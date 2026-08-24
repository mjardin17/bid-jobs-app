import React, { useState } from 'react';
import { 
  JobBid, 
  LineItem, 
  ElectricalCategory, 
  DifficultyFactors, 
  CrewConfiguration, 
  ContractorCompanyProfile,
  CustomerRequestedOption,
  ProjectAllowance
} from '../types';
import { PREBUILT_ELECTRICAL_ASSEMBLIES, PrebuiltAssembly } from '../data/electricalAssemblies';
import { calculateBidFinancials } from '../utils/calculator';
import { AITakeoffModal } from './AITakeoffModal';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Sliders, 
  Users, 
  DollarSign, 
  FileText, 
  Check, 
  Search, 
  BookOpen, 
  ShieldCheck, 
  AlertCircle,
  FileCheck2,
  FolderPlus
} from 'lucide-react';

interface BidBuilderViewProps {
  bids: JobBid[];
  selectedBid: JobBid | null;
  companyProfile: ContractorCompanyProfile;
  onSelectBid: (bid: JobBid) => void;
  onSaveBid: (bid: JobBid) => void;
  onCreateProposalFromBid: (bid: JobBid) => void;
  onCreateNewBid: () => void;
}

export const BidBuilderView: React.FC<BidBuilderViewProps> = ({
  bids,
  selectedBid,
  companyProfile,
  onSelectBid,
  onSaveBid,
  onCreateProposalFromBid,
  onCreateNewBid
}) => {
  const [showAssemblyPicker, setShowAssemblyPicker] = useState(false);
  const [showAITakeoff, setShowAITakeoff] = useState(false);
  const [assemblySearch, setAssemblySearch] = useState('');
  const [assemblyCategoryFilter, setAssemblyCategoryFilter] = useState<string>('all');

  if (!selectedBid) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 className="text-lg font-bold text-slate-200 mb-2">No Bid Selected</h3>
        <p className="text-xs text-slate-400 mb-4">Select an existing estimate from the list or create a new job takeoff.</p>
        <button
          onClick={onCreateNewBid}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20"
        >
          Create New Electrical Bid
        </button>
      </div>
    );
  }

  const financials = calculateBidFinancials(selectedBid);

  // Line item mutations
  const updateLineItem = (index: number, updates: Partial<LineItem>) => {
    const updatedItems = [...(selectedBid.lineItems || [])];
    const current = updatedItems[index];
    const nextItem = { ...current, ...updates };

    const qty = nextItem.quantity || 0;
    const baseHours = nextItem.baseLaborHoursPerUnit || 0;
    const matCost = nextItem.materialCostPerUnit || 0;

    nextItem.totalLaborHours = Math.round(qty * baseHours * 100) / 100;
    nextItem.totalMaterialCost = Math.round(qty * matCost * 100) / 100;

    updatedItems[index] = nextItem;
    onSaveBid({ ...selectedBid, lineItems: updatedItems });
  };

  const removeLineItem = (index: number) => {
    const updated = (selectedBid.lineItems || []).filter((_, i) => i !== index);
    onSaveBid({ ...selectedBid, lineItems: updated });
  };

  const addPrebuiltAssembly = (assembly: PrebuiltAssembly) => {
    const newItem: LineItem = {
      id: `li-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      category: assembly.category,
      description: assembly.name,
      quantity: 1,
      unit: assembly.unit,
      baseLaborHoursPerUnit: assembly.baseLaborHours,
      materialCostPerUnit: assembly.materialCost,
      wastePercent: assembly.wastePercent,
      totalLaborHours: assembly.baseLaborHours,
      totalMaterialCost: assembly.materialCost,
      necaAssemblyRefId: assembly.id,
      notes: assembly.description
    };
    onSaveBid({
      ...selectedBid,
      lineItems: [...(selectedBid.lineItems || []), newItem]
    });
    setShowAssemblyPicker(false);
  };

  const handleApplyAITakeoff = (items: Partial<LineItem>[], scopeNotes: string) => {
    const completeItems: LineItem[] = items.map(item => ({
      id: item.id || `li-${Date.now().toString(36)}`,
      category: item.category || 'branch_circuits',
      description: item.description || 'Electrical line item',
      quantity: item.quantity || 1,
      unit: item.unit || 'each',
      baseLaborHoursPerUnit: item.baseLaborHoursPerUnit || 1.0,
      materialCostPerUnit: item.materialCostPerUnit || 50.0,
      wastePercent: item.wastePercent || 5,
      totalLaborHours: (item.baseLaborHoursPerUnit || 1.0) * (item.quantity || 1),
      totalMaterialCost: (item.materialCostPerUnit || 50.0) * (item.quantity || 1),
      notes: item.notes
    }));

    onSaveBid({
      ...selectedBid,
      lineItems: [...(selectedBid.lineItems || []), ...completeItems],
      scopeOfWork: selectedBid.scopeOfWork ? `${selectedBid.scopeOfWork}\n\nAI Takeoff Scope: ${scopeNotes}` : scopeNotes
    });
  };

  const filteredAssemblies = PREBUILT_ELECTRICAL_ASSEMBLIES.filter(a => {
    const matchCat = assemblyCategoryFilter === 'all' || a.category === assemblyCategoryFilter;
    const matchText = a.name.toLowerCase().includes(assemblySearch.toLowerCase()) ||
      a.description.toLowerCase().includes(assemblySearch.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(assemblySearch.toLowerCase()));
    return matchCat && matchText;
  });

  return (
    <div className="space-y-6">
      {/* Bid Header & Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <select
              value={selectedBid.id}
              onChange={(e) => {
                const found = bids.find(b => b.id === e.target.value);
                if (found) onSelectBid(found);
              }}
              className="bg-slate-950 border border-slate-700 text-sm font-bold text-slate-100 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
            >
              {bids.map(b => (
                <option key={b.id} value={b.id}>
                  {b.bidNumber} — {b.title} ({b.clientName})
                </option>
              ))}
            </select>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold uppercase">
              {selectedBid.status}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Client: <strong className="text-slate-200">{selectedBid.clientName}</strong> | Jobsite: {selectedBid.jobAddress || 'No address set'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAITakeoff(true)}
            className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            AI Plan Takeoff
          </button>

          <button
            onClick={() => setShowAssemblyPicker(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            NECA Assemblies
          </button>

          <button
            onClick={() => onCreateProposalFromBid(selectedBid)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate Formal Proposal
          </button>
        </div>
      </div>

      {/* Main Grid: Takeoff Line Items (Left) vs Financial Summary & Multipliers (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Line Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Line Items Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">
                  Itemized Scope & Material Takeoff ({selectedBid.lineItems?.length || 0} items)
                </h3>
              </div>
              <button
                onClick={() => {
                  const newItem: LineItem = {
                    id: `li-custom-${Date.now().toString(36)}`,
                    category: 'branch_circuits',
                    description: 'Custom Electrical Assembly',
                    quantity: 1,
                    unit: 'each',
                    baseLaborHoursPerUnit: 1.0,
                    materialCostPerUnit: 25.0,
                    wastePercent: 5,
                    totalLaborHours: 1.0,
                    totalMaterialCost: 25.0
                  };
                  onSaveBid({
                    ...selectedBid,
                    lineItems: [...(selectedBid.lineItems || []), newItem]
                  });
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Blank Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Description & Category</th>
                    <th className="py-3 px-2 w-20">Qty</th>
                    <th className="py-3 px-2 w-16">Unit</th>
                    <th className="py-3 px-2 w-24">Hrs/Unit</th>
                    <th className="py-3 px-2 w-24">Mat ($/Unit)</th>
                    <th className="py-3 px-2 w-20">Waste%</th>
                    <th className="py-3 px-3 text-right">Ext Total</th>
                    <th className="py-3 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  {(selectedBid.lineItems || []).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/40 transition group">
                      <td className="py-3 px-4 font-sans">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, { description: e.target.value })}
                          className="w-full bg-transparent font-medium text-slate-100 focus:outline-none focus:bg-slate-950/80 px-1 py-0.5 rounded border border-transparent focus:border-slate-700"
                        />
                        <div className="flex items-center gap-2 mt-0.5">
                          <select
                            value={item.category}
                            onChange={(e) => updateLineItem(idx, { category: e.target.value as any })}
                            className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 rounded px-1.5 py-0.5"
                          >
                            <option value="service_panels">Service Panels</option>
                            <option value="conduit_raceway">Conduit & Raceway</option>
                            <option value="feeders_wire">Feeders & Wire</option>
                            <option value="branch_circuits">Branch Circuits</option>
                            <option value="devices_receptacles">Devices & Outlets</option>
                            <option value="lighting_fixtures">Lighting</option>
                            <option value="ev_chargers_solar">EV Chargers / Surge</option>
                            <option value="hvac_disconnects">HVAC Disconnects</option>
                            <option value="transformers_generators">Generators / Power</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3 px-2">
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-100 text-right focus:outline-none focus:border-amber-500"
                        />
                      </td>

                      <td className="py-3 px-2 text-slate-400 text-center font-sans">
                        {item.unit}
                      </td>

                      <td className="py-3 px-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.baseLaborHoursPerUnit}
                          onChange={(e) => updateLineItem(idx, { baseLaborHoursPerUnit: parseFloat(e.target.value) || 0 })}
                          className="w-20 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-amber-300 text-right focus:outline-none focus:border-amber-500"
                        />
                      </td>

                      <td className="py-3 px-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.materialCostPerUnit}
                          onChange={(e) => updateLineItem(idx, { materialCostPerUnit: parseFloat(e.target.value) || 0 })}
                          className="w-20 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-200 text-right focus:outline-none focus:border-amber-500"
                        />
                      </td>

                      <td className="py-3 px-2">
                        <input
                          type="number"
                          value={item.wastePercent || 0}
                          onChange={(e) => updateLineItem(idx, { wastePercent: parseFloat(e.target.value) || 0 })}
                          className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-400 text-right focus:outline-none focus:border-amber-500"
                        />
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-100">
                        ${((item.totalMaterialCost || 0) + (item.totalLaborHours || 0) * financials.burdenedHourlyWage).toFixed(2)}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => removeLineItem(idx)}
                          className="p-1 text-slate-600 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attached Engineering Calculations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-slate-200 text-sm uppercase tracking-wider">
                  Attached Physical & NEC Code Calculations ({selectedBid.attachedCalculations?.length || 0})
                </h4>
              </div>
            </div>

            {(!selectedBid.attachedCalculations || selectedBid.attachedCalculations.length === 0) ? (
              <p className="text-xs text-slate-500">
                No calculations attached to this bid yet. Open the "NEC & Engineering Tools" tab to run voltage drop or conduit sizing and click "Attach Calculation to Bid".
              </p>
            ) : (
              <div className="space-y-3">
                {selectedBid.attachedCalculations.map((calc, cIdx) => (
                  <div key={calc.id || cIdx} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">{calc.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                          {calc.calculatorVersion}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1 font-mono text-[11px]">
                        {calc.formulasUsed?.[0]?.explanation || 'Engineering calculation verified.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Signed Off by {calc.reviewedBy || companyProfile.authorizedLicensedWorkReviewer}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Multipliers, Crew & Financial Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* NECA Difficulty Factors */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                NECA Labor Multipliers
              </h4>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {financials.difficultyMultiplier.toFixed(2)}x
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Working Height</label>
                <select
                  value={selectedBid.difficulty?.workingHeight || 'under_10ft'}
                  onChange={(e) => onSaveBid({
                    ...selectedBid,
                    difficulty: { ...(selectedBid.difficulty || {} as any), workingHeight: e.target.value as any }
                  })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="under_10ft">Under 10 ft (1.00x)</option>
                  <option value="10_to_14ft">10 to 14 ft (+10%)</option>
                  <option value="15_to_20ft">15 to 20 ft (+20%)</option>
                  <option value="over_20ft_scaffold_lift">Over 20 ft Lift (+35%)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Environment / Remodel</label>
                <select
                  value={selectedBid.difficulty?.environmentType || 'new_open_construction'}
                  onChange={(e) => onSaveBid({
                    ...selectedBid,
                    difficulty: { ...(selectedBid.difficulty || {} as any), environmentType: e.target.value as any }
                  })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="new_open_construction">New Open Framing (1.00x)</option>
                  <option value="occupied_remodel">Occupied Remodel (+15%)</option>
                  <option value="confined_space_attic_crawl">Attic / Crawlspace (+25%)</option>
                  <option value="hazardous_classified">Hazardous Classified (+35%)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">NECA Base Level</label>
                <select
                  value={selectedBid.difficulty?.necaBaseLevel || 'level_1'}
                  onChange={(e) => onSaveBid({
                    ...selectedBid,
                    difficulty: { ...(selectedBid.difficulty || {} as any), necaBaseLevel: e.target.value as any }
                  })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="level_1">NECA Level 1: Standard Open Workspace</option>
                  <option value="level_2">NECA Level 2: Moderate Conduit Offsets (+5%)</option>
                  <option value="level_3">NECA Level 3: Crowded Plenum / Retrofit (+15%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Crew Setup */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Crew & Wage Configuration
              </h4>
              <span className="text-xs font-mono font-bold text-cyan-400">
                ${financials.burdenedHourlyWage}/hr (Burdened)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Master ($65/h)</label>
                <input
                  type="number"
                  min="0"
                  value={selectedBid.crew?.masterCount || 1}
                  onChange={(e) => onSaveBid({
                    ...selectedBid,
                    crew: { ...(selectedBid.crew || {} as any), masterCount: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-center font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Journeyman ($48/h)</label>
                <input
                  type="number"
                  min="0"
                  value={selectedBid.crew?.journeymanCount || 1}
                  onChange={(e) => onSaveBid({
                    ...selectedBid,
                    crew: { ...(selectedBid.crew || {} as any), journeymanCount: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-center font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1">Labor Burden % (Taxes, Comp, Ins)</label>
              <input
                type="number"
                value={selectedBid.crew?.laborBurdenPercent || 28}
                onChange={(e) => onSaveBid({
                  ...selectedBid,
                  crew: { ...(selectedBid.crew || {} as any), laborBurdenPercent: parseFloat(e.target.value) || 0 }
                })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-center font-mono text-xs"
              />
            </div>
          </div>

          {/* Margins & Financial Waterfall */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Financial Waterfall & Margins
            </h4>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Overhead %</label>
                <input
                  type="number"
                  value={selectedBid.overheadPercent || 15}
                  onChange={(e) => onSaveBid({ ...selectedBid, overheadPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-center font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Profit %</label>
                <input
                  type="number"
                  value={selectedBid.profitMarginPercent || 20}
                  onChange={(e) => onSaveBid({ ...selectedBid, profitMarginPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-center font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Permit ($)</label>
                <input
                  type="number"
                  value={selectedBid.permitCost || 175}
                  onChange={(e) => onSaveBid({ ...selectedBid, permitCost: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-center font-mono"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Labor ({financials.adjustedLaborHours} hrs):</span>
                <span className="text-slate-200">${financials.burdenedLaborCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Material (+ waste):</span>
                <span className="text-slate-200">${financials.wasteAdjustedMaterialCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Direct Job Cost:</span>
                <span className="text-slate-200">${financials.directJobCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Overhead Amount:</span>
                <span className="text-slate-200">${financials.overheadAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Target Net Profit:</span>
                <span>${financials.profitAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Permits & Fees:</span>
                <span className="text-slate-200">${financials.permitCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sales Tax ({selectedBid.taxRatePercent}%):</span>
                <span className="text-slate-200">${financials.salesTaxAmount.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                <span>Total Bid Amount:</span>
                <span className="text-amber-400 font-mono text-base">
                  ${financials.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assembly Library Picker Modal */}
      {showAssemblyPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-base">NECA Standard Electrical Assembly Catalog</h3>
              </div>
              <button onClick={() => setShowAssemblyPicker(false)} className="text-slate-400 hover:text-slate-100">
                ✕
              </button>
            </div>

            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={assemblySearch}
                  onChange={(e) => setAssemblySearch(e.target.value)}
                  placeholder="Search 200A panel, EMT conduit, Tesla wall connector..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={assemblyCategoryFilter}
                onChange={(e) => setAssemblyCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Categories</option>
                <option value="service_panels">Service Panels</option>
                <option value="conduit_raceway">Conduit & Raceway</option>
                <option value="feeders_wire">Feeders & Wire</option>
                <option value="branch_circuits">Branch Circuits</option>
                <option value="devices_receptacles">Devices & Outlets</option>
                <option value="lighting_fixtures">Lighting Fixtures</option>
                <option value="ev_chargers_solar">EV Chargers / Surge</option>
                <option value="hvac_disconnects">HVAC Disconnects</option>
                <option value="transformers_generators">Generators</option>
              </select>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {filteredAssemblies.map((asmb) => (
                <div
                  key={asmb.id}
                  className="p-4 bg-slate-950/60 hover:bg-slate-800/50 border border-slate-800 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-slate-100 text-sm">{asmb.name}</h5>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                        {asmb.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{asmb.description}</p>
                    <p className="text-[10px] text-amber-400/80 font-mono mt-1">Ref: {asmb.necaStandardRef}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    <div className="text-right">
                      <p className="text-amber-400 font-bold">{asmb.baseLaborHours} hrs / {asmb.unit}</p>
                      <p className="text-slate-300">${asmb.materialCost.toFixed(2)} mat</p>
                    </div>

                    <button
                      onClick={() => addPrebuiltAssembly(asmb)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Takeoff Modal */}
      {showAITakeoff && (
        <AITakeoffModal
          jobType={selectedBid.jobType}
          onClose={() => setShowAITakeoff(false)}
          onApplyTakeoff={handleApplyAITakeoff}
        />
      )}
    </div>
  );
};
