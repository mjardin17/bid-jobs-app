// =============================================================
// VOLTESTIMATE DEDICATED NEC CODE CALCULATORS & BID FINANCIAL ENGINE
// =============================================================

import { DifficultyFactors, CrewConfiguration, LineItem, JobBid } from '../types';

// =============================================================
// 1. DEDICATED NEC CODE CALCULATORS
// =============================================================

// NEC Chapter 9 Table 8 Conductor Properties (DC Ohms per 1000 ft at 75°C)
export const WIRE_RESISTANCE_OHMS_PER_1000FT: Record<string, { copper: number; aluminum: number; areaKcmil: number }> = {
  '14 AWG': { copper: 3.07, aluminum: 5.06, areaKcmil: 4.11 },
  '12 AWG': { copper: 1.93, aluminum: 3.18, areaKcmil: 6.53 },
  '10 AWG': { copper: 1.21, aluminum: 2.00, areaKcmil: 10.38 },
  '8 AWG':  { copper: 0.764, aluminum: 1.26, areaKcmil: 16.51 },
  '6 AWG':  { copper: 0.491, aluminum: 0.808, areaKcmil: 26.24 },
  '4 AWG':  { copper: 0.308, aluminum: 0.508, areaKcmil: 41.74 },
  '3 AWG':  { copper: 0.245, aluminum: 0.403, areaKcmil: 52.62 },
  '2 AWG':  { copper: 0.194, aluminum: 0.319, areaKcmil: 66.36 },
  '1 AWG':  { copper: 0.154, aluminum: 0.253, areaKcmil: 83.69 },
  '1/0 AWG': { copper: 0.122, aluminum: 0.201, areaKcmil: 105.6 },
  '2/0 AWG': { copper: 0.0967, aluminum: 0.159, areaKcmil: 133.1 },
  '3/0 AWG': { copper: 0.0766, aluminum: 0.126, areaKcmil: 167.8 },
  '4/0 AWG': { copper: 0.0608, aluminum: 0.100, areaKcmil: 211.6 },
  '250 kcmil': { copper: 0.0515, aluminum: 0.0847, areaKcmil: 250 },
  '300 kcmil': { copper: 0.0429, aluminum: 0.0707, areaKcmil: 300 },
  '350 kcmil': { copper: 0.0367, aluminum: 0.0605, areaKcmil: 350 },
  '500 kcmil': { copper: 0.0258, aluminum: 0.0424, areaKcmil: 500 }
};

// NEC Table 310.16 75°C Ampacity Ratings
export const NEC_75C_AMPACITIES: Record<string, { copper: number; aluminum: number }> = {
  '14 AWG': { copper: 20, aluminum: 0 },
  '12 AWG': { copper: 25, aluminum: 20 },
  '10 AWG': { copper: 35, aluminum: 30 },
  '8 AWG':  { copper: 50, aluminum: 40 },
  '6 AWG':  { copper: 65, aluminum: 50 },
  '4 AWG':  { copper: 85, aluminum: 65 },
  '3 AWG':  { copper: 100, aluminum: 75 },
  '2 AWG':  { copper: 115, aluminum: 90 },
  '1 AWG':  { copper: 130, aluminum: 100 },
  '1/0 AWG': { copper: 150, aluminum: 120 },
  '2/0 AWG': { copper: 175, aluminum: 135 },
  '3/0 AWG': { copper: 200, aluminum: 155 },
  '4/0 AWG': { copper: 230, aluminum: 180 },
  '250 kcmil': { copper: 255, aluminum: 205 },
  '300 kcmil': { copper: 285, aluminum: 230 },
  '350 kcmil': { copper: 310, aluminum: 250 },
  '500 kcmil': { copper: 380, aluminum: 310 }
};

// NEC Chapter 9 Table 5 THHN/THWN-2 Wire Area (sq. in.)
export const THHN_WIRE_AREA_SQ_IN: Record<string, number> = {
  '14 AWG': 0.0097,
  '12 AWG': 0.0133,
  '10 AWG': 0.0211,
  '8 AWG':  0.0366,
  '6 AWG':  0.0507,
  '4 AWG':  0.0824,
  '3 AWG':  0.0973,
  '2 AWG':  0.1158,
  '1 AWG':  0.1562,
  '1/0 AWG': 0.1855,
  '2/0 AWG': 0.2223,
  '3/0 AWG': 0.2679,
  '4/0 AWG': 0.3237,
  '250 kcmil': 0.3970,
  '300 kcmil': 0.4608,
  '350 kcmil': 0.5242,
  '500 kcmil': 0.7073
};

// NEC Chapter 9 Table 4 Usable Conduit Total Area (sq. in.)
export const CONDUIT_TOTAL_AREA_SQ_IN: Record<string, number> = {
  '1/2" EMT': 0.304,
  '3/4" EMT': 0.533,
  '1" EMT': 0.864,
  '1-1/4" EMT': 1.496,
  '1-1/2" EMT': 2.036,
  '2" EMT': 3.356,
  '2-1/2" EMT': 4.788,
  '3" EMT': 7.383,
  '3-1/2" EMT': 9.898,
  '4" EMT': 12.723,
  '1/2" PVC Sch 40': 0.269,
  '3/4" PVC Sch 40': 0.495,
  '1" PVC Sch 40': 0.811,
  '1-1/4" PVC Sch 40': 1.415,
  '1-1/2" PVC Sch 40': 1.936,
  '2" PVC Sch 40': 3.173,
  '2-1/2" PVC Sch 40': 4.519,
  '3" PVC Sch 40': 7.009,
  '4" PVC Sch 40': 12.180
};

export interface VoltageDropResult {
  voltageDropVolts: number;
  voltageDropPercent: number;
  voltageAtLoad: number;
  recommendedWireSize: string;
  isCompliant3Percent: boolean;
  isCompliant5Percent: boolean;
  formula: string;
  explanation: string;
}

export function calculateVoltageDrop(
  wireSize: string,
  conductorMaterial: 'copper' | 'aluminum',
  systemType: 'single_phase_120' | 'single_phase_240' | 'three_phase_208' | 'three_phase_480',
  currentAmps: number,
  oneWayDistanceFeet: number,
  targetMaxDropPercent: number = 3.0
): VoltageDropResult {
  let nominalVoltage = 120;
  let multiplier = 2; // 2 * K * I * L for single phase

  if (systemType === 'single_phase_120') { nominalVoltage = 120; multiplier = 2; }
  else if (systemType === 'single_phase_240') { nominalVoltage = 240; multiplier = 2; }
  else if (systemType === 'three_phase_208') { nominalVoltage = 208; multiplier = Math.sqrt(3); }
  else if (systemType === 'three_phase_480') { nominalVoltage = 480; multiplier = Math.sqrt(3); }

  const wireData = WIRE_RESISTANCE_OHMS_PER_1000FT[wireSize] || WIRE_RESISTANCE_OHMS_PER_1000FT['12 AWG'];
  const resistancePer1000ft = conductorMaterial === 'copper' ? wireData.copper : wireData.aluminum;
  const totalResistance = (resistancePer1000ft * oneWayDistanceFeet) / 1000;

  const voltageDrop = multiplier * currentAmps * totalResistance;
  const dropPercent = (voltageDrop / nominalVoltage) * 100;
  const voltageAtLoad = nominalVoltage - voltageDrop;

  // Sizing recommendation search
  const orderedSizes = Object.keys(WIRE_RESISTANCE_OHMS_PER_1000FT);
  let recommendedWire = wireSize;
  for (const size of orderedSizes) {
    const r = conductorMaterial === 'copper' ? WIRE_RESISTANCE_OHMS_PER_1000FT[size].copper : WIRE_RESISTANCE_OHMS_PER_1000FT[size].aluminum;
    const vDrop = multiplier * currentAmps * ((r * oneWayDistanceFeet) / 1000);
    if ((vDrop / nominalVoltage) * 100 <= targetMaxDropPercent) {
      recommendedWire = size;
      break;
    }
  }

  return {
    voltageDropVolts: Math.round(voltageDrop * 100) / 100,
    voltageDropPercent: Math.round(dropPercent * 100) / 100,
    voltageAtLoad: Math.round(voltageAtLoad * 100) / 100,
    recommendedWireSize: recommendedWire,
    isCompliant3Percent: dropPercent <= 3.0,
    isCompliant5Percent: dropPercent <= 5.0,
    formula: `VD = ${multiplier === 2 ? '2' : '√3'} × I (${currentAmps}A) × R (${resistancePer1000ft}Ω/1kft × ${oneWayDistanceFeet}ft / 1000)`,
    explanation: `NEC Informational Note 210.19(A) recommends max 3% drop on branch circuits and 5% total combined feeder + branch.`
  };
}

export interface ConduitFillResult {
  totalConductorAreaSqIn: number;
  totalConduitAreaSqIn: number;
  usableConduitAreaSqIn: number;
  fillPercentage: number;
  maxAllowedFillPercentage: number;
  isCompliant: boolean;
  totalConductorsCount: number;
  recommendedConduitSize: string;
}

export function calculateConduitFill(
  conduitTypeAndSize: string,
  conductors: { size: string; count: number }[]
): ConduitFillResult {
  let totalArea = 0;
  let totalCount = 0;

  for (const c of conductors) {
    const areaPerWire = THHN_WIRE_AREA_SQ_IN[c.size] || 0.0133;
    totalArea += areaPerWire * c.count;
    totalCount += c.count;
  }

  // NEC Chapter 9 Table 1 Fill Percent Limits:
  // 1 conductor: 53%, 2 conductors: 31%, 3+ conductors: 40%
  let maxFillPercent = 40;
  if (totalCount === 1) maxFillPercent = 53;
  else if (totalCount === 2) maxFillPercent = 31;

  const totalConduitArea = CONDUIT_TOTAL_AREA_SQ_IN[conduitTypeAndSize] || 0.533;
  const usableArea = totalConduitArea * (maxFillPercent / 100);
  const actualFillPercent = totalConduitArea > 0 ? (totalArea / totalConduitArea) * 100 : 0;
  const isCompliant = actualFillPercent <= maxFillPercent;

  // Find recommended minimum conduit
  const conduitList = Object.keys(CONDUIT_TOTAL_AREA_SQ_IN);
  let recommendedConduit = conduitTypeAndSize;
  for (const cName of conduitList) {
    const cArea = CONDUIT_TOTAL_AREA_SQ_IN[cName];
    if (totalArea / cArea <= maxFillPercent / 100) {
      recommendedConduit = cName;
      break;
    }
  }

  return {
    totalConductorAreaSqIn: Math.round(totalArea * 10000) / 10000,
    totalConduitAreaSqIn: Math.round(totalConduitArea * 1000) / 1000,
    usableConduitAreaSqIn: Math.round(usableArea * 1000) / 1000,
    fillPercentage: Math.round(actualFillPercent * 10) / 10,
    maxAllowedFillPercentage: maxFillPercent,
    isCompliant,
    totalConductorsCount: totalCount,
    recommendedConduitSize: recommendedConduit
  };
}

export interface AmpacityDeratingResult {
  baseAmpacity75C: number;
  ambientTempCorrectionFactor: number;
  conduitFillBundlingFactor: number;
  deratedAmpacity: number;
  recommendedContinuousLoadLimit80: number;
  necReference: string;
}

export function calculateAmpacityDerating(
  wireSize: string,
  ambientTempFahrenheit: number,
  currentCarryingConductorsInRaceway: number,
  conductorMaterial: 'copper' | 'aluminum' = 'copper'
): AmpacityDeratingResult {
  const baseAmp = (NEC_75C_AMPACITIES[wireSize] || NEC_75C_AMPACITIES['12 AWG'])[conductorMaterial];

  // NEC Table 310.15(B)(1) Ambient Temperature Correction Factors (Based on 86°F / 30°C)
  let tempFactor = 1.0;
  if (ambientTempFahrenheit <= 77) tempFactor = 1.05;
  else if (ambientTempFahrenheit <= 86) tempFactor = 1.00;
  else if (ambientTempFahrenheit <= 95) tempFactor = 0.94;
  else if (ambientTempFahrenheit <= 104) tempFactor = 0.88;
  else if (ambientTempFahrenheit <= 113) tempFactor = 0.82;
  else if (ambientTempFahrenheit <= 122) tempFactor = 0.75;
  else if (ambientTempFahrenheit <= 131) tempFactor = 0.67;
  else if (ambientTempFahrenheit <= 140) tempFactor = 0.58;
  else tempFactor = 0.40;

  // NEC Table 310.15(C)(1) Adjustment Factors for More than 3 Current-Carrying Conductors
  let bundleFactor = 1.0;
  if (currentCarryingConductorsInRaceway >= 4 && currentCarryingConductorsInRaceway <= 6) bundleFactor = 0.80;
  else if (currentCarryingConductorsInRaceway >= 7 && currentCarryingConductorsInRaceway <= 9) bundleFactor = 0.70;
  else if (currentCarryingConductorsInRaceway >= 10 && currentCarryingConductorsInRaceway <= 20) bundleFactor = 0.50;
  else if (currentCarryingConductorsInRaceway >= 21 && currentCarryingConductorsInRaceway <= 30) bundleFactor = 0.45;
  else if (currentCarryingConductorsInRaceway >= 31 && currentCarryingConductorsInRaceway <= 40) bundleFactor = 0.40;
  else if (currentCarryingConductorsInRaceway >= 41) bundleFactor = 0.35;

  const derated = baseAmp * tempFactor * bundleFactor;

  return {
    baseAmpacity75C: baseAmp,
    ambientTempCorrectionFactor: tempFactor,
    conduitFillBundlingFactor: bundleFactor,
    deratedAmpacity: Math.round(derated * 10) / 10,
    recommendedContinuousLoadLimit80: Math.round(derated * 0.80 * 10) / 10,
    necReference: 'NEC 310.15(B) & 310.15(C)(1)'
  };
}

export interface ResidentialLoadInputs {
  squareFootage: number;
  smallApplianceCircuits?: number;
  laundryCircuits?: number;
  rangeWatts?: number;
  waterHeaterWatts?: number;
  dryerWatts?: number;
  evseWatts?: number;
  otherLoadsWatts?: number;
  hvacWatts?: number;
}

export interface ResidentialLoadResult {
  generalLightingWatts: number;
  smallApplianceLaundryWatts: number;
  totalGeneralLoadsBeforeDemand: number;
  first10kWVA: number;
  remainingGeneralLoadsVA: number;
  netGeneralLoadsVA: number;
  hvacVA: number;
  totalServiceCalculatedVA: number;
  calculatedAmps240V: number;
  recommendedServiceAmps: number;
  codeReference: string;
}

export function calculateResidentialLoad(inputs: ResidentialLoadInputs): ResidentialLoadResult {
  // NEC 220.82 Optional Calculation
  const sqft = inputs.squareFootage || 1500;
  const generalLighting = sqft * 3; // 3 VA per sq ft (NEC 220.12)
  const smallApp = (inputs.smallApplianceCircuits || 2) * 1500;
  const laundry = (inputs.laundryCircuits || 1) * 1500;
  const range = inputs.rangeWatts || 8000;
  const waterHeater = inputs.waterHeaterWatts || 4500;
  const dryer = inputs.dryerWatts || 5000;
  const evse = inputs.evseWatts || 0;
  const other = inputs.otherLoadsWatts || 0;
  const hvac = inputs.hvacWatts || 5000; // 100% duty cycle for largest HVAC/heating unit

  const totalGeneralLoads = generalLighting + smallApp + laundry + range + waterHeater + dryer + evse + other;

  // Demand factor: First 10,000 VA at 100%, remainder at 40%
  const first10k = Math.min(10000, totalGeneralLoads);
  const remainder = Math.max(0, totalGeneralLoads - 10000);
  const netGeneral = first10k + (remainder * 0.40);

  const totalServiceVA = netGeneral + hvac;
  const calculatedAmps = totalServiceVA / 240;

  let recommendedService = 100;
  if (calculatedAmps > 200) recommendedService = 400;
  else if (calculatedAmps > 150) recommendedService = 200;
  else if (calculatedAmps > 100) recommendedService = 200;
  else recommendedService = 100;

  return {
    generalLightingWatts: generalLighting,
    smallApplianceLaundryWatts: smallApp + laundry,
    totalGeneralLoadsBeforeDemand: totalGeneralLoads,
    first10kWVA: first10k,
    remainingGeneralLoadsVA: remainder,
    netGeneralLoadsVA: Math.round(netGeneral),
    hvacVA: hvac,
    totalServiceCalculatedVA: Math.round(totalServiceVA),
    calculatedAmps240V: Math.round(calculatedAmps * 10) / 10,
    recommendedServiceAmps: recommendedService,
    codeReference: 'NEC 220.82 (Optional Calculation Method)'
  };
}

// =============================================================
// 2. CONTRACTOR BID FINANCIAL & LABOR MULTIPLIER ENGINE
// =============================================================

export function calculateDifficultyMultiplier(factors: DifficultyFactors): number {
  let multiplier = 1.0;

  // Height adjustments
  if (factors.workingHeight === '10_to_14ft') multiplier += 0.10;
  else if (factors.workingHeight === '15_to_20ft') multiplier += 0.20;
  else if (factors.workingHeight === 'over_20ft_scaffold_lift') multiplier += 0.35;

  // Environment
  if (factors.environmentType === 'occupied_remodel') multiplier += 0.15;
  else if (factors.environmentType === 'confined_space_attic_crawl') multiplier += 0.25;
  else if (factors.environmentType === 'hazardous_classified') multiplier += 0.35;

  // Ambient temperature
  if (factors.ambientTemp === 'extreme_heat_above_100' || factors.ambientTemp === 'extreme_cold_sub_freezing') {
    multiplier += 0.10;
  }

  // Overtime fatigue
  if (factors.overtimeSchedule === 'overtime_50h_fatigue') multiplier += 0.10;
  else if (factors.overtimeSchedule === 'overtime_60h_fatigue') multiplier += 0.20;

  // Logistics
  if (factors.distanceLogistics === 'remote_high_rise_long_carry') multiplier += 0.15;
  else if (factors.distanceLogistics === 'restricted_parking_loading') multiplier += 0.10;

  // NECA Base Labor Level
  if (factors.necaBaseLevel === 'level_2') multiplier += 0.05;
  else if (factors.necaBaseLevel === 'level_3') multiplier += 0.15;

  return Math.round(multiplier * 1000) / 1000;
}

export function calculateCrewWeightedRate(crew: CrewConfiguration): {
  blendedWagePerHour: number;
  burdenedWagePerHour: number;
  totalCrewHeadcount: number;
} {
  const totalCount = crew.masterCount + crew.journeymanCount + crew.apprenticeCount + crew.helperCount;
  if (totalCount === 0) {
    return { blendedWagePerHour: 50, burdenedWagePerHour: 64, totalCrewHeadcount: 1 };
  }

  const totalBaseWages = 
    (crew.masterCount * crew.masterHourlyWage) +
    (crew.journeymanCount * crew.journeymanHourlyWage) +
    (crew.apprenticeCount * crew.apprenticeHourlyWage) +
    (crew.helperCount * crew.helperHourlyWage);

  const blendedWage = totalBaseWages / totalCount;
  const burdenMultiplier = 1 + ((crew.laborBurdenPercent || 28) / 100);
  const burdenedWage = blendedWage * burdenMultiplier;

  return {
    blendedWagePerHour: Math.round(blendedWage * 100) / 100,
    burdenedWagePerHour: Math.round(burdenedWage * 100) / 100,
    totalCrewHeadcount: totalCount
  };
}

export interface BidFinancialsResult {
  rawLaborHours: number;
  adjustedLaborHours: number;
  difficultyMultiplier: number;
  calibrationMultiplier: number;
  blendedHourlyWage: number;
  burdenedHourlyWage: number;
  baseLaborCost: number;
  burdenedLaborCost: number;
  rawMaterialCost: number;
  wasteAdjustedMaterialCost: number;
  directJobCost: number;
  overheadAmount: number;
  profitAmount: number;
  contingencyAmount: number;
  permitCost: number;
  salesTaxAmount: number;
  subtotalBeforeTax: number;
  grandTotal: number;
  grossMarginPercent: number;
  effectiveMarkupPercent: number;
}

export function calculateBidFinancials(bid: Partial<JobBid>): BidFinancialsResult {
  const difficultyMultiplier = bid.difficulty ? calculateDifficultyMultiplier(bid.difficulty) : 1.0;
  const calibrationMultiplier = bid.appliedCompanyCalibrationFactor || 1.0;
  const crew = bid.crew || {
    masterCount: 1, masterHourlyWage: 65,
    journeymanCount: 1, journeymanHourlyWage: 48,
    apprenticeCount: 0, apprenticeHourlyWage: 25,
    helperCount: 0, helperHourlyWage: 18,
    laborBurdenPercent: 28
  };

  const { blendedWagePerHour, burdenedWagePerHour } = calculateCrewWeightedRate(crew);

  let rawHours = 0;
  let rawMaterial = 0;
  let wasteMaterial = 0;

  for (const item of (bid.lineItems || [])) {
    const qty = item.quantity || 0;
    const baseHours = (item.baseLaborHoursPerUnit || 0) * qty;
    rawHours += baseHours;

    const baseMat = (item.materialCostPerUnit || 0) * qty;
    rawMaterial += baseMat;
    const wasteFactor = 1 + ((item.wastePercent || 0) / 100);
    wasteMaterial += baseMat * wasteFactor;
  }

  // Adjusted hours = raw * difficulty * calibration
  const adjustedHours = rawHours * difficultyMultiplier * calibrationMultiplier;
  const baseLaborCost = adjustedHours * blendedWagePerHour;
  const burdenedLaborCost = adjustedHours * burdenedWagePerHour;

  const directCost = burdenedLaborCost + wasteMaterial;

  const overheadPct = (bid.overheadPercent || 15) / 100;
  const profitPct = (bid.profitMarginPercent || 20) / 100;
  const contingencyPct = (bid.contingencyPercent || 5) / 100;
  const permit = bid.permitCost || 0;
  const taxRate = (bid.taxRatePercent || 0) / 100;

  const overheadAmount = directCost * overheadPct;
  const contingencyAmount = (directCost + overheadAmount) * contingencyPct;
  const profitAmount = (directCost + overheadAmount + contingencyAmount) * profitPct;

  const subtotalBeforeTax = directCost + overheadAmount + contingencyAmount + profitAmount + permit;
  const salesTaxAmount = wasteMaterial * taxRate;
  const grandTotal = subtotalBeforeTax + salesTaxAmount;

  const grossProfit = grandTotal - directCost - permit;
  const grossMarginPercent = grandTotal > 0 ? (grossProfit / grandTotal) * 100 : 0;
  const effectiveMarkup = directCost > 0 ? ((grandTotal - directCost) / directCost) * 100 : 0;

  return {
    rawLaborHours: Math.round(rawHours * 100) / 100,
    adjustedLaborHours: Math.round(adjustedHours * 100) / 100,
    difficultyMultiplier,
    calibrationMultiplier,
    blendedHourlyWage: blendedWagePerHour,
    burdenedHourlyWage: burdenedWagePerHour,
    baseLaborCost: Math.round(baseLaborCost * 100) / 100,
    burdenedLaborCost: Math.round(burdenedLaborCost * 100) / 100,
    rawMaterialCost: Math.round(rawMaterial * 100) / 100,
    wasteAdjustedMaterialCost: Math.round(wasteMaterial * 100) / 100,
    directJobCost: Math.round(directCost * 100) / 100,
    overheadAmount: Math.round(overheadAmount * 100) / 100,
    profitAmount: Math.round(profitAmount * 100) / 100,
    contingencyAmount: Math.round(contingencyAmount * 100) / 100,
    permitCost: permit,
    salesTaxAmount: Math.round(salesTaxAmount * 100) / 100,
    subtotalBeforeTax: Math.round(subtotalBeforeTax * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
    effectiveMarkupPercent: Math.round(effectiveMarkup * 10) / 10
  };
}

export const calculateBidTotals = calculateBidFinancials;
