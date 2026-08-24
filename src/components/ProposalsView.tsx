import React, { useState } from 'react';
import { ProposalVersion, ContractorCompanyProfile, JobBid } from '../types';
import { createProposalVersion, sanitizeProposalForCustomerView } from '../utils/proposalEngine';
import { CustomerProposalModal } from './CustomerProposalModal';
import { 
  FileText, 
  GitBranch, 
  ShieldCheck, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Calendar, 
  Plus, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ProposalsViewProps {
  proposals: ProposalVersion[];
  bids: JobBid[];
  companyProfile: ContractorCompanyProfile;
  onSaveProposal: (proposal: ProposalVersion) => void;
  onSelectBidForProposal: (bidId: string) => void;
}

export const ProposalsView: React.FC<ProposalsViewProps> = ({
  proposals,
  bids,
  companyProfile,
  onSaveProposal,
  onSelectBidForProposal
}) => {
  const [selectedProposalForCustomerView, setSelectedProposalForCustomerView] = useState<ProposalVersion | null>(null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [parentProposalForRev, setParentProposalForRev] = useState<ProposalVersion | null>(null);
  const [revNotes, setRevNotes] = useState('');

  const handleCreateRevision = (parent: ProposalVersion) => {
    const parentBid = bids.find(b => b.id === parent.bidId);
    if (!parentBid) {
      alert('Associated bid not found to branch new version.');
      return;
    }

    const { newVersion, updatedParent } = createProposalVersion(
      parentBid,
      companyProfile,
      parent,
      revNotes || 'Customer requested pricing / scope revisions'
    );

    if (updatedParent) {
      onSaveProposal(updatedParent);
    }
    onSaveProposal(newVersion);
    setShowRevisionModal(false);
    setParentProposalForRev(null);
    setRevNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Proposal Versions & Acceptance</h2>
          </div>
          <p className="text-xs text-slate-400">
            Immutable version branching, cryptographic checksums, and client-sanitized proposal presentations.
          </p>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {proposals.map((prop) => {
          const isAccepted = prop.status === 'ACCEPTANCE_RECORDED';
          const isSuperseded = prop.status === 'SUPERSEDED';

          return (
            <div
              key={prop.id}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition flex flex-col justify-between shadow-xl ${
                isAccepted 
                  ? 'border-emerald-500/40 bg-slate-900/90' 
                  : isSuperseded 
                    ? 'border-slate-800 opacity-60' 
                    : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-base">{prop.customerName}</h3>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-teal-400">
                        v{prop.versionNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{prop.id.slice(0, 20)}...</p>
                  </div>

                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                    isAccepted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isSuperseded
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-teal-500/20 text-teal-300'
                  }`}>
                    {prop.status}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Base Contract Value:</span>
                    <span className="font-mono font-bold text-teal-400 text-sm">
                      ${prop.financialSnapshot.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>Target Margin:</span>
                    <span className="font-mono text-emerald-400">{prop.financialSnapshot.profitMarginPercent}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>Burdened Labor Hrs:</span>
                    <span className="font-mono text-slate-200">{prop.financialSnapshot.adjustedLaborHours} hrs</span>
                  </div>
                </div>

                {prop.revisionNotes && (
                  <p className="text-xs text-amber-300/90 italic bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    "{prop.revisionNotes}"
                  </p>
                )}

                <div className="text-[11px] text-slate-500 font-mono truncate">
                  Hash: {prop.integrityHash}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProposalForCustomerView(prop)}
                    className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-teal-600/20"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Customer View
                  </button>

                  {!isSuperseded && !isAccepted && (
                    <button
                      onClick={() => {
                        setParentProposalForRev(prop);
                        setShowRevisionModal(true);
                      }}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition border border-slate-700 flex items-center gap-1"
                      title="Branch New Proposal Version"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                      Branch
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Sanitized Proposal Modal */}
      {selectedProposalForCustomerView && (
        <CustomerProposalModal
          proposal={selectedProposalForCustomerView}
          companyProfile={companyProfile}
          onClose={() => setSelectedProposalForCustomerView(null)}
          onAcceptanceRecorded={(updated) => {
            onSaveProposal(updated);
            setSelectedProposalForCustomerView(updated);
          }}
        />
      )}

      {/* Branch New Version Modal */}
      {showRevisionModal && parentProposalForRev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-amber-400" />
              Branch Proposal Version v{parentProposalForRev.versionNumber + 1}
            </h3>
            <p className="text-xs text-slate-400">
              Parent v{parentProposalForRev.versionNumber} will be marked SUPERSEDED and locked. The new version will inherit the latest bid items and adjustments.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Revision Reason / Scope Changes</label>
              <textarea
                value={revNotes}
                onChange={(e) => setRevNotes(e.target.value)}
                placeholder="e.g. Added Level 2 EV charger branch circuit at customer request..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  setParentProposalForRev(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateRevision(parentProposalForRev)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow"
              >
                Confirm & Branch Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
