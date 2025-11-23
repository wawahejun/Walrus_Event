/// Walrus Events - Event Anchoring Smart Contract
/// 
/// This module provides on-chain event registration and verification
/// by anchoring event metadata hashes and Walrus blob IDs to the Sui blockchain.

module walrus_events::event_anchor {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // ====== Errors ======
    
    const EInvalidHash: u64 = 0;
    const EInvalidBlobId: u64 = 1;
    const EUnauthorized: u64 = 2;

    // ====== Structs ======

    /// Event anchor object stored on-chain
    public struct EventAnchor has key, store {
        id: UID,
        event_id: String,
        organizer: address,
        event_hash: String,      // SHA256 hash of event data
        blob_id: String,         // Walrus blob ID
        created_at: u64,         // Timestamp
    }

    /// Emitted when an event is anchored
    public struct EventAnchored has copy, drop {
        event_id: String,
        organizer: address,
        event_hash: String,
        blob_id: String,
        timestamp: u64,
    }

    /// Emitted when an event is updated
    public struct EventUpdated has copy, drop {
        event_id: String,
        old_hash: String,
        new_hash: String,
        new_blob_id: String,
        timestamp: u64,
    }

    // ====== Public Functions ======

    /// Anchor a new event to the blockchain
    /// 
    /// # Arguments
    /// * `event_id` - Unique event identifier
    /// * `event_hash` - SHA256 hash of event data (64 hex chars)
    /// * `blob_id` - Walrus blob ID where event data is stored
    /// * `ctx` - Transaction context
    ///
    /// # Returns
    /// * EventAnchor object transferred to the caller
    public fun anchor_event(
        event_id: vector<u8>,
        event_hash: vector<u8>,
        blob_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(vector::length(&event_hash) == 64, EInvalidHash);
        assert!(vector::length(&blob_id) > 0, EInvalidBlobId);

        let sender = tx_context::sender(ctx);
        let timestamp = tx_context::epoch(ctx);

        // Create event anchor object
        let anchor = EventAnchor {
            id: object::new(ctx),
            event_id: string::utf8(event_id),
            organizer: sender,
            event_hash: string::utf8(event_hash),
            blob_id: string::utf8(blob_id),
            created_at: timestamp,
        };

        // Emit event
        event::emit(EventAnchored {
            event_id: anchor.event_id,
            organizer: sender,
            event_hash: anchor.event_hash,
            blob_id: anchor.blob_id,
            timestamp,
        });

        // Transfer to sender
        transfer::public_transfer(anchor, sender);
    }

    /// Update an existing event anchor
    /// Only the original organizer can update
    public fun update_event(
        anchor: &mut EventAnchor,
        new_event_hash: vector<u8>,
        new_blob_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Only organizer can update
        assert!(anchor.organizer == sender, EUnauthorized);
        assert!(vector::length(&new_event_hash) == 64, EInvalidHash);
        assert!(vector::length(&new_blob_id) > 0, EInvalidBlobId);

        let old_hash = anchor.event_hash;
        let timestamp = tx_context::epoch(ctx);

        // Update anchor
        anchor.event_hash = string::utf8(new_event_hash);
        anchor.blob_id = string::utf8(new_blob_id);

        // Emit update event
        event::emit(EventUpdated {
            event_id: anchor.event_id,
            old_hash,
            new_hash: anchor.event_hash,
            new_blob_id: anchor.blob_id,
            timestamp,
        });
    }

    // ====== View Functions ======

    /// Get event anchor details
    public fun get_event_id(anchor: &EventAnchor): String {
        anchor.event_id
    }

    public fun get_organizer(anchor: &EventAnchor): address {
        anchor.organizer
    }

    public fun get_event_hash(anchor: &EventAnchor): String {
        anchor.event_hash
    }

    public fun get_blob_id(anchor: &EventAnchor): String {
        anchor.blob_id
    }

    public fun get_created_at(anchor: &EventAnchor): u64 {
        anchor.created_at
    }

    // ====== Test Functions ======

    #[test_only]
    public fun test_anchor_event(ctx: &mut TxContext): EventAnchor {
        EventAnchor {
            id: object::new(ctx),
            event_id: string::utf8(b"test_event_001"),
            organizer: tx_context::sender(ctx),
            event_hash: string::utf8(b"a" * 64), // 64 char hash
            blob_id: string::utf8(b"test_blob_id_12345"),
            created_at: tx_context::epoch(ctx),
        }
    }
}
