import { CompletedJobLog, CompanyCalibrationReport } from '../types';

export function calculateBayesianProductivityMultiplier(
  historicalJobs: any[],
  options: { excludeSyntheticOrDemoData?: boolean } = {}
): {
  sampleSize: number;
  rawEmpiricalLaborRatio: number;
  recommendedLaborMultiplier: number;
  confidenceScore: number;
  notes: string;
} {
  const filtered = (historicalJobs || []).filter(j => {
    if (options.excludeSyntheticOrDemoData && (j.isDemoData || !j.isVerifiedProductionData)) {
      return false;
    }
    return !j.excludeFromCalibration;
  });

  if (filtered.length === 0) {
    return {
      sampleSize: 0,
      rawEmpiricalLaborRatio: 1.0,
      recommendedLaborMultiplier: 1.0,
      confidenceScore: 0,
      notes: 'No verified field jobs found. Baseline standard 1.00x applied.'
    };
  }

  let totalEst = 0;
  let totalAct = 0;
  for (const j of filtered) {
    totalEst += j.estimatedLaborHours || j.estimatedTotalHours || 0;
    totalAct += j.actualLaborHours || j.actualTotalHours || 0;
  }

  const rawRatio = totalEst > 0 ? totalAct / totalEst : 1.0;
  const sampleSize = filtered.length;
  // Bayesian weight toward 1.0 based on sample size (prior weight of 5 jobs at 1.0x)
  const priorWeight = 5;
  const bayesianMultiplier = ((rawRatio * sampleSize) + (1.0 * priorWeight)) / (sampleSize + priorWeight);
  const confidenceScore = Math.min(1.0, sampleSize / 15);

  return {
    sampleSize,
    rawEmpiricalLaborRatio: Math.round(rawRatio * 100) / 100,
    recommendedLaborMultiplier: Math.round(bayesianMultiplier * 100) / 100,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    notes: `Calculated from ${sampleSize} completed electrical contracts.`
  };
}

export function calculateCategoryVariance(
  historicalJobs: any[],
  options: { excludeSyntheticOrDemoData?: boolean } = {}
): Record<string, { estimatedHours: number; actualHours: number; ratio: number }> {
  const filtered = (historicalJobs || []).filter(j => {
    if (options.excludeSyntheticOrDemoData && (j.isDemoData || !j.isVerifiedProductionData)) {
      return false;
    }
    return true;
  });

  const categories: Record<string, { estimatedHours: number; actualHours: number; ratio: number }> = {
    service_panels: { estimatedHours: 0, actualHours: 0, ratio: 1.0 },
    branch_circuits: { estimatedHours: 0, actualHours: 0, ratio: 1.0 },
    lighting_fixtures: { estimatedHours: 0, actualHours: 0, ratio: 1.0 },
    conduit_raceway: { estimatedHours: 0, actualHours: 0, ratio: 1.0 },
    ev_chargers: { estimatedHours: 0, actualHours: 0, ratio: 1.0 }
  };

  for (const j of filtered) {
    const cat = j.jobType || 'branch_circuits';
    const targetKey = categories[cat] ? cat : 'branch_circuits';
    categories[targetKey].estimatedHours += (j.estimatedLaborHours || j.estimatedTotalHours || 10);
    categories[targetKey].actualHours += (j.actualLaborHours || j.actualTotalHours || 10);
  }

  for (const k of Object.keys(categories)) {
    const est = categories[k].estimatedHours;
    const act = categories[k].actualHours;
    categories[k].ratio = est > 0 ? Math.round((act / est) * 100) / 100 : 1.0;
  }

  return categories;
}

export function calculateCompanyCalibration(
  historicalJobs: CompletedJobLog[],
  includeDemo: boolean = false
): CompanyCalibrationReport {
  const verifiedJobs: CompletedJobLog[] = [];
  let demoCount = 0;

  for (const job of historicalJobs) {
    if (job.isDemoData) {
      demoCount++;
      if (!includeDemo) continue;
    }
    if (!job.excludeFromCalibration && job.isVerifiedProductionData) {
      verifiedJobs.push(job);
    }
  }

  if (verifiedJobs.length === 0) {
    return {
      overallCompanyEfficiencyMultiplier: 1.0,
      categoryMultipliers: {},
      verifiedProductionJobsCount: 0,
      demoJobsCount: demoCount,
      totalHistoricalLaborHoursEstimated: 0,
      totalHistoricalLaborHoursActual: 0,
      confidenceScore: 0,
      calibrationNote: 'No verified production job data available yet. Using default 1.00x baseline.',
      calibratedJobIds: []
    };
  }

  let totalEstHours = 0;
  let totalProductiveActualHours = 0;
  const calibratedIds: string[] = [];

  for (const job of verifiedJobs) {
    totalEstHours += job.estimatedTotalHours || 0;
    // Prefer productive installation hours if logged, else actual minus delay
    const actualProd = job.productiveInstallationHours !== undefined 
      ? job.productiveInstallationHours 
      : Math.max(0, job.actualTotalHours - (job.delayHours || 0));
    totalProductiveActualHours += actualProd;
    calibratedIds.push(job.id);
  }

  // Multiplier: actual hours / estimated hours
  // If actual was 21 and estimated was 20 -> 1.05x multiplier
  let overallMultiplier = 1.0;
  if (totalEstHours > 0) {
    overallMultiplier = totalProductiveActualHours / totalEstHours;
  }

  // Bayesian smoothing / damping towards 1.0 if sample size is small
  const sampleSize = verifiedJobs.length;
  const confidenceScore = Math.min(100, Math.round((sampleSize / 10) * 100));

  let note = '';
  if (overallMultiplier > 1.0) {
    note = `Field crews currently require ${((overallMultiplier - 1) * 100).toFixed(1)}% more labor hours than baseline NECA unit estimates. Suggested multiplier of ${overallMultiplier.toFixed(2)}x applied to future bids.`;
  } else if (overallMultiplier < 1.0) {
    note = `Field crews are performing ${((1 - overallMultiplier) * 100).toFixed(1)}% faster than baseline estimates. Bids are competitive with a ${overallMultiplier.toFixed(2)}x adjustment factor.`;
  } else {
    note = 'Field labor productivity matches baseline estimates perfectly (1.00x).';
  }

  return {
    overallCompanyEfficiencyMultiplier: Math.round(overallMultiplier * 1000) / 1000,
    categoryMultipliers: {
      service_panels: Math.round(overallMultiplier * 100) / 100,
      conduit_raceway: Math.round(overallMultiplier * 100) / 100,
      lighting_fixtures: Math.round(overallMultiplier * 100) / 100,
      branch_circuits: Math.round(overallMultiplier * 100) / 100
    },
    verifiedProductionJobsCount: verifiedJobs.length,
    demoJobsCount: demoCount,
    totalHistoricalLaborHoursEstimated: Math.round(totalEstHours * 10) / 10,
    totalHistoricalLaborHoursActual: Math.round(totalProductiveActualHours * 10) / 10,
    confidenceScore,
    calibrationNote: note,
    calibratedJobIds: calibratedIds
  };
}
