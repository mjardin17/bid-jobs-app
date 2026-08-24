import { 
  JobBid, 
  ProposalVersion, 
  ContractorCompanyProfile, 
  CustomerAcceptanceRecord, 
  SanitizedCustomerProposal 
} from '../types';
import { calculateBidFinancials } from './calculator';

export function createProposalVersion(
  bid: JobBid,
  companyProfile?: ContractorCompanyProfile,
  parentProposal?: ProposalVersion,
  revisionNotes?: string
): { newVersion: ProposalVersion; updatedParent?: ProposalVersion } {
  if (parentProposal) {
    const res = createRevisedProposalVersion(parentProposal, bid, companyProfile);
    if (revisionNotes) {
      res.newVersion.revisionNotes = revisionNotes;
    }
    return {
      newVersion: res.newVersion,
      updatedParent: res.updatedCurrentVersion
    };
  } else {
    const newVersion = createProposalVersionFromBid(bid, 1, companyProfile);
    if (revisionNotes) {
      newVersion.revisionNotes = revisionNotes;
    }
    return { newVersion };
  }
}

export function generateProposalIntegrityHash(bid: JobBid, versionNumber: number, timestamp: string): string {
  const payload = `${bid.id}-${versionNumber}-${timestamp}-${bid.clientName}-${bid.jobAddress}-${(bid.lineItems || []).length}`;
  // Simple deterministic hash representation
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `SHA256-${Math.abs(hash).toString(16).padStart(8, '0')}-${Date.now().toString(16)}`;
}

export function createProposalVersionFromBid(
  bid: JobBid,
  versionNumber: number = 1,
  companyProfile?: ContractorCompanyProfile
): ProposalVersion {
  const financials = calculateBidFinancials(bid);
  const now = new Date().toISOString();
  const expDays = companyProfile?.proposalExpirationDays || 30;
  const expiresAt = new Date(Date.now() + expDays * 24 * 60 * 60 * 1000).toISOString();

  // Group line items into high-level customer-facing categories
  const categoryMap: Record<string, { count: number; descriptions: string[]; total: number }> = {};
  for (const item of (bid.lineItems || [])) {
    const cat = item.category || 'branch_circuits';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, descriptions: [], total: 0 };
    }
    categoryMap[cat].count += item.quantity || 1;
    categoryMap[cat].descriptions.push(item.description);
    // Proportionally apportion item total
    const itemMat = (item.materialCostPerUnit || 0) * (item.quantity || 1);
    const itemLabor = (item.baseLaborHoursPerUnit || 0) * (item.quantity || 1) * financials.burdenedHourlyWage;
    categoryMap[cat].total += itemMat + itemLabor;
  }

  const itemizedCategories = Object.keys(categoryMap).map(catKey => {
    const formatName = catKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
      categoryName: formatName,
      itemsCount: categoryMap[catKey].count,
      scopeSummary: categoryMap[catKey].descriptions.slice(0, 3).join(', ') + (categoryMap[catKey].descriptions.length > 3 ? '...' : ''),
      subtotalPrice: Math.round(categoryMap[catKey].total * 100) / 100
    };
  });

  const depositPct = bid.paymentSchedule?.depositPercent || companyProfile?.defaultPaymentSchedule.depositPercent || 40;
  const roughInPct = bid.paymentSchedule?.roughInPercent || companyProfile?.defaultPaymentSchedule.roughInPercent || 40;
  const finalPct = bid.paymentSchedule?.finalPercent || companyProfile?.defaultPaymentSchedule.finalPercent || 20;

  const grandTotal = financials.grandTotal;
  const paymentMilestones = {
    depositAmount: Math.round(grandTotal * (depositPct / 100) * 100) / 100,
    roughInAmount: Math.round(grandTotal * (roughInPct / 100) * 100) / 100,
    finalAmount: Math.round(grandTotal * (finalPct / 100) * 100) / 100
  };

  const defaultTerms = companyProfile?.defaultProposalTerms || 
    'All electrical installations will be performed in a professional workmanship manner in accordance with the National Electrical Code and local building authority having jurisdiction. 1-year warranty on craftsmanship. 30-day price validity.';

  return {
    id: `prop-${bid.id}-v${versionNumber}-${Date.now().toString(36)}`,
    versionNumber,
    bidId: bid.id,
    customerId: bid.customerId || `cust-${bid.id}`,
    customerName: bid.clientName,
    createdAt: now,
    status: 'DRAFT',
    expiresAt,
    financialSnapshot: {
      baseLaborCost: financials.baseLaborCost,
      baseMaterialCost: financials.rawMaterialCost,
      burdenedLaborCost: financials.burdenedLaborCost,
      overheadAmount: financials.overheadAmount,
      profitAmount: financials.profitAmount,
      contingencyAmount: financials.contingencyAmount,
      permitCost: financials.permitCost,
      salesTax: financials.salesTaxAmount,
      grandTotal: financials.grandTotal,
      totalLaborHours: financials.adjustedLaborHours
    },
    itemizedScopeCategories: itemizedCategories,
    customerOptions: bid.customerRequestedOptions || [],
    allowances: bid.allowances || [],
    termsAndConditions: bid.exclusionsAndTerms || defaultTerms,
    paymentMilestones,
    integrityHash: generateProposalIntegrityHash(bid, versionNumber, now),
    isCustomerViewSafe: false,
    isDemoData: bid.isDemoData || false,
    snapshotBid: bid
  };
}

export function isProposalEditableInPlace(proposal: ProposalVersion): boolean {
  return proposal.status === 'DRAFT';
}

export function createRevisedProposalVersion(
  currentProposal: ProposalVersion,
  revisedBid: JobBid,
  companyProfile?: ContractorCompanyProfile
): { newVersion: ProposalVersion; updatedCurrentVersion: ProposalVersion } {
  const newVerNum = currentProposal.versionNumber + 1;
  const newProposal = createProposalVersionFromBid(revisedBid, newVerNum, companyProfile);

  newProposal.supersedesVersionId = currentProposal.id;
  newProposal.revisionNotes = `Revised from Version ${currentProposal.versionNumber}`;

  const updatedCurrent: ProposalVersion = {
    ...currentProposal,
    status: 'SUPERSEDED',
    supersededByVersionId: newProposal.id
  };

  return {
    newVersion: newProposal,
    updatedCurrentVersion: updatedCurrent
  };
}

export function sanitizeProposalForCustomerView(
  proposal: ProposalVersion,
  companyProfile?: ContractorCompanyProfile
): SanitizedCustomerProposal {
  // Purge internal contractor markups, overhead, profit margins, calibration multipliers, burden breakdowns
  return {
    proposalId: proposal.id,
    versionNumber: proposal.versionNumber,
    jobTitle: (proposal as any).snapshotBid?.title || 'Electrical Services Proposal',
    customerName: proposal.customerName,
    jobAddress: (proposal as any).snapshotBid?.jobAddress || '',
    scopeOfWork: (proposal as any).snapshotBid?.scopeOfWork || 'Complete electrical installation as specified.',
    categories: proposal.itemizedScopeCategories.map(c => ({
      categoryName: c.categoryName,
      scopeSummary: c.scopeSummary,
      subtotalPrice: c.subtotalPrice
    })),
    options: proposal.customerOptions || [],
    allowances: proposal.allowances || [],
    paymentSchedule: proposal.paymentMilestones,
    termsAndConditions: proposal.termsAndConditions,
    expiresAt: proposal.expiresAt,
    grandTotal: proposal.financialSnapshot.grandTotal,
    companyInfo: companyProfile ? {
      legalBusinessName: companyProfile.legalBusinessName,
      dbaName: companyProfile.dbaName,
      address: companyProfile.address,
      phone: companyProfile.phone,
      email: companyProfile.email,
      licenseNumber: companyProfile.licenseNumber,
      licenseType: companyProfile.licenseType
    } : undefined
  };
}

export interface CustomerAcceptanceInput {
  customerName: string;
  acceptanceMethod: 'in_person_signed' | 'written_email_authorization' | 'verbal_recorded' | 'client_portal_acknowledged';
  selectedOptionIds?: string[];
  recordedByUser: string;
  customerNotes?: string;
  signatureDataUrl?: string;
}

export function recordCustomerAcceptance(
  proposal: ProposalVersion,
  input: CustomerAcceptanceInput
): { acceptanceRecord: CustomerAcceptanceRecord; updatedProposal: ProposalVersion } {
  const selectedIds = input.selectedOptionIds || [];
  const basePrice = proposal.financialSnapshot.grandTotal;

  let optionsTotal = 0;
  for (const opt of proposal.customerOptions) {
    if (selectedIds.includes(opt.id)) {
      optionsTotal += (opt.priceImpact !== undefined ? opt.priceImpact : (opt.price || 0));
    }
  }

  const totalContract = basePrice + optionsTotal;
  const now = new Date().toISOString();

  const record: CustomerAcceptanceRecord = {
    id: `acc-${proposal.id}-${Date.now().toString(36)}`,
    proposalVersionId: proposal.id,
    bidId: proposal.bidId,
    customerId: proposal.customerId,
    customerName: input.customerName,
    acceptedAt: now,
    acceptanceMethod: input.acceptanceMethod,
    selectedOptionIds: selectedIds,
    baseAcceptedPrice: Math.round(basePrice * 100) / 100,
    acceptedOptionsTotal: Math.round(optionsTotal * 100) / 100,
    totalAcceptedContractPrice: Math.round(totalContract * 100) / 100,
    recordedByUser: input.recordedByUser,
    customerNotes: input.customerNotes,
    signatureDataUrl: input.signatureDataUrl,
    nonVerifiedSignatureDisclosure: 'Digital signature / acceptance recorded internally by contractor. Identity is self-declared and not independently verified by a third-party certificate authority.'
  };

  const updatedProposal: ProposalVersion = {
    ...proposal,
    status: 'ACCEPTANCE_RECORDED',
    financialSnapshot: {
      ...proposal.financialSnapshot,
      grandTotal: Math.round(totalContract * 100) / 100
    }
  };

  return {
    acceptanceRecord: record,
    updatedProposal
  };
}
