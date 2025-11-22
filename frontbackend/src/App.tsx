import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { FloatingNav } from './components/walrus/FloatingNav';
import { HomePage } from './components/walrus/HomePage';
import { SovereigntyCenter } from './components/walrus/SovereigntyCenter';
import PrivacyDiscovery from './components/walrus/PrivacyDiscovery';
import { EventForge } from './components/walrus/EventForge';
import { ZKEntry } from './components/walrus/ZKEntry';
import { ReputationSystem } from './components/walrus/ReputationSystem';
import { GovernanceHall } from './components/walrus/GovernanceHall';
import { cn } from './components/ui/utils';
import { WalletButton } from './components/wallet/wallet-button';

// Background Particles Component
const StarField = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dimensions.width > 0 && [...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          initial={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
            opacity: Math.random() * 0.3 + 0.1,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{
            y: [null, Math.random() * dimensions.height],
            opacity: [null, Math.random() * 0.3 + 0.1]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            background: i % 2 === 0 ? '#F59E0B' : '#FBBF24',
          }}
        />
      ))}
    </div>
  );
};

export default function App() {
  const [activePage, setActivePage] = useState('discovery');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11

  // Get number of days in selected month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayOfMonth = getFirstDayOfMonth(selectedYear, selectedMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'landing': return <HomePage onNavigate={setActivePage} />;
      case 'home': return <SovereigntyCenter />;
      case 'discovery': return <PrivacyDiscovery />;
      case 'forge': return <EventForge />;
      case 'zkentry': return <ZKEntry />;
      case 'reputation': return <ReputationSystem />;
      case 'governance': return <GovernanceHall />;
      default: return <HomePage onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-amber-50 via-orange-50/60 to-rose-50/40 text-gray-800 overflow-hidden font-sans selection:bg-amber-200/40">
      {/* Global Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/40 via-orange-50/30 to-yellow-50/30" />
      <StarField />

      {/* Global Calendar Drawer */}
      <motion.div
        initial={{ y: '-100%' }}
        animate={{ y: calendarOpen ? 0 : '-95%' }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="absolute top-0 left-0 right-0 h-2/3 bg-white/95 backdrop-blur-xl z-40 border-b-2 border-amber-200 flex flex-col shadow-2xl"
      >
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">Global Timeline</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousMonth}
                  className="p-1 hover:bg-amber-100 rounded transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronDown className="w-5 h-5 text-amber-600 rotate-90" />
                </button>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-1 border border-amber-200 rounded-lg bg-white text-sm font-medium text-gray-800 focus:outline-none focus:border-amber-400"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-1 border border-amber-200 rounded-lg bg-white text-sm font-medium text-gray-800 focus:outline-none focus:border-amber-400"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-amber-100 rounded transition-colors"
                  aria-label="Next month"
                >
                  <ChevronDown className="w-5 h-5 text-amber-600 -rotate-90" />
                </button>
              </div>
            </div>
            <WalletButton />
          </div>
          <div className="grid grid-cols-7 gap-4 h-full pb-12">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-gray-500 uppercase tracking-widest text-xs font-medium">{d}</div>
            ))}
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className=""></div>
            ))}
            {/* Actual days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const today = new Date();
              const isToday = day === today.getDate() &&
                selectedMonth === today.getMonth() &&
                selectedYear === today.getFullYear();
              const hasEvent = [5, 12, 18, 24].includes(day);

              return (
                <div
                  key={day}
                  className={`border-2 rounded-lg p-2 hover:bg-amber-50 transition-colors relative bg-white ${isToday ? 'border-amber-400 bg-amber-50' : 'border-amber-100'
                    }`}
                >
                  <span className={`text-xs ${isToday ? 'text-amber-600 font-bold' : 'text-gray-600'}`}>{day}</span>
                  {hasEvent && (
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.6)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pull Tab */}
        <div
          className="h-12 w-full flex items-center justify-center cursor-pointer hover:bg-amber-50 transition-colors border-t-2 border-amber-200"
          onClick={() => setCalendarOpen(!calendarOpen)}
        >
          <ChevronDown
            className={cn("text-amber-600 transition-transform", calendarOpen ? "rotate-180" : "")}
          />
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <FloatingNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}
