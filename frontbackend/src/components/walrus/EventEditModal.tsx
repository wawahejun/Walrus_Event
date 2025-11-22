import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, UploadCloud, Lock, Unlock } from 'lucide-react';
import { cn } from '../ui/utils';

interface EventEditModalProps {
    event: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export const EventEditModal: React.FC<EventEditModalProps> = ({ event, isOpen, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        description: ''
    });
    const [privacyLevel, setPrivacyLevel] = useState(50);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                location: event.location,
                description: event.description
            });
            setCoverImage(event.image || event.cover_image);
            // Map privacy level string to number if needed, or default to 50
            setPrivacyLevel(event.privacy_level === 'zk-private' ? 100 : event.privacy_level === 'public' ? 0 : 50);
        }
    }, [event]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async () => {
        setUpdating(true);
        setMessage(null);

        try {
            const privacyLevelMap = privacyLevel === 0 ? 'public' : privacyLevel === 100 ? 'zk-private' : 'hybrid';

            const response = await fetch(`http://localhost:8000/api/v1/events/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizer_id: event.organizer_id || 'user_demo', // Should verify ownership
                    title: formData.title,
                    description: formData.description,
                    location: formData.location,
                    privacy_level: privacyLevelMap,
                    cover_image: coverImage
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                setMessage({ type: 'success', text: 'Event updated successfully!' });
                setTimeout(() => {
                    onUpdate();
                    onClose();
                }, 1500);
            } else {
                setMessage({ type: 'error', text: result.detail || 'Failed to update event' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred' });
        } finally {
            setUpdating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50">
                            <h2 className="text-xl font-bold text-gray-800">Edit Event</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-700 ml-1">Event Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:border-amber-500 transition-colors"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-700 ml-1">Location</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-700 ml-1">Description</label>
                                <textarea
                                    className="w-full h-32 bg-white border border-amber-200 rounded-xl p-4 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-700 ml-1">Cover Image</label>
                                {coverImage ? (
                                    <div className="relative group">
                                        <img src={coverImage} alt="Preview" className="w-full h-48 object-cover rounded-xl border-2 border-amber-200" />
                                        <button
                                            onClick={() => setCoverImage(null)}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="block cursor-pointer">
                                        <div className="w-full h-32 bg-white border-2 border-dashed border-amber-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-amber-400 hover:bg-amber-50 transition-all">
                                            <UploadCloud size={32} className="text-amber-400" />
                                            <span className="text-sm text-gray-600">Change Cover Image</span>
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                )}
                            </div>

                            {/* Privacy Level */}
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-medium">Privacy Level</label>
                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded border",
                                        privacyLevel === 0 ? "border-red-500/50 text-red-400 bg-red-500/10" :
                                            privacyLevel === 100 ? "border-[#F59E0B]/50 text-[#F59E0B] bg-[#F59E0B]/10" :
                                                "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                                    )}>
                                        {privacyLevel === 0 ? "PUBLIC" : privacyLevel === 100 ? "ZK-PRIVATE" : "HYBRID"}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="50"
                                    value={privacyLevel}
                                    onChange={(e) => setPrivacyLevel(parseInt(e.target.value))}
                                    className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#F59E0B]"
                                />
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={updating}
                                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {updating ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
