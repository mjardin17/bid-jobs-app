import { ChangeOrder, ChangeOrderStatus } from '../types';

export interface CreateChangeOrderInput {
  changeOrderNumber: string;
  bidId: string;
  proposalVersionId: string;
  customerId: string;
  customerName?: string;
  title: string;
  reason: string;
  scopeAdded: string;
  scopeRemoved?: string;
  materialAdjustment: number;
  laborAdjustmentHours: number;
  laborAdjustmentCost: number;
  equipmentSubcontractorAdjustment?: number;
  taxAdjustment?: number;
  scheduleImpactDays?: number;
  isDemoData?: boolean;
}

export function createChangeOrder(input: CreateChangeOrderInput): ChangeOrder {
  const equip = input.equipmentSubcontractorAdjustment || 0;
  const tax = input.taxAdjustment || 0;
  const priceAdjustment = Math.round(
    (input.materialAdjustment + input.laborAdjustmentCost + equip + tax) * 100
  ) / 100;

  return {
    id: `co-${input.bidId}-${input.changeOrderNumber.toLowerCase()}-${Date.now().toString(36)}`,
    changeOrderNumber: input.changeOrderNumber,
    bidId: input.bidId,
    proposalVersionId: input.proposalVersionId,
    customerId: input.customerId,
    customerName: input.customerName,
    title: input.title,
    reason: input.reason,
    scopeAdded: input.scopeAdded,
    scopeRemoved: input.scopeRemoved,
    materialAdjustment: input.materialAdjustment,
    laborAdjustmentHours: input.laborAdjustmentHours,
    laborAdjustmentCost: input.laborAdjustmentCost,
    equipmentSubcontractorAdjustment: equip,
    taxAdjustment: tax,
    priceAdjustment,
    scheduleImpactDays: input.scheduleImpactDays || 0,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    isDemoData: input.isDemoData || false
  };
}

export interface ApproveChangeOrderInput {
  acceptedBy: string;
  method: string;
  signatureDataUrl?: string;
  recordedBy: string;
  notes?: string;
}

export function approveChangeOrder(
  changeOrder: ChangeOrder,
  approval: ApproveChangeOrderInput
): ChangeOrder {
  return {
    ...changeOrder,
    status: 'ACCEPTANCE_RECORDED',
    acceptanceRecord: {
      acceptedAt: new Date().toISOString(),
      acceptedBy: approval.acceptedBy,
      method: approval.method,
      signatureDataUrl: approval.signatureDataUrl,
      recordedBy: approval.recordedBy,
      notes: approval.notes
    }
  };
}

export interface RevisedContractSummary {
  originalContractValue: number;
  approvedChangeOrdersTotal: number;
  pendingChangeOrdersTotal: number;
  revisedContractValue: number;
  approvedCount: number;
  pendingCount: number;
}

export function calculateRevisedContractTotal(
  originalContractTotal: number,
  changeOrders: ChangeOrder[]
): RevisedContractSummary {
  let approvedTotal = 0;
  let pendingTotal = 0;
  let approvedCount = 0;
  let pendingCount = 0;

  for (const co of changeOrders) {
    if (co.status === 'ACCEPTANCE_RECORDED') {
      approvedTotal += co.priceAdjustment;
      approvedCount++;
    } else if (co.status === 'DRAFT' || co.status === 'SUBMITTED_FOR_REVIEW') {
      pendingTotal += co.priceAdjustment;
      pendingCount++;
    }
  }

  const revised = originalContractTotal + approvedTotal;

  return {
    originalContractValue: Math.round(originalContractTotal * 100) / 100,
    approvedChangeOrdersTotal: Math.round(approvedTotal * 100) / 100,
    pendingChangeOrdersTotal: Math.round(pendingTotal * 100) / 100,
    revisedContractValue: Math.round(revised * 100) / 100,
    approvedCount,
    pendingCount
  };
}
