import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Database, Activity, Users, Lock, Globe } from 'lucide-react';
import { cn } from '../ui/utils';

export const SovereigntyCenter = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="h-full w-full p-4 md:p-8 flex flex-col gap-8 text-gray-800 pb-24 overflow-y-auto no-scrollbar">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-700/60">
            SOVEREIGNTY CENTER
          </h1>
          <p className="text-xs text-[#F59E0B] font-mono mt-1">NODE: WALRUS-7A • ONLINE</p>
        </div>
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
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">0xWalrus...8A2</h2>
                <div className="h-1 w-full bg-amber-100/50 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#F59E0B]" 
                    initial={{ width: 0 }}
                    animate={{ width: "72%" }}
                    transition={{ delay: 0.5, duration: 1 }}
                  />
                </div>
                <p className="text-xs text-gray-600 font-mono">REPUTATION SCORE: 842/1000</p>
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
                  <p className="text-[10px] text-gray-500 font-mono break-all">
                    0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
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
              <span className="flex items-center gap-1 text-gray-600"><span className="w-2 h-2 rounded-full bg-green-400" /> Created</span>
              <span className="flex items-center gap-1 text-gray-600"><span className="w-2 h-2 rounded-full bg-blue-400" /> Joined</span>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 h-full">
            {['S','M','T','W','T','F','S'].map(d => (
              <div key={d} className="text-center text-xs text-gray-400 font-mono py-1">{d}</div>
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

      {/* Bottom Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className="text-xs text-gray-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
