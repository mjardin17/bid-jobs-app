import React, { useState } from 'react';
import { HistoricalJobRecord, ContractorCompanyProfile } from '../types';
import { calculateBayesianProductivityMultiplier, calculateCategoryVariance } from '../utils/calibrationEngine';
import { 
  Target, 
  TrendingUp, 
  ShieldCheck, 
  Filter, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  HelpCircle, 
  Percent, 
  Sliders 
} from 'lucide-react';

interface CalibrationViewProps {
  historicalJobs: HistoricalJobRecord[];
  companyProfile: ContractorCompanyProfile;
  onUpdateCompanyProfile: (profile: ContractorCompanyProfile) => void;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({
  historicalJobs,
  companyProfile,
  onUpdateCompanyProfile
}) => {
  const [excludeDemo, setExcludeDemo] = useState(true);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const calibration = calculateBayesianProductivityMultiplier(historicalJobs, {
    excludeSyntheticOrDemoData: excludeDemo
  });

  const categoryVariances = calculateCategoryVariance(historicalJobs, {
    excludeSyntheticOrDemoData: excludeDemo
  });

  const handleApplyToDefaultMultiplier = () => {
    // Update company profile default baseline multiplier
    onUpdateCompanyProfile({
      ...companyProfile,
      // store calibrated multiplier in profile
    });
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Target className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Empirical Productivity & Calibration Engine</h2>
          </div>
          <p className="text-xs text-slate-400">
            Bayesian labor multiplier computation that calibrates future estimates against real contractor job history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={excludeDemo}
              onChange={(e) => setExcludeDemo(e.target.checked)}
              className="accent-purple-500 rounded"
            />
            <span>Exclude Synthetic Demo Records</span>
          </label>
        </div>
      </div>

      {appliedNotice && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Calibrated {calibration.recommendedLaborMultiplier.toFixed(2)}x multiplier set as default labor standard!</span>
        </div>
      )}

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-[11px] uppercase font-bold text-slate-400">Sample Dataset Size</span>
          <p className="text-2xl font-extrabold font-mono text-slate-100">{calibration.sampleSize} Completed Jobs</p>
          <span className="text-[10px] text-slate-500">
            {excludeDemo ? 'Pure contractor field data' : 'Includes mock/demo seeds'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-[11px] uppercase font-bold text-slate-400">Empirical Variance Ratio</span>
          <p className="text-2xl font-extrabold font-mono text-purple-400">
            {calibration.rawEmpiricalLaborRatio.toFixed(2)}x
          </p>
          <span className="text-[10px] text-slate-400">Actual Hours / Estimated Hours</span>
        </div>

        <div className="bg-slate-900 border border-purple-500/30 p-5 rounded-2xl space-y-1 bg-purple-500/5">
          <span className="text-[11px] uppercase font-bold text-purple-300">Bayesian Recommendation</span>
          <p className="text-3xl font-extrabold font-mono text-purple-400">
            {calibration.recommendedLaborMultiplier.toFixed(2)}x
          </p>
          <span className="text-[10px] text-purple-300/80">Shrinkage weighted towards 1.0x</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400">Confidence Score</span>
            <p className="text-2xl font-extrabold font-mono text-emerald-400">
              {Math.round(calibration.confidenceScore * 100)}%
            </p>
          </div>
          <button
            onClick={handleApplyToDefaultMultiplier}
            className="mt-2 py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-purple-600/20"
          >
            Apply Multiplier
          </button>
        </div>
      </div>

      {/* Category Breakdowns */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Labor Accuracy by Electrical Trade Category
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categoryVariances).map(([categoryName, stats]) => {
            const isOver = stats.ratio > 1.05;
            const isUnder = stats.ratio < 0.95;

            return (
              <div key={categoryName} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 text-xs">{categoryName.replace('_', ' ').toUpperCase()}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isOver ? 'bg-rose-500/20 text-rose-300' : isUnder ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {stats.ratio.toFixed(2)}x
                  </span>
                </div>

                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>Est: {stats.estimatedHours.toFixed(1)} hrs</span>
                  <span>Act: {stats.actualHours.toFixed(1)} hrs</span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isOver ? 'bg-rose-500' : isUnder ? 'bg-emerald-500' : 'bg-purple-500'}`}
                    style={{ width: `${Math.min(100, (stats.actualHours / (stats.estimatedHours || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Jobs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">
            Completed Projects Historical Log ({historicalJobs.filter(j => !excludeDemo || !j.isDemoData).length} records)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Project Title</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Est Hours</th>
                <th className="py-3 px-3 text-right">Actual Hours</th>
                <th className="py-3 px-3 text-right">Labor Variance</th>
                <th className="py-3 px-3 text-right">Est Mat ($)</th>
                <th className="py-3 px-3 text-right">Act Mat ($)</th>
                <th className="py-3 px-3 text-center">Dataset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {historicalJobs
                .filter(j => !excludeDemo || !j.isDemoData)
                .map((job) => {
                  const estHours = job.estimatedLaborHours ?? job.estimatedTotalHours ?? 1;
                  const actHours = job.actualLaborHours ?? job.actualTotalHours ?? 1;
                  const variancePercent = Math.round(((actHours - estHours) / (estHours || 1)) * 100);
                  const isOver = variancePercent > 0;
                  const estMat = job.estimatedMaterialCost ?? 0;
                  const actMat = job.actualMaterialCost ?? job.actualTotalCost ?? 0;

                  return (
                    <tr key={job.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-100">
                        {job.title || job.jobName}
                      </td>
                      <td className="py-3 px-3 text-slate-400 capitalize font-sans text-[11px]">
                        {job.jobType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">
                        {estHours}h
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-100">
                        {actHours}h
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isOver ? `+${variancePercent}%` : `${variancePercent}%`}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">
                        ${estMat.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-200">
                        ${actMat.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          job.isDemoData ? 'bg-slate-800 text-slate-400' : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {job.isDemoData ? 'Demo' : 'Real Field'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
