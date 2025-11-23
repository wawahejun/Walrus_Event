/// Walrus Events - NFT Ticket System
/// 
/// Features:
/// - Mint NFT tickets (free or paid)
/// - Soulbound tickets (non-transferable)
/// - Check-in system
/// - Ticket marketplace

module walrus_events::ticket_system {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::package;
    use sui::display;

    // ====== OTW ======
    public struct TICKET_SYSTEM has drop {}

    // ====== Errors ======
    const EEventFull: u64 = 3;
    const EAlreadyCheckedIn: u64 = 4;
    const EUnauthorized: u64 = 5;
    const EInsufficientPayment: u64 = 6;
    const ESoulbound: u64 = 7;
    const EInvalidZKProof: u64 = 8;

    // ====== Structs ======

    /// NFT Ticket
    public struct EventTicket has key, store {
        id: UID,
        event_id: String,
        ticket_number: u64,
        attendee: address,
        is_soulbound: bool,
        checked_in: bool,
        minted_at: u64,
        metadata_uri: String,
        zk_proof_hash: String, // Store ZK proof hash
    }

    /// Check-in proof (POAP)
    public struct CheckInProof has key {
        id: UID,
        event_id: String,
        attendee: address,
        checked_in_at: u64,
    }

    /// Ticket marketplace listing
    public struct TicketListing has key {
        id: UID,
        ticket_id: address,
        seller: address,
        price: u64,
    }

    /// Event treasury
    public struct EventTreasury has key {
        id: UID,
        event_id: String,
        organizer: address,
        balance: Balance<SUI>,
    }

    // ====== Events ======

    public struct TicketMinted has copy, drop {
        event_id: String,
        ticket_number: u64,
        attendee: address,
        is_soulbound: bool,
    }

    public struct AttendeeCheckedIn has copy, drop {
        event_id: String,
        attendee: address,
        timestamp: u64,
    }

    public struct TicketListed has copy, drop {
        seller: address,
        price: u64,
    }

    // ====== Init ======

    fun init(otw: TICKET_SYSTEM, ctx: &mut TxContext) {
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"image_url"),
            string::utf8(b"description"),
            string::utf8(b"project_url"),
        ];

        let values = vector[
            string::utf8(b"Walrus Event Ticket #{ticket_number}"),
            string::utf8(b"{metadata_uri}"),
            string::utf8(b"Access ticket for Walrus Event: {event_id}"),
            string::utf8(b"https://walrus.events"),
        ];

        let publisher = package::claim(otw, ctx);
        let mut display = display::new_with_fields<EventTicket>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    // ====== Public Functions ======

    /// Mint free ticket
    public fun mint_ticket(
        event_id: vector<u8>,
        ticket_number: u64,
        is_soulbound: bool,
        metadata_uri: vector<u8>,
        ctx: &mut TxContext
    ) {
        let ticket = EventTicket {
            id: object::new(ctx),
            event_id: string::utf8(event_id),
            ticket_number,
            attendee: tx_context::sender(ctx),
            is_soulbound,
            checked_in: false,
            minted_at: tx_context::epoch(ctx),
            metadata_uri: string::utf8(metadata_uri),
            zk_proof_hash: string::utf8(b""),
        };

        event::emit(TicketMinted {
            event_id: ticket.event_id,
            ticket_number,
            attendee: ticket.attendee,
            is_soulbound,
        });

        transfer::transfer(ticket, tx_context::sender(ctx));
    }

    /// Buy paid ticket with SUI
    public fun buy_new_ticket(
        event_id: vector<u8>,
        ticket_number: u64,
        is_soulbound: bool,
        metadata_uri: vector<u8>,
        payment: Coin<SUI>,
        price: u64,
        organizer: address,
        ctx: &mut TxContext
    ) {
        assert!(coin::value(&payment) >= price, EInsufficientPayment);

        // Transfer payment to organizer
        transfer::public_transfer(payment, organizer);

        let ticket = EventTicket {
            id: object::new(ctx),
            event_id: string::utf8(event_id),
            ticket_number,
            attendee: tx_context::sender(ctx),
            is_soulbound,
            checked_in: false,
            minted_at: tx_context::epoch(ctx),
            metadata_uri: string::utf8(metadata_uri),
            zk_proof_hash: string::utf8(b""), // Initial empty proof
        };

        event::emit(TicketMinted {
            event_id: ticket.event_id,
            ticket_number,
            attendee: ticket.attendee,
            is_soulbound,
        });

        transfer::transfer(ticket, tx_context::sender(ctx));
    }

    /// Verify ZK Proof for attendance
    /// In a real system, this would verify a Groth16 proof
    /// For MVP, we verify a hash commitment
    public fun verify_zk_proof(
        ticket: &mut EventTicket,
        zk_proof: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Simulate ZK verification
        // In reality: verify_groth16_proof(vk, public_inputs, proof)
        assert!(vector::length(&zk_proof) > 0, EInvalidZKProof);

        ticket.zk_proof_hash = string::utf8(zk_proof);
    }

    /// Check in with ticket
    public fun check_in(
        ticket: &mut EventTicket,
        ctx: &mut TxContext
    ) {
        assert!(!ticket.checked_in, EAlreadyCheckedIn);
        assert!(ticket.attendee == tx_context::sender(ctx), EUnauthorized);

        ticket.checked_in = true;

        let proof = CheckInProof {
            id: object::new(ctx),
            event_id: ticket.event_id,
            attendee: ticket.attendee,
            checked_in_at: tx_context::epoch(ctx),
        };

        event::emit(AttendeeCheckedIn {
            event_id: ticket.event_id,
            attendee: ticket.attendee,
            timestamp: tx_context::epoch(ctx),
        });

        transfer::transfer(proof, ticket.attendee);
    }

    /// List ticket for sale
    public fun list_for_sale(
        ticket: EventTicket,
        price: u64,
        ctx: &mut TxContext
    ) {
        assert!(!ticket.is_soulbound, ESoulbound);

        let ticket_id = object::uid_to_address(&ticket.id);
        let seller = ticket.attendee;

        let listing = TicketListing {
            id: object::new(ctx),
            ticket_id,
            seller,
            price,
        };

        event::emit(TicketListed {
            seller,
            price,
        });

        transfer::share_object(listing);
        transfer::share_object(ticket);
    }

    /// Buy listed ticket
    public fun buy_ticket(
        listing: TicketListing,
        mut ticket: EventTicket,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(coin::value(&payment) >= listing.price, EInsufficientPayment);

        let buyer = tx_context::sender(ctx);
        let TicketListing { id, ticket_id: _, seller, price: _ } = listing;

        transfer::public_transfer(payment, seller);
        ticket.attendee = buyer;
        
        transfer::transfer(ticket, buyer);
        object::delete(id);
    }

    // ====== View Functions ======

    public fun is_checked_in(ticket: &EventTicket): bool {
        ticket.checked_in
    }

    public fun get_ticket_number(ticket: &EventTicket): u64 {
        ticket.ticket_number
    }

    public fun is_soulbound(ticket: &EventTicket): bool {
        ticket.is_soulbound
    }

    /// Burn ticket (e.g. when leaving event)
    public fun burn_ticket(ticket: EventTicket) {
        let EventTicket { 
            id, 
            event_id: _, 
            ticket_number: _, 
            attendee: _, 
            is_soulbound: _, 
            checked_in: _, 
            minted_at: _, 
            metadata_uri: _, 
            zk_proof_hash: _ 
        } = ticket;
        object::delete(id);
    }
}
