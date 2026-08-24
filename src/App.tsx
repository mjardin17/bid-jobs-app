import React, { useState, useEffect } from 'react';
import { 
  Customer, 
  JobBid, 
  ProposalVersion, 
  ChangeOrder, 
  Invoice, 
  SiteVisit, 
  HistoricalJobRecord, 
  ContractorCompanyProfile, 
  AttachedCalculation 
} from './types';
import { MOCK_HISTORICAL_JOBS } from './data/mockHistoricalData';
import { createProposalVersion } from './utils/proposalEngine';
import { Navigation, ActiveNavTab } from './components/Navigation';
import { CRMView } from './components/CRMView';
import { BidBuilderView } from './components/BidBuilderView';
import { EngineeringCalculatorsView } from './components/EngineeringCalculatorsView';
import { ProposalsView } from './components/ProposalsView';
import { ChangeOrdersView } from './components/ChangeOrdersView';
import { InvoicingView } from './components/InvoicingView';
import { CalibrationView } from './components/CalibrationView';
import { CompanyProfileView } from './components/CompanyProfileView';
import { Loader2 } from 'lucide-react';

const INITIAL_COMPANY_PROFILE: ContractorCompanyProfile = {
  legalBusinessName: 'Vance & Sons Electrical Contracting LLC',
  dbaName: 'Vance Electric & Energy Systems',
  licenseNumber: 'MA-EL-94821-M',
  licenseType: 'Master Electrician Class A',
  issuingAuthorityState: 'Massachusetts BBRS',
  address: '420 Commercial Blvd, Suite 2B, Worcester, MA 01609',
  phone: '(508) 555-0199',
  email: 'estimating@vanceelectric.com',
  website: 'https://vanceelectric.com',
  authorizedLicensedWorkReviewer: 'David Vance, Master Electrician #94821-M',
  authorizedProposalApprover: 'David Vance',
  generalLiabilityPolicyLimit: '$2,000,000 Aggregate / $1,000,000 Occurrence',
  defaultPaymentSchedule: {
    depositPercent: 30,
    roughInPercent: 40,
    finalPercent: 30
  },
  defaultTermsAndConditions: `1. Acceptance of Proposal: The specifications and prices stated herein are satisfactory and are hereby accepted. Contractor is authorized to execute the work as specified.
2. Payment Terms: Invoices are due upon receipt according to milestone schedule. Payments past 30 days are subject to 1.5% monthly finance charge.
3. Electrical Permits & Inspections: All work shall be performed in accordance with the National Electrical Code (NEC 2023) and local AHJ amendments.
4. Concealed Conditions: Quote covers visible conditions only. Unforeseen concealed knob & tube, aluminum branch wiring, or framing obstructions will be billed via written Change Order.
5. Workmanship Warranty: Contractor guarantees all labor and installation for twelve (12) months from final AHJ electrical inspection.`
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('crm');
  const [loading, setLoading] = useState(true);

  // Core Data Stores
  const [companyProfile, setCompanyProfile] = useState<ContractorCompanyProfile>(INITIAL_COMPANY_PROFILE);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bids, setBids] = useState<JobBid[]>([]);
  const [proposals, setProposals] = useState<ProposalVersion[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [historicalJobs, setHistoricalJobs] = useState<HistoricalJobRecord[]>(MOCK_HISTORICAL_JOBS);

  // Active Selected Bid for Takeoff
  const [selectedBidId, setSelectedBidId] = useState<string>('');

  // Initial Fetch from REST API Backend
  const loadAllData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data.customers) setCustomers(data.customers);
        if (data.bids) {
          setBids(data.bids);
          if (data.bids.length > 0 && !selectedBidId) {
            setSelectedBidId(data.bids[0].id);
          }
        }
        if (data.proposals) setProposals(data.proposals);
        if (data.changeOrders) setChangeOrders(data.changeOrders);
        if (data.invoices) setInvoices(data.invoices);
        if (data.siteVisits) setSiteVisits(data.siteVisits);
        if (data.companyProfile) setCompanyProfile(data.companyProfile);
      }
    } catch (err) {
      console.warn('API data fetch failed, fallback to local state', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Save Entity Handlers (sync to server)
  const saveCustomer = async (cust: Customer) => {
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.id === cust.id);
      return idx >= 0 ? prev.map(c => c.id === cust.id ? cust : c) : [cust, ...prev];
    });
    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cust)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveBid = async (bid: JobBid) => {
    setBids(prev => {
      const idx = prev.findIndex(b => b.id === bid.id);
      return idx >= 0 ? prev.map(b => b.id === bid.id ? bid : b) : [bid, ...prev];
    });
    try {
      await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bid)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveProposal = async (proposal: ProposalVersion) => {
    setProposals(prev => {
      const idx = prev.findIndex(p => p.id === proposal.id);
      return idx >= 0 ? prev.map(p => p.id === proposal.id ? proposal : p) : [proposal, ...prev];
    });
    try {
      await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposal)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveChangeOrder = async (co: ChangeOrder) => {
    setChangeOrders(prev => {
      const idx = prev.findIndex(c => c.id === co.id);
      return idx >= 0 ? prev.map(c => c.id === co.id ? co : c) : [co, ...prev];
    });
    try {
      await fetch('/api/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(co)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveInvoice = async (inv: Invoice) => {
    setInvoices(prev => {
      const idx = prev.findIndex(i => i.id === inv.id);
      return idx >= 0 ? prev.map(i => i.id === inv.id ? inv : i) : [inv, ...prev];
    });
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inv)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveSiteVisit = async (visit: Partial<SiteVisit>) => {
    const newVisit: SiteVisit = {
      id: `visit-${Date.now().toString(36)}`,
      customerId: visit.customerId || '',
      scheduledDateTime: visit.scheduledDateTime || new Date().toISOString(),
      estimator: visit.estimator || companyProfile.authorizedProposalApprover || 'David Vance',
      jobsiteAddress: visit.jobsiteAddress || '',
      existingConditions: visit.existingConditions || '',
      panelServiceObservations: visit.panelServiceObservations || '',
      measurements: visit.measurements || '',
      accessLimitations: visit.accessLimitations || '',
      scopeNotes: visit.scopeNotes || '',
      recommendedNextAction: visit.recommendedNextAction || '',
      status: visit.status || 'scheduled',
      workConditionFactors: visit.workConditionFactors || { workingHeight: 'under_10ft', environmentType: 'occupied_remodel' },
      attachments: visit.attachments || [],
      necDisclosure: visit.necDisclosure || '',
      createdAt: new Date().toISOString()
    };

    setSiteVisits(prev => [newVisit, ...prev]);
    try {
      await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVisit)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveCompanyProfile = async (profile: ContractorCompanyProfile) => {
    setCompanyProfile(profile);
    try {
      await fetch('/api/company-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Action: Create Bid for Customer
  const handleCreateBidForCustomer = (cust: Customer) => {
    const existing = bids.find(b => b.customerId === cust.id);
    if (existing) {
      setSelectedBidId(existing.id);
      setActiveTab('takeoff');
      return;
    }

    const newBid: JobBid = {
      id: `bid-${Date.now().toString(36)}`,
      bidNumber: `EST-2026-${(bids.length + 101).toString()}`,
      customerId: cust.id,
      title: `${cust.serviceRequested || 'Electrical Installation'}`,
      jobType: 'residential',
      jobAddress: cust.jobsiteAddress || cust.billingAddress || '',
      clientName: cust.name,
      clientEmail: cust.email,
      clientPhone: cust.phone,
      scopeOfWork: cust.serviceRequested || 'Provide electrical estimate per site walkthrough.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      lineItems: [
        {
          id: `li-init-${Date.now().toString(36)}`,
          category: 'service_panels',
          description: '200A 40-Space Main Breaker Panel & Whole-Home SPD',
          quantity: 1,
          unit: 'each',
          baseLaborHoursPerUnit: 8.5,
          materialCostPerUnit: 650.0,
          wastePercent: 5,
          totalLaborHours: 8.5,
          totalMaterialCost: 650.0
        }
      ],
      difficulty: {
        workingHeight: 'under_10ft',
        environmentType: 'occupied_remodel',
        ambientTemp: 'moderate_standard',
        overtimeSchedule: 'standard_40h',
        distanceLogistics: 'ground_adjacent',
        necaBaseLevel: 'level_1'
      },
      crew: {
        masterCount: 1,
        masterHourlyWage: 65,
        journeymanCount: 1,
        journeymanHourlyWage: 48,
        apprenticeCount: 0,
        apprenticeHourlyWage: 28,
        helperCount: 0,
        helperHourlyWage: 20,
        laborBurdenPercent: 28
      },
      overheadPercent: 15,
      profitMarginPercent: 20,
      contingencyPercent: 5,
      permitCost: 175,
      taxRatePercent: 6.25,
      customerRequestedOptions: [
        {
          id: `opt-ev-${Date.now().toString(36)}`,
          title: 'Add Level 2 48A Hardwired EV Charger Station',
          description: 'Includes 60A 240V dedicated feeder, disconnect, and smart charger mounting',
          priceImpact: 1450.0,
          laborHours: 4.5
        }
      ]
    };

    saveBid(newBid);
    setSelectedBidId(newBid.id);
    setActiveTab('takeoff');
  };

  // Create New Standalone Bid
  const handleCreateNewBid = () => {
    const newCust: Customer = {
      id: `cust-${Date.now().toString(36)}`,
      name: 'New Client',
      phone: '(555) 000-0000',
      email: 'client@example.com',
      billingAddress: '100 Main St',
      jobsiteAddress: '100 Main St',
      preferredContactMethod: 'phone',
      serviceRequested: 'Residential Electrical Upgrade',
      urgency: 'standard',
      leadSource: 'referral',
      initialNotes: 'Direct lead inquiry',
      assignedEstimator: 'David Vance',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pipelineStatus: 'NEW_LEAD'
    };
    saveCustomer(newCust);
    handleCreateBidForCustomer(newCust);
  };

  // Generate Proposal Version from Bid
  const handleCreateProposalFromBid = (bid: JobBid) => {
    const existingProps = proposals.filter(p => p.bidId === bid.id);
    const parentProp = existingProps.find(p => p.status !== 'SUPERSEDED');

    const { newVersion, updatedParent } = createProposalVersion(
      bid,
      companyProfile,
      parentProp,
      parentProp ? 'Updated proposal based on latest takeoff adjustments' : 'Initial proposal release'
    );

    if (updatedParent) {
      saveProposal(updatedParent);
    }
    saveProposal(newVersion);
    setActiveTab('proposals');
  };

  // Attach Engineering Calculation to Bid
  const handleAttachCalculationToBid = (bidId: string, calc: AttachedCalculation) => {
    const bid = bids.find(b => b.id === bidId);
    if (!bid) return;

    const existingCalcs = bid.attachedCalculations || [];
    const updatedBid: JobBid = {
      ...bid,
      attachedCalculations: [...existingCalcs, calc]
    };
    saveBid(updatedBid);
  };

  const handleResetData = async () => {
    if (confirm('Reset database to clean demo state?')) {
      try {
        await fetch('/api/reset', { method: 'POST' });
        await loadAllData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const selectedBid = bids.find(b => b.id === selectedBidId) || bids[0] || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium">Loading VoltEstimate Database & NEC Engines...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        companyProfile={companyProfile}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'crm' && (
          <CRMView
            customers={customers}
            bids={bids}
            onSaveCustomer={saveCustomer}
            onCreateBidForCustomer={handleCreateBidForCustomer}
            onSaveSiteVisit={saveSiteVisit}
          />
        )}

        {activeTab === 'takeoff' && (
          <BidBuilderView
            bids={bids}
            selectedBid={selectedBid}
            companyProfile={companyProfile}
            onSelectBid={(bid) => setSelectedBidId(bid.id)}
            onSaveBid={saveBid}
            onCreateProposalFromBid={handleCreateProposalFromBid}
            onCreateNewBid={handleCreateNewBid}
          />
        )}

        {activeTab === 'engineering' && (
          <EngineeringCalculatorsView
            bids={bids}
            onAttachCalculationToBid={handleAttachCalculationToBid}
          />
        )}

        {activeTab === 'proposals' && (
          <ProposalsView
            proposals={proposals}
            bids={bids}
            companyProfile={companyProfile}
            onSaveProposal={saveProposal}
            onSelectBidForProposal={(bidId) => {
              setSelectedBidId(bidId);
              setActiveTab('takeoff');
            }}
          />
        )}

        {activeTab === 'change_orders' && (
          <ChangeOrdersView
            changeOrders={changeOrders}
            bids={bids}
            proposals={proposals}
            onSaveChangeOrder={saveChangeOrder}
          />
        )}

        {activeTab === 'invoicing' && (
          <InvoicingView
            invoices={invoices}
            bids={bids}
            proposals={proposals}
            changeOrders={changeOrders}
            companyProfile={companyProfile}
            onSaveInvoice={saveInvoice}
          />
        )}

        {activeTab === 'calibration' && (
          <CalibrationView
            historicalJobs={historicalJobs}
            companyProfile={companyProfile}
            onUpdateCompanyProfile={saveCompanyProfile}
          />
        )}

        {activeTab === 'settings' && (
          <CompanyProfileView
            companyProfile={companyProfile}
            onSaveProfile={saveCompanyProfile}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 py-6 text-center text-xs text-slate-500 font-mono">
        <p>VoltEstimate & Contractor Bid AI • NEC 2023 Reference Engine • Vance & Sons Electrical Contracting</p>
      </footer>
    </div>
  );
};

export default App;
