import { 
  Invoice, 
  InvoiceStatus, 
  PaymentRecord, 
  ProposalVersion, 
  ChangeOrder, 
  CustomerAcceptanceRecord, 
  FinancialReconciliation 
} from '../types';

export interface CreateInvoiceInput {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  bidId: string;
  invoiceType: 'deposit' | 'progress_rough_in' | 'final_balance' | 'change_order_invoice' | 'service_direct';
  subtotal: number;
  taxRatePercent?: number;
  paymentMilestoneLabel?: string;
  notes?: string;
  lineItems?: { description: string; amount: number }[];
  isDemoData?: boolean;
}

export function createInvoice(input: CreateInvoiceInput): Invoice {
  const taxRate = (input.taxRatePercent || 0) / 100;
  const tax = Math.round(input.subtotal * taxRate * 100) / 100;
  const total = Math.round((input.subtotal + tax) * 100) / 100;
  const now = new Date().toISOString();
  const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `inv-${input.bidId}-${input.invoiceNumber.toLowerCase()}-${Date.now().toString(36)}`,
    invoiceNumber: input.invoiceNumber,
    customerId: input.customerId,
    customerName: input.customerName,
    bidId: input.bidId,
    invoiceType: input.invoiceType,
    issueDate: now,
    dueDate,
    subtotal: input.subtotal,
    taxAmount: tax,
    total,
    amountPaid: 0,
    remainingBalance: total,
    status: 'ISSUED_MANUALLY',
    paymentMilestoneLabel: input.paymentMilestoneLabel,
    notes: input.notes,
    lineItems: input.lineItems,
    isDemoData: input.isDemoData || false
  };
}

export interface RecordPaymentInput {
  paymentId?: string;
  amount: number;
  method: 'check' | 'ach_transfer' | 'cash' | 'credit_card_offline' | 'wire_transfer' | 'other_manual';
  referenceNumber?: string;
  notes?: string;
  recordedByUser: string;
  existingPayments?: PaymentRecord[];
}

export function recordManualPayment(
  invoice: Invoice,
  input: RecordPaymentInput
): { paymentRecord: PaymentRecord; updatedInvoice: Invoice } {
  const paymentId = input.paymentId || `pmt-${invoice.id}-${Date.now().toString(36)}`;

  // Duplicate payment prevention
  if (input.existingPayments && input.existingPayments.some(p => p.id === paymentId)) {
    throw new Error(`Payment with reference ID ${paymentId} has already been recorded.`);
  }

  const pmtAmount = Math.min(input.amount, invoice.remainingBalance > 0 ? invoice.remainingBalance : input.amount);
  const now = new Date().toISOString();

  const record: PaymentRecord = {
    id: paymentId,
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    bidId: invoice.bidId,
    amount: pmtAmount,
    paymentDate: now,
    paymentMethod: input.method,
    referenceNumber: input.referenceNumber,
    notes: input.notes,
    recordedByUser: input.recordedByUser,
    status: 'active',
    disclaimer: 'Manual payment logged for bookkeeping records only. No bank or credit card transaction was processed through an automated gateway.',
    isDemoData: invoice.isDemoData || false
  };

  const newAmountPaid = Math.round((invoice.amountPaid + pmtAmount) * 100) / 100;
  const newRemaining = Math.max(0, Math.round((invoice.total - newAmountPaid) * 100) / 100);

  let newStatus: InvoiceStatus = invoice.status;
  if (newRemaining === 0) {
    newStatus = 'PAID';
  } else if (newAmountPaid > 0) {
    newStatus = 'PARTIALLY_PAID';
  }

  const updatedInvoice: Invoice = {
    ...invoice,
    amountPaid: newAmountPaid,
    remainingBalance: newRemaining,
    status: newStatus
  };

  return {
    paymentRecord: record,
    updatedInvoice
  };
}

export function reverseManualPayment(
  originalPayment: PaymentRecord,
  invoice: Invoice,
  reason: string,
  recordedByUser: string
): {
  reversalRecord: PaymentRecord;
  updatedOriginalPayment: PaymentRecord;
  updatedInvoice: Invoice;
} {
  const now = new Date().toISOString();
  const reversalId = `rev-${originalPayment.id}-${Date.now().toString(36)}`;

  const reversalRecord: PaymentRecord = {
    id: reversalId,
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    bidId: invoice.bidId,
    amount: -Math.abs(originalPayment.amount),
    paymentDate: now,
    paymentMethod: originalPayment.paymentMethod,
    referenceNumber: `REV-${originalPayment.referenceNumber || originalPayment.id}`,
    notes: `Reversal: ${reason}`,
    recordedByUser,
    status: 'active',
    isReversal: true,
    reversedPaymentId: originalPayment.id,
    reversalReason: reason,
    disclaimer: 'Reversal entry recorded in contractor ledger.',
    isDemoData: originalPayment.isDemoData
  };

  const updatedOriginal: PaymentRecord = {
    ...originalPayment,
    status: 'reversed',
    reversalReason: reason
  };

  const newAmountPaid = Math.max(0, Math.round((invoice.amountPaid - originalPayment.amount) * 100) / 100);
  const newRemaining = Math.round((invoice.total - newAmountPaid) * 100) / 100;

  let newStatus: InvoiceStatus = 'ISSUED_MANUALLY';
  if (newAmountPaid === 0) {
    newStatus = 'ISSUED_MANUALLY';
  } else if (newAmountPaid > 0 && newRemaining > 0) {
    newStatus = 'PARTIALLY_PAID';
  } else if (newRemaining === 0) {
    newStatus = 'PAID';
  }

  const updatedInvoice: Invoice = {
    ...invoice,
    amountPaid: newAmountPaid,
    remainingBalance: newRemaining,
    status: newStatus
  };

  return {
    reversalRecord,
    updatedOriginalPayment: updatedOriginal,
    updatedInvoice
  };
}

export function createInvoiceFromProposalMilestone(
  proposal: ProposalVersion,
  companyProfile: any,
  milestoneType: string,
  changeOrders: ChangeOrder[] = []
): Invoice {
  const grandTotal = proposal.financialSnapshot?.grandTotal || 0;
  let subtotal = 0;
  let milestoneLabel = 'Milestone Payment';

  const schedule = companyProfile?.defaultPaymentSchedule || { depositPercent: 30, roughInPercent: 40, finalPercent: 30 };

  if (milestoneType === 'deposit_mobilization' || milestoneType === 'deposit') {
    subtotal = grandTotal * (schedule.depositPercent / 100);
    milestoneLabel = `Mobilization Deposit (${schedule.depositPercent}%)`;
  } else if (milestoneType === 'rough_in_inspection' || milestoneType === 'progress_rough_in') {
    subtotal = grandTotal * (schedule.roughInPercent / 100);
    milestoneLabel = `Rough-In Completion (${schedule.roughInPercent}%)`;
  } else if (milestoneType === 'final_completion' || milestoneType === 'final_balance') {
    subtotal = grandTotal * (schedule.finalPercent / 100);
    milestoneLabel = `Final Inspection Sign-Off (${schedule.finalPercent}%)`;
  } else if (milestoneType === 'change_order_standalone') {
    const approvedCO = changeOrders.filter(co => co.status === 'ACCEPTANCE_RECORDED');
    subtotal = approvedCO.reduce((acc, c) => acc + (c.priceAdjustment || 0), 0);
    milestoneLabel = 'Approved Field Change Orders';
  } else {
    subtotal = grandTotal;
  }

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  return createInvoice({
    invoiceNumber,
    customerId: proposal.customerId,
    customerName: proposal.customerName,
    bidId: proposal.bidId,
    invoiceType: milestoneType as any,
    subtotal: Math.round(subtotal * 100) / 100,
    paymentMilestoneLabel: milestoneLabel,
    notes: `Milestone billing for ${proposal.customerName}`
  });
}

export function recordPayment(
  invoice: Invoice,
  input: {
    amount: number;
    method: any;
    referenceNumber?: string;
    notes?: string;
    recordedByUser: string;
  }
): { updatedInvoice: Invoice; paymentRecord: PaymentRecord } {
  return recordManualPayment(invoice, {
    amount: input.amount,
    method: input.method === 'check' ? 'check' : input.method === 'cash' ? 'cash' : 'ach_transfer',
    referenceNumber: input.referenceNumber,
    notes: input.notes,
    recordedByUser: input.recordedByUser,
    existingPayments: invoice.payments || []
  });
}

export function reversePayment(
  arg1: Invoice | PaymentRecord,
  arg2: string | Invoice,
  reason: string,
  reversedByUser: string
): { updatedInvoice: Invoice; reversalRecord: any; updatedOriginalPayment?: PaymentRecord } {
  // Check if called as reversePayment(originalPayment, invoice, reason, recordedByUser)
  if ('amount' in arg1 && !('invoiceNumber' in arg1)) {
    const originalPayment = arg1 as PaymentRecord;
    const invoice = arg2 as Invoice;
    return reverseManualPayment(originalPayment, invoice, reason, reversedByUser);
  }

  // Otherwise called as reversePayment(invoice, paymentId, reason, reversedByUser)
  const invoice = arg1 as Invoice;
  const paymentId = arg2 as string;
  const originalPayment = (invoice.payments || []).find(p => p.id === paymentId) || {
    id: paymentId,
    invoiceId: invoice.id,
    amount: invoice.amountPaid,
    paymentDate: new Date().toISOString(),
    paymentMethod: 'check' as const,
    recordedByUser: reversedByUser,
    recordedAt: new Date().toISOString(),
    status: 'active' as const
  };

  return reverseManualPayment(originalPayment as any, invoice, reason, reversedByUser);
}

export function reconcileJobFinancials(
  proposal: ProposalVersion,
  changeOrders: ChangeOrder[],
  invoices: Invoice[]
): {
  baseProposalGrandTotal: number;
  approvedChangeOrdersTotal: number;
  revisedContractTotal: number;
  totalPaymentsCollected: number;
  outstandingAccountsReceivable: number;
  remainingUnbilledAmount: number;
  isReconciled: boolean;
  warnings: string[];
} {
  const allPayments: PaymentRecord[] = [];
  for (const inv of invoices) {
    if (inv.payments) {
      allPayments.push(...inv.payments);
    }
  }

  const rec = computeFinancialReconciliation(
    proposal,
    changeOrders,
    invoices,
    allPayments,
    proposal.acceptanceRecord
  );

  return {
    baseProposalGrandTotal: rec.baseContractValue,
    approvedChangeOrdersTotal: rec.approvedChangeOrdersTotal,
    revisedContractTotal: rec.revisedContractValue,
    totalPaymentsCollected: rec.totalPaymentsRecorded,
    outstandingAccountsReceivable: rec.outstandingBalance,
    remainingUnbilledAmount: rec.remainingUninvoicedAmount,
    isReconciled: rec.isReconciled,
    warnings: rec.warnings
  };
}

export function computeFinancialReconciliation(
  proposal: ProposalVersion,
  changeOrders: ChangeOrder[],
  invoices: Invoice[],
  payments: PaymentRecord[],
  acceptanceRecord?: CustomerAcceptanceRecord | null
): FinancialReconciliation {
  const warnings: string[] = [];

  // Contract base value
  const baseContract = acceptanceRecord 
    ? acceptanceRecord.baseAcceptedPrice 
    : (proposal.financialSnapshot?.grandTotal || 0);

  const optionsValue = acceptanceRecord 
    ? acceptanceRecord.acceptedOptionsTotal 
    : 0;

  const totalOriginalContract = acceptanceRecord 
    ? acceptanceRecord.totalAcceptedContractPrice 
    : (proposal.financialSnapshot?.grandTotal || 0);

  let approvedCO = 0;
  let pendingCO = 0;
  for (const co of changeOrders) {
    if (co.status === 'ACCEPTANCE_RECORDED') {
      approvedCO += co.priceAdjustment;
    } else if (co.status === 'DRAFT' || co.status === 'SUBMITTED_FOR_REVIEW') {
      pendingCO += co.priceAdjustment;
    }
  }

  const revisedContractValue = Math.round((totalOriginalContract + approvedCO) * 100) / 100;

  let totalInvoiced = 0;
  let outstandingBalance = 0;
  for (const inv of invoices) {
    if (inv.status !== 'VOID' && inv.status !== 'REFUNDED') {
      totalInvoiced += inv.total;
      outstandingBalance += inv.remainingBalance;
    }
  }

  let totalPayments = 0;
  for (const pmt of payments) {
    if (pmt.status === 'active') {
      totalPayments += pmt.amount;
    }
  }

  const remainingUninvoiced = Math.max(0, Math.round((revisedContractValue - totalInvoiced) * 100) / 100);

  if (totalInvoiced > revisedContractValue + 0.01) {
    warnings.push(`Total billed amount ($${totalInvoiced.toFixed(2)}) exceeds revised contract value ($${revisedContractValue.toFixed(2)}).`);
  }

  if (totalPayments > totalInvoiced + 0.01) {
    warnings.push(`Total payments recorded ($${totalPayments.toFixed(2)}) exceed total invoiced amount ($${totalInvoiced.toFixed(2)}).`);
  }

  const isReconciled = warnings.length === 0;

  return {
    baseContractValue: Math.round(baseContract * 100) / 100,
    acceptedOptionsValue: Math.round(optionsValue * 100) / 100,
    totalOriginalContract: Math.round(totalOriginalContract * 100) / 100,
    approvedChangeOrdersTotal: Math.round(approvedCO * 100) / 100,
    pendingChangeOrdersTotal: Math.round(pendingCO * 100) / 100,
    revisedContractValue,
    totalInvoiced: Math.round(totalInvoiced * 100) / 100,
    totalPaymentsRecorded: Math.round(totalPayments * 100) / 100,
    outstandingBalance: Math.round(outstandingBalance * 100) / 100,
    remainingUninvoicedAmount: remainingUninvoiced,
    isReconciled,
    warnings
  };
}
