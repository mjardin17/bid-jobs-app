// =============================================================
// VOLTESTIMATE CORE DOMAIN TYPES & INTERFACES
// =============================================================

export type ElectricalCategory = 
  | 'service_panels'
  | 'branch_circuits'
  | 'lighting_fixtures'
  | 'devices_receptacles'
  | 'conduit_raceway'
  | 'feeders_wire'
  | 'low_voltage_fire'
  | 'hvac_disconnects'
  | 'ev_chargers_solar'
  | 'transformers_generators'
  | 'custom_assembly';

export type JobType = 'residential' | 'commercial' | 'industrial' | 'service_call';

// NECA standard difficulty levels
export type NECABaseLevel = 'level_1' | 'level_2' | 'level_3';

export type WorkingHeight = 
  | 'under_10ft'
  | '10_to_14ft'
  | '15_to_20ft'
  | 'over_20ft_scaffold_lift';

export type EnvironmentType = 
  | 'new_open_construction'
  | 'occupied_remodel'
  | 'hazardous_classified'
  | 'confined_space_attic_crawl';

export type AmbientTemperature = 
  | 'moderate_standard'
  | 'extreme_heat_above_100'
  | 'extreme_cold_sub_freezing';

export type OvertimeSchedule = 
  | 'standard_40h'
  | 'overtime_50h_fatigue'
  | 'overtime_60h_fatigue';

export type DistanceLogistics = 
  | 'ground_adjacent'
  | 'remote_high_rise_long_carry'
  | 'restricted_parking_loading';

export interface DifficultyFactors {
  workingHeight: WorkingHeight;
  environmentType: EnvironmentType;
  ambientTemp: AmbientTemperature;
  overtimeSchedule: OvertimeSchedule;
  distanceLogistics: DistanceLogistics;
  necaBaseLevel: NECABaseLevel;
}

export interface CrewConfiguration {
  masterCount: number;
  masterHourlyWage: number;
  journeymanCount: number;
  journeymanHourlyWage: number;
  apprenticeCount: number;
  apprenticeHourlyWage: number;
  helperCount: number;
  helperHourlyWage: number;
  laborBurdenPercent: number; // e.g. 28% for FICA, SUI, FUI, workers comp, insurance
}

export interface LineItem {
  id: string;
  category: ElectricalCategory;
  description: string;
  quantity: number;
  unit: 'each' | 'ft' | 'lot' | 'hr' | 'set' | 'box';
  baseLaborHoursPerUnit: number;
  materialCostPerUnit: number;
  wastePercent: number; // e.g. 5% or 10%
  totalLaborHours: number;
  totalMaterialCost: number;
  necaAssemblyRefId?: string;
  notes?: string;
}

export interface CustomerRequestedOption {
  id: string;
  title: string;
  description: string;
  priceImpact: number;
  price?: number;
  laborHours: number;
  isSelected?: boolean;
}

export interface ProjectAllowance {
  id: string;
  description: string;
  amount: number;
  allocatedAmount?: number;
}

// Attached physical/code calculations
export interface AttachedCalculationFormulaStep {
  targetVariable: string;
  formulaName: string;
  formulaRaw: string;
  formulaSubstituted: string;
  resultFormatted: string;
  unit: string;
  explanation: string;
}

export interface AttachedCalculation {
  id: string;
  calculatorType: 'ohms_law' | 'voltage_drop' | 'conduit_fill' | 'ampacity_derating' | 'residential_load_220_82';
  title: string;
  calculatorVersion: string;
  timestamp: string;
  systemType?: string;
  originalInputs: Record<string, any>;
  normalizedInputs: Record<string, any>;
  formulasUsed: AttachedCalculationFormulaStep[];
  assumptions: string[];
  safetyDisclaimer: string;
  verificationStatus: 'unreviewed' | 'signed_off_by_licensed_reviewer' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  summaryNote?: string;
}

export interface JobBid {
  id: string;
  bidNumber: string;
  title: string;
  customerId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  jobAddress: string;
  jobType: JobType;
  status: 'draft' | 'review' | 'approved' | 'sent' | 'won' | 'lost' | 'superseded';
  createdAt: string;
  updatedAt: string;
  difficulty: DifficultyFactors;
  crew: CrewConfiguration;
  lineItems: LineItem[];
  customerRequestedOptions?: CustomerRequestedOption[];
  allowances?: ProjectAllowance[];
  overheadPercent: number;
  profitMarginPercent: number;
  contingencyPercent: number;
  permitCost: number;
  taxRatePercent: number;
  appliedCompanyCalibrationFactor?: number;
  scopeOfWork?: string;
  exclusionsAndTerms?: string;
  paymentSchedule?: {
    depositPercent: number;
    roughInPercent: number;
    finalPercent: number;
  };
  attachedCalculations?: AttachedCalculation[];
  isDemoData?: boolean;
}

// =============================================================
// CRM & PIPELINE STAGES
// =============================================================

export type PipelineStage = 
  | 'NEW_LEAD'
  | 'CONTACTED'
  | 'SITE_VISIT_SCHEDULED'
  | 'ESTIMATING'
  | 'INTERNAL_REVIEW'
  | 'PROPOSAL_READY'
  | 'PROPOSAL_DELIVERED'
  | 'FOLLOW_UP_DUE'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  phone: string;
  email: string;
  billingAddress: string;
  jobsiteAddress: string;
  preferredContactMethod: 'phone' | 'email' | 'text' | 'in_person';
  leadSource: 'website' | 'referral' | 'google_maps' | 'repeat_client' | 'subcontractor_request' | 'yard_sign' | 'other';
  serviceRequested: string;
  urgency: 'emergency_24h' | 'high_priority' | 'standard' | 'flexible';
  initialNotes: string;
  createdAt: string;
  updatedAt: string;
  assignedEstimator: string;
  pipelineStatus: PipelineStage;
  wonLostOutcome?: 'won' | 'lost' | 'open';
  wonLostReason?: string;
  isDemoData?: boolean;
}

export interface SiteVisit {
  id: string;
  customerId: string;
  bidId?: string;
  scheduledDateTime: string;
  estimator: string;
  jobsiteAddress: string;
  customerConcerns?: string;
  existingConditions: string;
  measurements?: string;
  panelServiceObservations?: string;
  accessLimitations?: string;
  workConditionFactors?: Partial<DifficultyFactors>;
  scopeNotes: string;
  recommendedNextAction: string;
  status: 'scheduled' | 'completed' | 'canceled' | 'rescheduled';
  attachments: { name: string; url: string; category: string }[];
  necDisclosure: string;
  createdAt: string;
}

export interface PipelineTransitionEvent {
  id: string;
  customerId: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  timestamp: string;
  changedBy: string;
  reason?: string;
}

// =============================================================
// PROPOSAL VERSIONING & CONTRACT MANAGEMENT
// =============================================================

export type ProposalStatus = 
  | 'DRAFT'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED_MANUALLY'
  | 'SUPERSEDED'
  | 'ACCEPTANCE_RECORDED'
  | 'DECLINED'
  | 'EXPIRED';

export interface ProposalVersion {
  id: string;
  versionNumber: number;
  bidId: string;
  customerId: string;
  customerName: string;
  createdAt: string;
  status: ProposalStatus;
  supersededByVersionId?: string;
  supersedesVersionId?: string;
  expiresAt: string;
  deliveredAt?: string;
  deliveryMethod?: 'in_person' | 'printed_handout' | 'manual_email_sent' | 'client_portal';
  acceptanceRecord?: CustomerAcceptanceRecord;
  financialSnapshot: {
    baseLaborCost: number;
    baseMaterialCost: number;
    burdenedLaborCost: number;
    overheadAmount: number;
    profitAmount: number;
    contingencyAmount: number;
    permitCost: number;
    salesTax: number;
    grandTotal: number;
    totalLaborHours: number;
    adjustedLaborHours?: number;
    profitMarginPercent?: number;
  };
  itemizedScopeCategories: {
    categoryName: string;
    itemsCount: number;
    scopeSummary: string;
    subtotalPrice: number;
  }[];
  customerOptions: CustomerRequestedOption[];
  allowances: ProjectAllowance[];
  termsAndConditions: string;
  paymentMilestones: {
    depositAmount: number;
    roughInAmount: number;
    finalAmount: number;
  };
  integrityHash: string;
  isCustomerViewSafe: boolean;
  isDemoData?: boolean;
  snapshotBid?: any;
  deliveredBy?: string;
  deliveryNotes?: string;
  revisionNotes?: string;
  author?: string;
}

export interface CustomerAcceptanceRecord {
  id: string;
  proposalVersionId: string;
  bidId: string;
  customerId: string;
  customerName: string;
  acceptedAt: string;
  acceptanceMethod: 'in_person_signed' | 'written_email_authorization' | 'verbal_recorded' | 'client_portal_acknowledged';
  selectedOptionIds: string[];
  baseAcceptedPrice: number;
  acceptedOptionsTotal: number;
  totalAcceptedContractPrice: number;
  recordedByUser: string;
  customerNotes?: string;
  signatureDataUrl?: string;
  nonVerifiedSignatureDisclosure: string;
}

export interface SanitizedCustomerProposal {
  proposalId: string;
  versionNumber: number;
  jobTitle: string;
  customerName: string;
  jobAddress: string;
  scopeOfWork: string;
  categories: {
    categoryName: string;
    scopeSummary: string;
    subtotalPrice: number;
  }[];
  options: CustomerRequestedOption[];
  allowances: ProjectAllowance[];
  paymentSchedule: {
    depositAmount: number;
    roughInAmount: number;
    finalAmount: number;
  };
  termsAndConditions: string;
  expiresAt: string;
  grandTotal: number;
  companyInfo?: Partial<ContractorCompanyProfile>;
}

// =============================================================
// CHANGE ORDERS & INVOICES
// =============================================================

export type ChangeOrderStatus = 
  | 'DRAFT'
  | 'SUBMITTED_FOR_REVIEW'
  | 'ACCEPTANCE_RECORDED'
  | 'REJECTED'
  | 'VOID';

export interface ChangeOrder {
  id: string;
  changeOrderNumber: string;
  bidId: string;
  proposalVersionId: string;
  customerId: string;
  customerName?: string;
  title: string;
  description?: string;
  reason: string;
  scopeAdded: string;
  scopeRemoved?: string;
  materialAdjustment: number;
  materialCost?: number;
  laborAdjustmentHours: number;
  laborHours?: number;
  burdenedHourlyRate?: number;
  laborAdjustmentCost: number;
  equipmentSubcontractorAdjustment: number;
  taxAdjustment: number;
  overheadPercent?: number;
  profitPercent?: number;
  overheadAmount?: number;
  profitAmount?: number;
  totalAmount?: number;
  priceAdjustment: number;
  scheduleImpactDays: number;
  status: ChangeOrderStatus;
  createdAt: string;
  acceptanceRecord?: {
    acceptedAt: string;
    acceptedBy: string;
    method: string;
    signatureDataUrl?: string;
    recordedBy: string;
    notes?: string;
  };
  approvalDetails?: {
    acceptedBy: string;
    method: string;
    signedAt: string;
    recordedBy: string;
  };
  isDemoData?: boolean;
}

export type InvoiceStatus = 
  | 'DRAFT'
  | 'ISSUED_MANUALLY'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'PAID_IN_FULL'
  | 'VOID'
  | 'REFUNDED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  bidId: string;
  invoiceType: 'deposit' | 'progress_rough_in' | 'final_balance' | 'change_order_invoice' | 'service_direct' | string;
  milestoneType?: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  remainingBalance: number;
  balanceRemaining?: number;
  status: InvoiceStatus;
  paymentMilestoneLabel?: string;
  notes?: string;
  lineItems?: { description: string; amount: number }[];
  payments?: PaymentRecord[];
  isDemoData?: boolean;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  customerId: string;
  bidId: string;
  amount: number;
  paymentDate: string;
  recordedAt?: string;
  method?: string;
  paymentMethod: 'check' | 'ach_transfer' | 'cash' | 'credit_card_offline' | 'wire_transfer' | 'other_manual' | string;
  referenceNumber?: string;
  notes?: string;
  recordedByUser: string;
  status: 'active' | 'reversed';
  isReversal?: boolean;
  reversedPaymentId?: string;
  reversalReason?: string;
  disclaimer: string;
  isDemoData?: boolean;
}

export type PaymentTransaction = PaymentRecord;
export type HistoricalJobRecord = CompletedJobLog;

export interface FinancialReconciliation {
  baseContractValue: number;
  acceptedOptionsValue: number;
  totalOriginalContract: number;
  approvedChangeOrdersTotal: number;
  pendingChangeOrdersTotal: number;
  revisedContractValue: number;
  totalInvoiced: number;
  totalPaymentsRecorded: number;
  outstandingBalance: number;
  remainingUninvoicedAmount: number;
  isReconciled: boolean;
  warnings: string[];
}

// =============================================================
// CALIBRATION & HISTORICAL LOGS
// =============================================================

export interface CompletedJobLog {
  id: string;
  bidId: string;
  jobName: string;
  title?: string;
  jobType: JobType;
  completionDate: string;
  bidPrice: number;
  actualTotalCost: number;
  realizedGrossProfit: number;
  estimatedTotalHours: number;
  actualTotalHours: number;
  estimatedLaborHours?: number;
  actualLaborHours?: number;
  estimatedMaterialCost?: number;
  actualMaterialCost?: number;
  productiveInstallationHours: number;
  delayHours: number;
  changeOrderHours: number;
  isVerifiedProductionData: boolean;
  excludeFromCalibration: boolean;
  isDemoData?: boolean;
}

export interface CompanyCalibrationReport {
  overallCompanyEfficiencyMultiplier: number;
  categoryMultipliers: Record<string, number>;
  verifiedProductionJobsCount: number;
  demoJobsCount: number;
  totalHistoricalLaborHoursEstimated: number;
  totalHistoricalLaborHoursActual: number;
  confidenceScore: number;
  calibrationNote: string;
  calibratedJobIds: string[];
}

// =============================================================
// CONTRACTOR COMPANY PROFILE
// =============================================================

export interface ContractorCompanyProfile {
  id?: string;
  legalBusinessName: string;
  dbaName?: string;
  address: string;
  isServiceAreaOnly?: boolean;
  serviceArea?: string;
  phone: string;
  email: string;
  website?: string;
  licenseNumber: string;
  licenseType: string;
  licenseJurisdiction?: string;
  issuingAuthorityState?: string;
  licenseVerificationStatus?: 'contractor_provided' | 'verified' | 'unverified';
  insuranceCarrier?: string;
  insurancePolicyNumber?: string;
  insuranceCoverageAmount?: number;
  generalLiabilityPolicyLimit?: string;
  insuranceVerificationStatus?: 'contractor_provided' | 'verified' | 'unverified';
  defaultProposalTerms?: string;
  defaultTermsAndConditions?: string;
  defaultPaymentSchedule: {
    depositPercent: number;
    roughInPercent: number;
    finalPercent: number;
  };
  proposalExpirationDays?: number;
  defaultTaxRatePercent?: number;
  defaultTaxLabor?: boolean;
  defaultOverheadPercent?: number;
  defaultProfitMarginPercent?: number;
  defaultContingencyPercent?: number;
  authorizedProposalApprover?: string;
  authorizedLicensedWorkReviewer?: string;
  lastUpdated?: string;
}
