import React, { useState } from 'react';
import { Invoice, PaymentTransaction, ProposalVersion, ChangeOrder, JobBid, ContractorCompanyProfile } from '../types';
import { 
  createInvoiceFromProposalMilestone, 
  recordPayment, 
  reversePayment, 
  reconcileJobFinancials 
} from '../utils/invoiceEngine';
import { 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Receipt, 
  CreditCard, 
  RotateCcw, 
  ShieldCheck, 
  FileCheck, 
  Scale, 
  Calendar 
} from 'lucide-react';

interface InvoicingViewProps {
  invoices: Invoice[];
  bids: JobBid[];
  proposals: ProposalVersion[];
  changeOrders: ChangeOrder[];
  companyProfile: ContractorCompanyProfile;
  onSaveInvoice: (inv: Invoice) => void;
}

export const InvoicingView: React.FC<InvoicingViewProps> = ({
  invoices,
  bids,
  proposals,
  changeOrders,
  companyProfile,
  onSaveInvoice
}) => {
  const [selectedBidId, setSelectedBidId] = useState<string>(bids[0]?.id || '');
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);

  const [targetInvoiceForPayment, setTargetInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentTransaction['method']>('check');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [targetPaymentForReversal, setTargetPaymentForReversal] = useState<{ invoice: Invoice; payment: PaymentTransaction } | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Milestone Invoice Creation state
  const [milestoneType, setMilestoneType] = useState<Invoice['milestoneType']>('deposit_mobilization');

  const activeBid = bids.find(b => b.id === selectedBidId);
  const activeProposal = proposals.find(p => p.bidId === selectedBidId && p.status === 'ACCEPTANCE_RECORDED') || proposals.find(p => p.bidId === selectedBidId);
  const activeChangeOrders = changeOrders.filter(co => co.bidId === selectedBidId);
  const activeInvoices = invoices.filter(inv => inv.bidId === selectedBidId);

  const reconciliation = activeProposal 
    ? reconcileJobFinancials(activeProposal, activeChangeOrders, activeInvoices)
    : null;

  const handleCreateMilestoneInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProposal) {
      alert('Must have an active proposal to generate milestone invoice.');
      return;
    }

    const newInv = createInvoiceFromProposalMilestone(
      activeProposal,
      companyProfile,
      milestoneType || 'deposit_mobilization',
      activeChangeOrders
    );

    onSaveInvoice(newInv);
    setShowCreateInvoiceModal(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceForPayment) return;

    const { updatedInvoice } = recordPayment(targetInvoiceForPayment, {
      amount: paymentAmount,
      method: paymentMethod,
      referenceNumber: paymentRef || undefined,
      notes: paymentNotes || undefined,
      recordedByUser: companyProfile.authorizedProposalApprover || 'David Vance'
    });

    onSaveInvoice(updatedInvoice);
    setShowPaymentModal(false);
    setTargetInvoiceForPayment(null);
  };

  const handleReversePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPaymentForReversal) return;

    const { updatedInvoice } = reversePayment(
      targetPaymentForReversal.invoice,
      targetPaymentForReversal.payment.id,
      reversalReason || 'Administrative correction',
      'David Vance'
    );

    onSaveInvoice(updatedInvoice);
    setShowReverseModal(false);
    setTargetPaymentForReversal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Job Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Invoicing & Financial Ledger</h2>
          </div>
          <p className="text-xs text-slate-400">
            AIA G702-styled milestone billing, payment logging, and 5-step contract reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedBidId}
            onChange={(e) => setSelectedBidId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs font-bold text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 font-mono"
          >
            {bids.map(b => (
              <option key={b.id} value={b.id}>{b.bidNumber} — {b.title} ({b.clientName})</option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateInvoiceModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Generate Milestone Invoice
          </button>
        </div>
      </div>

      {/* 5-Step Financial Reconciliation Dashboard */}
      {reconciliation && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">
                5-Step Contract Financial Reconciliation
              </h3>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${
              reconciliation.isReconciled 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300'
            }`}>
              {reconciliation.isReconciled ? '✓ RECONCILED CLEAN' : '⚠ BALANCE OUTSTANDING'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">1. Base Contract</span>
              <p className="text-base font-extrabold font-mono text-slate-100">
                ${reconciliation.baseProposalGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-orange-400 block mb-1">2. + Change Orders</span>
              <p className="text-base font-extrabold font-mono text-orange-400">
                +${reconciliation.approvedChangeOrdersTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">3. = Revised Contract</span>
              <p className="text-base font-extrabold font-mono text-cyan-400">
                ${reconciliation.revisedContractTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">4. Payments Collected</span>
              <p className="text-base font-extrabold font-mono text-emerald-400">
                ${reconciliation.totalPaymentsCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">5. Outstanding AR</span>
              <p className="text-base font-extrabold font-mono text-amber-400">
                ${reconciliation.outstandingAccountsReceivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">
            Issued Invoices & Progress Applications ({activeInvoices.length})
          </h3>
        </div>

        {activeInvoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No invoices generated for this project yet. Click "Generate Milestone Invoice" above.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {activeInvoices.map((inv) => {
              const remaining = inv.balanceRemaining ?? inv.remainingBalance ?? 0;
              const isPaid = inv.status === 'PAID' || inv.status === 'PAID_IN_FULL' || remaining <= 0;
              const isPart = inv.status === 'PARTIALLY_PAID';

              return (
                <div key={inv.id} className="p-6 space-y-4 hover:bg-slate-850/40 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-100 text-base">{inv.invoiceNumber}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                          {inv.milestoneType || inv.invoiceType}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          isPaid 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : isPart
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Due: {new Date(inv.dueDate).toLocaleDateString()} | Billed To: {inv.customerName}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 font-mono">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Balance Due</span>
                        <span className="text-lg font-bold text-amber-400">
                          ${remaining.toFixed(2)}
                        </span>
                      </div>

                      {!isPaid && (
                        <button
                          onClick={() => {
                            setTargetInvoiceForPayment(inv);
                            setPaymentAmount(remaining);
                            setShowPaymentModal(true);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Record Payment
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Payment History Table for this Invoice */}
                  {inv.payments && inv.payments.length > 0 && (
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                      <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider block">
                        Payment & Audit Trail
                      </span>
                      <div className="space-y-1.5 font-mono">
                        {inv.payments.map((pmt) => (
                          <div key={pmt.id} className="flex items-center justify-between text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                            <div>
                              <span className="font-semibold text-emerald-400">+${pmt.amount.toFixed(2)}</span>
                              <span className="text-slate-500 text-[11px] ml-2">via {pmt.method || pmt.paymentMethod} {pmt.referenceNumber ? `(${pmt.referenceNumber})` : ''}</span>
                              <span className="text-slate-500 text-[10px] ml-2">on {new Date(pmt.recordedAt || pmt.paymentDate || new Date().toISOString()).toLocaleDateString()}</span>
                            </div>

                            <button
                              onClick={() => {
                                setTargetPaymentForReversal({ invoice: inv, payment: pmt });
                                setShowReverseModal(true);
                              }}
                              className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-sans"
                            >
                              <RotateCcw className="w-3 h-3" /> Reverse
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate Milestone Invoice Modal */}
      {showCreateInvoiceModal && activeProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              Generate Milestone Progress Invoice
            </h3>

            <form onSubmit={handleCreateMilestoneInvoice} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contract Milestone Stage</label>
                <select
                  value={milestoneType}
                  onChange={(e) => setMilestoneType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="deposit_mobilization">Deposit / Mobilization ({companyProfile.defaultPaymentSchedule.depositPercent}%)</option>
                  <option value="rough_in_inspection">Rough-In Inspection Passed ({companyProfile.defaultPaymentSchedule.roughInPercent}%)</option>
                  <option value="final_completion">Final Completion & Sign-off ({companyProfile.defaultPaymentSchedule.finalPercent}%)</option>
                  <option value="change_order_standalone">Approved Change Order Billing</option>
                </select>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Customer:</span>
                  <span className="text-slate-200">{activeProposal.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Base Contract:</span>
                  <span className="text-emerald-400">${activeProposal.financialSnapshot.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && targetInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Record Payment on {targetInvoiceForPayment.invoiceNumber}
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-base"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="check">Paper Check</option>
                  <option value="ach_bank_transfer">ACH Bank Transfer</option>
                  <option value="credit_card">Credit Card (Stripe/Clover)</option>
                  <option value="cash">Cash / Certified Funds</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Check # or Transaction Reference</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. Check #4092 or Stripe ch_3Nx9..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Reversal Modal */}
      {showReverseModal && targetPaymentForReversal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="font-bold text-rose-300 text-base flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-400" />
              Reverse Payment (${targetPaymentForReversal.payment.amount.toFixed(2)})
            </h3>
            <p className="text-slate-400">
              Reversing this payment will restore ${targetPaymentForReversal.payment.amount.toFixed(2)} to the invoice's remaining balance due and create an audit log.
            </p>

            <form onSubmit={handleReversePayment} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Reason for Reversal *</label>
                <input
                  type="text"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Check bounced / Returned for insufficient funds"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReverseModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition shadow"
                >
                  Authorize Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
