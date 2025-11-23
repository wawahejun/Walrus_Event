import React, { useState } from 'react';
import { Lock, Unlock, MapPin, Type, UploadCloud, X, Users, Ticket, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../ui/utils';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useSuiAnchor } from '../../hooks/useSuiAnchor';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { DatePickerWithTime } from '../ui/date-picker-with-time';
import { StackedCircularFooter } from '../ui/stacked-circular-footer';

export const EventForge = () => {
  // Wallet and blockchain hooks
  const account = useCurrentAccount();
  const { anchorToBlockchain, isAnchoring } = useSuiAnchor();

  const [privacyLevel, setPrivacyLevel] = useState(50);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    start_time: '',
    end_time: '',
    tags: [] as string[],
    max_participants: 100,
    ticket_type: 'free', // 'free' or 'paid'
    price: 0 // Price in MIST (1 SUI = 1,000,000,000 MIST)
  });
  const [priceDisplayValue, setPriceDisplayValue] = useState(''); // Separate state for display
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string, eventId?: string, txDigest?: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }

      // Store file for upload
      setSelectedFile(file);
      setMessage({ type: 'success', text: `✅ Image selected: ${file.name} (${Math.round(file.size / 1024)}KB)` });
    }
  };

  // Function to upload image and get URL
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/v1/events/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 'success') {
        return result.image_url;
      } else {
        setMessage({ type: 'error', text: `Failed to upload image: ${result.detail || 'Unknown error'}` });
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Network error while uploading image' });
      return null;
    }
  };

  const handleCreateEvent = async () => {
    // Helper function to validate date format and logic (e.g. reject Feb 31)
    const validateDateTime = (str: string) => {
      const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
      if (!regex.test(str)) return false;

      const [datePart, timePart] = str.split(' ');
      const [y, m, d] = datePart.split('-').map(Number);
      const [h, min] = timePart.split(':').map(Number);

      const date = new Date(y, m - 1, d, h, min);
      return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && date.getHours() === h && date.getMinutes() === min;
    };

    // Helper function to convert text input "YYYY-MM-DD HH:MM" to ISO string "YYYY-MM-DDTHH:MM:00"
    const toNaiveDatetime = (dateTimeStr: string) => {
      if (!dateTimeStr) return null;
      return dateTimeStr.replace(' ', 'T') + ':00';
    };

    // Validation
    if (!formData.title || !formData.description) {
      setMessage({ type: 'error', text: 'Please fill in title and description' });
      return;
    }

    if (formData.start_time && !validateDateTime(formData.start_time)) {
      setMessage({ type: 'error', text: 'Invalid Start Time. Format: YYYY-MM-DD HH:MM (e.g. 2025-11-23 19:00)' });
      return;
    }

    if (new Date(formData.start_time) < new Date()) {
      setMessage({ type: 'error', text: 'Start time cannot be in the past' });
      return;
    }

    if (formData.end_time && !validateDateTime(formData.end_time)) {
      setMessage({ type: 'error', text: 'Invalid End Time. Format: YYYY-MM-DD HH:MM' });
      return;
    }

    setCreating(true);
    setMessage(null);

    try {
      // Determine privacy level
      const privacyLevelMap = privacyLevel < 33 ? 'public' : privacyLevel < 66 ? 'hybrid' : 'zk-private';

      // Upload image first if selected
      let coverImagePath = null;
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) {
          coverImagePath = uploadedUrl;
        } else {
          setCreating(false);
          return; // Stop if image upload failed
        }
      }

      // Debug: Log price data before submission
      console.log('=== Event Creation DEBUG ===');
      console.log('Ticket Type:', formData.ticket_type);
      console.log('Form Data Price (MIST):', formData.price);
      console.log('Price Display Value:', priceDisplayValue);
      const finalPrice = formData.ticket_type === 'paid' ? formData.price : 0;
      console.log('Final Price to Submit (MIST):', finalPrice);
      console.log('Final Price in SUI:', finalPrice / 1000000000);

      // Create event
      const response = await fetch('http://localhost:8000/api/v1/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizer_id: account?.address || 'anonymous_' + Date.now(),
          title: formData.title,
          description: formData.description,
          event_type: 'Meetup',
          start_time: formData.start_time ? toNaiveDatetime(formData.start_time) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19),
          end_time: formData.end_time ? toNaiveDatetime(formData.end_time) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString().slice(0, 19),
          location: formData.location || 'Virtual',
          max_participants: formData.max_participants,
          privacy_level: privacyLevelMap,
          store_to_walrus: true,
          cover_image_path: coverImagePath,
          tags: formData.tags,
          ticket_type: formData.ticket_type,
          price: finalPrice
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        const blobId = result.walrus_storage?.blob_id;

        // If wallet connected, anchor to Sui blockchain
        if (account && blobId) {
          setMessage({
            type: 'success',
            text: `✅ Event created! Anchoring to Sui blockchain...\nBlob ID: ${blobId}`,
            eventId: result.event_id
          });

          try {
            // 使用后端返回的 event_hash（如果有）
            const eventHash = result.event_hash || btoa(JSON.stringify({
              id: result.event_id,
              title: formData.title,
              timestamp: Date.now()
            })).substring(0, 64).padEnd(64, '0');

            const anchorResult = await anchorToBlockchain(
              result.event_id,
              eventHash,
              blobId
            );

            if (anchorResult.success) {
              setMessage({
                type: 'success',
                text: `🎉 Event anchored to Sui blockchain!\n\nBlob ID: ${blobId}\nTransaction: ${anchorResult.digest?.slice(0, 16)}...\n\nView in Sui Explorer`,
                eventId: result.event_id,
                txDigest: anchorResult.digest
              });
            } else {
              setMessage({
                type: 'error',
                text: `Event created but blockchain anchoring failed: ${anchorResult.error}\n\nBlob ID: ${blobId}`
              });
            }
          } catch (txError: any) {
            console.error('Sui anchoring error:', txError);
            setMessage({
              type: 'error',
              text: `Event created but blockchain anchoring failed: ${txError.message}\n\nBlob ID: ${blobId}`
            });
          }
        } else {
          // No wallet connected, show success without blockchain
          setMessage({
            type: 'success',
            text: `✅ Event "${formData.title}" created!\nBlob ID: ${blobId || 'N/A'}\n\n${!account ? '💡 Connect wallet to anchor on Sui blockchain' : ''}`,
            eventId: result.event_id
          });
        }

        // Clear form
        setFormData({
          title: '',
          location: '',
          description: '',
          start_time: '',
          end_time: '',
          tags: [],
          max_participants: 100,
          ticket_type: 'free',
          price: 0
        });
        setSelectedFile(null);
        setTagInput('');
      } else {
        const errorText = typeof result.detail === 'string'
          ? result.detail
          : Array.isArray(result.detail)
            ? result.detail.map((e: any) => e.msg).join(', ')
            : JSON.stringify(result.detail);
        setMessage({ type: 'error', text: errorText || 'Failed to create event' });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-full w-full p-4 md:p-8 flex flex-col gap-8 text-gray-800 pb-24 overflow-y-auto no-scrollbar bg-gradient-to-br from-orange-50/60 via-amber-50/70 to-yellow-50/50">

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Left: Creation Form */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600">EVENT FORGE</h1>
            <p className="text-sm text-gray-800">Create Sovereign Events</p>
          </div>

          <div className="space-y-5">
            <EncryptedInput
              label="Event Title"
              icon={Type}
              value={formData.title}
              onChange={(v: string) => setFormData({ ...formData, title: v })}
              privacyLevel={privacyLevel}
            />
            <EncryptedInput
              label="Location / URL"
              icon={MapPin}
              value={formData.location}
              onChange={(v: string) => setFormData({ ...formData, location: v })}
              privacyLevel={privacyLevel}
            />
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-700 ml-1">Description</label>
              <div className="relative group">
                <textarea
                  className="w-full h-32 bg-white/80 border border-amber-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#F59E0B]/50 transition-colors resize-none shadow-sm"
                  placeholder="Event details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <div className="absolute top-4 right-4">
                  {privacyLevel > 0 ? <Lock size={14} className="text-[#F59E0B]" /> : <Unlock size={14} className="text-gray-400" />}
                </div>
              </div>
            </div>

            {/* Ticket & Capacity Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Participants */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-gray-700 ml-1">Max Participants</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F59E0B] transition-colors">
                    <Users size={16} />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 0 })}
                    className="w-full h-12 bg-white/80 border border-amber-200 rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:border-[#F59E0B]/50 transition-colors shadow-sm"
                  />
                </div>
              </div>

              {/* Ticket Type */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-gray-700 ml-1">Ticket Type</label>
                <div className="flex bg-white/80 border border-amber-200 rounded-xl p-1 h-12">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ticket_type: 'free' })}
                    className={cn(
                      "flex-1 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                      formData.ticket_type === 'free' ? "bg-amber-100 text-amber-800 shadow-sm" : "text-gray-500 hover:bg-amber-50"
                    )}
                  >
                    <Ticket size={14} /> Free
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ticket_type: 'paid' })}
                    className={cn(
                      "flex-1 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                      formData.ticket_type === 'paid' ? "bg-amber-100 text-amber-800 shadow-sm" : "text-gray-500 hover:bg-amber-50"
                    )}
                  >
                    <DollarSign size={14} /> Paid
                  </button>
                </div>
              </div>
            </div>

            {/* Price Input (Only if Paid) */}
            {formData.ticket_type === 'paid' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs uppercase tracking-wider text-gray-700 ml-1">Ticket Price (SUI)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F59E0B] transition-colors">
                    <span className="font-bold text-xs">SUI</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 0.0001 or 0.1"
                    value={priceDisplayValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only digits and at most one decimal point
                      if (/^[\d.]*$/.test(value) && (value.match(/\./g) || []).length <= 1) {
                        setPriceDisplayValue(value); // Keep the raw input
                        const suiValue = value === '' || value === '.' ? 0 : parseFloat(value) || 0;
                        const mistValue = Math.round(suiValue * 1000000000);
                        setFormData({ ...formData, price: mistValue });
                      }
                    }}
                    className="w-full h-12 bg-white/80 border border-amber-200 rounded-xl pl-12 pr-32 text-sm focus:outline-none focus:border-[#F59E0B]/50 transition-colors shadow-sm"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">
                    {formData.price.toLocaleString()} MIST
                  </div>
                </div>
                <p className="text-xs text-gray-500 ml-1">
                  💡 Enter SUI amount. 1 SUI = 1,000,000,000 MIST. Min: 0.0001 SUI
                </p>
              </div>
            )}

            {/* Start & End Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DatePickerWithTime
                  label="Start Time"
                  value={formData.start_time}
                  onChange={(v) => setFormData({ ...formData, start_time: v })}
                />
              </div>
              <div className="space-y-2">
                <DatePickerWithTime
                  label="End Time"
                  value={formData.end_time}
                  onChange={(v) => setFormData({ ...formData, end_time: v })}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-700 ml-1">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-white/80 border border-amber-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#F59E0B]/50 transition-colors shadow-sm"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      if (!formData.tags.includes(tagInput.trim())) {
                        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
                      }
                      setTagInput('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
                      setTagInput('');
                    }
                  }}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-sm font-medium"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, idx) => idx !== i) })}
                        className="hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-700 ml-1">Cover Image (Optional)</label>
              {selectedFile ? (
                <div className="relative group">
                  <div className="w-full h-48 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <UploadCloud size={32} className="text-amber-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-amber-700">{selectedFile.name}</p>
                      <p className="text-xs text-amber-600">{Math.round(selectedFile.size / 1024)}KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="w-full h-32 bg-white/80 border-2 border-dashed border-amber-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-amber-400 hover:bg-amber-50/50 transition-all">
                    <UploadCloud size={32} className="text-amber-400" />
                    <span className="text-sm text-gray-600">Click to upload image</span>
                    <span className="text-xs text-gray-500">Max 5MB</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Privacy Slider */}
            <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
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
                className="w-full h-2 bg-amber-100/50 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#F59E0B]"
              />
              <div className="flex justify-between text-[10px] text-gray-700 mt-2 uppercase tracking-wide">
                <span>Public on Chain</span>
                <span>Mixed Metadata</span>
                <span>Full Zero-Knowledge</span>
              </div>
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`p-4 rounded-xl ${message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                <div className="text-sm font-medium mb-2 whitespace-pre-line">{message.text}</div>
                {message.type === 'success' && message.eventId && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <p className="text-xs text-green-700 mb-2">Event ID: {message.eventId}</p>
                    <p className="text-xs text-green-600 italic">💡 Go to Privacy Discovery tab to see your event!</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCreateEvent}
              disabled={creating || isAnchoring}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F59E0B] to-yellow-600 font-bold text-white shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud size={18} />
              <span>
                {creating ? 'CREATING...' : isAnchoring ? 'ANCHORING TO SUI...' : 'FORGE & SEAL ON WALRUS'}
              </span>
            </button>

            {!account && (
              <p className="text-xs text-amber-600 text-center mt-2">
                💡 Connect your Sui wallet to anchor events on blockchain
              </p>
            )}
          </div>
        </div>

        {/* Right: Real-time Preview */}
        <div className="w-full lg:w-[400px] flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Walrus Storage Preview</h3>

          <div className="bg-white/80 rounded-xl border border-amber-200 p-6 font-mono text-xs overflow-hidden relative shadow-lg h-fit">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

            <div className="relative z-10 space-y-4">
              <div className="border-b border-amber-200 pb-2 mb-4">
                <span className="text-[#F59E0B] mr-2">{'>'}</span>
                <span className="text-gray-800">generating_blob_id...</span>
              </div>

              <PreviewItem label="TITLE" value={formData.title} secure={privacyLevel > 0} />
              <PreviewItem label="LOCATION" value={formData.location} secure={privacyLevel > 0} />
              <PreviewItem label="METADATA" value={formData.description} secure={privacyLevel > 50} multiline />

              {selectedFile && (
                <div className="space-y-1">
                  <div className="text-gray-700 text-[10px]">COVER IMAGE</div>
                  <div className="text-green-600">
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-amber-200">
                <div className="flex items-center justify-between text-gray-700 mb-2">
                  <span>Shards Distribution</span>
                  <span>3/5 Nodes</span>
                </div>
                <div className="flex gap-1 h-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={cn("flex-1 rounded-full", i < 3 ? "bg-green-500/50" : "bg-amber-100/50")} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StackedCircularFooter />
    </div>
  );
};

const EncryptedInput = ({ label, icon: Icon, value, onChange, privacyLevel }: any) => {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wider text-gray-700 ml-1 flex items-center justify-between">
        <span>{label}</span>
        {privacyLevel > 0 && <Lock size={10} className="text-[#F59E0B] animate-pulse" />}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F59E0B] transition-colors">
          <Icon size={16} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 bg-white/80 border border-amber-200 rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:border-[#F59E0B]/50 transition-colors shadow-sm"
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      </div>
    </div>
  )
}

const PreviewItem = ({ label, value, secure, multiline }: any) => {
  // Simple "hashing" simulation for visual effect
  const hash = value ? btoa(value).substring(0, multiline ? 100 : 20) + (value.length > 0 ? "..." : "") : "";

  return (
    <div className="space-y-1">
      <div className="text-gray-700 text-[10px]">{label}</div>
      <div className={cn(
        "break-all transition-all duration-500",
        secure ? "text-[#F59E0B] blur-[0.5px]" : "text-gray-800"
      )}>
        {secure ? (value ? hash : <span className="opacity-50 text-gray-600">waiting_for_input...</span>) : (value || <span className="opacity-50 text-gray-600">waiting_for_input...</span>)}
      </div>
    </div>
  )
}


