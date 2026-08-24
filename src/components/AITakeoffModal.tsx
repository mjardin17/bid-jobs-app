import React, { useState } from 'react';
import { Sparkles, X, Loader2, Plus, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { LineItem, JobType } from '../types';

interface AITakeoffModalProps {
  jobType: JobType;
  onClose: () => void;
  onApplyTakeoff: (items: Partial<LineItem>[], scopeNotes: string) => void;
}

export const AITakeoffModal: React.FC<AITakeoffModalProps> = ({ jobType, onClose, onApplyTakeoff }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/takeoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, jobType })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AI takeoff');
      }

      setResult(data);
      if (data.recommendedItems) {
        setSelectedIndices(data.recommendedItems.map((_: any, idx: number) => idx));
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI Takeoff engine');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleApply = () => {
    if (!result || !result.recommendedItems) return;
    const itemsToApply: Partial<LineItem>[] = result.recommendedItems
      .filter((_: any, idx: number) => selectedIndices.includes(idx))
      .map((item: any) => ({
        id: `li-ai-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        category: item.category,
        description: item.description,
        quantity: item.quantity || 1,
        unit: item.unit || 'each',
        baseLaborHoursPerUnit: item.estimatedLaborHoursPerUnit || 1.0,
        materialCostPerUnit: item.estimatedMaterialCostPerUnit || 50.0,
        wastePercent: 5,
        totalLaborHours: (item.estimatedLaborHoursPerUnit || 1.0) * (item.quantity || 1),
        totalMaterialCost: (item.estimatedMaterialCostPerUnit || 50.0) * (item.quantity || 1),
        notes: item.notes
      }));

    onApplyTakeoff(itemsToApply, result.projectSummary || prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">AI Electrical Scope Takeoff</h3>
              <p className="text-xs text-slate-400">Auto-generate NECA-aligned assemblies from plan descriptions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Describe Project Scope, Specs, or Plan Notes:</span>
                <span className="text-[11px] font-normal text-amber-400">Powered by Gemini 2.5</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Upgrade 100A overhead service to 200A underground. Run 85ft 2-inch PVC trenching to garage, install 100A subpanel, 2x 50A EV chargers, and 12 wafer LED pot lights in finished living room with Lutron dimmers..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Extracts conduit, wire runs, panels, and labor hours automatically</span>
              </div>
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Analyzing Scope...' : 'Generate Line Item Takeoff'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">AI Analysis Notice:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-5 pt-4 border-t border-slate-800">
              {result.projectSummary && (
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <span className="font-bold text-amber-400 block mb-1">Executive Scope Summary:</span>
                  <p>{result.projectSummary}</p>
                </div>
              )}

              {result.recommendedItems && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Generated Takeoff Assemblies ({result.recommendedItems.length})
                    </h4>
                    <span className="text-xs text-slate-400">
                      {selectedIndices.length} of {result.recommendedItems.length} selected
                    </span>
                  </div>

                  <div className="space-y-2">
                    {result.recommendedItems.map((item: any, idx: number) => {
                      const isSelected = selectedIndices.includes(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleItem(idx)}
                          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/40 text-slate-200'
                              : 'bg-slate-950/40 border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-1 accent-amber-500 w-4 h-4 rounded cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-100">{item.description}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{item.notes}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono text-xs">
                            <p className="text-slate-200 font-semibold">{item.quantity} {item.unit}</p>
                            <p className="text-amber-400">{item.estimatedLaborHoursPerUnit} hrs/ea</p>
                            <p className="text-slate-400">${item.estimatedMaterialCostPerUnit}/ea</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {result.necNotes && result.necNotes.length > 0 && (
                <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300">
                  <span className="font-bold text-teal-400 block mb-1">Key NEC Considerations:</span>
                  <ul className="list-disc list-inside space-y-1 text-teal-200/90">
                    {result.necNotes.map((note: string, nIdx: number) => (
                      <li key={nIdx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={selectedIndices.length === 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Add {selectedIndices.length} Items to Bid
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
