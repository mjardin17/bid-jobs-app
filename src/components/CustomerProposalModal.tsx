import React, { useState } from 'react';
import { ProposalVersion, ContractorCompanyProfile } from '../types';
import { sanitizeProposalForCustomerView, recordCustomerAcceptance } from '../utils/proposalEngine';
import { X, CheckCircle, ShieldCheck, Printer, FileText, Check, AlertCircle } from 'lucide-react';

interface CustomerProposalModalProps {
  proposal: ProposalVersion;
  companyProfile: ContractorCompanyProfile;
  onClose: () => void;
  onAcceptanceRecorded: (updatedProposal: ProposalVersion) => void;
}

export const CustomerProposalModal: React.FC<CustomerProposalModalProps> = ({
  proposal,
  companyProfile,
  onClose,
  onAcceptanceRecorded
}) => {
  const sanitized = sanitizeProposalForCustomerView(proposal, companyProfile);

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState(proposal.customerName || '');
  const [signMethod, setSignMethod] = useState<'in_person_signed' | 'written_email_authorization' | 'verbal_recorded' | 'client_portal_acknowledged'>('client_portal_acknowledged');
  const [signatureText, setSignatureText] = useState('');
  const [notes, setNotes] = useState('');

  const toggleOption = (optId: string) => {
    if (proposal.status === 'ACCEPTANCE_RECORDED') return;
    setSelectedOptions(prev => 
      prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId]
    );
  };

  const optionsTotal = (sanitized.options || []).reduce((acc, opt) => {
    if (selectedOptions.includes(opt.id)) {
      return acc + (opt.priceImpact !== undefined ? opt.priceImpact : (opt.price || 0));
    }
    return acc;
  }, 0);

  const totalContractPrice = sanitized.grandTotal + optionsTotal;

  const handleRecordAcceptance = (e: React.FormEvent) => {
    e.preventDefault();
    const { updatedProposal } = recordCustomerAcceptance(proposal, {
      customerName: signerName,
      acceptanceMethod: signMethod,
      selectedOptionIds: selectedOptions,
      recordedByUser: companyProfile.authorizedProposalApprover || 'David Vance',
      customerNotes: notes,
      signatureDataUrl: signatureText ? `data:text/plain;utf-8,${encodeURIComponent(signatureText)}` : undefined
    });

    onAcceptanceRecorded(updatedProposal);
    setShowSignModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-lg">Customer-Facing Proposal View</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  v{proposal.versionNumber}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-medium">
                  Client-Sanitized (Markup & Burden Hidden)
                </span>
              </div>
              <p className="text-xs text-slate-400">Recipient: {proposal.customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition text-xs flex items-center gap-1.5 border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-8 bg-slate-900 font-sans text-slate-200">
          {/* Letterhead */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-800 pb-6 gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {companyProfile.legalBusinessName}
              </h1>
              {companyProfile.dbaName && (
                <p className="text-sm font-medium text-slate-400">{companyProfile.dbaName}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">{companyProfile.address}</p>
              <p className="text-xs text-slate-400">{companyProfile.phone} | {companyProfile.email}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-amber-400 font-mono">
                <span>License: {companyProfile.licenseNumber} ({companyProfile.licenseType})</span>
              </div>
            </div>

            <div className="md:text-right bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 min-w-[240px]">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block mb-1">
                Electrical Scope Proposal
              </span>
              <p className="text-sm font-mono text-slate-300">Proposal #{proposal.id.slice(0, 18)}</p>
              <p className="text-xs text-slate-400">Date: {new Date(proposal.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-amber-400/90 font-medium mt-1">
                Valid Through: {new Date(proposal.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Prepared For:
              </span>
              <p className="text-base font-bold text-white">{proposal.customerName}</p>
              <p className="text-xs text-slate-300 mt-0.5">{sanitized.jobAddress}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Project Scope:
              </span>
              <p className="text-base font-bold text-white">{sanitized.jobTitle}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sanitized.scopeOfWork}</p>
            </div>
          </div>

          {/* Scope Categories */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Itemized Scope of Work
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
              {sanitized.categories.map((cat, idx) => (
                <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-slate-800/30 transition">
                  <div>
                    <h5 className="font-semibold text-slate-200 text-sm">{cat.categoryName}</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{cat.scopeSummary}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold font-mono text-slate-100">
                      ${cat.subtotalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Add-Ons */}
          {sanitized.options && sanitized.options.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Optional Customer Upgrades</span>
                <span className="text-[11px] font-normal text-slate-400 lowercase">(select to include in contract)</span>
              </h4>
              <div className="space-y-2">
                {sanitized.options.map((opt) => {
                  const isChecked = selectedOptions.includes(opt.id);
                  const price = opt.priceImpact !== undefined ? opt.priceImpact : (opt.price || 0);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => toggleOption(opt.id)}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                        isChecked 
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                          isChecked ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 font-bold stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{opt.title}</p>
                          <p className="text-xs text-slate-400">{opt.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-sm font-semibold text-amber-400">
                          +${price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Schedule & Financial Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Payment Milestones
              </h4>
              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span>1. Mobilization Deposit ({companyProfile.defaultPaymentSchedule.depositPercent}%)</span>
                  <span className="font-semibold text-slate-100">
                    ${sanitized.paymentSchedule.depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span>2. Rough-In Completion ({companyProfile.defaultPaymentSchedule.roughInPercent}%)</span>
                  <span className="font-semibold text-slate-100">
                    ${sanitized.paymentSchedule.roughInAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>3. Final Inspection & Sign-off ({companyProfile.defaultPaymentSchedule.finalPercent}%)</span>
                  <span className="font-semibold text-slate-100">
                    ${sanitized.paymentSchedule.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Base Proposal Subtotal</span>
                  <span className="font-mono text-slate-300">${sanitized.grandTotal.toFixed(2)}</span>
                </div>
                {optionsTotal > 0 && (
                  <div className="flex justify-between text-xs text-amber-400">
                    <span>Selected Optional Upgrades</span>
                    <span className="font-mono">+${optionsTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline mt-3">
                <span className="text-sm font-bold text-white">Total Contract Investment</span>
                <span className="text-2xl font-extrabold font-mono text-teal-400">
                  ${totalContractPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="text-xs text-slate-400 bg-slate-950/30 p-4 rounded-xl border border-slate-800/60 leading-relaxed">
            <h5 className="font-semibold text-slate-300 mb-1">Contract Terms & Standard Conditions:</h5>
            <p>{sanitized.termsAndConditions}</p>
          </div>

          {/* Status Banner */}
          {proposal.status === 'ACCEPTANCE_RECORDED' ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-300 text-sm">Customer Acceptance Recorded</h4>
                  <p className="text-xs text-emerald-400/80">Contract bound at ${proposal.financialSnapshot.grandTotal.toFixed(2)}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-300 px-3 py-1 bg-emerald-500/20 rounded-lg">
                SIGNED & ACCEPTED
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400">
                Integrity Hash: <span className="font-mono text-slate-500">{proposal.integrityHash.slice(0, 24)}...</span>
              </p>
              <button
                onClick={() => setShowSignModal(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Record Customer Acceptance
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Signature & Acceptance Recording Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base">Record Customer Contract Acceptance</h3>
              <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordAcceptance} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / Signer Name</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Acceptance Authorization Method</label>
                <select
                  value={signMethod}
                  onChange={(e) => setSignMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="client_portal_acknowledged">Client Portal Acknowledged</option>
                  <option value="in_person_signed">In-Person Hand Signed Document</option>
                  <option value="written_email_authorization">Written Email Authorization</option>
                  <option value="verbal_recorded">Verbal Authorization Recorded</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Digital Signature / Initial Text</label>
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="Type full legal name (e.g. Eleanor Vance)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-serif italic text-base focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Internal Notes & Reference</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Email confirmation received 2:30 PM with deposit check attached"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Base Accepted Total:</span>
                  <span className="font-mono text-slate-200">${sanitized.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Selected Upgrades:</span>
                  <span className="font-mono text-amber-400">+${optionsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-100 pt-1 border-t border-slate-800">
                  <span>Total Bound Contract:</span>
                  <span className="font-mono text-emerald-400">${totalContractPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition shadow-lg"
                >
                  Confirm & Lock Acceptance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
