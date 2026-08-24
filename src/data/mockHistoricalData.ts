import { 
  JobBid, 
  Customer, 
  CompletedJobLog, 
  ContractorCompanyProfile, 
  ProposalVersion, 
  Invoice, 
  PaymentRecord, 
  ChangeOrder 
} from '../types';

export const INITIAL_COMPANY_PROFILE: ContractorCompanyProfile = {
  id: 'comp-apex-01',
  legalBusinessName: 'Apex Electrical Solutions LLC',
  dbaName: 'Apex Electrical Contracting',
  address: '1420 Innovation Parkway, Suite 400, Worcester, MA 01605',
  isServiceAreaOnly: false,
  serviceArea: 'Greater Boston & Central Massachusetts',
  phone: '(508) 555-0198',
  email: 'estimating@apexelectric.com',
  website: 'https://apexelectricalcontractors.com',
  licenseNumber: 'MA-EL-94821-M',
  licenseType: 'Master Electrician (Class A)',
  licenseJurisdiction: 'Commonwealth of Massachusetts Board of Electricians',
  licenseVerificationStatus: 'verified',
  insuranceCarrier: 'Travelers Casualty & Surety',
  insurancePolicyNumber: 'POL-COMM-8839210-26',
  insuranceCoverageAmount: 2000000,
  insuranceVerificationStatus: 'verified',
  defaultProposalTerms: 'All electrical work is performed by licensed electricians in strict compliance with the NFPA 70 National Electrical Code (NEC) and Massachusetts Electrical Amendments (527 CMR 12.00). Workmanship is guaranteed for 1 full year from completion date. Price firm for 30 days from proposal date.',
  defaultPaymentSchedule: {
    depositPercent: 40,
    roughInPercent: 40,
    finalPercent: 20
  },
  proposalExpirationDays: 30,
  defaultTaxRatePercent: 6.25,
  defaultTaxLabor: false,
  defaultOverheadPercent: 15,
  defaultProfitMarginPercent: 20,
  defaultContingencyPercent: 5,
  authorizedProposalApprover: 'David Vance, Lead Estimator',
  authorizedLicensedWorkReviewer: 'David Vance, Master Electrician #MA-EL-94821-M',
  lastUpdated: '2026-01-15T08:00:00Z'
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-101',
    name: 'Eleanor Vance',
    companyName: 'Hill House Property Management',
    phone: '(508) 555-0144',
    email: 'eleanor@hillhouse.com',
    billingAddress: '100 Manor Lane, Worcester, MA 01609',
    jobsiteAddress: '100 Manor Lane, Worcester, MA 01609',
    preferredContactMethod: 'phone',
    leadSource: 'referral',
    serviceRequested: '200A Service Upgrade & EV Charger Installation',
    urgency: 'high_priority',
    initialNotes: 'Existing obsolete 100A pushmatic panel needing complete 200A underground upgrade and Level 2 Tesla charger in detached garage.',
    createdAt: '2026-01-10T09:30:00Z',
    updatedAt: '2026-01-12T14:20:00Z',
    assignedEstimator: 'David Vance',
    pipelineStatus: 'PROPOSAL_DELIVERED',
    isDemoData: false
  },
  {
    id: 'cust-102',
    name: 'Marcus Brody',
    companyName: 'Museum of Antiquities',
    phone: '(617) 555-8833',
    email: 'mbrody@museum.org',
    billingAddress: '45 Museum Way, Boston, MA 02115',
    jobsiteAddress: '45 Museum Way, Boston, MA 02115',
    preferredContactMethod: 'email',
    leadSource: 'website',
    serviceRequested: 'Gallery Architectural LED Retrofit & Lighting Controls',
    urgency: 'standard',
    initialNotes: 'Full gallery space lighting upgrade to high-CRI 0-10V dimmable museum track spotlights and automated daylight occupancy sensors.',
    createdAt: '2026-01-14T11:00:00Z',
    updatedAt: '2026-01-15T16:45:00Z',
    assignedEstimator: 'David Vance',
    pipelineStatus: 'ESTIMATING',
    isDemoData: false
  },
  {
    id: 'cust-103',
    name: 'Sarah Chen',
    companyName: 'Chen BioTech Labs',
    phone: '(508) 555-9922',
    email: 'schen@chenbiotech.com',
    billingAddress: '500 BioPark Drive, Cambridge, MA 02142',
    jobsiteAddress: '500 BioPark Drive, Suite 210, Cambridge, MA 02142',
    preferredContactMethod: 'email',
    leadSource: 'repeat_client',
    serviceRequested: 'Cleanroom Dedicated Equipment Disconnects & 480V 3-Phase Subpanel',
    urgency: 'high_priority',
    initialNotes: 'Autoclave and centrifugal lab equipment circuits with emergency power transfer switch.',
    createdAt: '2026-01-18T08:15:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
    assignedEstimator: 'David Vance',
    pipelineStatus: 'ACCEPTED',
    isDemoData: false
  },
  {
    id: 'cust-104',
    name: 'Robert Hastings',
    phone: '(508) 555-3311',
    email: 'rhastings@baystate.net',
    billingAddress: '78 Elm Street, Shrewsbury, MA 01545',
    jobsiteAddress: '78 Elm Street, Shrewsbury, MA 01545',
    preferredContactMethod: 'phone',
    leadSource: 'google_maps',
    serviceRequested: 'Residential Standby Generator Interlock & Whole-House Surge',
    urgency: 'flexible',
    initialNotes: 'Customer experienced recent storm outage and wants generator inlet box connected to main breaker interlock.',
    createdAt: '2026-01-22T13:00:00Z',
    updatedAt: '2026-01-22T13:00:00Z',
    assignedEstimator: 'David Vance',
    pipelineStatus: 'NEW_LEAD',
    isDemoData: false
  }
];

export const INITIAL_BIDS: JobBid[] = [
  {
    id: 'bid-101',
    bidNumber: 'BID-2026-101',
    customerId: 'cust-101',
    title: '200A Service Upgrade + Tesla EVSE',
    clientName: 'Eleanor Vance',
    clientPhone: '(508) 555-0144',
    clientEmail: 'eleanor@hillhouse.com',
    jobAddress: '100 Manor Lane, Worcester, MA 01609',
    jobType: 'residential',
    status: 'sent',
    createdAt: '2026-01-11T10:00:00Z',
    updatedAt: '2026-01-12T15:30:00Z',
    difficulty: {
      workingHeight: 'under_10ft',
      environmentType: 'occupied_remodel',
      ambientTemp: 'moderate_standard',
      overtimeSchedule: 'standard_40h',
      distanceLogistics: 'ground_adjacent',
      necaBaseLevel: 'level_2'
    },
    crew: {
      masterCount: 1,
      masterHourlyWage: 65,
      journeymanCount: 1,
      journeymanHourlyWage: 48,
      apprenticeCount: 1,
      apprenticeHourlyWage: 26,
      helperCount: 0,
      helperHourlyWage: 18,
      laborBurdenPercent: 28
    },
    lineItems: [
      {
        id: 'li-1',
        category: 'service_panels',
        description: '200A Main Breaker Panelboard (40/80 Space)',
        quantity: 1,
        unit: 'each',
        baseLaborHoursPerUnit: 7.5,
        materialCostPerUnit: 485.00,
        wastePercent: 0,
        totalLaborHours: 7.5,
        totalMaterialCost: 485.00
      },
      {
        id: 'li-2',
        category: 'service_panels',
        description: '200A Meter Socket Base (Ringless)',
        quantity: 1,
        unit: 'each',
        baseLaborHoursPerUnit: 3.5,
        materialCostPerUnit: 210.00,
        wastePercent: 0,
        totalLaborHours: 3.5,
        totalMaterialCost: 210.00
      },
      {
        id: 'li-3',
        category: 'service_panels',
        description: 'Dual 5/8" x 8ft Copper Ground Rod System (NEC 250.53)',
        quantity: 1,
        unit: 'set',
        baseLaborHoursPerUnit: 2.5,
        materialCostPerUnit: 115.00,
        wastePercent: 5,
        totalLaborHours: 2.5,
        totalMaterialCost: 120.75
      },
      {
        id: 'li-4',
        category: 'feeders_wire',
        description: '4/0-4/0-4/0-2/0 Aluminum SER Service Cable (35 ft)',
        quantity: 35,
        unit: 'ft',
        baseLaborHoursPerUnit: 0.048,
        materialCostPerUnit: 4.25,
        wastePercent: 5,
        totalLaborHours: 1.68,
        totalMaterialCost: 156.19
      },
      {
        id: 'li-5',
        category: 'ev_chargers_solar',
        description: 'Tesla Universal Wall Connector 48A / 240V Station',
        quantity: 1,
        unit: 'each',
        baseLaborHoursPerUnit: 4.5,
        materialCostPerUnit: 590.00,
        wastePercent: 0,
        totalLaborHours: 4.5,
        totalMaterialCost: 590.00
      },
      {
        id: 'li-6',
        category: 'conduit_raceway',
        description: '3/4" EMT Conduit Run to Garage (45 ft)',
        quantity: 45,
        unit: 'ft',
        baseLaborHoursPerUnit: 0.055,
        materialCostPerUnit: 1.65,
        wastePercent: 8,
        totalLaborHours: 2.475,
        totalMaterialCost: 80.19
      }
    ],
    customerRequestedOptions: [
      {
        id: 'opt-spd-1',
        title: 'Whole-House Type 2 Surge Protective Device (SPD)',
        description: 'Eaton/Square D 50kA panel-mounted surge suppressor protecting EV charger and home appliances.',
        priceImpact: 360.00,
        price: 360.00,
        laborHours: 1.2,
        isSelected: false
      }
    ],
    allowances: [
      {
        id: 'allw-utility',
        description: 'National Grid utility disconnect / reconnect administrative fee allowance',
        amount: 250.00,
        allocatedAmount: 250.00
      }
    ],
    overheadPercent: 15,
    profitMarginPercent: 20,
    contingencyPercent: 5,
    permitCost: 175.00,
    taxRatePercent: 6.25,
    appliedCompanyCalibrationFactor: 1.05,
    scopeOfWork: 'Furnish and install new 200A 120/240V single-phase electrical service including outdoor meter enclosure, weatherhead/riser, ground rod electrodes, interior 40-space main breaker loadcenter with all existing branch circuits cut over, and dedicated 48A Tesla Wall Connector circuit in garage.',
    exclusionsAndTerms: 'Utility company engineering fees or underground transformer pull charges not included. Drywall patching or paint finish work excluded.',
    paymentSchedule: {
      depositPercent: 40,
      roughInPercent: 40,
      finalPercent: 20
    },
    attachedCalculations: [
      {
        id: 'calc-ev-drop',
        calculatorType: 'voltage_drop',
        title: 'Tesla 48A EVSE 45ft Feeder Voltage Drop Check',
        calculatorVersion: 'NEC 2023 §210.19',
        timestamp: '2026-01-11T11:00:00Z',
        originalInputs: { wireSize: '6 AWG', conductorMaterial: 'copper', distance: 45, current: 48 },
        normalizedInputs: { wireSize: '6 AWG', distance: 45, current: 48, volts: 240 },
        formulasUsed: [
          {
            targetVariable: 'voltageDropVolts',
            formulaName: 'Single Phase AC Voltage Drop',
            formulaRaw: 'VD = 2 × I × (R / 1000) × L',
            formulaSubstituted: 'VD = 2 × 48A × (0.491Ω / 1000) × 45ft',
            resultFormatted: '2.12 V (0.88%)',
            unit: 'V',
            explanation: '0.88% voltage drop is well within the NEC recommended 3% branch limit.'
          }
        ],
        assumptions: ['6 AWG THHN Copper in 3/4" EMT conduit', 'Continuous load duty 125% factor'],
        safetyDisclaimer: 'Calculation verified for standard branch circuit design. Comply with local AHJ guidelines.',
        verificationStatus: 'signed_off_by_licensed_reviewer',
        reviewedBy: 'David Vance, Master Electrician #MA-EL-94821-M',
        reviewedAt: '2026-01-11T14:00:00Z'
      }
    ],
    isDemoData: false
  }
];

export const INITIAL_COMPLETED_JOBS: CompletedJobLog[] = [
  {
    id: 'job-hist-001',
    bidId: 'bid-prior-001',
    jobName: '200A Service Replacement - Westborough Res',
    jobType: 'residential',
    completionDate: '2025-11-20',
    bidPrice: 4850.00,
    actualTotalCost: 3580.00,
    realizedGrossProfit: 1270.00,
    estimatedTotalHours: 20.0,
    actualTotalHours: 21.0,
    productiveInstallationHours: 21.0,
    delayHours: 0,
    changeOrderHours: 0,
    isVerifiedProductionData: true,
    excludeFromCalibration: false,
    isDemoData: false
  },
  {
    id: 'job-hist-002',
    bidId: 'bid-prior-002',
    jobName: 'Downtown Boutique LED Track & Dimming',
    jobType: 'commercial',
    completionDate: '2025-12-05',
    bidPrice: 8400.00,
    actualTotalCost: 6150.00,
    realizedGrossProfit: 2250.00,
    estimatedTotalHours: 32.0,
    actualTotalHours: 34.0,
    productiveInstallationHours: 33.5,
    delayHours: 0.5,
    changeOrderHours: 0,
    isVerifiedProductionData: true,
    excludeFromCalibration: false,
    isDemoData: false
  },
  {
    id: 'job-hist-003',
    bidId: 'bid-prior-003',
    jobName: 'Dual ChargePoint Commercial EV Pedestals',
    jobType: 'commercial',
    completionDate: '2025-12-18',
    bidPrice: 12600.00,
    actualTotalCost: 9100.00,
    realizedGrossProfit: 3500.00,
    estimatedTotalHours: 44.0,
    actualTotalHours: 46.5,
    productiveInstallationHours: 46.0,
    delayHours: 0.5,
    changeOrderHours: 0,
    isVerifiedProductionData: true,
    excludeFromCalibration: false,
    isDemoData: false
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-101-dep',
    invoiceNumber: 'INV-2026-001-DEP',
    customerId: 'cust-101',
    customerName: 'Eleanor Vance',
    bidId: 'bid-101',
    invoiceType: 'deposit',
    issueDate: '2026-01-12T16:00:00Z',
    dueDate: '2026-01-27T16:00:00Z',
    subtotal: 1980.00,
    taxAmount: 0,
    total: 1980.00,
    amountPaid: 1980.00,
    remainingBalance: 0.00,
    status: 'PAID',
    paymentMilestoneLabel: 'Contract Deposit (40%)',
    notes: 'Payment received via check #4491. Work scheduled for rough-in.',
    isDemoData: false
  }
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pmt-101-1',
    invoiceId: 'inv-101-dep',
    customerId: 'cust-101',
    bidId: 'bid-101',
    amount: 1980.00,
    paymentDate: '2026-01-13T10:30:00Z',
    paymentMethod: 'check',
    referenceNumber: 'CHK-4491',
    notes: 'Mobilization deposit collected at contract signing.',
    recordedByUser: 'David Vance',
    status: 'active',
    disclaimer: 'Manual payment logged for bookkeeping records only. No bank or credit card transaction was processed through an automated gateway.',
    isDemoData: false
  }
];

export const MOCK_HISTORICAL_JOBS = INITIAL_COMPLETED_JOBS;
