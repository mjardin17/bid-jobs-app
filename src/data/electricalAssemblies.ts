import { ElectricalCategory } from '../types';

export interface PrebuiltAssembly {
  id: string;
  category: ElectricalCategory;
  name: string;
  unit: 'each' | 'ft' | 'lot' | 'hr' | 'set' | 'box';
  baseLaborHours: number;
  materialCost: number;
  wastePercent: number;
  description: string;
  necaStandardRef: string;
  tags: string[];
}

export const PREBUILT_ELECTRICAL_ASSEMBLIES: PrebuiltAssembly[] = [
  // Service Panels & Distribution
  {
    id: 'asmb-sp-200a-mb',
    category: 'service_panels',
    name: '200A Main Breaker Panelboard (40/80 Space)',
    unit: 'each',
    baseLaborHours: 7.5,
    materialCost: 485.00,
    wastePercent: 0,
    description: 'Indoor NEMA 1 200A 120/240V loadcenter with main breaker, ground/neutral bars, and surface mount cover.',
    necaStandardRef: 'NECA 100-2016 Table 2.1 (Panelboards up to 225A)',
    tags: ['panel', '200A', 'service', 'residential', 'commercial']
  },
  {
    id: 'asmb-sp-100a-sub',
    category: 'service_panels',
    name: '100A Subpanel (24 Space)',
    unit: 'each',
    baseLaborHours: 4.5,
    materialCost: 240.00,
    wastePercent: 0,
    description: 'Main lug loadcenter with isolated ground bar kit for sub-distribution.',
    necaStandardRef: 'NECA 100-2016 Table 2.1 (Subpanels up to 125A)',
    tags: ['subpanel', '100A', 'distribution']
  },
  {
    id: 'asmb-sp-meter-socket',
    category: 'service_panels',
    name: '200A Meter Socket Base (Ringless Overhead/Underground)',
    unit: 'each',
    baseLaborHours: 3.5,
    materialCost: 210.00,
    wastePercent: 0,
    description: 'Utility approved 4-jaw 200A continuous meter socket with 5th terminal kit and hub.',
    necaStandardRef: 'NECA 100-2016 Table 2.4 (Meter Sockets)',
    tags: ['meter', 'utility', 'service']
  },
  {
    id: 'asmb-sp-ground-rods',
    category: 'service_panels',
    name: 'Dual 5/8" x 8ft Copper Ground Rod System (NEC 250.53)',
    unit: 'set',
    baseLaborHours: 2.5,
    materialCost: 115.00,
    wastePercent: 5,
    description: 'Two 5/8" x 8ft copper-clad ground rods spaced 6ft apart with direct-burial acorn clamps and #6 AWG bare copper ground wire.',
    necaStandardRef: 'NECA 100-2016 Table 2.6 (Grounding Electrodes)',
    tags: ['grounding', 'rods', 'bonding', 'nec-250']
  },

  // Conduit & Raceway
  {
    id: 'asmb-cond-emt-34',
    category: 'conduit_raceway',
    name: '3/4" EMT Conduit Run (per 100 ft)',
    unit: 'ft',
    baseLaborHours: 0.055, // 5.5 hours per 100 ft
    materialCost: 1.65,
    wastePercent: 8,
    description: '3/4" Electrical Metallic Tubing including steel setscrew couplings, connectors, and 1-hole straps every 8ft.',
    necaStandardRef: 'NECA 101-2015 Table 4.2 (EMT 1/2" - 1")',
    tags: ['conduit', 'emt', 'raceway', 'commercial']
  },
  {
    id: 'asmb-cond-pvc-2in',
    category: 'conduit_raceway',
    name: '2" PVC Schedule 40 Underground Trench Raceway',
    unit: 'ft',
    baseLaborHours: 0.045,
    materialCost: 2.85,
    wastePercent: 5,
    description: '2" Schedule 40 rigid PVC conduit with bell ends, solvent cement, and pull string (excludes trenching excavation).',
    necaStandardRef: 'NECA 101-2015 Table 4.6 (Underground PVC)',
    tags: ['pvc', 'underground', 'feeder']
  },
  {
    id: 'asmb-cond-flex-mc',
    category: 'conduit_raceway',
    name: '12/2 MC Aluminum Armored Cable Run',
    unit: 'ft',
    baseLaborHours: 0.022, // 2.2 hrs per 100ft
    materialCost: 0.88,
    wastePercent: 6,
    description: '12 AWG 2-conductor with ground THHN aluminum armored metal clad cable including snap-in MC connectors and supports.',
    necaStandardRef: 'NECA 120-2018 Table 3.1 (MC Cable)',
    tags: ['mc', 'cable', 'commercial', 'branch']
  },

  // Feeders & Wire
  {
    id: 'asmb-wire-40-ser',
    category: 'feeders_wire',
    name: '4/0-4/0-4/0-2/0 Aluminum SER Service Cable',
    unit: 'ft',
    baseLaborHours: 0.048,
    materialCost: 4.25,
    wastePercent: 5,
    description: 'Aluminum Service Entrance Style R cable for 200A residential feeder/service with cable clamps.',
    necaStandardRef: 'NECA 100-2016 Table 3.2 (SE Cable)',
    tags: ['wire', 'ser', 'feeder', '200A']
  },
  {
    id: 'asmb-wire-thhn-10',
    category: 'feeders_wire',
    name: '#10 AWG THHN Stranded Copper Wire (per 100 ft)',
    unit: 'ft',
    baseLaborHours: 0.015,
    materialCost: 0.45,
    wastePercent: 5,
    description: '600V 90°C THHN/THWN-2 copper conductor wire pull.',
    necaStandardRef: 'NECA 100-2016 Table 3.1 (Conductor Pulling)',
    tags: ['wire', 'thhn', 'copper', '30A']
  },

  // Branch Circuits & Romex
  {
    id: 'asmb-bc-nm12-2',
    category: 'branch_circuits',
    name: '12/2 NM-B Romex Residential Branch Circuit (Avg 50 ft)',
    unit: 'lot',
    baseLaborHours: 1.75,
    materialCost: 58.00,
    wastePercent: 8,
    description: '12/2 with ground copper NM-B cable pulled through wood studs, stapled per NEC 334, including rough box.',
    necaStandardRef: 'NECA 100-2016 Table 1.1 (Residential Branch NM)',
    tags: ['romex', 'branch', 'residential', '20A']
  },
  {
    id: 'asmb-bc-gfci-breaker',
    category: 'branch_circuits',
    name: '20A 1-Pole Dual Function AFCI/GFCI Circuit Breaker',
    unit: 'each',
    baseLaborHours: 0.4,
    materialCost: 65.00,
    wastePercent: 0,
    description: 'Plug-on 20A 120V combination Arc-Fault and Ground-Fault circuit interrupter breaker installed and tested.',
    necaStandardRef: 'NECA 100-2016 Table 1.4 (Breakers)',
    tags: ['breaker', 'afci', 'gfci', 'safety']
  },

  // Devices & Receptacles
  {
    id: 'asmb-dev-duplex-20a',
    category: 'devices_receptacles',
    name: 'Commercial Spec 20A Duplex Receptacle Trim & Device',
    unit: 'each',
    baseLaborHours: 0.35,
    materialCost: 7.50,
    wastePercent: 0,
    description: '20A 125V heavy-duty specification grade receptacle with nylon wallplate, pigtails, and grounding screw.',
    necaStandardRef: 'NECA 100-2016 Table 5.1 (Wiring Devices)',
    tags: ['outlet', 'receptacle', 'commercial', 'device']
  },
  {
    id: 'asmb-dev-gfci-20a',
    category: 'devices_receptacles',
    name: '20A Tamper-Resistant Self-Test GFCI Receptacle',
    unit: 'each',
    baseLaborHours: 0.50,
    materialCost: 24.00,
    wastePercent: 0,
    description: 'Tamper-resistant self-testing GFCI with status indicator LED and decorator wallplate.',
    necaStandardRef: 'NECA 100-2016 Table 5.2 (GFCI Devices)',
    tags: ['gfci', 'outlet', 'receptacle', 'safety']
  },
  {
    id: 'asmb-dev-dec-switch',
    category: 'devices_receptacles',
    name: 'Decora Rocker Single-Pole Switch',
    unit: 'each',
    baseLaborHours: 0.30,
    materialCost: 5.50,
    wastePercent: 0,
    description: '15A/20A Decora quiet rocker switch with matching screwless wallplate.',
    necaStandardRef: 'NECA 100-2016 Table 5.3 (Switches)',
    tags: ['switch', 'lighting-control', 'device']
  },

  // Lighting Fixtures
  {
    id: 'asmb-lt-recessed-can',
    category: 'lighting_fixtures',
    name: '6" LED Ultra-Thin Recessed Downlight (Canless)',
    unit: 'each',
    baseLaborHours: 0.65,
    materialCost: 22.50,
    wastePercent: 0,
    description: 'Wafer-thin selectable CCT LED recessed downlight with remote junction box and spring clips.',
    necaStandardRef: 'NECA 100-2016 Table 6.1 (Recessed Downlights)',
    tags: ['lighting', 'led', 'recessed', 'canless', 'potlight']
  },
  {
    id: 'asmb-lt-2x4-flatpanel',
    category: 'lighting_fixtures',
    name: '2x4 Commercial LED Backlit Flat Panel (Grid Ceiling)',
    unit: 'each',
    baseLaborHours: 0.85,
    materialCost: 58.00,
    wastePercent: 0,
    description: '50W 0-10V dimmable LED troffer lay-in fixture for T-bar drop ceiling with earthquake safety grid clips.',
    necaStandardRef: 'NECA 100-2016 Table 6.3 (Troffers & Panels)',
    tags: ['commercial', 'lighting', 'panel', 'led', 't-bar']
  },
  {
    id: 'asmb-lt-occupancy-sensor',
    category: 'lighting_fixtures',
    name: 'Ceiling Mount Ultrasonic/PIR Dual Tech Occupancy Sensor',
    unit: 'each',
    baseLaborHours: 0.90,
    materialCost: 75.00,
    wastePercent: 0,
    description: '360-degree coverage dual-technology motion sensor with 24V power pack controller for energy code compliance (Title 24 / IECC).',
    necaStandardRef: 'NECA 100-2016 Table 6.6 (Lighting Controls)',
    tags: ['lighting-control', 'sensor', 'energy-code']
  },

  // EV Chargers & Renewables
  {
    id: 'asmb-ev-tesla-wall',
    category: 'ev_chargers_solar',
    name: 'Tesla Universal Wall Connector 48A / 240V Station',
    unit: 'each',
    baseLaborHours: 4.5,
    materialCost: 590.00,
    wastePercent: 0,
    description: 'Hardwired 48A Level 2 EV charging station with integrated J1772 & NACS adapter, Wi-Fi provisioning, and 60A 2-pole breaker.',
    necaStandardRef: 'NECA 100-2016 Table 8.1 (EVSE Stations)',
    tags: ['evse', 'ev', 'charger', 'tesla', 'level-2']
  },
  {
    id: 'asmb-ev-nema-1450',
    category: 'ev_chargers_solar',
    name: '50A 240V NEMA 14-50 EV Receptacle Outlet & Box',
    unit: 'each',
    baseLaborHours: 2.2,
    materialCost: 145.00,
    wastePercent: 0,
    description: 'Industrial-grade Bryant/Hubbell NEMA 14-50 receptacle in 2-gang deep metal box with stainless plate and 50A 2-pole GFCI breaker.',
    necaStandardRef: 'NECA 100-2016 Table 8.2 (50A Receptacles)',
    tags: ['evse', 'nema-1450', 'receptacle', '50A']
  },
  {
    id: 'asmb-surge-wholehouse',
    category: 'ev_chargers_solar',
    name: 'Whole-House Type 2 Surge Protective Device (SPD)',
    unit: 'each',
    baseLaborHours: 1.2,
    materialCost: 160.00,
    wastePercent: 0,
    description: 'Panel-mounted Eaton/Square D 50kA per phase surge protective device with dedicated 20A 2-pole breaker (NEC 242 requirement).',
    necaStandardRef: 'NECA 100-2016 Table 2.8 (Surge Arresters)',
    tags: ['surge', 'spd', 'safety', 'nec-242']
  },

  // HVAC Disconnects & Equipment
  {
    id: 'asmb-hvac-60a-disc',
    category: 'hvac_disconnects',
    name: '60A Non-Fusible AC Disconnect & 6ft Liquidtight Whip',
    unit: 'set',
    baseLaborHours: 1.8,
    materialCost: 65.00,
    wastePercent: 0,
    description: 'NEMA 3R outdoor rainproof pullout disconnect with 3/4" metallic Liquidtight flexible conduit whip and #8 THHN conductors.',
    necaStandardRef: 'NECA 100-2016 Table 7.1 (Equipment Disconnects)',
    tags: ['hvac', 'ac', 'disconnect', 'outdoor', 'whip']
  },
  {
    id: 'asmb-gen-interlock',
    category: 'transformers_generators',
    name: 'Generator Mechanical Interlock Kit & 30A/50A Inlet Box',
    unit: 'set',
    baseLaborHours: 3.8,
    materialCost: 260.00,
    wastePercent: 0,
    description: 'UL-listed panel cover mechanical interlock bracket, exterior NEMA 3R power inlet box, and 30A/50A 2-pole backfeed breaker.',
    necaStandardRef: 'NECA 100-2016 Table 7.4 (Standby Power)',
    tags: ['generator', 'interlock', 'inlet', 'emergency-backup']
  }
];
