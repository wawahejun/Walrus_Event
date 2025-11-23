import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Scale, FileText, Check, X, Lock } from 'lucide-react';
import { cn } from '../ui/utils';
import { StackedCircularFooter } from '../ui/stacked-circular-footer';

export const GovernanceHall = () => {
  return (
    <div className="h-full w-full p-4 md:p-8 flex flex-col gap-8 text-gray-800 pb-24 overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">GOVERNANCE HALL</h1>
          <p className="text-sm text-gray-700 mt-1">Private Voting & Proposal DAO</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 text-xs hover:bg-[#F59E0B]/20 transition-colors">
          + New Proposal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProposalCard
          id="WIP-24"
          title="Increase Walrus Storage Cap"
          description="Proposal to increase the storage cap per node to 500GB to accommodate growing media demand."
          votes={1240}
          timeLeft="2d 4h"
        />
        <ProposalCard
          id="WIP-25"
          title="Update Privacy Defaults"
          description="Change default privacy setting from 'Hybrid' to 'Full ZK' for all new events."
          votes={850}
          timeLeft="4d 12h"
        />
        <ProposalCard
          id="WIP-26"
          title="Community Treasury Allocation"
          description="Allocate 5% of treasury to fund privacy research grants."
          votes={2100}
          timeLeft="12h 30m"
          hasVoted
        />
      </div>
      <StackedCircularFooter />
    </div>
  );
};

const ProposalCard = ({ id, title, description, votes, timeLeft, hasVoted }: any) => {
  const [votingState, setVotingState] = useState<'idle' | 'voting' | 'sealed'>('idle');

  const handleVote = () => {
    setVotingState('voting');
    setTimeout(() => setVotingState('sealed'), 2000);
  };

  if (hasVoted || votingState === 'sealed') {
    return (
      <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-center min-h-[200px] relative overflow-hidden">
        <div className="absolute inset-0 bg-green-500/5" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="z-10"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400 border border-green-500/50">
            <Lock size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Vote Sealed</h3>
          <p className="text-xs text-gray-700 mt-2">Your vote has been ZK-encrypted and cast.</p>
          <div className="mt-4 text-[10px] font-mono text-gray-600">{id} • HASH: 0x9f...2a</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-xl bg-[#000]/40 border border-amber-200 hover:border-[#F59E0B]/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <span className="px-2 py-1 rounded bg-amber-100/50 text-[10px] font-mono text-gray-700">{id}</span>
        <span className="text-xs text-[#F59E0B]">{timeLeft} remaining</span>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#F59E0B] transition-colors">{title}</h3>
      <p className="text-sm text-gray-700 mb-6 leading-relaxed">{description}</p>

      {votingState === 'idle' ? (
        <div className="flex gap-3">
          <button
            onClick={handleVote}
            className="flex-1 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={16} /> Approve
          </button>
          <button
            onClick={handleVote}
            className="flex-1 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} /> Reject
          </button>
        </div>
      ) : (
        <div className="h-12 flex items-center justify-center text-[#F59E0B] gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Lock size={16} />
          </motion.div>
          <span className="text-xs font-mono">Generating ZK Proof...</span>
        </div>
      )}
    </div>
  );
}
