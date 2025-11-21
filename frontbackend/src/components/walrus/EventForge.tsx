import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Unlock, Eye, Save, Calendar, MapPin, Type, UploadCloud } from 'lucide-react';
import { cn } from '../ui/utils';

export const EventForge = () => {
  const [privacyLevel, setPrivacyLevel] = useState(50);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: ''
  });

  return (
    <div className="h-full w-full p-4 md:p-8 flex flex-col lg:flex-row gap-8 text-gray-800 pb-24 overflow-y-auto no-scrollbar bg-gradient-to-br from-orange-50/60 via-amber-50/70 to-yellow-50/50">

      {/* Left: Creation Form */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600">EVENT FORGE</h1>
          <p className="text-sm text-gray-600">Create Sovereign Events</p>
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
            <label className="text-xs uppercase tracking-wider text-gray-600 ml-1">Description</label>
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
            <div className="flex justify-between text-[10px] text-gray-400 mt-2 uppercase tracking-wide">
              <span>Public on Chain</span>
              <span>Mixed Metadata</span>
              <span>Full Zero-Knowledge</span>
            </div>
          </div>

          <button className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F59E0B] to-yellow-600 font-bold text-white shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <UploadCloud size={18} />
            <span>FORGE & SEAL ON WALRUS</span>
          </button>
        </div>
      </div>

      {/* Right: Real-time Preview */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4">
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Walrus Storage Preview</h3>

        <div className="flex-1 bg-white/80 rounded-xl border border-amber-200 p-6 font-mono text-xs overflow-hidden relative shadow-lg">
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

            <div className="mt-8 pt-4 border-t border-amber-200">
              <div className="flex items-center justify-between text-gray-500 mb-2">
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
  );
};

const EncryptedInput = ({ label, icon: Icon, value, onChange, privacyLevel }: any) => {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wider text-gray-600 ml-1 flex items-center justify-between">
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
      <div className="text-gray-500 text-[10px]">{label}</div>
      <div className={cn(
        "break-all transition-all duration-500",
        secure ? "text-[#F59E0B] blur-[0.5px]" : "text-gray-800"
      )}>
        {secure ? (value ? hash : <span className="opacity-20">waiting_for_input...</span>) : (value || <span className="opacity-20">waiting_for_input...</span>)}
      </div>
    </div>
  )
}
