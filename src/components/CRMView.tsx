import React, { useState } from 'react';
import { Customer, PipelineStage, SiteVisit, JobBid } from '../types';
import { 
  PIPELINE_STAGE_LABELS, 
  PIPELINE_STAGE_COLORS, 
  validatePipelineTransition, 
  checkPossibleDuplicates 
} from '../utils/pipelineEngine';
import { SiteVisitModal } from './SiteVisitModal';
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';

interface CRMViewProps {
  customers: Customer[];
  bids: JobBid[];
  onSaveCustomer: (customer: Customer) => void;
  onCreateBidForCustomer: (customer: Customer) => void;
  onSaveSiteVisit: (visit: Partial<SiteVisit>) => void;
}

export const CRMView: React.FC<CRMViewProps> = ({
  customers,
  bids,
  onSaveCustomer,
  onCreateBidForCustomer,
  onSaveSiteVisit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [selectedCustomerForWalk, setSelectedCustomerForWalk] = useState<Customer | null>(null);

  // New Lead Form State
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newService, setNewService] = useState('');
  const [newUrgency, setNewUrgency] = useState<Customer['urgency']>('standard');
  const [newNotes, setNewNotes] = useState('');
  const [newSource, setNewSource] = useState<Customer['leadSource']>('referral');

  const duplicateMatches = checkPossibleDuplicates({
    name: newName,
    phone: newPhone,
    email: newEmail
  }, customers);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now().toString(36)}`,
      name: newName.trim(),
      companyName: newCompany.trim() || undefined,
      phone: newPhone.trim(),
      email: newEmail.trim(),
      billingAddress: newAddress.trim(),
      jobsiteAddress: newAddress.trim(),
      preferredContactMethod: 'phone',
      leadSource: newSource,
      serviceRequested: newService.trim() || 'General Electrical Estimate',
      urgency: newUrgency,
      initialNotes: newNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedEstimator: 'David Vance',
      pipelineStatus: 'NEW_LEAD',
      isDemoData: false
    };

    onSaveCustomer(newCust);
    setShowNewCustomerModal(false);
    // Reset form
    setNewName('');
    setNewCompany('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewService('');
    setNewNotes('');
  };

  const handleStageChange = (customer: Customer, nextStage: PipelineStage) => {
    const hasBid = bids.some(b => b.customerId === customer.id);
    const validation = validatePipelineTransition(customer.pipelineStatus, nextStage, {
      hasProposal: hasBid
    });

    if (!validation.isValid) {
      alert(`Pipeline Transition Warning:\n${validation.reason}`);
      return;
    }

    onSaveCustomer({
      ...customer,
      pipelineStatus: nextStage,
      updatedAt: new Date().toISOString()
    });
  };

  const filteredCustomers = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.serviceRequested && c.serviceRequested.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStage = stageFilter === 'all' || c.pipelineStatus === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Client Pipeline & Lead Management</h2>
          </div>
          <p className="text-xs text-slate-400">
            Track customer lifecycles from intake to site walks, estimating, contract delivery, and completion.
          </p>
        </div>

        <button
          onClick={() => setShowNewCustomerModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Capture New Lead
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads by customer name, phone, address, or service..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Stages ({customers.length})</option>
          {Object.entries(PIPELINE_STAGE_LABELS).map(([stageKey, stageLabel]) => (
            <option key={stageKey} value={stageKey}>{stageLabel}</option>
          ))}
        </select>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const stageStyle = PIPELINE_STAGE_COLORS[cust.pipelineStatus] || PIPELINE_STAGE_COLORS['NEW_LEAD'];
          const customerBid = bids.find(b => b.customerId === cust.id);

          return (
            <div
              key={cust.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between shadow-lg shadow-black/20"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{cust.name}</h3>
                    {cust.companyName && (
                      <p className="text-xs text-slate-400 font-medium">{cust.companyName}</p>
                    )}
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${stageStyle.badge}`}>
                    {PIPELINE_STAGE_LABELS[cust.pipelineStatus]}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{cust.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{cust.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{cust.jobsiteAddress || cust.billingAddress}</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">Service Scope:</span>
                  <p className="text-slate-200 line-clamp-2">{cust.serviceRequested}</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                {/* Stage Progression Dropdown */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">Advance Stage:</span>
                  <select
                    value={cust.pipelineStatus}
                    onChange={(e) => handleStageChange(cust, e.target.value as PipelineStage)}
                    className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(PIPELINE_STAGE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCustomerForWalk(cust)}
                    className="flex-1 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Site Walk
                  </button>

                  <button
                    onClick={() => onCreateBidForCustomer(cust)}
                    className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    {customerBid ? 'Open Bid' : 'Start Takeoff'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Lead Intake Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="font-bold text-slate-100 text-lg">Intake New Client / Jobsite Lead</h3>
              <button onClick={() => setShowNewCustomerModal(false)} className="text-slate-400 hover:text-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 text-xs">
              {duplicateMatches.length > 0 && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Fuzzy Duplicate Lead Warning:</span>
                    <span>Existing record found: <strong>{duplicateMatches[0].existingCustomer.name}</strong> ({duplicateMatches[0].existingCustomer.phone})</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Customer / Contact Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Hill House Property LLC"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. (508) 555-0144"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. eleanor@example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Jobsite / Billing Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. 100 Manor Lane, Worcester, MA 01609"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Lead Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="referral">Client Referral</option>
                    <option value="website">Company Website</option>
                    <option value="google_maps">Google Maps / Search</option>
                    <option value="repeat_client">Repeat Client</option>
                    <option value="subcontractor_request">General Contractor</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Project Urgency</label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="emergency_24h">Emergency (24h Service)</option>
                    <option value="high_priority">High Priority (1-3 Days)</option>
                    <option value="standard">Standard Estimating Timeline</option>
                    <option value="flexible">Flexible / Planning Phase</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Electrical Service Requested</label>
                <textarea
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="e.g. 200A Service upgrade, EV charger, kitchen remodel circuits..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow-lg"
                >
                  Save Lead Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Walk Modal */}
      {selectedCustomerForWalk && (
        <SiteVisitModal
          customer={selectedCustomerForWalk}
          onClose={() => setSelectedCustomerForWalk(null)}
          onSave={onSaveSiteVisit}
        />
      )}
    </div>
  );
};
