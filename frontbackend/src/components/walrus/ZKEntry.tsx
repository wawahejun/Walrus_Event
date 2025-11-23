import React, { useState } from 'react';
import { motion } from 'motion/react';
import { QrCode, CheckCircle, ArrowLeft, List } from 'lucide-react';
import QRCode from 'react-qr-code';
import { StackedCircularFooter } from '../ui/stacked-circular-footer';

export const ZKEntry = () => {
  const [scanning, setScanning] = useState(true);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'scan' | 'list'>('scan');

  React.useEffect(() => {
    const joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '[]');
    setTickets(joinedEvents);
  }, []);

  const handleSimulateScan = () => {
    setScanning(false);
    setTimeout(() => setVerified(true), 1500);
  };

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
  };

  const generateZKProofHash = (ticketId: string) => {
    // Simple hash simulation based on ticket ID
    let hash = '0x';
    const chars = '0123456789abcdef';
    // Use ticket ID to seed the hash so it's consistent for the same ticket
    let seed = ticketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let i = 0; i < 64; i++) {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      hash += chars[Math.floor((seed / 4294967296) * 16)];
    }
    return hash;
  };

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-gray-50">
      {/* Header for List Mode */}
      {viewMode === 'list' && (
        <div className="bg-white border-b border-amber-200 p-4 flex items-center gap-4 z-20 shadow-sm">
          <button
            onClick={() => setViewMode('scan')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-800 flex-1">My ZK Tickets</h2>
          {tickets.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all tickets? This action cannot be undone.')) {
                  localStorage.setItem('joinedEvents', JSON.stringify([]));
                  setTickets([]);
                  setSelectedTicket(null);
                }
              }}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-y-auto">
        {viewMode === 'scan' ? (
          <>
            {/* Camera Viewfinder Simulation */}
            <div className="absolute inset-0 bg-white">
              {/* Mock Camera Feed Background */}
              <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1516110833967-0b5716ca1387?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center grayscale" />

              {/* ZK Grid Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.1)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

              {/* Scanner UI */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
                <div className="relative w-64 h-64 md:w-80 md:h-80 border-2 border-amber-300 rounded-3xl overflow-hidden">
                  {/* Corner Brackets */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[#F59E0B]" />
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-[#F59E0B]" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-[#F59E0B]" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[#F59E0B]" />

                  {/* Scanning Line */}
                  {scanning && (
                    <motion.div
                      className="absolute left-0 right-0 h-1 bg-[#F59E0B] shadow-[0_0_20px_#F59E0B]"
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                    />
                  )}

                  {/* Success/Fail State */}
                  {!scanning && verified === true && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm"
                    >
                      <CheckCircle size={64} className="text-green-400 mb-4" />
                      <span className="text-xl font-bold text-gray-800">ZK PROOF VERIFIED</span>
                      <span className="text-xs text-green-400 font-mono mt-2">0x82...a91 Valid</span>
                    </motion.div>
                  )}
                </div>

                <div className="mt-8 text-center">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">SCAN ENTRY CODE</h2>
                  <p className="text-sm text-gray-800 max-w-xs mx-auto">
                    Align the dynamic QR code within the frame. Zero-Knowledge verification happens on-device.
                  </p>
                </div>

                {scanning && (
                  <button
                    onClick={handleSimulateScan}
                    className="mt-8 px-8 py-3 rounded-full bg-amber-100/50 border border-amber-300 text-amber-700 text-sm hover:bg-amber-100 transition-colors"
                  >
                    [ SIMULATE SCAN ]
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket)}
                  className="bg-white border border-amber-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="w-20 h-20 bg-amber-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {ticket.image ? (
                      <img src={ticket.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <QrCode className="text-amber-300" />
                    )}
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="text-base font-bold text-gray-800 truncate mb-1">{ticket.title}</div>
                    <div className="text-sm text-gray-600 mb-2 truncate">{ticket.date} • {ticket.time}</div>
                    <div className="flex items-center gap-1 text-xs text-green-500 font-medium">
                      <CheckCircle size={12} />
                      <span>Verified Ticket</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
                <QrCode size={48} className="mb-4 opacity-50" />
                <p>No tickets found. Join an event to see it here.</p>
              </div>
            )}
          </div>
        )}
        <StackedCircularFooter />
      </div>

      {/* Bottom Ticket Wallet (Only in Scan Mode) */}
      {viewMode === 'scan' && (
        <div className="h-[200px] bg-white/95 border-t border-amber-200 p-6 z-20 relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Your ZK Tickets</h3>
            <button
              className="text-[#F59E0B] text-xs hover:underline flex items-center gap-1"
              onClick={() => setViewMode('list')}
            >
              <List size={12} /> View All
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket)}
                  className="flex-shrink-0 w-64 h-24 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 hover:bg-amber-100/50 transition-colors cursor-pointer"
                >
                  <div className="w-16 h-full bg-white/40 rounded-lg flex items-center justify-center overflow-hidden">
                    {ticket.image ? (
                      <img src={ticket.image} alt="" className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <QrCode className="text-amber-300" />
                    )}
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800 truncate">{ticket.title}</div>
                    <div className="text-xs text-gray-700 mb-1 truncate">{ticket.date} • {ticket.time}</div>
                    <div className="flex items-center gap-1 text-[10px] text-green-400">
                      <CheckCircle size={10} />
                      <span>Ready to Verify</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full text-center text-gray-400 text-sm py-4">
                No tickets found. Join an event to see it here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedTicket(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-32 bg-gradient-to-r from-amber-400 to-orange-500 relative flex-shrink-0">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
              <div className="absolute bottom-4 left-6 text-white">
                <h2 className="text-2xl font-bold truncate pr-8">{selectedTicket.title}</h2>
                <p className="text-white/90 text-sm">{selectedTicket.date} • {selectedTicket.time}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white border-2 border-amber-100 rounded-2xl shadow-inner">
                  <QRCode
                    value={generateZKProofHash(selectedTicket.id)}
                    size={160}
                    level="H"
                    fgColor="#1F2937"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Ticket ID</span>
                  <span className="text-sm font-mono font-medium text-gray-700">{selectedTicket.id.substring(0, 12)}...</span>
                </div>
                <div className="flex flex-col p-3 bg-gray-50 rounded-xl gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">ZK Proof</span>
                    <span className="text-sm font-mono font-medium text-green-600 flex items-center gap-1">
                      <CheckCircle size={14} /> Verified
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 break-all leading-tight bg-gray-100 p-2 rounded border border-gray-200">
                    {generateZKProofHash(selectedTicket.id)}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Location</span>
                  <span className="text-sm font-medium text-gray-700">{selectedTicket.location}</span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
                  Show Entry Code
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Check if it's a real event
                      const isRealEvent = selectedTicket.id.startsWith('event_');

                      if (isRealEvent) {
                        // Call backend API to remove participant
                        const response = await fetch(`http://localhost:8000/api/v1/events/${selectedTicket.id}/leave`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            user_id: 'demo_user',
                            public_key: 'demo_key'
                          })
                        });

                        // If 404, it means the participant was never actually registered
                        // This is okay - we'll just remove it from localStorage
                        if (!response.ok && response.status !== 404) {
                          const errorData = await response.json();
                          throw new Error(errorData.detail || 'Failed to leave event');
                        }
                      }

                      // Update local storage and state
                      const updatedTickets = tickets.filter(t => t.id !== selectedTicket.id);
                      setTickets(updatedTickets);
                      localStorage.setItem('joinedEvents', JSON.stringify(updatedTickets));
                      setSelectedTicket(null);

                      alert('Successfully removed ticket');
                    } catch (error) {
                      console.error('Error cancelling participation:', error);
                      alert(error instanceof Error ? error.message : 'Failed to cancel participation');
                    }
                  }}
                  className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-semibold hover:bg-red-100 transition-colors"
                >
                  Cancel Participation
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
