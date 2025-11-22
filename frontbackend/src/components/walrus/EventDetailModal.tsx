import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Users, Hash, Shield, Database } from 'lucide-react';
import { Activity } from './PrivacyDiscovery';

interface EventDetailModalProps {
    event: Activity | null;
    isOpen: boolean;
    onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, isOpen, onClose }) => {
    if (!event) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[80vh] bg-white rounded-2xl shadow-2xl z-[9999] overflow-hidden"
                    >
                        {/* Header with Image */}
                        <div className="relative h-48 bg-gradient-to-br from-amber-400 to-orange-500">
                            {event.image && (
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors z-[10000] shadow-lg"
                            >
                                <X size={20} className="text-gray-800" />
                            </button>

                            {/* Title Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-2xl font-bold text-white">{event.title}</h2>
                                    <span className="px-3 py-1 bg-amber-500 text-white text-sm rounded-full whitespace-nowrap ml-4">
                                        {event.category}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(80vh-12rem)]">
                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Description</h3>
                                <p className="text-gray-700 leading-relaxed">{event.description}</p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <Calendar size={18} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600">Date</div>
                                        <div className="font-medium text-gray-900">{event.date}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MapPin size={18} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600">Location</div>
                                        <div className="font-medium text-gray-900">{event.location}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Users size={18} className="text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600">Participants</div>
                                        <div className="font-medium text-gray-900">
                                            {event.participants} / {event.maxParticipants}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Hash size={18} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600">Event ID</div>
                                        <div className="font-mono text-xs text-gray-900">{event.id.substring(0, 12)}...</div>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            {event.tags && event.tags.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {event.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Organizer & Additional Info */}
                            <div className="border-t border-gray-200 pt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {event.organizer && (
                                        <div>
                                            <div className="text-gray-600 mb-1">Organizer</div>
                                            <div className="font-medium text-gray-900">{event.organizer}</div>
                                        </div>
                                    )}
                                    {event.time && (
                                        <div>
                                            <div className="text-gray-600 mb-1">Time</div>
                                            <div className="font-medium text-gray-900">{event.time}</div>
                                        </div>
                                    )}
                                    {event.recommendationScore && (
                                        <div>
                                            <div className="text-gray-600 mb-1">Match Score</div>
                                            <div className="font-medium text-amber-600">{event.recommendationScore}%</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex gap-3">
                                <button className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                                    Join Event
                                </button>
                                <button className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all">
                                    Share
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
