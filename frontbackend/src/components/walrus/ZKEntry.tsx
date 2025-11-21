import React, { useState } from 'react';
import { motion } from 'motion/react';
import { QrCode, Scan, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../ui/utils';

export const ZKEntry = () => {
  const [scanning, setScanning] = useState(true);
  const [verified, setVerified] = useState<boolean | null>(null);

  const handleSimulateScan = () => {
    setScanning(false);
    setTimeout(() => setVerified(true), 1500);
  };

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden">
      {/* Camera Viewfinder Simulation */}
      <div className="flex-1 relative bg-white">
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
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
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

      {/* Bottom Ticket Wallet */}
      <div className="h-[200px] bg-white/95 border-t border-amber-200 p-6 z-20">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Your ZK Tickets</h3>
           <button className="text-[#F59E0B] text-xs hover:underline">View All</button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[1, 2, 3].map((ticket) => (
            <div key={ticket} className="flex-shrink-0 w-64 h-24 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 hover:bg-amber-100/50 transition-colors cursor-pointer">
              <div className="w-16 h-full bg-white/40 rounded-lg flex items-center justify-center">
                <QrCode className="text-white/20" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-sm font-bold text-gray-800">DAO Annual Summit</div>
                <div className="text-xs text-gray-500 mb-1">Nov 24 • 18:00</div>
                <div className="flex items-center gap-1 text-[10px] text-green-400">
                  <CheckCircle size={10} />
                  <span>Ready to Verify</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
