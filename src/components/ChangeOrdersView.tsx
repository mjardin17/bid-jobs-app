import React, { useState } from 'react';
import { ChangeOrder, JobBid, ProposalVersion } from '../types';
import { createChangeOrder, approveChangeOrder } from '../utils/changeOrderEngine';
import { 
  GitPullRequest, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  FileText,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

interface ChangeOrdersViewProps {
  changeOrders: ChangeOrder[];
  bids: JobBid[];
  proposals: ProposalVersion[];
  onSaveChangeOrder: (co: ChangeOrder) => void;
}

export const ChangeOrdersView: React.FC<ChangeOrdersViewProps> = ({
  changeOrders,
  bids,
  proposals,
  onSaveChangeOrder
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState(bids[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState<string>('Customer requested added receptacles');
  const [laborHours, setLaborHours] = useState(3.5);
  const [hourlyRate, setHourlyRate] = useState(115);
  const [materialCost, setMaterialCost] = useState(145);
  const [taxAdjustment, setTaxAdjustment] = useState(9.06);
  const [daysImpact, setDaysImpact] = useState(1);

  // Approval modal state
  const [approvingCO, setApprovingCO] = useState<ChangeOrder | null>(null);
  const [approverName, setApproverName] = useState('');
  const [approvalMethod, setApprovalMethod] = useState<string>('written_email_authorization');

  const handleCreateCO = (e: React.FormEvent) => {
    e.preventDefault();
    const bid = bids.find(b => b.id === selectedBidId);
    if (!bid) return;

    const coNumber = `CO-${(changeOrders.filter(c => c.bidId === bid.id).length + 1).toString().padStart(2, '0')}`;
    const activeProp = proposals.find(p => p.bidId === bid.id);

    const laborCost = Math.round(laborHours * hourlyRate * 100) / 100;
    const co = createChangeOrder({
      changeOrderNumber: coNumber,
      bidId: bid.id,
      proposalVersionId: activeProp?.id || 'prop-default',
      customerId: bid.customerId || 'cust-default',
      customerName: bid.clientName,
      title,
      reason,
      scopeAdded: description || title,
      materialAdjustment: materialCost,
      laborAdjustmentHours: laborHours,
      laborAdjustmentCost: laborCost,
      taxAdjustment,
      scheduleImpactDays: daysImpact
    });

    onSaveChangeOrder(co);
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingCO) return;

    const approved = approveChangeOrder(approvingCO, {
      acceptedBy: approverName || approvingCO.customerName || 'Customer Client',
      method: approvalMethod,
      recordedBy: 'David Vance, Master Electrician'
    });

    onSaveChangeOrder(approved);
    setApprovingCO(null);
    setApproverName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
              <GitPullRequest className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Field Change Orders & Scope Adjustments</h2>
          </div>
          <p className="text-xs text-slate-400">
            Document unforeseen conditions, customer additions, and AHJ requirements with full markup auditing.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-orange-500/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Change Order
        </button>
      </div>

      {/* Change Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {changeOrders.length === 0 ? (
          <div className="col-span-full bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-500">
            <GitPullRequest className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-400" />
            <p className="text-sm font-semibold">No Change Orders Logged</p>
            <p className="text-xs mt-1">Create a change order when field conditions or customer scope changes arise.</p>
          </div>
        ) : (
          changeOrders.map((co) => {
            const isApproved = co.status === 'ACCEPTANCE_RECORDED';
            const isDraft = co.status === 'DRAFT';

            return (
              <div
                key={co.id}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition ${
                  isApproved ? 'border-emerald-500/30' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                      {co.changeOrderNumber}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                      isApproved 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : isDraft
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                    }`}>
                      {co.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm">{co.title}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Client: {co.customerName || 'Contract Customer'}
                  </p>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                  {co.scopeAdded || co.description || co.title}
                </p>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Labor ({co.laborAdjustmentHours}h):</span>
                    <span className="text-slate-200">${co.laborAdjustmentCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Material & Tax:</span>
                    <span className="text-slate-200">${(co.materialAdjustment + (co.taxAdjustment || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                    <span>Change Total:</span>
                    <span className="text-orange-400 text-sm">${co.priceAdjustment.toFixed(2)}</span>
                  </div>
                </div>

                {isApproved && co.acceptanceRecord && (
                  <div className="text-[11px] text-emerald-300/90 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Approved by {co.acceptanceRecord.acceptedBy} ({new Date(co.acceptanceRecord.acceptedAt).toLocaleDateString()})</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  {!isApproved && (
                    <button
                      onClick={() => {
                        setApprovingCO(co);
                        setApproverName(co.customerName || '');
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Record Approval
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Change Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-orange-400" />
              Create Field Change Order
            </h3>

            <form onSubmit={handleCreateCO} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Active Project</label>
                <select
                  value={selectedBidId}
                  onChange={(e) => setSelectedBidId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  {bids.map(b => (
                    <option key={b.id} value={b.id}>{b.bidNumber} — {b.title} ({b.clientName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Change Order Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Add 2 Dedicated 20A Appliance Outlets in Island"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Reason / Trigger</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="Customer requested added receptacles">Customer requested scope addition</option>
                  <option value="Unforeseen concealed knob & tube wiring encountered">Unforeseen concealed conditions</option>
                  <option value="AHJ Inspector mandated additional AFCI/GFCI protection">AHJ electrical inspector correction</option>
                  <option value="Architectural plan revision">Architectural / Engineering revision</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Scope Description & Bill of Materials</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe conductors pulled, conduit routing, and specific hardware..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Labor Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={laborHours}
                    onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Labor Rate ($/h)</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Material Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={materialCost}
                    onChange={(e) => setMaterialCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center font-mono">
                <span className="text-slate-400 font-bold">Estimated Change Price:</span>
                <span className="text-base font-extrabold text-orange-400">
                  ${((laborHours * hourlyRate) + materialCost + taxAdjustment).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-lg transition shadow"
                >
                  Issue Change Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Approval Modal */}
      {approvingCO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Record Client Approval for {approvingCO.changeOrderNumber}
            </h3>

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Approved By (Customer Name) *</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Authorization Method</label>
                <select
                  value={approvalMethod}
                  onChange={(e) => setApprovalMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="written_email_authorization">Written Email Authorization</option>
                  <option value="in_person_signed">In-Person Physical Sign-Off</option>
                  <option value="client_portal_signed">Client Electronic Acknowledgment</option>
                  <option value="verbal_recorded">Verbal Authorization with Field Log</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-center">
                <span className="text-slate-400 text-[11px] block">Added to Contract Total:</span>
                <span className="text-emerald-400 font-bold text-base">
                  +${approvingCO.priceAdjustment.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingCO(null)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow"
                >
                  Confirm & Lock Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
