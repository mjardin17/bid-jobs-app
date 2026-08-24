import React, { useState } from 'react';
import { Customer, SiteVisit, DifficultyFactors } from '../types';
import { X, Calendar, MapPin, User, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SiteVisitModalProps {
  customer: Customer;
  onClose: () => void;
  onSave: (visit: Partial<SiteVisit>) => void;
}

export const SiteVisitModal: React.FC<SiteVisitModalProps> = ({ customer, onClose, onSave }) => {
  const [scheduledDateTime, setScheduledDateTime] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [estimator, setEstimator] = useState(customer.assignedEstimator || 'David Vance');
  const [jobsiteAddress, setJobsiteAddress] = useState(customer.jobsiteAddress || customer.billingAddress || '');
  const [existingConditions, setExistingConditions] = useState('');
  const [panelObservations, setPanelObservations] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [accessLimitations, setAccessLimitations] = useState('');
  const [scopeNotes, setScopeNotes] = useState('');
  const [recommendedNextAction, setRecommendedNextAction] = useState('Prepare formal takeoff and estimate');
  const [workingHeight, setWorkingHeight] = useState<DifficultyFactors['workingHeight']>('under_10ft');
  const [environmentType, setEnvironmentType] = useState<DifficultyFactors['environmentType']>('occupied_remodel');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      customerId: customer.id,
      scheduledDateTime,
      estimator,
      jobsiteAddress,
      existingConditions,
      panelServiceObservations: panelObservations,
      measurements,
      accessLimitations,
      scopeNotes,
      recommendedNextAction,
      status: 'scheduled',
      workConditionFactors: {
        workingHeight,
        environmentType
      },
      attachments: [],
      necDisclosure: 'Field site observation only — does not constitute AHJ code declaration.'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Schedule Site Walk & Observation</h3>
              <p className="text-xs text-slate-400">Customer: {customer.name} ({customer.phone})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date & Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Estimator</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={estimator}
                  onChange={(e) => setEstimator(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Jobsite Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={jobsiteAddress}
                onChange={(e) => setJobsiteAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Working Height Observed</label>
              <select
                value={workingHeight}
                onChange={(e) => setWorkingHeight(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="under_10ft">Under 10 ft (Standard step ladder)</option>
                <option value="10_to_14ft">10 to 14 ft (+10% NECA labor)</option>
                <option value="15_to_20ft">15 to 20 ft (+20% NECA labor)</option>
                <option value="over_20ft_scaffold_lift">Over 20 ft (Scaffold/Boom Lift +35%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Environment Condition</label>
              <select
                value={environmentType}
                onChange={(e) => setEnvironmentType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="new_open_construction">New Open Framing Construction</option>
                <option value="occupied_remodel">Occupied Remodel (+15% labor)</option>
                <option value="confined_space_attic_crawl">Confined Attic / Crawlspace (+25%)</option>
                <option value="hazardous_classified">Hazardous Classified Location (+35%)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Existing Panel & Service Observations</label>
            <textarea
              value={panelObservations}
              onChange={(e) => setPanelObservations(e.target.value)}
              placeholder="e.g. Existing 100A Pushmatic panel, double-tapped breakers, underground feeder conduit condition..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Measurements & Feeder Lengths</label>
            <input
              type="text"
              value={measurements}
              onChange={(e) => setMeasurements(e.target.value)}
              placeholder="e.g. 45 ft run from meter to garage subpanel; 12 ft ceiling height"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Scope Notes & Customer Priorities</label>
            <textarea
              value={scopeNotes}
              onChange={(e) => setScopeNotes(e.target.value)}
              placeholder="Key items discussed on-site with owner..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl flex items-start gap-3 text-xs text-amber-300/90">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>NEC Disclosure:</strong> Site walk observations document field conditions for estimating accuracy. All sizing and overcurrent configurations remain subject to official permit submission and local AHJ inspection.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Site Walk Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
