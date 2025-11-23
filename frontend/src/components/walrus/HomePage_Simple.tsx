import React from 'react';
import { motion } from 'motion/react';
import { Shield, Hammer, Compass, QrCode, Link as LinkIcon, Scale, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../ui/utils';
import { StackedCircularFooter } from '../ui/stacked-circular-footer';

interface HomePageProps {
    onNavigate?: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    const features = [
        {
            id: 'home',
            icon: Shield,
            title: 'Sovereignty Center',
            description: 'Manage your digital identity and data sovereignty with advanced privacy controls',
            gradient: 'from-amber-100 to-yellow-50',
            iconColor: 'text-amber-600',
            borderColor: 'border-amber-200',
        },
        {
            id: 'forge',
            icon: Hammer,
            title: 'Event Forge',
            description: 'Create and manage events with zero-knowledge proof verification',
            gradient: 'from-orange-100 to-amber-50',
            iconColor: 'text-orange-600',
            borderColor: 'border-orange-200',
        },
        {
            id: 'discovery',
            icon: Compass,
            title: 'Privacy Discovery',
            description: 'Explore privacy-preserving connections and discover relevant content',
            gradient: 'from-yellow-100 to-amber-50',
            iconColor: 'text-yellow-600',
            borderColor: 'border-yellow-200',
        },
        {
            id: 'zkentry',
            icon: QrCode,
            title: 'ZK Entry',
            description: 'Secure authentication using zero-knowledge proofs and cryptographic verification',
            gradient: 'from-amber-100 to-orange-50',
            iconColor: 'text-amber-700',
            borderColor: 'border-amber-300',
        },
        {
            id: 'reputation',
            icon: LinkIcon,
            title: 'Reputation System',
            description: 'Build and maintain your decentralized reputation across the network',
            gradient: 'from-yellow-50 to-amber-100',
            iconColor: 'text-yellow-700',
            borderColor: 'border-yellow-300',
        },
        {
            id: 'governance',
            icon: Scale,
            title: 'Governance Hall',
            description: 'Participate in decentralized governance and community decision-making',
            gradient: 'from-orange-50 to-yellow-100',
            iconColor: 'text-orange-700',
            borderColor: 'border-orange-300',
        },
    ];

    return (
        <div className="h-full w-full flex flex-col overflow-y-auto no-scrollbar pb-24 bg-gradient-to-br from-white via-amber-50/20 to-white">
            {/* Hero Section */}
            <section className="min-h-[600px] flex items-center justify-center px-4 md:px-8 py-20 relative">
                {/* Animated Background - Very Subtle */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full"
                            initial={{
                                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                                y: Math.random() * 400,
                                scale: 0,
                                opacity: 0,
                            }}
                            animate={{
                                scale: [0, 1, 0],
                                opacity: [0, 0.1, 0],
                            }}
                            transition={{
                                duration: 4 + Math.random() * 2,
                                repeat: Infinity,
                                delay: i * 0.5,
                            }}
                            style={{
                                width: 150 + Math.random() * 100 + 'px',
                                height: 150 + Math.random() * 100 + 'px',
                                background: `radial-gradient(circle, ${i % 2 === 0 ? '#F59E0B' : '#FBBF24'}30, transparent)`,
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-20 text-center max-w-5xl mx-auto w-full space-y-8">
                    {/* Subtitle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center justify-center gap-2"
                    >
                        <Sparkles className="text-amber-600" size={20} />
                        <span className="text-sm font-mono text-amber-700 tracking-widest uppercase">
                            Walrus Event Platform
                        </span>
                        <Sparkles className="text-amber-600" size={20} />
                    </motion.div>

                    {/* Main Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                            <div className="mb-4">
                                <span className="text-gray-900">Your Data</span>
                                <span className="mx-4 text-amber-600">|</span>
                                <span className="text-gray-900">Your Reputation</span>
                            </div>
                            <div className="text-orange-600">
                                Your Control
                            </div>
                        </h1>
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
                    >
                        A privacy-first platform for managing your digital sovereignty.
                        Built on zero-knowledge proofs and decentralized governance.
                    </motion.p>

                    {/* Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate?.('home')}
                            className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            Get Started
                            <ArrowRight size={20} />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate?.('discovery')}
                            className="px-8 py-4 rounded-full border-2 border-amber-300 text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
                        >
                            Explore Features
                        </motion.button>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12"
                    >
                        {[
                            { value: '10K+', label: 'Active Users' },
                            { value: '99.9%', label: 'Uptime' },
                            { value: '1M+', label: 'ZK Proofs' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-bold text-amber-600 mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-500 uppercase tracking-wider">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="px-4 md:px-8 py-20 bg-white/50">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Explore the Ecosystem
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Navigate through our comprehensive suite of privacy-preserving tools and services
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            onClick={() => onNavigate?.(feature.id)}
                            className="group cursor-pointer"
                        >
                            <div
                                className={cn(
                                    'h-full p-6 rounded-2xl border-2',
                                    feature.borderColor,
                                    'bg-white hover:bg-gradient-to-br hover:from-white hover:to-amber-50/50',
                                    'transition-all duration-300',
                                    'shadow-lg hover:shadow-[0_8px_30px_rgba(217,119,6,0.15)]'
                                )}
                            >
                                {/* Icon */}
                                <div
                                    className={cn(
                                        'w-14 h-14 rounded-xl mb-4 flex items-center justify-center',
                                        'bg-gradient-to-br',
                                        feature.gradient,
                                        'border-2',
                                        feature.borderColor,
                                        'group-hover:scale-110 transition-transform duration-300'
                                    )}
                                >
                                    <feature.icon className={cn('w-7 h-7', feature.iconColor)} />
                                </div>

                                {/* Content */}
                                <h3 className={cn('text-xl font-bold mb-2 transition-colors', 'text-gray-800 group-hover:text-amber-700')}>
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                    {feature.description}
                                </p>

                                {/* Arrow */}
                                <div className="flex items-center gap-2 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-sm font-semibold">Explore</span>
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Call to Action */}
            <section className="px-4 md:px-8 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 p-8 md:p-12 text-center shadow-xl"
                >
                    <Shield className="w-16 h-16 text-amber-600 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Ready to Take Control?
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                        Join thousands of users who have already embraced digital sovereignty.
                        Your privacy, your rules.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate?.('home')}
                        className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold shadow-[0_4px_20px_rgba(217,119,6,0.4)] hover:shadow-[0_8px_30px_rgba(217,119,6,0.5)] transition-shadow"
                    >
                        Go to Sovereignty Center
                    </motion.button>
                </motion.div>
            </section>
            <StackedCircularFooter />
        </div >
    );
};
