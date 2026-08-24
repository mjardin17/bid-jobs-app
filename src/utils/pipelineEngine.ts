import { Customer, PipelineStage, JobBid, ProposalVersion, Invoice, PaymentRecord } from '../types';

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  NEW_LEAD: 'New Leads',
  CONTACTED: 'Contacted',
  SITE_VISIT_SCHEDULED: 'Site Walk Scheduled',
  ESTIMATING: 'Estimating & Takeoff',
  INTERNAL_REVIEW: 'Internal Review',
  PROPOSAL_READY: 'Proposal Ready',
  PROPOSAL_DELIVERED: 'Proposal Delivered',
  FOLLOW_UP_DUE: 'Follow-Up Due',
  ACCEPTED: 'Accepted / Won',
  DECLINED: 'Declined / Lost',
  EXPIRED: 'Expired',
  SCHEDULED: 'Job Scheduled',
  IN_PROGRESS: 'Work In Progress',
  COMPLETED: 'Completed (Calibrated)',
  CANCELED: 'Canceled'
};

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, { bg: string; text: string; border: string; badge: string }> = {
  NEW_LEAD: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', badge: 'bg-blue-500/20 text-blue-300' },
  CONTACTED: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', badge: 'bg-indigo-500/20 text-indigo-300' },
  SITE_VISIT_SCHEDULED: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', badge: 'bg-purple-500/20 text-purple-300' },
  ESTIMATING: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', badge: 'bg-amber-500/20 text-amber-300' },
  INTERNAL_REVIEW: { bg: 'bg-amber-600/10', text: 'text-amber-300', border: 'border-amber-600/20', badge: 'bg-amber-600/20 text-amber-200' },
  PROPOSAL_READY: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', badge: 'bg-teal-500/20 text-teal-300' },
  PROPOSAL_DELIVERED: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', badge: 'bg-cyan-500/20 text-cyan-300' },
  FOLLOW_UP_DUE: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', badge: 'bg-rose-500/20 text-rose-300' },
  ACCEPTED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-300' },
  DECLINED: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', badge: 'bg-slate-500/20 text-slate-300' },
  EXPIRED: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20', badge: 'bg-zinc-500/20 text-zinc-300' },
  SCHEDULED: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', badge: 'bg-sky-500/20 text-sky-300' },
  IN_PROGRESS: { bg: 'bg-emerald-600/10', text: 'text-emerald-300', border: 'border-emerald-600/20', badge: 'bg-emerald-600/20 text-emerald-200' },
  COMPLETED: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', badge: 'bg-green-500/20 text-green-300' },
  CANCELED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', badge: 'bg-red-500/20 text-red-300' }
};

export const VALID_PIPELINE_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  NEW_LEAD: ['CONTACTED', 'SITE_VISIT_SCHEDULED', 'ESTIMATING', 'DECLINED', 'CANCELED'],
  CONTACTED: ['SITE_VISIT_SCHEDULED', 'ESTIMATING', 'DECLINED', 'CANCELED', 'FOLLOW_UP_DUE'],
  SITE_VISIT_SCHEDULED: ['ESTIMATING', 'CONTACTED', 'DECLINED', 'CANCELED', 'FOLLOW_UP_DUE'],
  ESTIMATING: ['INTERNAL_REVIEW', 'PROPOSAL_READY', 'PROPOSAL_DELIVERED', 'DECLINED', 'CANCELED', 'FOLLOW_UP_DUE'],
  INTERNAL_REVIEW: ['ESTIMATING', 'PROPOSAL_READY', 'PROPOSAL_DELIVERED', 'DECLINED', 'CANCELED'],
  PROPOSAL_READY: ['INTERNAL_REVIEW', 'PROPOSAL_DELIVERED', 'FOLLOW_UP_DUE', 'DECLINED', 'EXPIRED', 'CANCELED'],
  PROPOSAL_DELIVERED: ['FOLLOW_UP_DUE', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELED', 'ESTIMATING'],
  FOLLOW_UP_DUE: ['CONTACTED', 'PROPOSAL_DELIVERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELED', 'ESTIMATING'],
  ACCEPTED: ['SCHEDULED', 'IN_PROGRESS', 'CANCELED'],
  DECLINED: ['CONTACTED', 'ESTIMATING', 'CANCELED'],
  EXPIRED: ['CONTACTED', 'ESTIMATING', 'CANCELED'],
  SCHEDULED: ['IN_PROGRESS', 'CANCELED', 'COMPLETED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELED', 'SCHEDULED'],
  COMPLETED: [], // Terminal stage
  CANCELED: ['NEW_LEAD', 'CONTACTED'] // Can be reopened
};

export interface TransitionValidationResult {
  isValid: boolean;
  reason?: string;
}

export function validatePipelineTransition(
  currentStage: PipelineStage,
  targetStage: PipelineStage,
  context?: {
    hasProposal?: boolean;
    proposalStatus?: string;
    hasAcceptedProposal?: boolean;
    hasActualJobCost?: boolean;
  }
): TransitionValidationResult {
  if (currentStage === targetStage) {
    return { isValid: true };
  }

  const allowedTargets = VALID_PIPELINE_TRANSITIONS[currentStage] || [];
  if (!allowedTargets.includes(targetStage)) {
    return {
      isValid: false,
      reason: `Cannot transition directly from ${currentStage} to ${targetStage}. Transition not allowed by contractor pipeline rules.`
    };
  }

  // Guard rules:
  if (targetStage === 'ACCEPTED' && context && !context.hasProposal) {
    return {
      isValid: false,
      reason: 'Cannot transition to ACCEPTED: No proposal version exists for this customer/bid.'
    };
  }

  if (targetStage === 'PROPOSAL_DELIVERED' && context && !context.hasProposal) {
    return {
      isValid: false,
      reason: 'Cannot transition to PROPOSAL_DELIVERED: No proposal version exists.'
    };
  }

  return { isValid: true };
}

export function isValidPipelineTransition(currentStage: PipelineStage, targetStage: PipelineStage): boolean {
  return validatePipelineTransition(currentStage, targetStage).isValid;
}

export interface DuplicateCustomerMatch {
  existingCustomer: Customer;
  matchedFields: ('phone' | 'email' | 'name')[];
  similarityScore: number;
  note: string;
}

export function checkPossibleDuplicates(
  candidate: Partial<Customer>,
  existingCustomers: Customer[]
): DuplicateCustomerMatch[] {
  const matches: DuplicateCustomerMatch[] = [];

  const cleanPhone = (p?: string) => (p || '').replace(/\D/g, '');
  const cleanEmail = (e?: string) => (e || '').trim().toLowerCase();
  const cleanName = (n?: string) => (n || '').trim().toLowerCase();

  const candidatePhone = cleanPhone(candidate.phone);
  const candidateEmail = cleanEmail(candidate.email);
  const candidateName = cleanName(candidate.name);

  for (const existing of existingCustomers) {
    if (candidate.id && existing.id === candidate.id) continue;

    const matchedFields: ('phone' | 'email' | 'name')[] = [];
    const existingPhone = cleanPhone(existing.phone);
    const existingEmail = cleanEmail(existing.email);
    const existingName = cleanName(existing.name);

    if (candidatePhone && existingPhone && candidatePhone.length >= 7 && candidatePhone === existingPhone) {
      matchedFields.push('phone');
    }

    if (candidateEmail && existingEmail && candidateEmail.length > 3 && candidateEmail === existingEmail) {
      matchedFields.push('email');
    }

    if (candidateName && existingName && candidateName.length > 2 && candidateName === existingName) {
      matchedFields.push('name');
    }

    if (matchedFields.length > 0) {
      let score = 0;
      if (matchedFields.includes('email')) score += 50;
      if (matchedFields.includes('phone')) score += 40;
      if (matchedFields.includes('name')) score += 30;
      score = Math.min(score, 100);

      matches.push({
        existingCustomer: existing,
        matchedFields,
        similarityScore: score,
        note: `Potential duplicate matching on ${matchedFields.join(', ')} (Customer: ${existing.name}, ID: ${existing.id})`
      });
    }
  }

  return matches;
}

export function checkDuplicateCustomer(
  existingCustomers: Customer[],
  candidate: Partial<Customer>
): Customer | null {
  const matches = checkPossibleDuplicates(candidate, existingCustomers);
  if (matches.length > 0) {
    return matches[0].existingCustomer;
  }
  return null;
}

export interface DashboardMetrics {
  newLeadsCount: number;
  estimatesInProgressCount: number;
  proposalsAwaitingFollowUpCount: number;
  acceptedUnscheduledCount: number;
  jobsInProgressCount: number;
  totalOutstandingBalance: number;
  wonRevenue: number;
  lostRevenue: number;
  winRatePercent: number;
  totalProductionRecords: number;
  demoRecordsExcludedCount: number;
}

export function computePipelineDashboardMetrics(
  customers: Customer[],
  proposals: ProposalVersion[],
  invoices: { remainingBalance: number; status: string; isDemoData?: boolean }[],
  includeDemo: boolean = false
): DashboardMetrics {
  const filteredCustomers = customers.filter(c => includeDemo || !c.isDemoData);
  const filteredProposals = proposals.filter(p => includeDemo || !p.isDemoData);
  const filteredInvoices = invoices.filter(i => includeDemo || !i.isDemoData);

  const demoRecordsExcluded = (customers.length - filteredCustomers.length) +
    (proposals.length - filteredProposals.length) +
    (invoices.length - filteredInvoices.length);

  let newLeads = 0;
  let estimatesInProgress = 0;
  let proposalsAwaitingFollowUp = 0;
  let acceptedUnscheduled = 0;
  let jobsInProgress = 0;
  let wonCount = 0;
  let lostCount = 0;
  let wonRevenue = 0;
  let lostRevenue = 0;

  for (const c of filteredCustomers) {
    const stage = String(c.pipelineStatus || (c as any).pipelineStage || '');
    if (stage === 'NEW_LEAD' || stage === 'new_lead') newLeads++;
    if (stage === 'ESTIMATING' || stage === 'estimating' || stage === 'INTERNAL_REVIEW' || stage === 'internal_review') estimatesInProgress++;
    if (stage === 'PROPOSAL_DELIVERED' || stage === 'proposal_sent' || stage === 'FOLLOW_UP_DUE') proposalsAwaitingFollowUp++;
    if (stage === 'ACCEPTED' || stage === 'approved_in_progress') acceptedUnscheduled++;
    if (stage === 'IN_PROGRESS' || stage === 'SCHEDULED') jobsInProgress++;

    if (c.wonLostOutcome === 'won' || stage === 'ACCEPTED' || stage === 'approved_in_progress' || stage === 'SCHEDULED' || stage === 'IN_PROGRESS' || stage === 'COMPLETED') {
      wonCount++;
    } else if (c.wonLostOutcome === 'lost' || stage === 'DECLINED' || stage === 'EXPIRED' || stage === 'lost') {
      lostCount++;
    }
  }

  // Won / lost revenue from proposals
  for (const p of filteredProposals) {
    if (p.status === 'ACCEPTANCE_RECORDED') {
      wonRevenue += p.financialSnapshot?.grandTotal || 0;
    } else if (p.status === 'DECLINED' || p.status === 'EXPIRED') {
      lostRevenue += p.financialSnapshot?.grandTotal || 0;
    }
  }

  // Outstanding balances from invoices
  let totalOutstanding = 0;
  for (const inv of filteredInvoices) {
    if (inv.status !== 'VOID' && inv.status !== 'REFUNDED' && inv.status !== 'DRAFT') {
      totalOutstanding += (inv.remainingBalance || 0);
    }
  }

  const decidedTotal = wonCount + lostCount;
  const winRate = decidedTotal > 0 ? Math.round((wonCount / decidedTotal) * 1000) / 10 : 0;

  return {
    newLeadsCount: newLeads,
    estimatesInProgressCount: estimatesInProgress,
    proposalsAwaitingFollowUpCount: proposalsAwaitingFollowUp,
    acceptedUnscheduledCount: acceptedUnscheduled,
    jobsInProgressCount: jobsInProgress,
    totalOutstandingBalance: Math.round(totalOutstanding * 100) / 100,
    wonRevenue: Math.round(wonRevenue * 100) / 100,
    lostRevenue: Math.round(lostRevenue * 100) / 100,
    winRatePercent: winRate,
    totalProductionRecords: filteredCustomers.length + filteredProposals.length,
    demoRecordsExcludedCount: demoRecordsExcluded
  };
}

export function computePipelineSummaryMetrics(
  customers: Customer[],
  bids: JobBid[],
  invoices: Invoice[],
  payments: PaymentRecord[]
): DashboardMetrics {
  const proposals: ProposalVersion[] = [];
  return computePipelineDashboardMetrics(customers, proposals, invoices, true);
}
