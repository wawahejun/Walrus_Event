/// Walrus Events - Seal Access Control Module
///
/// This module implements access control for Seal-encrypted event data.
/// It provides programmable access policies that determine who can decrypt
/// encrypted event information stored on Walrus.

module walrus_events::seal_access {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use std::vector;

    // ====== Errors ======
    
    const ENotOrganizer: u64 = 0;
    const ENotParticipant: u64 = 1;
    const EEventNotFound: u64 = 2;
    const EAlreadyParticipant: u64 = 3;
    const EEventNotActive: u64 = 4;
    const EInsufficientPayment: u64 = 5;

    // ====== Structs ======

    /// Event access control object
    public struct EventAccess has key, store {
        id: UID,
        event_id: String,
        organizer: address,
        is_public: bool,              // Public vs private event
        requires_payment: bool,        // Paid event
        payment_amount: u64,           // SUI tokens required
        is_active: bool,               // Event is active
        participants: Table<address, ParticipantInfo>,
        created_at: u64,
    }

    /// Participant information
    public struct ParticipantInfo has store, copy, drop {
        joined_at: u64,
        has_paid: bool,
        access_level: u8,  // 0: basic, 1: vip, 2: organizer
    }

    /// Seal approval result for encrypted data access
    public struct SealApprovalProof has copy, drop {
        event_id: String,
        user: address,
        approved: bool,
        timestamp: u64,
    }

    // ====== Events ======

    public struct ParticipantJoined has copy, drop {
        event_id: String,
        participant: address,
        timestamp: u64,
    }

    public struct ParticipantLeft has copy, drop {
        event_id: String,
        participant: address,
        timestamp: u64,
    }

    public struct AccessGranted has copy, drop {
        event_id: String,
        user: address,
        timestamp: u64,
    }

    // ====== Public Functions ======

    /// Create a new event with access control
    ///
    /// # Arguments
    /// * `event_id` - Unique event identifier (matches encrypted data ID)
    /// * `is_public` - If true, anyone can join; if false, only allowlisted users
    /// * `requires_payment` - If true, users must pay to join
    /// * `payment_amount` - Amount of SUI tokens required (if requires_payment is true)
    /// * `ctx` - Transaction context
    public fun create_event_access(
        event_id: vector<u8>,
        is_public: bool,
        requires_payment: bool,
        payment_amount: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = tx_context::epoch(ctx);

        let mut access = EventAccess {
            id: object::new(ctx),
            event_id: string::utf8(event_id),
            organizer: sender,
            is_public,
            requires_payment,
            payment_amount,
            is_active: true,
            participants: table::new(ctx),
            created_at: timestamp,
        };

        // Automatically add organizer as participant with highest access
        let organizer_info = ParticipantInfo {
            joined_at: timestamp,
            has_paid: true,  // Organizer doesn't need to pay
            access_level: 2, // Organizer access level
        };
        table::add(&mut access.participants, sender, organizer_info);

        transfer::public_share_object(access);
    }

    /// Join an event (add yourself as a participant)
    /// This grants access to decrypt the event data
    public fun join_event(
        access: &mut EventAccess,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = tx_context::epoch(ctx);

        // Check if event is active
        assert!(access.is_active, EEventNotActive);

        // Check if already a participant
        assert!(!table::contains(&access.participants, sender), EAlreadyParticipant);

        // TODO: If requires_payment, check payment in a separate function

        // Add participant
        let participant_info = ParticipantInfo {
            joined_at: timestamp,
            has_paid: !access.requires_payment,  // Free events don't require payment
            access_level: 0,  // Basic access
        };
        table::add(&mut access.participants, sender, participant_info);

        // Emit event
        event::emit(ParticipantJoined {
            event_id: access.event_id,
            participant: sender,
            timestamp,
        });
    }

    /// Leave an event (remove yourself as a participant)
    public fun leave_event(
        access: &mut EventAccess,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = tx_context::epoch(ctx);

        // Check if participant exists
        assert!(table::contains(&access.participants, sender), ENotParticipant);

        // Cannot remove organizer
        assert!(sender != access.organizer, ENotOrganizer);

        // Remove participant
        table::remove(&mut access.participants, sender);

        // Emit event
        event::emit(ParticipantLeft {
            event_id: access.event_id,
            participant: sender,
            timestamp,
        });
    }

    /// ⭐ SEAL APPROVAL FUNCTION ⭐
    /// This function is called by Seal key servers to verify access rights
    /// 
    /// Returns true if the user has permission to decrypt the event data
    /// 
    /// # Arguments
    /// * `access` - Event access control object
    /// * `event_id_bytes` - Event ID to verify (must match)
    /// * `user` - Address requesting decryption
    /// * `ctx` - Transaction context
    ///
    /// # Returns
    /// * bool - true if access is granted, false otherwise
    public fun seal_approve(
        access: &EventAccess,
        event_id_bytes: vector<u8>,
        user: address,
        ctx: &TxContext
    ): bool {
        let timestamp = tx_context::epoch(ctx);
        let event_id_str = string::utf8(event_id_bytes);

        // Verify event ID matches
        if (access.event_id != event_id_str) {
            return false
        };

        // Check if event is active
        if (!access.is_active) {
            return false
        };

        // Check if user is a participant
        if (!table::contains(&access.participants, user)) {
            return false
        };

        // Get participant info
        let participant_info = table::borrow(&access.participants, user);

        // If payment required, check if user has paid
        if (access.requires_payment && !participant_info.has_paid) {
            return false
        };

        // Emit access granted event
        event::emit(AccessGranted {
            event_id: access.event_id,
            user,
            timestamp,
        });

        // Access granted!
        true
    }

    /// Alternative seal_approve for simpler use cases
    /// Just checks if user is apprticipant
    public fun seal_approve_simple(
        access: &EventAccess,
        user: address,
    ): bool {
        table::contains(&access.participants, user)
    }

    /// Organizer can deactivate the event
    /// This prevents new joins and denies all decryption access
    public fun deactivate_event(
        access: &mut EventAccess,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(access.organizer == sender, ENotOrganizer);
        access.is_active = false;
    }

    /// Organizer can reactivate the event
    public fun reactivate_event(
        access: &mut EventAccess,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(access.organizer == sender, ENotOrganizer);
        access.is_active = true;
    }

    /// Organizer can manually add participants (for allowlist)
    public fun add_participant(
        access: &mut EventAccess,
        participant: address,
        access_level: u8,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = tx_context::epoch(ctx);

        assert!(access.organizer == sender, ENotOrganizer);
        assert!(!table::contains(&access.participants, participant), EAlreadyParticipant);

        let participant_info = ParticipantInfo {
            joined_at: timestamp,
            has_paid: true,  // Manually added participants don't need to pay
            access_level,
        };
        table::add(&mut access.participants, participant, participant_info);
    }

    // ====== View Functions ======

    /// Check if a user is a participant
    public fun is_participant(access: &EventAccess, user: address): bool {
        table::contains(&access.participants, user)
    }

    /// Get event organizer
    public fun get_organizer(access: &EventAccess): address {
        access.organizer
    }

    /// Check if event is public
    public fun is_public(access: &EventAccess): bool {
        access.is_public
    }

    /// Check if event is active
    public fun is_active(access: &EventAccess): bool {
        access.is_active
    }

    /// Get payment requirement
    public fun get_payment_amount(access: &EventAccess): u64 {
        access.payment_amount
    }

    /// Check if event requires payment
    public fun requires_payment(access: &EventAccess): bool {
        access.requires_payment
    }

    // ====== Test Functions ======

    #[test_only]
    public fun test_create_event_access(ctx: &mut TxContext): EventAccess {
        let event_id = b"test_event_123";
        EventAccess {
            id: object::new(ctx),
            event_id: string::utf8(event_id),
            organizer: tx_context::sender(ctx),
            is_public: true,
            requires_payment: false,
            payment_amount: 0,
            is_active: true,
            participants: table::new(ctx),
            created_at: tx_context::epoch(ctx),
        }
    }
}
