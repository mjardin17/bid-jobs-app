export interface NECACategoryInfo {
  code: string;
  title: string;
  scope: string;
  laborFactorLevel1: string;
  laborFactorLevel2: string;
  laborFactorLevel3: string;
}

export const NECA_STANDARD_CATEGORIES: Record<string, NECACategoryInfo> = {
  service_panels: {
    code: 'NECA 100-2016 §2',
    title: 'Service Entrance & Distribution Equipment',
    scope: 'Installation of main service panels, switchboards, meter banks, panelboards, and system grounding electrodes.',
    laborFactorLevel1: 'Level 1: Ideal open floor workspace, accessible panel location, pre-drilled studs.',
    laborFactorLevel2: 'Level 2: Standard commercial/residential tenant space with moderate conduit routing (+5%).',
    laborFactorLevel3: 'Level 3: Occupied retrofit, existing active live bus adjacent, high-density wire raceways (+15%).'
  },
  conduit_raceway: {
    code: 'NECA 101-2015 §4',
    title: 'Conduit & Raceway Systems',
    scope: 'Bending, cutting, threading, and mounting EMT, Rigid Steel, IMC, PVC, and Flexible Metallic Conduit.',
    laborFactorLevel1: 'Level 1: Exposed straight runs on concrete ceilings under 10 ft using scissor lift.',
    laborFactorLevel2: 'Level 2: Multiple 90-degree saddle offsets over existing HVAC ductwork (+10%).',
    laborFactorLevel3: 'Level 3: Working above 15 ft in crowded plenum ceilings from rolling scaffolding (+25%).'
  },
  branch_circuits: {
    code: 'NECA 100-2016 §1',
    title: 'Branch Circuit Wiring & Raceways',
    scope: 'Rough-in of NM-B Romex, MC cable, wire pulling, junction box makeup, and circuit identification.',
    laborFactorLevel1: 'Level 1: New wood or light steel framing with accessible pre-punched stud holes.',
    laborFactorLevel2: 'Level 2: Remodel requiring surgical drywall fishing without destructive channel cutting (+15%).',
    laborFactorLevel3: 'Level 3: Lathe and plaster walls with insulation blockages in occupied historic structures (+35%).'
  },
  lighting_fixtures: {
    code: 'NECA 100-2016 §6',
    title: 'Luminaires & Lighting Control Devices',
    scope: 'Assembly, hanging, secondary safety support wire, driver connection, and 0-10V dimming integration.',
    laborFactorLevel1: 'Level 1: Standard lay-in LED troffers into 2x4 suspended grid ceiling under 9 ft.',
    laborFactorLevel2: 'Level 2: Surface architectural pendants requiring laser leveling and aircraft cable drops (+15%).',
    laborFactorLevel3: 'Level 3: High-bay fixtures mounted to open bar joists at 20+ ft working height (+40%).'
  }
};
