
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Database, Activity, Lock, Globe, Wallet, Calendar, MapPin, Users, Edit } from 'lucide-react';
import { cn } from '../ui/utils';
import { useCurrentAccount, useConnectWallet, useDisconnectWallet } from '@mysten/dapp-kit';
import { EventDetailModal } from './EventDetailModal';
import { EventEditModal } from './EventEditModal';
import { WalletButton } from '../wallet/wallet-button';

interface UserEvent {
  event_id: string;
  title: string;
  description: string;
  event_type: string;
  start_time: string;
  location: string;
  participants_count: number;
  max_participants: number;
}

export const SovereigntyCenter = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const account = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch user's created events
  useEffect(() => {
    if (!account) return;

    const fetchUserEvents = async () => {
      setLoadingEvents(true);
      try {
        // Get all events and filter by organizer (in real app, backend should filter)
        const response = await fetch('http://localhost:8000/api/v1/events?limit=50');
        const data = await response.json();

        if (data.status === 'success' && data.events) {
          // For now, show all events since we don't have proper user tracking
          // In production, filter by organizer_id === account.address
          setUserEvents(data.events.slice(0, 5)); // Show latest 5 events
        }
      } catch (error) {
        console.error('Failed to fetch user events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchUserEvents();
  }, [account]);

  // Show connect wallet prompt if not connected
  if (!account) {
    return (
      <div className="h-full w-full p-4 md:p-8 flex flex-col items-center justify-center gap-8 text-gray-800 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border-2 border-amber-300">
            <Wallet size={48} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Connect Your Wallet</h1>
            <p className="text-gray-700 mb-6">
              Please connect your Sui wallet to access your Sovereignty Center and view your digital identity profile.
            </p>
          </div>
          <WalletButton />
        </motion.div>
      </div>
    );
  }

  const address = account.address;
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="h-full w-full p-4 md:p-8 flex flex-col gap-8 text-gray-800 pb-24 overflow-y-auto no-scrollbar">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-gray-800">
            SOVEREIGNTY CENTER
          </h1>
          <p className="text-xs text-[#F59E0B] font-mono mt-1">NODE: WALRUS-7A • ONLINE</p>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Lock size={16} />
          Disconnect
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 h-auto lg:h-[400px]">
        {/* 3D Identity Card */}
        <div className="w-full lg:w-[40%] h-[300px] lg:h-full perspective-1000">
          <motion.div
            className="w-full h-full relative preserve-3d cursor-pointer"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden rounded-2xl p-6 flex flex-col justify-between
              bg-gradient-to-br from-white/95 to-amber-50/80 border border-[#F59E0B]/30 backdrop-blur-xl shadow-[0_4px_30px_rgba(245,158,11,0.15)]">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full bg-[#F59E0B]/20 flex items-center justify-center border border-[#F59E0B]">
                  <Shield className="text-[#F59E0B]" size={24} />
                </div>
                <div className="px-3 py-1 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs font-mono text-[#F59E0B]">
                  LEVEL 7
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{shortAddress}</h2>
                <div className="h-1 w-full bg-amber-100/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#F59E0B]"
                    initial={{ width: 0 }}
                    animate={{ width: "72%" }}
                    transition={{ delay: 0.5, duration: 1 }}
                  />
                </div>
                <p className="text-xs text-gray-700 font-mono">REPUTATION SCORE: 842/1000</p>
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rounded-2xl p-6 flex flex-col justify-center items-center
              bg-[#000]/90 border border-[#F59E0B]/30 backdrop-blur-xl rotate-y-180">
              <div className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto bg-amber-50 rounded-lg p-2 border border-amber-200">
                  {/* Mock QR/Merkle Root */}
                  <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WalrusIdentity')] bg-cover opacity-80 grayscale invert" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-[#F59E0B] font-mono">MERKLE ROOT</p>
                  <p className="text-[10px] text-gray-400 font-mono break-all">
                    {account.address}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Smart Calendar */}
        <div className="w-full lg:w-[60%] h-[300px] lg:h-full rounded-2xl bg-amber-50 border border-amber-200 backdrop-blur-md p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Events / November</h3>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1 text-gray-700"><span className="w-2 h-2 rounded-full bg-green-400" /> Created</span>
              <span className="flex items-center gap-1 text-gray-700"><span className="w-2 h-2 rounded-full bg-blue-400" /> Joined</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 h-full">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-center text-xs text-gray-600 font-mono py-1">{d}</div>
            ))}
            {Array.from({ length: 30 }).map((_, i) => {
              const day = i + 1;
              const hasEvent = [5, 12, 18, 24].includes(day);
              const isToday = day === 21;

              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                  className={cn(
                    "relative rounded-lg flex flex-col items-center justify-center transition-colors",
                    isToday ? "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/50" : "text-gray-700 hover:text-gray-800"
                  )}
                >
                  <span className="text-sm">{day}</span>
                  {hasEvent && (
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1",
                      day === 5 ? "bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]" :
                        day === 18 ? "bg-purple-400 shadow-[0_0_5px_rgba(192,132,252,0.8)]" :
                          "bg-[#F59E0B] shadow-[0_0_5px_rgba(245,158,11,0.8)]"
                    )} />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* My Events Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">My Events</h2>
          <span className="text-sm text-gray-600">
            {loadingEvents ? 'Loading...' : `${userEvents.length} events`}
          </span>
        </div>

        {userEvents.length === 0 ? (
          <div className="p-8 rounded-xl bg-amber-50/50 border border-amber-200 text-center">
            <Calendar size={48} className="mx-auto mb-3 text-amber-400" />
            <p className="text-gray-700">No events created yet</p>
            <p className="text-sm text-gray-600 mt-1">Go to Event Forge to create your first event!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userEvents.map((event) => (
              <motion.div
                key={event.event_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 hover:shadow-lg transition-all relative group"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    // Convert to Activity format for DetailModal
                    const activity = {
                      id: event.event_id,
                      title: event.title,
                      description: event.description,
                      image: event.cover_image || `https://images.unsplash.com/photo-${Math.random().toString(36).substring(7)}?w=1280&h=720&fit=crop&auto=format&q=80`,
                      category: event.event_type,
                      date: new Date(event.start_time).toISOString().split('T')[0],
                      location: event.location || 'Virtual',
                      participants: event.participants_count,
                      maxParticipants: event.max_participants,
                      tags: [event.event_type, 'Privacy'],
                      time: new Date(event.start_time).toLocaleTimeString(),
                      organizer: event.organizer_id
                    };
                    setSelectedEvent(activity);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                    <span className="px-2 py-1 bg-amber-200 text-amber-800 text-xs rounded-full whitespace-nowrap ml-2">
                      {event.event_type}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-amber-600" />
                      <span>{new Date(event.start_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-amber-600" />
                      <span>{event.location || 'Virtual'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-amber-600" />
                      <span>{event.participants_count} / {event.max_participants} participants</span>
                    </div>
                  </div>
                </div >

                <div className="mt-3 pt-3 border-t border-amber-300 flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-mono">{event.event_id.substring(0, 16)}...</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingEvent({
                        id: event.event_id,
                        ...event
                      });
                      setShowEditModal(true);
                    }}
                    className="p-1.5 bg-white text-amber-600 rounded-lg border border-amber-200 hover:bg-amber-50 transition-colors flex items-center gap-1 text-xs font-medium"
                  >
                    <Edit size={12} /> Edit
                  </button>
                </div>
              </motion.div >
            ))}
          </div >
        )}
      </div >

      {/* Modals */}
      < EventDetailModal
        event={selectedEvent}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />

      < EventEditModal
        event={editingEvent}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={() => {
          // Refresh events
          const fetchUserEvents = async () => {
            try {
              const response = await fetch('http://localhost:8000/api/v1/events?limit=50');
              const data = await response.json();
              if (data.status === 'success' && data.events) {
                // Filter for current user (mock logic since no real auth yet)
                // In reality, backend would filter or we filter by wallet address
                const myEvents = data.events.filter((e: any) => e.organizer_id.startsWith('user_'));
                setUserEvents(myEvents);
              }
            } catch (error) {
              console.error('Failed to refresh events:', error);
            }
          };
          fetchUserEvents();
        }}
      />

      {/* Bottom Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[
          { label: 'Storage Used', value: '4.2 GB', icon: Database, color: 'text-purple-400' },
          { label: 'ZK Proofs', value: '1,024', icon: Lock, color: 'text-green-400' },
          { label: 'Auth Apps', value: '12', icon: Globe, color: 'text-blue-400' },
          { label: 'Right to be Forgotten', value: 'Active', icon: Activity, color: 'text-orange-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
            className="p-4 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100/50 transition-colors"
          >
            <stat.icon size={16} className={cn("mb-2", stat.color)} />
            <div className="text-xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-xs text-gray-700">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div >
  );
};
