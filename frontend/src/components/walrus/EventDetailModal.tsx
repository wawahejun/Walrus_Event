import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Users, ArrowLeft, ExternalLink, Shield, Ticket, Share2, CheckCircle, Loader2 } from 'lucide-react';
import { Activity } from './PrivacyDiscovery';
import { useSuiAnchor } from '../../hooks/useSuiAnchor';
import { useTicketSystem } from '../../hooks/useTicketSystem';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

interface EventDetailModalProps {
    event: Activity | null;
    isOpen: boolean;
    onClose: () => void;
    onEventUpdate?: (event: Activity) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, isOpen, onClose, onEventUpdate }) => {
    const [joined, setJoined] = useState(false);
    const [loading, setLoading] = useState(false);
    const account = useCurrentAccount();
    const client = useSuiClient();
    const { anchorToBlockchain } = useSuiAnchor();
    const { buyTicket, burnTicket, generateAndVerifyZKProof, isMinting, isVerifyingZK } = useTicketSystem();
    const [ticketId, setTicketId] = useState<string | null>(null);
    const [zkVerified, setZkVerified] = useState(false);
    const hasPackageId = !!import.meta.env.VITE_SUI_PACKAGE_ID;

    useEffect(() => {
        if (isOpen && event) {
            const joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '[]');
            const isJoined = joinedEvents.some((e: any) => e.id === event.id);
            setJoined(isJoined);
        }
    }, [isOpen, event]);

    // Fetch user's ticket for this event
    useEffect(() => {
        const fetchTicket = async () => {
            // Check all required conditions including client availability
            if (!account || !event || !joined || !hasPackageId || !client) {
                setTicketId(null);
                setZkVerified(false);
                return;
            }

            try {
                const { data } = await client.getOwnedObjects({
                    owner: account.address,
                    filter: {
                        StructType: `${import.meta.env.VITE_SUI_PACKAGE_ID}::ticket_system::EventTicket`
                    },
                    options: { showContent: true }
                });

                const ticket = data.find(obj => {
                    const content = obj.data?.content as any;
                    return content?.fields?.event_id === event.id;
                });

                if (ticket?.data?.objectId) {
                    setTicketId(ticket.data.objectId);
                    // Check if already verified
                    if (ticket.data.content && (ticket.data.content as any).fields.zk_proof_hash) {
                        setZkVerified(true);
                    } else {
                        setZkVerified(false);
                    }
                } else {
                    setTicketId(null);
                    setZkVerified(false);
                }
            } catch (e) {
                console.error("Failed to fetch ticket:", e);
                setTicketId(null);
                setZkVerified(false);
            }
        };

        fetchTicket();
    }, [account, event, joined, client, hasPackageId]);

    if (!isOpen || !event) return null;

    const handleJoinEvent = async () => {
        setLoading(true);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if it's a real event (has event_id) or simulated
            const isRealEvent = event.id.startsWith('event_');

            if (isRealEvent) {
                // Real event logic
                const response = await fetch(`http://localhost:8000/api/v1/events/${event.id}/join`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: 'demo_user', // Hardcoded for MVP
                        public_key: 'demo_key'
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to join event');
                }

                // Mint NFT Ticket if wallet is connected and contract deployed
                console.log('=== Join Event DEBUG ===');
                console.log('Account:', account?.address);
                console.log('Has Package ID:', hasPackageId);
                console.log('Package ID value:', import.meta.env.VITE_SUI_PACKAGE_ID);
                console.log('Event price:', (event as any).price);

                if (account && hasPackageId) {
                    try {
                        console.log("Starting Ticket Purchase & ZK Flow...");

                        // Get price from event data, default to free (0) if not set
                        const price = (event as any).price || 0;
                        // Use event organizer address if available, otherwise fallback to current user (only for testing)
                        const organizer = (event as any).organizerAddress || account.address;
                        const imageUrl = (event as any).image || (event as any).cover_image || "walrus://premium-ticket";

                        console.log(`Buying ticket for event ${event.id}, price: ${price} MIST`);
                        console.log(`Payment recipient (Organizer): ${organizer}`);
                        console.log(`Ticket Image: ${imageUrl}`);

                        const ticketResult = await buyTicket(event.id, price, organizer, imageUrl);
                        console.log("Ticket Purchased:", ticketResult);
                        alert("✅ Payment Successful! Ticket NFT Minted.");

                        // 2. Generate & Verify ZK Proof
                        // 2. Generate & Verify ZK Proof
                        // We will show a button for this instead of auto-confirm
                        // setZkVerified(false); // Reset status

                    } catch (mintError) {
                        console.error("Failed to process ticket:", mintError);
                        alert("Transaction failed. See console for details.");
                    }
                } else {
                    console.warn('Skipping blockchain minting:', {
                        hasAccount: !!account,
                        hasPackageId,
                        reason: !account ? 'No wallet connected' : 'Package ID not configured'
                    });
                }
            }

            // Success logic for both real and simulated
            const joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '[]');
            if (!joinedEvents.some((e: any) => e.id === event.id)) {
                joinedEvents.push({
                    ...event,
                    joinedAt: new Date().toISOString()
                });
                localStorage.setItem('joinedEvents', JSON.stringify(joinedEvents));
            }

            setJoined(true);

            // Fetch updated event data to get accurate participant count
            if (isRealEvent) {
                try {
                    const eventResponse = await fetch(`http://localhost:8000/api/v1/events/${event.id}`);
                    if (eventResponse.ok) {
                        const eventData = await eventResponse.json();
                        if (eventData.status === 'success' && eventData.event) {
                            const updatedEvent = {
                                ...event,
                                participants: eventData.event.participants_count || (event.participants || 0) + 1
                            };
                            if (onEventUpdate) {
                                onEventUpdate(updatedEvent);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch updated event data:', err);
                    // Fallback to local increment
                    const updatedEvent = { ...event, participants: (event.participants || 0) + 1 };
                    if (onEventUpdate) {
                        onEventUpdate(updatedEvent);
                    }
                }
            } else {
                // For simulated events, just increment locally
                const updatedEvent = { ...event, participants: (event.participants || 0) + 1 };
                if (onEventUpdate) {
                    onEventUpdate(updatedEvent);
                }
            }

            alert('Successfully joined the event!');
        } catch (error) {
            console.error('Join event error:', error);
            alert(error instanceof Error ? error.message : 'Failed to join event');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveEvent = async () => {
        setLoading(true);
        try {
            // Check if it's a real event
            const isRealEvent = event.id.startsWith('event_');

            if (isRealEvent) {
                // Call backend API to remove participant
                const response = await fetch(`http://localhost:8000/api/v1/events/${event.id}/leave`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: 'demo_user', // Hardcoded for MVP
                        public_key: 'demo_key'
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to leave event');
                }

                // Burn NFT Ticket if wallet is connected
                if (account && hasPackageId) {
                    try {
                        console.log("Checking for tickets to burn...");
                        const { data: objects } = await client.getOwnedObjects({
                            owner: account.address,
                            filter: {
                                StructType: `${import.meta.env.VITE_SUI_PACKAGE_ID}::ticket_system::EventTicket`
                            },
                            options: { showContent: true }
                        });

                        const ticketsToBurn = objects.filter((obj: any) => {
                            const content = obj.data?.content;
                            return content?.dataType === 'moveObject' && content.fields.event_id === event.id;
                        });

                        if (ticketsToBurn.length > 0) {
                            console.log(`Found ${ticketsToBurn.length} tickets to burn`);
                            // Burn all found tickets
                            for (const ticket of ticketsToBurn) {
                                if (ticket.data?.objectId) {
                                    await burnTicket(ticket.data.objectId);
                                }
                            }
                            alert(`Burned ${ticketsToBurn.length} ticket(s) from your wallet.`);
                        } else {
                            console.log("No tickets found for this event.");
                        }
                    } catch (burnError) {
                        console.error("Failed to burn tickets:", burnError);
                        // Don't block leaving event if burn fails
                    }
                }
            }

            // Remove from local storage
            const joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '[]');
            const updatedJoinedEvents = joinedEvents.filter((e: any) => e.id !== event.id);
            localStorage.setItem('joinedEvents', JSON.stringify(updatedJoinedEvents));

            setJoined(false);

            // Fetch updated event data to get accurate participant count
            if (isRealEvent) {
                try {
                    const eventResponse = await fetch(`http://localhost:8000/api/v1/events/${event.id}`);
                    if (eventResponse.ok) {
                        const eventData = await eventResponse.json();
                        if (eventData.status === 'success' && eventData.event) {
                            const updatedEvent = {
                                ...event,
                                participants: eventData.event.current_participants || Math.max(0, (event.participants || 0) - 1)
                            };
                            if (onEventUpdate) {
                                onEventUpdate(updatedEvent);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch updated event data:', err);
                    // Fallback to local decrement
                    const updatedEvent = { ...event, participants: Math.max(0, (event.participants || 0) - 1) };
                    if (onEventUpdate) {
                        onEventUpdate(updatedEvent);
                    }
                }
            } else {
                // Decrement participant count for simulated events
                const updatedEvent = { ...event, participants: Math.max(0, (event.participants || 0) - 1) };
                if (onEventUpdate) {
                    onEventUpdate(updatedEvent);
                }
            }

            alert('You have left the event.');
        } catch (error) {
            console.error('Leave event error:', error);
            alert(error instanceof Error ? error.message : 'Failed to leave event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Image Section */}
                        <div className="w-full md:w-2/5 relative h-64 md:h-auto">
                            <img
                                src={event.image}
                                alt={event.title}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r" />
                            <button
                                onClick={onClose}
                                className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors md:hidden"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div className="absolute bottom-4 left-4 right-4 text-white md:hidden">
                                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500 text-white mb-2">
                                    {event.category}
                                </div>
                                <h2 className="text-2xl font-bold leading-tight">{event.title}</h2>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 flex flex-col overflow-y-auto bg-white">
                            {/* Header (Desktop) */}
                            <div className="hidden md:block p-8 pb-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                                        {event.category}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h2>
                                <div className="flex items-center gap-2 text-gray-500">
                                    <MapPin size={18} />
                                    <span>{event.location}</span>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 space-y-8">
                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                <Calendar size={20} />
                                            </div>
                                            <span className="text-sm text-gray-500">Date & Time</span>
                                        </div>
                                        <div className="font-medium text-gray-900">{event.date}</div>
                                        <div className="text-sm text-gray-500">{event.time}</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                                <Users size={20} />
                                            </div>
                                            <span className="text-sm text-gray-500">Participants</span>
                                        </div>
                                        <div className="font-medium text-gray-900">
                                            {event.participants} / {event.maxParticipants}
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                            <div
                                                className="bg-green-500 h-1.5 rounded-full"
                                                style={{ width: `${(event.participants / event.maxParticipants) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">About Event</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {event.description}
                                    </p>
                                </div>

                                {/* Tags */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {event.tags.map((tag: string) => (
                                            <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Blockchain Verification */}
                                {(event as any).blob_id && (
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Shield size={20} className="text-green-600" />
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                                Blockchain Verification
                                            </h3>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            {/* Walrus Storage */}
                                            <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                                                <span className="text-gray-600">Walrus Storage:</span>
                                                <a
                                                    href={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${(event as any).blob_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-mono text-xs"
                                                >
                                                    {(event as any).blob_id.slice(0, 12)}...
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>

                                            {/* Sui Transaction */}
                                            {(event as any).transaction_id && (
                                                <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                                                    <span className="text-gray-600">Sui Blockchain:</span>
                                                    <a
                                                        href={`https://testnet.suivision.xyz/txblock/${(event as any).transaction_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-mono text-xs"
                                                    >
                                                        {(event as any).transaction_id.slice(0, 12)}...
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            )}

                                            {/* Verification Badge */}
                                            <div className="mt-2 p-2 bg-green-100 rounded-lg flex items-center gap-2">
                                                <Shield size={16} className="text-green-700" />
                                                <span className="text-green-700 font-medium text-xs">
                                                    ✓ Data verified on {(event as any).transaction_id ? 'Sui blockchain' : 'Walrus storage'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ZK Verification Status */}
                                {joined && (
                                    <div className={`p-4 rounded-2xl border ${zkVerified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield size={20} className={zkVerified ? 'text-green-600' : 'text-yellow-600'} />
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                                                Attendance Proof
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {isVerifyingZK
                                                ? "⏳ Verifying ZK Proof on-chain..."
                                                : zkVerified
                                                    ? "✅ ZK Proof Verified. Access Granted."
                                                    : "⚠️ Proof not generated yet. Please generate to enter."}
                                        </p>
                                        {!zkVerified && !isVerifyingZK && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        if (!ticketId) {
                                                            alert("Ticket not found. Please wait for transaction to confirm or refresh.");
                                                            return;
                                                        }
                                                        await generateAndVerifyZKProof(ticketId);
                                                        setZkVerified(true);
                                                    } catch (e) {
                                                        console.error("ZK Verify failed", e);
                                                        alert("Verification failed. See console.");
                                                    }
                                                }}
                                                disabled={!ticketId}
                                                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${!ticketId ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/25'
                                                    }`}
                                            >
                                                {isVerifyingZK ? <Loader2 className="animate-spin" /> : <Shield size={18} />}
                                                <span>{ticketId ? "Generate & Verify Proof" : "Finding Ticket..."}</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Organizer */}
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                                    <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-xl">
                                        {event.organizer ? event.organizer[0] : 'O'}
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Organized by</div>
                                        <div className="font-bold text-gray-900">{event.organizer || 'Unknown'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Action */}
                            <div className="p-6 md:p-8 border-t border-gray-100 mt-auto bg-white sticky bottom-0">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="hidden md:block">
                                        <div className="text-sm text-gray-500">Price</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {(event as any).price && (event as any).price > 0
                                                ? (() => {
                                                    const suiValue = (event as any).price / 1000000000;
                                                    // Show more decimals for small amounts
                                                    const decimals = suiValue < 0.01 ? 6 : 2;
                                                    return `${suiValue.toFixed(decimals)} SUI`;
                                                })()
                                                : 'Free'}
                                        </div>
                                    </div>
                                    {joined ? (
                                        <button
                                            onClick={handleLeaveEvent}
                                            disabled={loading}
                                            className="w-full md:w-auto px-8 py-4 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? 'Processing...' : 'Leave Event'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleJoinEvent}
                                            disabled={loading || event.participants >= event.maxParticipants}
                                            className="w-full md:w-auto flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                'Joining...'
                                            ) : event.participants >= event.maxParticipants ? (
                                                'Event Full'
                                            ) : (
                                                <>
                                                    Join Event & Mint Ticket
                                                    <Ticket size={20} />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div >
            )}
        </AnimatePresence >
    );
};
