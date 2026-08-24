// =============================================================
// PURE PHYSICS OHM'S LAW & POWER SOLVER
// Decoupled strictly from NEC prescriptive conductor / breaker sizing
// =============================================================

export type PowerSystemType = 'dc_resistive' | 'single_phase_ac' | 'three_phase_ac';
export type ClassificationType = 'known' | 'assumed' | 'na';

export interface OhmsLawInputs {
  voltage?: number;
  current?: number;
  power?: number;
  resistance?: number;
  powerUnit?: 'W' | 'kW' | 'hp';
  systemType?: PowerSystemType;
  powerFactor?: number;
  powerFactorClassification?: ClassificationType;
  efficiency?: number;
  efficiencyClassification?: ClassificationType;
  operatingHoursPerDay?: number;
  electricityRatePerKwh?: number;
}

export interface OhmsLawFormulaStep {
  targetVariable: string;
  formulaName: string;
  formulaRaw: string;
  formulaSubstituted: string;
  resultFormatted: string;
  unit: string;
  explanation: string;
}

export interface OhmsLawResult {
  isValid: boolean;
  error?: string;
  volts: number;
  amps: number;
  wattsReal: number;
  apparentPowerVA: number;
  reactivePowerVAR: number;
  ohms: number;
  systemType: PowerSystemType;
  powerFactor: number;
  powerFactorClassification: ClassificationType;
  efficiency: number;
  efficiencyClassification: ClassificationType;
  mechanicalOutputWatts: number;
  mechanicalOutputHP: number;
  dailyKWh: number;
  dailyCost: number;
  annualCost: number;
  calculationSteps: OhmsLawFormulaStep[];
  assumptions: string[];
  safetyDisclaimer: string;
}

export function solveOhmsLaw(inputs: OhmsLawInputs): OhmsLawResult {
  const steps: OhmsLawFormulaStep[] = [];
  const assumptions: string[] = [];
  const disclaimer = "PHYSICS/ELECTRO-MECHANICAL CALCULATION ONLY. Conductor sizing, overcurrent protection, and continuous duty ratings must be determined separately in accordance with the applicable National Electrical Code (NEC) and local AHJ requirements.";

  const systemType: PowerSystemType = inputs.systemType || 'single_phase_ac';
  let pf = inputs.powerFactor !== undefined ? inputs.powerFactor : 1.0;
  if (pf <= 0 || pf > 1.0) pf = 1.0;
  const pfClassification: ClassificationType = inputs.powerFactorClassification || (pf === 1.0 ? 'na' : 'assumed');

  let eff = inputs.efficiency !== undefined ? inputs.efficiency : 1.0;
  if (eff <= 0 || eff > 1.0) eff = 1.0;
  const effClassification: ClassificationType = inputs.efficiencyClassification || (eff === 1.0 ? 'na' : 'assumed');

  // Normalize power input to Watts (W)
  let rawPower = inputs.power;
  if (rawPower !== undefined) {
    if (inputs.powerUnit === 'kW') rawPower = rawPower * 1000;
    else if (inputs.powerUnit === 'hp') rawPower = rawPower * 745.7;
  }

  let V = inputs.voltage;
  let I = inputs.current;
  let P = rawPower; // Real power (Watts)
  let R = inputs.resistance;

  // System factor for AC
  const sqrt3 = Math.sqrt(3);

  // Count provided basic parameters among V, I, P, R
  const provided = [V !== undefined && V > 0, I !== undefined && I > 0, P !== undefined && P > 0, R !== undefined && R > 0].filter(Boolean).length;

  if (provided < 2) {
    return {
      isValid: false,
      error: 'Please supply at least 2 non-zero parameters (Voltage, Current, Power, or Resistance) to compute.',
      volts: 0, amps: 0, wattsReal: 0, apparentPowerVA: 0, reactivePowerVAR: 0, ohms: 0,
      systemType, powerFactor: pf, powerFactorClassification: pfClassification,
      efficiency: eff, efficiencyClassification: effClassification,
      mechanicalOutputWatts: 0, mechanicalOutputHP: 0, dailyKWh: 0, dailyCost: 0, annualCost: 0,
      calculationSteps: [], assumptions: [], safetyDisclaimer: disclaimer
    };
  }

  // Pure physics resolution based on system type
  if (systemType === 'dc_resistive') {
    // Standard DC / Resistive: P = V * I, V = I * R, P = I^2 * R, P = V^2 / R
    if (V !== undefined && I !== undefined) {
      P = V * I;
      R = V / I;
      steps.push({
        targetVariable: 'power',
        formulaName: "Joule's Law (P = V × I)",
        formulaRaw: 'P = V × I',
        formulaSubstituted: `P = ${V} V × ${I} A`,
        resultFormatted: `${P.toFixed(2)} W`,
        unit: 'W',
        explanation: 'Real power calculated directly as product of voltage and current.'
      });
      steps.push({
        targetVariable: 'resistance',
        formulaName: "Ohm's Law (R = V / I)",
        formulaRaw: 'R = V / I',
        formulaSubstituted: `R = ${V} V / ${I} A`,
        resultFormatted: `${R.toFixed(2)} Ω`,
        unit: 'Ω',
        explanation: 'Equivalent resistance computed as ratio of potential difference to current.'
      });
    } else if (V !== undefined && P !== undefined) {
      I = P / V;
      R = (V * V) / P;
      steps.push({
        targetVariable: 'current',
        formulaName: "Current from Power (I = P / V)",
        formulaRaw: 'I = P / V',
        formulaSubstituted: `I = ${P} W / ${V} V`,
        resultFormatted: `${I.toFixed(2)} A`,
        unit: 'A',
        explanation: 'DC load current computed from total power and operating voltage.'
      });
      steps.push({
        targetVariable: 'resistance',
        formulaName: "Resistance from Voltage and Power (R = V² / P)",
        formulaRaw: 'R = V² / P',
        formulaSubstituted: `R = (${V} V)² / ${P} W`,
        resultFormatted: `${R.toFixed(2)} Ω`,
        unit: 'Ω',
        explanation: 'Circuit resistance computed from voltage squared divided by power.'
      });
    } else if (V !== undefined && R !== undefined) {
      I = V / R;
      P = (V * V) / R;
      steps.push({
        targetVariable: 'current',
        formulaName: "Ohm's Law (I = V / R)",
        formulaRaw: 'I = V / R',
        formulaSubstituted: `I = ${V} V / ${R} Ω`,
        resultFormatted: `${I.toFixed(2)} A`,
        unit: 'A',
        explanation: 'DC current computed from Ohm’s law.'
      });
      steps.push({
        targetVariable: 'power',
        formulaName: "Power from Voltage & Resistance (P = V² / R)",
        formulaRaw: 'P = V² / R',
        formulaSubstituted: `P = (${V} V)² / ${R} Ω`,
        resultFormatted: `${P.toFixed(2)} W`,
        unit: 'W',
        explanation: 'Power dissipation calculated from voltage squared over resistance.'
      });
    } else if (I !== undefined && P !== undefined) {
      V = P / I;
      R = P / (I * I);
      steps.push({
        targetVariable: 'voltage',
        formulaName: "Voltage from Power (V = P / I)",
        formulaRaw: 'V = P / I',
        formulaSubstituted: `V = ${P} W / ${I} A`,
        resultFormatted: `${V.toFixed(2)} V`,
        unit: 'V',
        explanation: 'Operating potential calculated from real power and current.'
      });
      steps.push({
        targetVariable: 'resistance',
        formulaName: "Resistance from Power & Current (R = P / I²)",
        formulaRaw: 'R = P / I²',
        formulaSubstituted: `R = ${P} W / (${I} A)²`,
        resultFormatted: `${R.toFixed(2)} Ω`,
        unit: 'Ω',
        explanation: 'Internal resistance computed from power divided by current squared.'
      });
    } else if (I !== undefined && R !== undefined) {
      V = I * R;
      P = I * I * R;
      steps.push({
        targetVariable: 'voltage',
        formulaName: "Ohm's Law (V = I × R)",
        formulaRaw: 'V = I × R',
        formulaSubstituted: `V = ${I} A × ${R} Ω`,
        resultFormatted: `${V.toFixed(2)} V`,
        unit: 'V',
        explanation: 'Voltage drop across resistance calculated by Ohm’s law.'
      });
      steps.push({
        targetVariable: 'power',
        formulaName: "Joule Heating (P = I² × R)",
        formulaRaw: 'P = I² × R',
        formulaSubstituted: `P = (${I} A)² × ${R} Ω`,
        resultFormatted: `${P.toFixed(2)} W`,
        unit: 'W',
        explanation: 'Power dissipation in resistive element calculated from I squared R.'
      });
    } else if (P !== undefined && R !== undefined) {
      I = Math.sqrt(P / R);
      V = Math.sqrt(P * R);
      steps.push({
        targetVariable: 'current',
        formulaName: "Current from Power & Resistance (I = √(P / R))",
        formulaRaw: 'I = √(P / R)',
        formulaSubstituted: `I = √(${P} W / ${R} Ω)`,
        resultFormatted: `${I.toFixed(2)} A`,
        unit: 'A',
        explanation: 'Current computed as square root of power over resistance.'
      });
      steps.push({
        targetVariable: 'voltage',
        formulaName: "Voltage from Power & Resistance (V = √(P × R))",
        formulaRaw: 'V = √(P × R)',
        formulaSubstituted: `V = √(${P} W × ${R} Ω)`,
        resultFormatted: `${V.toFixed(2)} V`,
        unit: 'V',
        explanation: 'Voltage computed as square root of product of power and resistance.'
      });
    }
  } else if (systemType === 'single_phase_ac') {
    // 1-Phase AC: P = V * I * pf, S = V * I, Q = sqrt(S^2 - P^2), Z = V / I
    if (V !== undefined && P !== undefined) {
      I = P / (V * pf);
      R = (V * pf) / I;
      steps.push({
        targetVariable: 'current',
        formulaName: "1-Phase AC Current (I = P / (V × PF))",
        formulaRaw: 'I = P / (V × PF)',
        formulaSubstituted: `I = ${P} W / (${V} V × ${pf})`,
        resultFormatted: `${I.toFixed(2)} A`,
        unit: 'A',
        explanation: 'Single-phase AC line current calculated from real power, line-to-line/neutral voltage, and power factor.'
      });
    } else if (V !== undefined && I !== undefined) {
      P = V * I * pf;
      R = V / I;
      steps.push({
        targetVariable: 'power',
        formulaName: "1-Phase AC Real Power (P = V × I × PF)",
        formulaRaw: 'P = V × I × PF',
        formulaSubstituted: `P = ${V} V × ${I} A × ${pf}`,
        resultFormatted: `${P.toFixed(2)} W`,
        unit: 'W',
        explanation: 'Active real power in Watts calculated from RMS voltage, current, and power factor.'
      });
    } else if (I !== undefined && P !== undefined) {
      V = P / (I * pf);
      R = V / I;
      steps.push({
        targetVariable: 'voltage',
        formulaName: "1-Phase AC Voltage (V = P / (I × PF))",
        formulaRaw: 'V = P / (I × PF)',
        formulaSubstituted: `V = ${P} W / (${I} A × ${pf})`,
        resultFormatted: `${V.toFixed(2)} V`,
        unit: 'V',
        explanation: 'RMS operating voltage calculated from real power and load current.'
      });
    } else if (V !== undefined && R !== undefined) {
      I = V / R;
      P = V * I * pf;
      steps.push({
        targetVariable: 'current',
        formulaName: "1-Phase AC Current via Impedance (I = V / Z)",
        formulaRaw: 'I = V / Z',
        formulaSubstituted: `I = ${V} V / ${R} Ω`,
        resultFormatted: `${I.toFixed(2)} A`,
        unit: 'A',
        explanation: 'Current computed from operating voltage and circuit impedance.'
      });
    }
  } else if (systemType === 'three_phase_ac') {
    // 3-Phase AC: P = sqrt(3) * V_LL * I * pf, S = sqrt(3) * V_LL * I, Q = sqrt(S^2 - P^2)
    if (V !== undefined && P !== undefined) {
      I = P / (sqrt3 * V * pf);
      R = (V / sqrt3) / I;
      steps.push({
        targetVariable: 'current',
        formulaName: "3-Phase AC Line Current (I = P / (√3 × V_LL × PF))",
        formulaRaw: 'I = P / (√3 × V_LL × PF)',
        formulaSubstituted: `I = ${P} W / (1.732 × ${V} V × ${pf})`,
        resultFormatted: `${I.toFixed(2)} A`,
        unit: 'A',
        explanation: 'Balanced three-phase line current calculated from real power, line-to-line voltage, and power factor.'
      });
    } else if (V !== undefined && I !== undefined) {
      P = sqrt3 * V * I * pf;
      R = (V / sqrt3) / I;
      steps.push({
        targetVariable: 'power',
        formulaName: "3-Phase AC Real Power (P = √3 × V_LL × I × PF)",
        formulaRaw: 'P = √3 × V_LL × I × PF',
        formulaSubstituted: `P = 1.732 × ${V} V × ${I} A × ${pf}`,
        resultFormatted: `${P.toFixed(2)} W`,
        unit: 'W',
        explanation: 'Total balanced 3-phase real power calculated across all 3 phases.'
      });
    } else if (I !== undefined && P !== undefined) {
      V = P / (sqrt3 * I * pf);
      R = (V / sqrt3) / I;
      steps.push({
        targetVariable: 'voltage',
        formulaName: "3-Phase AC Line-to-Line Voltage (V_LL = P / (√3 × I × PF))",
        formulaRaw: 'V_LL = P / (√3 × I × PF)',
        formulaSubstituted: `V_LL = ${P} W / (1.732 × ${I} A × ${pf})`,
        resultFormatted: `${V.toFixed(2)} V`,
        unit: 'V',
        explanation: 'Required line-to-line voltage for three-phase balanced active power delivery.'
      });
    }
  }

  const finalV = V || 0;
  const finalI = I || 0;
  const finalP = P || 0;
  const finalR = R || 0;

  // Apparent and reactive power
  let apparentPowerVA = 0;
  let reactivePowerVAR = 0;
  if (systemType === 'three_phase_ac') {
    apparentPowerVA = sqrt3 * finalV * finalI;
  } else {
    apparentPowerVA = finalV * finalI;
  }
  reactivePowerVAR = Math.sqrt(Math.max(0, (apparentPowerVA * apparentPowerVA) - (finalP * finalP)));

  // Mechanical outputs for motor loads
  const mechanicalOutputWatts = finalP * eff;
  const mechanicalOutputHP = mechanicalOutputWatts / 745.7;

  // Daily energy & financial costs
  const hours = inputs.operatingHoursPerDay || 0;
  const rate = inputs.electricityRatePerKwh || 0;
  const dailyKWh = (finalP * hours) / 1000;
  const dailyCost = dailyKWh * rate;
  const annualCost = dailyCost * 365;

  if (pf < 1.0) {
    assumptions.push(`AC Power Factor assumed: ${pf.toFixed(2)} (${pfClassification})`);
  }
  if (eff < 1.0) {
    assumptions.push(`Motor / Mechanical Efficiency assumed: ${(eff * 100).toFixed(1)}% (${effClassification})`);
  }
  if (systemType === 'three_phase_ac') {
    assumptions.push('Balanced 3-phase symmetrical sinusoidal load conditions assumed.');
  }

  return {
    isValid: true,
    volts: Math.round(finalV * 100) / 100,
    amps: Math.round(finalI * 1000) / 1000,
    wattsReal: Math.round(finalP * 100) / 100,
    apparentPowerVA: Math.round(apparentPowerVA * 100) / 100,
    reactivePowerVAR: Math.round(reactivePowerVAR * 100) / 100,
    ohms: Math.round(finalR * 100) / 100,
    systemType,
    powerFactor: pf,
    powerFactorClassification: pfClassification,
    efficiency: eff,
    efficiencyClassification: effClassification,
    mechanicalOutputWatts: Math.round(mechanicalOutputWatts * 100) / 100,
    mechanicalOutputHP: Math.round(mechanicalOutputHP * 100) / 100,
    dailyKWh: Math.round(dailyKWh * 100) / 100,
    dailyCost: Math.round(dailyCost * 100) / 100,
    annualCost: Math.round(annualCost * 100) / 100,
    calculationSteps: steps,
    assumptions,
    safetyDisclaimer: disclaimer
  };
}
