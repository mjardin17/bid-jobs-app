import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { 
  INITIAL_COMPANY_PROFILE, 
  INITIAL_CUSTOMERS, 
  INITIAL_BIDS, 
  INITIAL_COMPLETED_JOBS, 
  INITIAL_INVOICES, 
  INITIAL_PAYMENTS 
} from './src/data/mockHistoricalData';
import { 
  JobBid, 
  Customer, 
  CompletedJobLog, 
  ContractorCompanyProfile, 
  ProposalVersion, 
  Invoice, 
  PaymentRecord, 
  ChangeOrder,
  SiteVisit 
} from './src/types';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Persistent JSON Database path
const DATA_DIR = path.join(process.cwd(), 'data_store');
const DB_FILE = path.join(DATA_DIR, 'contractor_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  companyProfile: ContractorCompanyProfile;
  customers: Customer[];
  bids: JobBid[];
  proposals: ProposalVersion[];
  changeOrders: ChangeOrder[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  completedJobs: CompletedJobLog[];
  siteVisits: SiteVisit[];
}

function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return {
        companyProfile: data.companyProfile || INITIAL_COMPANY_PROFILE,
        customers: Array.isArray(data.customers) ? data.customers : INITIAL_CUSTOMERS,
        bids: Array.isArray(data.bids) ? data.bids : INITIAL_BIDS,
        proposals: Array.isArray(data.proposals) ? data.proposals : [],
        changeOrders: Array.isArray(data.changeOrders) ? data.changeOrders : [],
        invoices: Array.isArray(data.invoices) ? data.invoices : INITIAL_INVOICES,
        payments: Array.isArray(data.payments) ? data.payments : INITIAL_PAYMENTS,
        completedJobs: Array.isArray(data.completedJobs) ? data.completedJobs : INITIAL_COMPLETED_JOBS,
        siteVisits: Array.isArray(data.siteVisits) ? data.siteVisits : []
      };
    } catch (e) {
      console.error('Error reading database file, using fallback initial data:', e);
    }
  }

  const initialData: DatabaseSchema = {
    companyProfile: INITIAL_COMPANY_PROFILE,
    customers: INITIAL_CUSTOMERS,
    bids: INITIAL_BIDS,
    proposals: [],
    changeOrders: [],
    invoices: INITIAL_INVOICES,
    payments: INITIAL_PAYMENTS,
    completedJobs: INITIAL_COMPLETED_JOBS,
    siteVisits: []
  };
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

// Lazy Gemini API client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// Company Profile
app.get('/api/company-profile', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.companyProfile);
});

app.put('/api/company-profile', (req: Request, res: Response) => {
  const db = loadDatabase();
  db.companyProfile = { ...db.companyProfile, ...req.body, lastUpdated: new Date().toISOString() };
  saveDatabase(db);
  res.json(db.companyProfile);
});

// Customers CRM
app.get('/api/customers', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.customers);
});

app.post('/api/customers', (req: Request, res: Response) => {
  const db = loadDatabase();
  const newCustomer: Customer = {
    id: `cust-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pipelineStatus: 'NEW_LEAD',
    ...req.body
  };
  db.customers.unshift(newCustomer);
  saveDatabase(db);
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req: Request, res: Response) => {
  const db = loadDatabase();
  const idx = db.customers.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  db.customers[idx] = { ...db.customers[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  res.json(db.customers[idx]);
});

app.delete('/api/customers/:id', (req: Request, res: Response) => {
  const db = loadDatabase();
  db.customers = db.customers.filter(c => c.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// Bids
app.get('/api/bids', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.bids);
});

app.get('/api/bids/:id', (req: Request, res: Response) => {
  const db = loadDatabase();
  const bid = db.bids.find(b => b.id === req.params.id);
  if (!bid) return res.status(404).json({ error: 'Bid not found' });
  res.json(bid);
});

app.post('/api/bids', (req: Request, res: Response) => {
  const db = loadDatabase();
  const newBid: JobBid = {
    id: `bid-${Date.now().toString(36)}`,
    bidNumber: `BID-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    lineItems: [],
    ...req.body
  };
  db.bids.unshift(newBid);
  saveDatabase(db);
  res.status(201).json(newBid);
});

app.put('/api/bids/:id', (req: Request, res: Response) => {
  const db = loadDatabase();
  const idx = db.bids.findIndex(b => b.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Bid not found' });
  }
  db.bids[idx] = { ...db.bids[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  res.json(db.bids[idx]);
});

app.delete('/api/bids/:id', (req: Request, res: Response) => {
  const db = loadDatabase();
  db.bids = db.bids.filter(b => b.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true });
});

// Proposals
app.get('/api/proposals', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.proposals);
});

app.post('/api/proposals', (req: Request, res: Response) => {
  const db = loadDatabase();
  const newProposal: ProposalVersion = req.body;
  // Replace or add
  const idx = db.proposals.findIndex(p => p.id === newProposal.id);
  if (idx >= 0) {
    db.proposals[idx] = newProposal;
  } else {
    db.proposals.unshift(newProposal);
  }
  saveDatabase(db);
  res.status(201).json(newProposal);
});

app.put('/api/proposals/:id', (req: Request, res: Response) => {
  const db = loadDatabase();
  const idx = db.proposals.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    db.proposals.unshift(req.body);
    saveDatabase(db);
    return res.json(req.body);
  }
  db.proposals[idx] = { ...db.proposals[idx], ...req.body };
  saveDatabase(db);
  res.json(db.proposals[idx]);
});

// Change Orders
app.get('/api/change-orders', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.changeOrders);
});

app.post('/api/change-orders', (req: Request, res: Response) => {
  const db = loadDatabase();
  const newCO: ChangeOrder = req.body;
  const idx = db.changeOrders.findIndex(c => c.id === newCO.id);
  if (idx >= 0) {
    db.changeOrders[idx] = newCO;
  } else {
    db.changeOrders.unshift(newCO);
  }
  saveDatabase(db);
  res.status(201).json(newCO);
});

app.put('/api/change-orders/:id', (req: Request, res: Response) => {
  const db = loadDatabase();
  const idx = db.changeOrders.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Change order not found' });
  db.changeOrders[idx] = { ...db.changeOrders[idx], ...req.body };
  saveDatabase(db);
  res.json(db.changeOrders[idx]);
});

// Invoices & Payments
app.get('/api/invoices', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.invoices);
});

app.post('/api/invoices', (req: Request, res: Response) => {
  const db = loadDatabase();
  const newInv: Invoice = req.body;
  const idx = db.invoices.findIndex(i => i.id === newInv.id);
  if (idx >= 0) db.invoices[idx] = newInv;
  else db.invoices.unshift(newInv);
  saveDatabase(db);
  res.status(201).json(newInv);
});

app.put('/api/invoices/:id', (req: Request, res: Response) => {
  const db = loadDatabase();
  const idx = db.invoices.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Invoice not found' });
  db.invoices[idx] = { ...db.invoices[idx], ...req.body };
  saveDatabase(db);
  res.json(db.invoices[idx]);
});

app.get('/api/payments', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.payments);
});

app.post('/api/payments', (req: Request, res: Response) => {
  const db = loadDatabase();
  const pmt: PaymentRecord = req.body;
  db.payments.unshift(pmt);
  saveDatabase(db);
  res.status(201).json(pmt);
});

// Completed Jobs / Calibration Logs
app.get('/api/completed-jobs', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.completedJobs);
});

app.post('/api/completed-jobs', (req: Request, res: Response) => {
  const db = loadDatabase();
  const newJob: CompletedJobLog = {
    id: `job-${Date.now().toString(36)}`,
    ...req.body
  };
  db.completedJobs.unshift(newJob);
  saveDatabase(db);
  res.status(201).json(newJob);
});

// Site Visits
app.get('/api/site-visits', (req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.siteVisits);
});

app.post('/api/site-visits', (req: Request, res: Response) => {
  const db = loadDatabase();
  const visit: SiteVisit = {
    id: `sv-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    attachments: [],
    necDisclosure: 'Field site observation only — does not constitute AHJ code declaration.',
    ...req.body
  };
  db.siteVisits.unshift(visit);
  saveDatabase(db);
  res.status(201).json(visit);
});

// AI Takeoff Assistant (Server-Side Gemini API Proxy)
app.post('/api/ai/takeoff', async (req: Request, res: Response) => {
  const { prompt, jobType, existingScope } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured in server environment.',
      suggestedAssemblies: []
    });
  }

  try {
    const systemPrompt = `You are a master electrical estimator and NEC code consultant.
The user provides a description of an electrical project or renovation scope.
Analyze the scope and extract recommended electrical takeoff line items and relevant NEC considerations.
Return a structured JSON response matching this schema:
{
  "projectSummary": "string",
  "difficultyAssessment": {
    "workingHeight": "under_10ft" | "10_to_14ft" | "15_to_20ft" | "over_20ft_scaffold_lift",
    "environmentType": "new_open_construction" | "occupied_remodel" | "hazardous_classified" | "confined_space_attic_crawl",
    "ambientTemp": "moderate_standard" | "extreme_heat_above_100" | "extreme_cold_sub_freezing",
    "overtimeSchedule": "standard_40h",
    "distanceLogistics": "ground_adjacent" | "remote_high_rise_long_carry",
    "necaBaseLevel": "level_1" | "level_2" | "level_3"
  },
  "recommendedItems": [
    {
      "category": "service_panels" | "branch_circuits" | "lighting_fixtures" | "devices_receptacles" | "conduit_raceway" | "feeders_wire" | "ev_chargers_solar" | "hvac_disconnects",
      "description": "string",
      "quantity": number,
      "unit": "each" | "ft" | "lot" | "set",
      "estimatedLaborHoursPerUnit": number,
      "estimatedMaterialCostPerUnit": number,
      "notes": "string"
    }
  ],
  "necNotes": ["string"],
  "permitAndUtilityConsiderations": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Job Type: ${jobType || 'residential'}\nExisting Scope: ${existingScope || 'None'}\nProject Description: ${prompt}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err: any) {
    console.error('Gemini Takeoff Error:', err);
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
});

// Production vs Vite Development integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Vite Dev Server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ VoltEstimate Contractor Server running on port ${PORT}`);
  });
}

startServer();
