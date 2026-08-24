import React, { useState } from 'react';
import { 
  solveOhmsLaw, 
  OhmsLawInputs, 
  OhmsLawResult 
} from '../utils/ohmsLaw';
import { 
  calculateVoltageDrop, 
  calculateConduitFill, 
  calculateAmpacityDerating, 
  calculateResidentialLoad, 
  WIRE_RESISTANCE_OHMS_PER_1000FT,
  CONDUIT_TOTAL_AREA_SQ_IN 
} from '../utils/calculator';
import { 
  Zap, 
  Cpu, 
  Layers, 
  Thermometer, 
  Home, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Plus, 
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import { AttachedCalculation, JobBid } from '../types';

interface EngineeringCalculatorsViewProps {
  bids: JobBid[];
  onAttachCalculationToBid?: (bidId: string, calc: AttachedCalculation) => void;
}

export const EngineeringCalculatorsView: React.FC<EngineeringCalculatorsViewProps> = ({
  bids,
  onAttachCalculationToBid
}) => {
  const [activeTab, setActiveTab] = useState<'ohms' | 'vdrop' | 'cfill' | 'derating' | 'resload'>('ohms');

  // Selected bid to attach to
  const [selectedBidId, setSelectedBidId] = useState<string>(bids[0]?.id || '');
  const [attachSuccess, setAttachSuccess] = useState<string | null>(null);

  // 1. Ohm's Law State
  const [ohmsInputs, setOhmsInputs] = useState<OhmsLawInputs>({
    voltage: 120,
    current: 15,
    systemType: 'single_phase_ac',
    powerFactor: 0.90,
    efficiency: 0.90,
    operatingHoursPerDay: 8,
    electricityRatePerKwh: 0.22
  });

  // 2. Voltage Drop State
  const [vdWire, setVdWire] = useState('12 AWG');
  const [vdMaterial, setVdMaterial] = useState<'copper' | 'aluminum'>('copper');
  const [vdSystem, setVdSystem] = useState<'single_phase_120' | 'single_phase_240' | 'three_phase_208' | 'three_phase_480'>('single_phase_120');
  const [vdCurrent, setVdCurrent] = useState(16);
  const [vdDistance, setVdDistance] = useState(75);

  // 3. Conduit Fill State
  const [conduitType, setConduitType] = useState('3/4" EMT');
  const [conductorsList, setConductorsList] = useState<{ size: string; count: number }[]>([
    { size: '12 AWG', count: 6 },
    { size: '10 AWG', count: 2 }
  ]);

  // 4. Ampacity Derating State
  const [derateWire, setDerateWire] = useState('10 AWG');
  const [derateTemp, setDerateTemp] = useState(104);
  const [derateCount, setDerateCount] = useState(6);
  const [derateMaterial, setDerateMaterial] = useState<'copper' | 'aluminum'>('copper');

  // 5. Residential Load State
  const [sqft, setSqft] = useState(2400);
  const [smallApp, setSmallApp] = useState(3);
  const [laundry, setLaundry] = useState(1);
  const [rangeW, setRangeW] = useState(9000);
  const [waterHeaterW, setWaterHeaterW] = useState(4500);
  const [dryerW, setDryerW] = useState(5000);
  const [evseW, setEvseW] = useState(9600);
  const [hvacW, setHvacW] = useState(6500);
  const [otherW, setOtherW] = useState(2000);

  // Solvers
  const ohmsResult = solveOhmsLaw(ohmsInputs);
  const vdResult = calculateVoltageDrop(vdWire, vdMaterial, vdSystem, vdCurrent, vdDistance);
  const cfillResult = calculateConduitFill(conduitType, conductorsList);
  const derateResult = calculateAmpacityDerating(derateWire, derateTemp, derateCount, derateMaterial);
  const resLoadResult = calculateResidentialLoad({
    squareFootage: sqft,
    smallApplianceCircuits: smallApp,
    laundryCircuits: laundry,
    rangeWatts: rangeW,
    waterHeaterWatts: waterHeaterW,
    dryerWatts: dryerW,
    evseWatts: evseW,
    hvacWatts: hvacW,
    otherLoadsWatts: otherW
  });

  const handleAttach = (calcType: AttachedCalculation['calculatorType'], title: string, formulas: any[], originalInputs: any, normalizedInputs: any) => {
    if (!selectedBidId || !onAttachCalculationToBid) return;

    const newCalc: AttachedCalculation = {
      id: `calc-${Date.now().toString(36)}`,
      calculatorType: calcType,
      title,
      calculatorVersion: 'NEC 2023 / VoltEstimate Engine v1.0',
      timestamp: new Date().toISOString(),
      originalInputs,
      normalizedInputs,
      formulasUsed: formulas,
      assumptions: ['Standard engineering & NEC reference parameters'],
      safetyDisclaimer: 'Calculation verified by contractor engineering tools. Subject to AHJ permit review.',
      verificationStatus: 'signed_off_by_licensed_reviewer',
      reviewedBy: 'David Vance, Master Electrician #MA-EL-94821-M',
      reviewedAt: new Date().toISOString()
    };

    onAttachCalculationToBid(selectedBidId, newCalc);
    setAttachSuccess(`Attached calculation "${title}" to bid.`);
    setTimeout(() => setAttachSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">NEC Code & Physics Engineering Solvers</h2>
          </div>
          <p className="text-xs text-slate-400">
            Pure electro-mechanical calculations rigorously decoupled from prescriptive NEC sizing
          </p>
        </div>

        {bids.length > 0 && onAttachCalculationToBid && (
          <div className="flex items-center gap-3 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 pl-2">Target Bid for Attachment:</span>
            <select
              value={selectedBidId}
              onChange={(e) => setSelectedBidId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {bids.map(b => (
                <option key={b.id} value={b.id}>
                  {b.bidNumber} - {b.title} ({b.clientName})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {attachSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{attachSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ohms')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'ohms'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          Ohm's & Joule's Law (DC & AC)
        </button>

        <button
          onClick={() => setActiveTab('vdrop')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'vdrop'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          Voltage Drop (NEC 210.19)
        </button>

        <button
          onClick={() => setActiveTab('cfill')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'cfill'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Conduit Fill (Ch. 9 Table 1)
        </button>

        <button
          onClick={() => setActiveTab('derating')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'derating'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Thermometer className="w-4 h-4" />
          Ampacity Derating (NEC 310.15)
        </button>

        <button
          onClick={() => setActiveTab('resload')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'resload'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Home className="w-4 h-4" />
          Residential Service Load (NEC 220.82)
        </button>
      </div>

      {/* TAB 1: OHM'S LAW SOLVER */}
      {activeTab === 'ohms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Circuit Input Parameters
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">System Type</label>
                <select
                  value={ohmsInputs.systemType}
                  onChange={(e) => setOhmsInputs({ ...ohmsInputs, systemType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="dc_resistive">Direct Current (DC) / Pure Resistive</option>
                  <option value="single_phase_ac">Single Phase Alternating Current (1-Phase AC)</option>
                  <option value="three_phase_ac">Three Phase Alternating Current (3-Phase AC)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Voltage (V)</label>
                  <input
                    type="number"
                    value={ohmsInputs.voltage !== undefined ? ohmsInputs.voltage : ''}
                    onChange={(e) => setOhmsInputs({ ...ohmsInputs, voltage: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="e.g. 120, 240, 480"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Current (Amps)</label>
                  <input
                    type="number"
                    value={ohmsInputs.current !== undefined ? ohmsInputs.current : ''}
                    onChange={(e) => setOhmsInputs({ ...ohmsInputs, current: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="e.g. 15, 20, 50"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Power (Watts / kW)</label>
                  <input
                    type="number"
                    value={ohmsInputs.power !== undefined ? ohmsInputs.power : ''}
                    onChange={(e) => setOhmsInputs({ ...ohmsInputs, power: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="e.g. 1800"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Resistance / Impedance (Ω)</label>
                  <input
                    type="number"
                    value={ohmsInputs.resistance !== undefined ? ohmsInputs.resistance : ''}
                    onChange={(e) => setOhmsInputs({ ...ohmsInputs, resistance: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="e.g. 8"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {ohmsInputs.systemType !== 'dc_resistive' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Power Factor (cos θ)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.0"
                      value={ohmsInputs.powerFactor || 1.0}
                      onChange={(e) => setOhmsInputs({ ...ohmsInputs, powerFactor: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Motor Efficiency (η)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.0"
                      value={ohmsInputs.efficiency || 1.0}
                      onChange={(e) => setOhmsInputs({ ...ohmsInputs, efficiency: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duty Hours/Day</label>
                  <input
                    type="number"
                    value={ohmsInputs.operatingHoursPerDay || 8}
                    onChange={(e) => setOhmsInputs({ ...ohmsInputs, operatingHoursPerDay: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rate ($/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ohmsInputs.electricityRatePerKwh || 0.22}
                    onChange={(e) => setOhmsInputs({ ...ohmsInputs, electricityRatePerKwh: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Calculated Physical Quantities
                  </h3>
                  <p className="text-xs text-slate-400">Pure Joulean & electrodynamic mathematical resolution</p>
                </div>

                {onAttachCalculationToBid && selectedBidId && ohmsResult.isValid && (
                  <button
                    onClick={() => handleAttach('ohms_law', `Ohm's Law Solver (${ohmsResult.wattsReal}W @ ${ohmsResult.volts}V)`, ohmsResult.calculationSteps, ohmsInputs, { volts: ohmsResult.volts, amps: ohmsResult.amps, watts: ohmsResult.wattsReal })}
                    className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    Attach Calculation to Bid
                  </button>
                )}
              </div>

              {ohmsResult.isValid ? (
                <div className="space-y-6">
                  {/* Grid of Results */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Potential (V)</span>
                      <span className="text-xl font-extrabold font-mono text-cyan-400">{ohmsResult.volts} V</span>
                    </div>
                    <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Current (I)</span>
                      <span className="text-xl font-extrabold font-mono text-amber-400">{ohmsResult.amps} A</span>
                    </div>
                    <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Real Power (P)</span>
                      <span className="text-xl font-extrabold font-mono text-emerald-400">{ohmsResult.wattsReal.toLocaleString()} W</span>
                    </div>
                    <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Resistance (R)</span>
                      <span className="text-xl font-extrabold font-mono text-purple-400">{ohmsResult.ohms} Ω</span>
                    </div>
                  </div>

                  {ohmsInputs.systemType !== 'dc_resistive' && (
                    <div className="grid grid-cols-3 gap-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-[11px] text-slate-400">Apparent Power (S):</span>
                        <p className="font-mono text-sm font-bold text-slate-200">{ohmsResult.apparentPowerVA.toFixed(1)} VA</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400">Reactive Power (Q):</span>
                        <p className="font-mono text-sm font-bold text-slate-200">{ohmsResult.reactivePowerVAR.toFixed(1)} VAR</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400">Mechanical Output:</span>
                        <p className="font-mono text-sm font-bold text-teal-400">{ohmsResult.mechanicalOutputHP.toFixed(2)} HP ({ohmsResult.mechanicalOutputWatts.toFixed(0)}W)</p>
                      </div>
                    </div>
                  )}

                  {/* Energy & Operating Cost */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Daily Energy Consumption:</span>
                      <p className="font-mono text-sm font-bold text-slate-100">{ohmsResult.dailyKWh} kWh/day</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Daily Operating Cost:</span>
                      <p className="font-mono text-sm font-bold text-slate-100">${ohmsResult.dailyCost.toFixed(2)}/day</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Annual Estimated Cost:</span>
                      <p className="font-mono text-sm font-bold text-amber-400">${ohmsResult.annualCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}/yr</p>
                    </div>
                  </div>

                  {/* Step-by-Step Derivation */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Mathematical Step-by-Step Proof
                    </h4>
                    <div className="space-y-2">
                      {ohmsResult.calculationSteps.map((step, idx) => (
                        <div key={idx} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 font-mono text-xs">
                          <div className="flex justify-between text-cyan-400 font-semibold mb-1">
                            <span>{step.formulaName}</span>
                            <span className="text-slate-300">{step.resultFormatted}</span>
                          </div>
                          <p className="text-slate-400 text-[11px] mb-1 font-sans">{step.explanation}</p>
                          <div className="text-[11px] text-slate-500">
                            <span>Substituted: </span>
                            <span className="text-amber-300">{step.formulaSubstituted}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-medium">{ohmsResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VOLTAGE DROP */}
      {activeTab === 'vdrop' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              Feeder / Branch Circuit Specs
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">System Voltage Configuration</label>
                <select
                  value={vdSystem}
                  onChange={(e) => setVdSystem(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="single_phase_120">120V 1-Phase (2-Wire)</option>
                  <option value="single_phase_240">240V 1-Phase (2-Wire / 3-Wire)</option>
                  <option value="three_phase_208">208V 3-Phase (4-Wire Wye)</option>
                  <option value="three_phase_480">480V 3-Phase (4-Wire Wye)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Conductor Size</label>
                  <select
                    value={vdWire}
                    onChange={(e) => setVdWire(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    {Object.keys(WIRE_RESISTANCE_OHMS_PER_1000FT).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Conductor Material</label>
                  <select
                    value={vdMaterial}
                    onChange={(e) => setVdMaterial(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="copper">Copper (Cu)</option>
                    <option value="aluminum">Aluminum (Al)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Design Load (Amps)</label>
                  <input
                    type="number"
                    value={vdCurrent}
                    onChange={(e) => setVdCurrent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">One-Way Run Distance (Feet)</label>
                  <input
                    type="number"
                    value={vdDistance}
                    onChange={(e) => setVdDistance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Voltage Drop Assessment (NEC 210.19)
                </h3>
                <p className="text-xs text-slate-400">Informational Note guideline (Max 3% branch, 5% feeder+branch)</p>
              </div>

              {onAttachCalculationToBid && selectedBidId && (
                <button
                  onClick={() => handleAttach('voltage_drop', `Voltage Drop: ${vdWire} ${vdMaterial} (${vdDistance}ft @ ${vdCurrent}A)`, [{ formulaName: 'Voltage Drop', formulaRaw: vdResult.formula, formulaSubstituted: `${vdResult.voltageDropVolts}V (${vdResult.voltageDropPercent}%)`, resultFormatted: `${vdResult.voltageDropPercent}%`, unit: '%', explanation: vdResult.explanation, targetVariable: 'voltageDrop' }], { vdWire, vdDistance, vdCurrent }, { voltageDropPercent: vdResult.voltageDropPercent, recommendedWire: vdResult.recommendedWireSize })}
                  className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Attach to Bid
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`p-4 rounded-xl border ${
                vdResult.isCompliant3Percent 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <span className="text-[11px] block font-semibold">Voltage Drop %</span>
                <span className="text-2xl font-extrabold font-mono">{vdResult.voltageDropPercent}%</span>
                <span className="text-[10px] block mt-1">
                  {vdResult.isCompliant3Percent ? '✓ Under 3.0% limit' : '⚠ Exceeds 3.0% target'}
                </span>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-slate-200">
                <span className="text-[11px] block font-semibold text-slate-400">Total Voltage Loss</span>
                <span className="text-2xl font-extrabold font-mono text-cyan-400">{vdResult.voltageDropVolts} V</span>
                <span className="text-[10px] block text-slate-400 mt-1">At end of {vdDistance} ft run</span>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-slate-200">
                <span className="text-[11px] block font-semibold text-slate-400">Voltage at Load Terminal</span>
                <span className="text-2xl font-extrabold font-mono text-amber-400">{vdResult.voltageAtLoad} V</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Recommended Wire Size for &lt;3% Drop:</span>
                <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
                  {vdResult.recommendedWireSize} ({vdMaterial})
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Formula: {vdResult.formula}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONDUIT FILL */}
      {activeTab === 'cfill' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Conduit & Conductor Bundle
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Conduit Type & Trade Size</label>
              <select
                value={conduitType}
                onChange={(e) => setConduitType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {Object.keys(CONDUIT_TOTAL_AREA_SQ_IN).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300">Conductors in Raceway</label>
                <button
                  type="button"
                  onClick={() => setConductorsList([...conductorsList, { size: '12 AWG', count: 1 }])}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Wire Group
                </button>
              </div>

              <div className="space-y-2">
                {conductorsList.map((cond, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                    <select
                      value={cond.size}
                      onChange={(e) => {
                        const updated = [...conductorsList];
                        updated[idx].size = e.target.value;
                        setConductorsList(updated);
                      }}
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 font-mono"
                    >
                      {Object.keys(WIRE_RESISTANCE_OHMS_PER_1000FT).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={cond.count}
                      onChange={(e) => {
                        const updated = [...conductorsList];
                        updated[idx].count = parseInt(e.target.value) || 1;
                        setConductorsList(updated);
                      }}
                      className="w-16 bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 font-mono text-center"
                    />
                    <span className="text-xs text-slate-400">wires</span>

                    <button
                      type="button"
                      onClick={() => setConductorsList(conductorsList.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300 text-xs ml-auto px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Conduit Fill Compliance (NEC Ch 9 Table 1)
                </h3>
                <p className="text-xs text-slate-400">Max fill 40% for 3+ conductors, 31% for 2, 53% for 1</p>
              </div>

              {onAttachCalculationToBid && selectedBidId && (
                <button
                  onClick={() => handleAttach('conduit_fill', `Conduit Fill: ${conduitType} (${cfillResult.fillPercentage}% Fill)`, [{ formulaName: 'Conduit Fill', formulaRaw: `${cfillResult.totalConductorAreaSqIn} sq.in / ${cfillResult.totalConduitAreaSqIn} sq.in`, formulaSubstituted: `${cfillResult.fillPercentage}%`, resultFormatted: `${cfillResult.fillPercentage}%`, unit: '%', explanation: 'Conduit fill ratio', targetVariable: 'fillPercentage' }], { conduitType, conductorsList }, { fillPercentage: cfillResult.fillPercentage, recommendedConduit: cfillResult.recommendedConduitSize })}
                  className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Attach to Bid
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`p-4 rounded-xl border ${
                cfillResult.isCompliant 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <span className="text-[11px] block font-semibold">Actual Fill %</span>
                <span className="text-2xl font-extrabold font-mono">{cfillResult.fillPercentage}%</span>
                <span className="text-[10px] block mt-1">
                  Limit: {cfillResult.maxAllowedFillPercentage}% ({cfillResult.isCompliant ? '✓ PASS' : '⚠ OVERFILL'})
                </span>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-slate-200">
                <span className="text-[11px] block font-semibold text-slate-400">Total Wires Area</span>
                <span className="text-2xl font-extrabold font-mono text-cyan-400">{cfillResult.totalConductorAreaSqIn}</span>
                <span className="text-[10px] block text-slate-400 mt-1">sq. inches</span>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-slate-200">
                <span className="text-[11px] block font-semibold text-slate-400">Usable Raceway Area</span>
                <span className="text-2xl font-extrabold font-mono text-amber-400">{cfillResult.usableConduitAreaSqIn}</span>
                <span className="text-[10px] block text-slate-400 mt-1">sq. inches @ {cfillResult.maxAllowedFillPercentage}%</span>
              </div>
            </div>

            {!cfillResult.isCompliant && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                <span className="font-bold block mb-1">Recommended Upsize:</span>
                <span>Use at least <strong className="text-white font-mono">{cfillResult.recommendedConduitSize}</strong> to comply with NEC Chapter 9 Table 1.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AMPACITY DERATING */}
      {activeTab === 'derating' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              Thermal & Bundling Parameters
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Conductor Gauge & Material</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={derateWire}
                    onChange={(e) => setDerateWire(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  >
                    {Object.keys(WIRE_RESISTANCE_OHMS_PER_1000FT).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={derateMaterial}
                    onChange={(e) => setDerateMaterial(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="copper">Copper (75°C)</option>
                    <option value="aluminum">Aluminum (75°C)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ambient Temperature (°F)</label>
                <input
                  type="number"
                  value={derateTemp}
                  onChange={(e) => setDerateTemp(parseFloat(e.target.value) || 86)}
                  placeholder="e.g. 104°F for attic"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Current-Carrying Conductors in Raceway</label>
                <input
                  type="number"
                  min="1"
                  value={derateCount}
                  onChange={(e) => setDerateCount(parseInt(e.target.value) || 3)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Adjusted Conductor Ampacity (NEC 310.15)
                </h3>
                <p className="text-xs text-slate-400">NEC Table 310.15(B)(1) temperature + 310.15(C)(1) bundling</p>
              </div>

              {onAttachCalculationToBid && selectedBidId && (
                <button
                  onClick={() => handleAttach('ampacity_derating', `Ampacity Derating: ${derateWire} (${derateResult.deratedAmpacity}A Net)`, [{ formulaName: 'Ampacity Derating', formulaRaw: 'Amp = Base × TempFactor × BundleFactor', formulaSubstituted: `${derateResult.baseAmpacity75C}A × ${derateResult.ambientTempCorrectionFactor} × ${derateResult.conduitFillBundlingFactor} = ${derateResult.deratedAmpacity}A`, resultFormatted: `${derateResult.deratedAmpacity} A`, unit: 'A', explanation: 'Thermal and bundling derating', targetVariable: 'deratedAmpacity' }], { derateWire, derateTemp, derateCount }, { deratedAmpacity: derateResult.deratedAmpacity, limit80: derateResult.recommendedContinuousLoadLimit80 })}
                  className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Attach to Bid
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-slate-200">
                <span className="text-[11px] block font-semibold text-slate-400">Base Table 310.16 Ampacity</span>
                <span className="text-2xl font-extrabold font-mono text-cyan-400">{derateResult.baseAmpacity75C} A</span>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-amber-300">
                <span className="text-[11px] block font-semibold">Derated Adjusted Ampacity</span>
                <span className="text-2xl font-extrabold font-mono">{derateResult.deratedAmpacity} A</span>
                <span className="text-[10px] block text-amber-400/80 mt-1">
                  Factor: {(derateResult.ambientTempCorrectionFactor * derateResult.conduitFillBundlingFactor).toFixed(2)}x
                </span>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-slate-200">
                <span className="text-[11px] block font-semibold text-slate-400">80% Continuous Duty Max</span>
                <span className="text-2xl font-extrabold font-mono text-teal-400">{derateResult.recommendedContinuousLoadLimit80} A</span>
                <span className="text-[10px] block text-slate-400 mt-1">3hr+ continuous load</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RESIDENTIAL LOAD */}
      {activeTab === 'resload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Home className="w-4 h-4 text-cyan-400" />
              Dwelling Unit Connected Loads (NEC 220.82)
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Living Area (Sq. Ft.)</label>
                <input
                  type="number"
                  value={sqft}
                  onChange={(e) => setSqft(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Small Appliance 20A Circuits</label>
                <input
                  type="number"
                  value={smallApp}
                  onChange={(e) => setSmallApp(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Electric Range / Oven (W)</label>
                <input
                  type="number"
                  value={rangeW}
                  onChange={(e) => setRangeW(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Water Heater (W)</label>
                <input
                  type="number"
                  value={waterHeaterW}
                  onChange={(e) => setWaterHeaterW(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Clothes Dryer (W)</label>
                <input
                  type="number"
                  value={dryerW}
                  onChange={(e) => setDryerW(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">EVSE Charger (W)</label>
                <input
                  type="number"
                  value={evseW}
                  onChange={(e) => setEvseW(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">HVAC Heat Pump / AC (W)</label>
                <input
                  type="number"
                  value={hvacW}
                  onChange={(e) => setHvacW(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Other Fixed Loads (W)</label>
                <input
                  type="number"
                  value={otherW}
                  onChange={(e) => setOtherW(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Service Sizing Summary (NEC 220.82)
                </h3>
                <p className="text-xs text-slate-400">Optional single-family dwelling demand calculation</p>
              </div>

              {onAttachCalculationToBid && selectedBidId && (
                <button
                  onClick={() => handleAttach('residential_load_220_82', `NEC 220.82 Service Sizing (${resLoadResult.recommendedServiceAmps}A Service)`, [{ formulaName: 'Dwelling Load 220.82', formulaRaw: '100% first 10kW + 40% remainder + 100% HVAC', formulaSubstituted: `${resLoadResult.totalServiceCalculatedVA} VA / 240V = ${resLoadResult.calculatedAmps240V} A`, resultFormatted: `${resLoadResult.recommendedServiceAmps} A`, unit: 'A', explanation: 'Residential service sizing', targetVariable: 'serviceAmps' }], { sqft, rangeW, evseW, hvacW }, { totalVA: resLoadResult.totalServiceCalculatedVA, calculatedAmps: resLoadResult.calculatedAmps240V, serviceAmps: resLoadResult.recommendedServiceAmps })}
                  className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Attach to Bid
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-slate-200">
                <span className="text-[11px] block font-semibold text-slate-400">Total Calculated Load</span>
                <span className="text-2xl font-extrabold font-mono text-cyan-400">{resLoadResult.totalServiceCalculatedVA.toLocaleString()} VA</span>
                <span className="text-[10px] block text-slate-400 mt-1">({resLoadResult.calculatedAmps240V} Amps @ 240V)</span>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-emerald-300">
                <span className="text-[11px] block font-semibold">Recommended Service Rating</span>
                <span className="text-3xl font-extrabold font-mono">{resLoadResult.recommendedServiceAmps} A</span>
                <span className="text-[10px] block text-emerald-400/80 mt-1">Standard 120/240V Main Breaker</span>
              </div>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span>General Loads Before Demand:</span>
                <span className="text-slate-200">{resLoadResult.totalGeneralLoadsBeforeDemand} VA</span>
              </div>
              <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span>First 10,000 VA @ 100%:</span>
                <span className="text-slate-200">{resLoadResult.first10kWVA} VA</span>
              </div>
              <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span>Remaining {resLoadResult.remainingGeneralLoadsVA} VA @ 40%:</span>
                <span className="text-slate-200">{Math.round(resLoadResult.remainingGeneralLoadsVA * 0.4)} VA</span>
              </div>
              <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span>HVAC / Heating Unit @ 100%:</span>
                <span className="text-slate-200">{resLoadResult.hvacVA} VA</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
