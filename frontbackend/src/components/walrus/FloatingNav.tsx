import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Hammer, Compass, QrCode, Link as LinkIcon, Scale, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../ui/utils';

interface FloatingNavProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({ activePage, setActivePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const menuItems = [
    { id: 'landing', icon: Home, label: 'Landing' },
    { id: 'home', icon: Home, label: 'Sovereignty Center' },
    { id: 'forge', icon: Hammer, label: 'Event Forge' },
    { id: 'discovery', icon: Compass, label: 'Privacy Discovery' },
    { id: 'zkentry', icon: QrCode, label: 'ZK Entry' },
    { id: 'reputation', icon: LinkIcon, label: 'Reputation' },
    { id: 'governance', icon: Scale, label: 'Governance' },
  ];

  const toggleOpen = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50 pointer-events-none">
      <motion.div
        drag
        dragConstraints={{ left: -300, right: 0, top: 0, bottom: 600 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
        className="pointer-events-auto relative"
      >
        {/* Main Sphere */}
        <motion.div
          onClick={toggleOpen}
          className={cn(
            "w-16 h-16 rounded-full backdrop-blur-xl border-2 border-amber-400 flex items-center justify-center cursor-pointer shadow-[0_4px_20px_rgba(245,158,11,0.3)]",
            "bg-white/90 text-amber-700"
          )}
          animate={{
            boxShadow: isOpen
              ? "0 8px 30px rgba(245,158,11,0.4)"
              : "0 4px 20px rgba(245,158,11,0.2)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
            {/* Particle Effect Placeholder */}
            <div className="absolute inset-0 opacity-20 bg-gradient-to-tr from-transparent via-amber-400 to-transparent animate-spin-slow" />
            <div className="text-xs font-mono font-bold relative z-10">
              {activePage === 'landing' ? 'HOME' : activePage === 'home' ? 'Lvl.7' : activePage.substring(0, 3).toUpperCase()}
            </div>
          </div>
        </motion.div>

        {/* Expanded Menu */}
        <AnimatePresence>
          {isOpen && (
            <div className="absolute top-20 right-0 flex flex-col gap-3 items-end">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setActivePage(item.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md border-2 shadow-lg",
                    activePage === item.id
                      ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-400 font-semibold"
                      : "bg-white/90 text-gray-700 border-amber-200 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                  )}
                >
                  <span className="text-xs font-medium tracking-wide">{item.label}</span>
                  <item.icon size={16} />
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
