// =============================================================
// VOLTESTIMATE VERIFICATION & COMPLIANCE TEST SUITE
// =============================================================

import { solveOhmsLaw } from './src/utils/ohmsLaw';
import { 
  calculateVoltageDrop, 
  calculateConduitFill, 
  calculateAmpacityDerating, 
  calculateResidentialLoad, 
  calculateDifficultyMultiplier, 
  calculateCrewWeightedRate, 
  calculateBidFinancials 
} from './src/utils/calculator';
import { 
  validatePipelineTransition, 
  isValidPipelineTransition, 
  checkPossibleDuplicates, 
  computePipelineDashboardMetrics 
} from './src/utils/pipelineEngine';
import { 
  createProposalVersionFromBid, 
  createRevisedProposalVersion, 
  sanitizeProposalForCustomerView, 
  recordCustomerAcceptance 
} from './src/utils/proposalEngine';
import { 
  createChangeOrder, 
  approveChangeOrder, 
  calculateRevisedContractTotal 
} from './src/utils/changeOrderEngine';
import { 
  createInvoice, 
  recordManualPayment, 
  reversePayment, 
  computeFinancialReconciliation 
} from './src/utils/invoiceEngine';
import { calculateCompanyCalibration } from './src/utils/calibrationEngine';
import { 
  JobBid, 
  Customer, 
  CompletedJobLog, 
  ContractorCompanyProfile 
} from './src/types';

function runTestSuite() {
  console.log('⚡ STARTING VOLTESTIMATE VERIFICATION TEST SUITE...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Pure Physics Ohm's Law Solver
  // -------------------------------------------------------------
  console.log('--- TEST 1: Physics & Electro-Mechanical Solver ---');
  
  // 1A. DC Resistive Circuit
  const dcRes = solveOhmsLaw({
    systemType: 'dc_resistive',
    voltage: 120,
    current: 10
  });
  assert(dcRes.isValid && dcRes.wattsReal === 1200 && dcRes.ohms === 12, 'DC 120V / 10A -> 1200W, 12Ω');

  // 1B. 1-Phase AC with Power Factor
  const ac1Phase = solveOhmsLaw({
    systemType: 'single_phase_ac',
    voltage: 240,
    current: 20,
    powerFactor: 0.85
  });
  assert(ac1Phase.isValid && ac1Phase.wattsReal === 4080 && ac1Phase.apparentPowerVA === 4800, '1-Phase AC 240V, 20A, PF 0.85 -> 4080W Real, 4800VA Apparent');

  // 1C. 3-Phase AC Motor with Mechanical Efficiency
  const ac3Phase = solveOhmsLaw({
    systemType: 'three_phase_ac',
    voltage: 480,
    current: 30,
    powerFactor: 0.90,
    efficiency: 0.92,
    operatingHoursPerDay: 8,
    electricityRatePerKwh: 0.20
  });
  assert(
    ac3Phase.isValid && 
    Math.round(ac3Phase.wattsReal) === 22447 && 
    Math.round(ac3Phase.mechanicalOutputHP * 10) / 10 === 27.7, 
    '3-Phase 480V 30A PF 0.90 Eff 0.92 -> 22.4kW Real, ~27.7 HP Mechanical Output'
  );

  // -------------------------------------------------------------
  // TEST 2: Dedicated NEC Code Sizing
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Dedicated NEC Code Calculators ---');

  // 2A. Voltage Drop (NEC 210.19)
  const vdResult = calculateVoltageDrop('6 AWG', 'copper', 'single_phase_240', 48, 100);
  assert(vdResult.voltageDropPercent < 3.0 && vdResult.isCompliant3Percent, 'Voltage drop on 6 AWG Cu 48A at 100ft < 3%');

  // 2B. Conduit Fill (NEC Ch 9 Table 1)
  const cfResult = calculateConduitFill('3/4" EMT', [
    { size: '12 AWG', count: 9 }
  ]);
  assert(cfResult.isCompliant && cfResult.fillPercentage < 40, '9x #12 AWG THHN in 3/4" EMT < 40% fill');

  // 2C. Ampacity Derating (NEC 310.15)
  const ampResult = calculateAmpacityDerating('10 AWG', 104, 6, 'copper');
  assert(ampResult.deratedAmpacity === 24.6, '10 AWG Cu derated at 104°F and 6 conductors -> 24.6A');

  // 2D. Residential Load Calculation (NEC 220.82)
  const resLoad = calculateResidentialLoad({
    squareFootage: 2400,
    smallApplianceCircuits: 3,
    laundryCircuits: 1,
    rangeWatts: 9000,
    waterHeaterWatts: 4500,
    dryerWatts: 5000,
    evseWatts: 9600,
    hvacWatts: 6000
  });
  assert(resLoad.calculatedAmps240V > 100 && resLoad.recommendedServiceAmps === 200, '2400 sqft home with EV + HVAC qualifies for 200A service');

  // -------------------------------------------------------------
  // TEST 3: Bid Financials & NECA Multipliers
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Bid Financial Calculations ---');

  const diffMult = calculateDifficultyMultiplier({
    workingHeight: '10_to_14ft',
    environmentType: 'occupied_remodel',
    ambientTemp: 'moderate_standard',
    overtimeSchedule: 'standard_40h',
    distanceLogistics: 'ground_adjacent',
    necaBaseLevel: 'level_2'
  });
  assert(diffMult === 1.30, `Difficulty multiplier: 1.0 + 0.10 (height) + 0.15 (remodel) + 0.05 (level 2) = 1.30 (got ${diffMult})`);

  const mockBid: Partial<JobBid> = {
    id: 'bid-test-01',
    difficulty: {
      workingHeight: '10_to_14ft',
      environmentType: 'occupied_remodel',
      ambientTemp: 'moderate_standard',
      overtimeSchedule: 'standard_40h',
      distanceLogistics: 'ground_adjacent',
      necaBaseLevel: 'level_2'
    },
    crew: {
      masterCount: 1, masterHourlyWage: 60,
      journeymanCount: 1, journeymanHourlyWage: 40,
      apprenticeCount: 0, apprenticeHourlyWage: 25,
      helperCount: 0, helperHourlyWage: 18,
      laborBurdenPercent: 25
    },
    lineItems: [
      {
        id: 'li-1',
        category: 'service_panels',
        description: '200A Panel',
        quantity: 1,
        unit: 'each',
        baseLaborHoursPerUnit: 10,
        materialCostPerUnit: 500,
        wastePercent: 0,
        totalLaborHours: 10,
        totalMaterialCost: 500
      }
    ],
    overheadPercent: 15,
    profitMarginPercent: 20,
    contingencyPercent: 5,
    permitCost: 150,
    taxRatePercent: 6,
    appliedCompanyCalibrationFactor: 1.0
  };

  const bidFin = calculateBidFinancials(mockBid);
  assert(bidFin.adjustedLaborHours === 13 && bidFin.grandTotal > 2000, `Adjusted hours = 10 * 1.3 = 13 hrs, grand total = $${bidFin.grandTotal}`);

  // -------------------------------------------------------------
  // TEST 4: CRM Pipeline Transitions & Duplicate Detection
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Pipeline CRM & Fuzzy Duplication ---');

  const validTrans = isValidPipelineTransition('NEW_LEAD', 'SITE_VISIT_SCHEDULED');
  const invalidTrans = isValidPipelineTransition('COMPLETED', 'ESTIMATING');
  assert(validTrans && !invalidTrans, 'Pipeline validates transition rules correctly');

  const dupMatches = checkPossibleDuplicates({
    name: 'Eleanor Vance',
    phone: '508-555-0144'
  }, [
    {
      id: 'cust-1',
      name: 'Eleanor Vance',
      phone: '(508) 555-0144',
      email: 'eleanor@example.com',
      billingAddress: '',
      jobsiteAddress: '',
      preferredContactMethod: 'phone',
      leadSource: 'website',
      serviceRequested: '',
      urgency: 'standard',
      initialNotes: '',
      createdAt: '',
      updatedAt: '',
      assignedEstimator: '',
      pipelineStatus: 'NEW_LEAD'
    }
  ]);
  assert(dupMatches.length === 1 && dupMatches[0].similarityScore >= 70, 'Fuzzy duplicate match detected on phone & name');

  // -------------------------------------------------------------
  // TEST 5: Proposal Versioning & Customer Acceptance
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Proposal Versioning & Acceptance ---');

  const testBidFull: JobBid = {
    ...mockBid,
    id: 'bid-prop-01',
    bidNumber: 'BID-2026-001',
    title: 'Service Upgrade',
    clientName: 'Alice Green',
    clientPhone: '555-1234',
    clientEmail: 'alice@green.com',
    jobAddress: '123 Main St',
    jobType: 'residential',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customerRequestedOptions: [
      { id: 'opt-surge', title: 'Surge Protection', description: 'Type 2 SPD', priceImpact: 350, laborHours: 1 }
    ],
    allowances: []
  } as JobBid;

  const propV1 = createProposalVersionFromBid(testBidFull, 1);
  assert(propV1.versionNumber === 1 && propV1.status === 'DRAFT', 'Created Proposal Version 1 in DRAFT');

  const sanitized = sanitizeProposalForCustomerView(propV1);
  assert((sanitized as any).financialSnapshot === undefined && sanitized.grandTotal > 0, 'Sanitized proposal strips contractor burden/margin markups');

  // Revise to Version 2
  const { newVersion: propV2, updatedCurrentVersion: supersededV1 } = createRevisedProposalVersion(propV1, testBidFull);
  assert(propV2.versionNumber === 2 && supersededV1.status === 'SUPERSEDED', 'Version 1 superseded by Version 2');

  // Accept Version 2 with option
  const { acceptanceRecord, updatedProposal: acceptedV2 } = recordCustomerAcceptance(propV2, {
    customerName: 'Alice Green',
    acceptanceMethod: 'in_person_signed',
    selectedOptionIds: ['opt-surge'],
    recordedByUser: 'David Vance'
  });
  assert(
    acceptedV2.status === 'ACCEPTANCE_RECORDED' && 
    acceptanceRecord.acceptedOptionsTotal === 350 && 
    acceptanceRecord.totalAcceptedContractPrice === acceptanceRecord.baseAcceptedPrice + 350,
    'Recorded customer acceptance with Surge Protection option'
  );

  // -------------------------------------------------------------
  // TEST 6: Change Orders
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Change Orders ---');

  const co1 = createChangeOrder({
    changeOrderNumber: 'CO-01',
    bidId: testBidFull.id,
    proposalVersionId: propV2.id,
    customerId: 'cust-alice',
    title: 'Add Dedicated Freezer Circuit in Basement',
    reason: 'Customer added deep freezer load during rough-in',
    scopeAdded: '1x 20A 120V dedicated branch circuit with GFCI receptacle',
    materialAdjustment: 85.00,
    laborAdjustmentHours: 3.5,
    laborAdjustmentCost: 280.00,
    taxAdjustment: 5.10
  });
  assert(co1.priceAdjustment === 370.10 && co1.status === 'DRAFT', 'Created Change Order CO-01 for $370.10');

  const approvedCO1 = approveChangeOrder(co1, {
    acceptedBy: 'Alice Green',
    method: 'written_email_authorization',
    recordedBy: 'David Vance'
  });
  assert(approvedCO1.status === 'ACCEPTANCE_RECORDED', 'Approved Change Order CO-01');

  const revisedSummary = calculateRevisedContractTotal(acceptanceRecord.totalAcceptedContractPrice, [approvedCO1]);
  assert(
    revisedSummary.revisedContractValue === acceptanceRecord.totalAcceptedContractPrice + 370.10,
    'Revised contract value correctly integrates approved change orders'
  );

  // -------------------------------------------------------------
  // TEST 7: Invoicing, Payments & Reversals
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Invoicing, Payments & Reversals ---');

  const depositInv = createInvoice({
    invoiceNumber: 'INV-001',
    customerId: 'cust-alice',
    customerName: 'Alice Green',
    bidId: testBidFull.id,
    invoiceType: 'deposit',
    subtotal: 1500.00
  });
  assert(depositInv.total === 1500 && depositInv.remainingBalance === 1500, 'Created Deposit Invoice for $1500.00');

  const { paymentRecord: pmt1, updatedInvoice: invAfterPmt } = recordManualPayment(depositInv, {
    amount: 1500,
    method: 'check',
    referenceNumber: 'CHK-1002',
    recordedByUser: 'David Vance'
  });
  assert(invAfterPmt.status === 'PAID' && invAfterPmt.remainingBalance === 0, 'Deposit invoice paid in full');

  // Test Reversal
  const { reversalRecord, updatedInvoice: invAfterRev } = reversePayment(
    pmt1,
    invAfterPmt,
    'Bounced check notification from bank',
    'David Vance'
  );
  assert(reversalRecord.amount === -1500 && invAfterRev.remainingBalance === 1500, 'Reversal restored invoice remaining balance');

  // -------------------------------------------------------------
  // TEST 8: Financial Reconciliation
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Full Financial Reconciliation ---');

  const recon = computeFinancialReconciliation(
    propV2,
    [approvedCO1],
    [depositInv],
    [pmt1, reversalRecord],
    acceptanceRecord
  );
  assert(recon.isReconciled && recon.revisedContractValue === acceptanceRecord.totalAcceptedContractPrice + 370.10, 'Financial reconciliation engine verified');

  // -------------------------------------------------------------
  // TEST 9: Historical Bayesian Calibration Engine
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: Calibration Engine ---');

  const sampleHistoricalJobs: CompletedJobLog[] = [
    {
      id: 'job-1',
      bidId: 'bid-1',
      jobName: 'Panel Upgrade',
      jobType: 'residential',
      completionDate: '2025-10-01',
      bidPrice: 3000,
      actualTotalCost: 2200,
      realizedGrossProfit: 800,
      estimatedTotalHours: 20,
      actualTotalHours: 22,
      productiveInstallationHours: 22,
      delayHours: 0,
      changeOrderHours: 0,
      isVerifiedProductionData: true,
      excludeFromCalibration: false,
      isDemoData: false
    },
    {
      id: 'job-demo',
      bidId: 'bid-demo',
      jobName: 'Synthetic Demo Job',
      jobType: 'commercial',
      completionDate: '2025-10-02',
      bidPrice: 5000,
      actualTotalCost: 3500,
      realizedGrossProfit: 1500,
      estimatedTotalHours: 10,
      actualTotalHours: 50, // extreme anomaly
      productiveInstallationHours: 50,
      delayHours: 0,
      changeOrderHours: 0,
      isVerifiedProductionData: false,
      excludeFromCalibration: false,
      isDemoData: true
    }
  ];

  const calibProd = calculateCompanyCalibration(sampleHistoricalJobs, false);
  assert(
    calibProd.verifiedProductionJobsCount === 1 && 
    calibProd.overallCompanyEfficiencyMultiplier === 1.1 && 
    calibProd.demoJobsCount === 1,
    'Calibration successfully excludes synthetic/demo data and computes 1.10x productivity ratio'
  );

  console.log(`\n=============================================================`);
  console.log(`⚡ TEST RESULTS: ${passed}/${total} TESTS PASSED!`);
  console.log(`=============================================================\n`);
}

runTestSuite();
