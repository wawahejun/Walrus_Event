import React from 'react';
import { motion } from 'motion/react';
import { Link as LinkIcon, Share2, Shield, Activity, Award } from 'lucide-react';
import { cn } from '../ui/utils';

export const ReputationSystem = () => {
  return (
    <div className="h-full w-full p-4 md:p-8 flex flex-col gap-8 text-gray-800 pb-24 overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">REPUTATION SYSTEM</h1>
          <p className="text-sm text-gray-700 mt-1">Sovereign Identity & Trust Score</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-[#F59E0B]">842</div>
          <div className="text-[10px] text-gray-700 uppercase tracking-widest">Trust Score</div>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div className="flex-1 min-h-[400px] flex flex-col lg:flex-row gap-8">

        {/* 3D Object / NFT Placeholder */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-[#F59E0B]/20 to-purple-500/20 border border-amber-200 backdrop-blur-xl relative group perspective-1000">
            <motion.div
              className="w-full h-full flex items-center justify-center preserve-3d"
              animate={{ rotateY: [0, 10, 0, -10, 0], rotateX: [0, 5, 0, -5, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            >
              <Award size={120} className="text-white/80 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]" />
            </motion.div>

            {/* Drag Targets (Mock) */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" title="Connect Discord">
                <Share2 size={16} />
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" title="Connect Twitter">
                <Share2 size={16} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Active Verifications</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700">Sybil Resistance</span>
                <span className="text-green-400">Verified</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700">Contribution History</span>
                <span className="text-[#F59E0B]">Level 7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Markov Chain Visualization */}
        <div className="w-full lg:w-2/3 bg-white/70 rounded-2xl border border-amber-200 p-8 relative overflow-hidden">
          <h3 className="text-sm font-bold text-gray-700 absolute top-6 left-6 uppercase tracking-wider">Reputation State Machine</h3>

          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-full max-w-2xl h-64">
              {/* Nodes */}
              <StateNode x="10%" y="50%" label="Newbie" active={false} />
              <StateNode x="35%" y="20%" label="Verified" active={false} />
              <StateNode x="35%" y="80%" label="Contributor" active={false} />
              <StateNode x="60%" y="50%" label="Sovereign" active={true} />
              <StateNode x="90%" y="50%" label="Council" active={false} />

              {/* Connecting Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10">
                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="rgba(255,255,255,0.2)" />
                  </marker>
                </defs>
                <path d="M10% 50% L35% 20%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" markerEnd="url(#arrow)" />
                <path d="M10% 50% L35% 80%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" markerEnd="url(#arrow)" />
                <path d="M35% 20% L60% 50%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" markerEnd="url(#arrow)" />
                <path d="M35% 80% L60% 50%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" markerEnd="url(#arrow)" />
                <path d="M60% 50% L90% 50%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" markerEnd="url(#arrow)" />

                {/* Active Flow Animation */}
                <motion.circle r="3" fill="#F59E0B"
                  animate={{ offsetDistance: ["0%", "100%"] }}
                  style={{ offsetPath: "path('M 35 80 L 60 50')" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StateNode = ({ x, y, label, active }: any) => (
  <div
    className={cn(
      "absolute w-24 h-24 -ml-12 -mt-12 rounded-full border flex items-center justify-center flex-col gap-1 backdrop-blur-md transition-all",
      active
        ? "bg-[#F59E0B]/20 border-[#F59E0B] shadow-[0_4px_20px_rgba(245,158,11,0.25)] z-10"
        : "bg-amber-50 border-amber-200 hover:border-amber-300"
    )}
    style={{ left: x, top: y }}
  >
    <div className={cn("w-2 h-2 rounded-full mb-1", active ? "bg-[#F59E0B] animate-pulse" : "bg-amber-100")} />
    <span className={cn("text-xs font-medium", active ? "text-gray-800" : "text-gray-700")}>{label}</span>
  </div>
)
