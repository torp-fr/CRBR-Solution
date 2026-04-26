'use strict';

// Grid & rendering constants
const GRID   = 80;   // px per 1250mm module width (world space)
const WALL_T = 16;   // wall thickness in px (153mm represented)
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.12;

// 3D scale: 1 THREE unit = 100mm → 1250mm = 12.5 units
const U3  = 12.5;  // width of one module in 3D
const H3  = 25;    // wall height (2500mm)
const T3  = 1.5;   // wall thickness (153mm)

const MODULE_LABELS = {
  wall:    'Mur plein',
  window:  'Mur avec fenêtre',
  door:    'Module porte',
  opening: 'Passage libre',
};

const MODULE_ICONS = {
  wall: '▬', window: '▭', door: '▮', opening: '⊟',
};

// Colors used by 2D renderer
const COLORS = {
  bg:       '#0f0f12',
  grid:     'rgba(201,168,76,0.13)',
  gridMaj:  'rgba(201,168,76,0.25)',
  wall:     '#252530',
  wallStroke:'rgba(201,168,76,0.75)',
  gold:     '#C9A84C',
  goldD:    'rgba(201,168,76,0.45)',
  select:   'rgba(201,168,76,0.85)',
  ghost:    'rgba(201,168,76,0.25)',
  ghostErr: 'rgba(210,50,50,0.55)',
  text:     '#8A8A96',
};

// Default material prices
const DEFAULT_MATERIALS = {
  montant:   { name: 'Montant bois 2500mm', unit: 'unité', price: 8.50  },
  osb:       { name: 'Panneau OSB',         unit: 'm²',    price: 12.00 },
  visserie:  { name: 'Visserie (lot)',       unit: 'lot',   price: 15.00 },
  boulon:    { name: 'Boulon M12',          unit: 'unité', price: 0.80  },
  charniere: { name: 'Charnière',           unit: 'unité', price: 8.00  },
  serrure:   { name: 'Serrure',             unit: 'unité', price: 45.00 },
};

// Default module compositions (quantities per module)
// OSB area: 2 faces × 1.25m × 2.5m = 6.25 m² for a full wall
const DEFAULT_COMPOSITIONS = {
  wall:    { montant: 4, osb: 6.25, visserie: 1, boulon: 8,  charniere: 0, serrure: 0 },
  window:  { montant: 5, osb: 4.50, visserie: 1, boulon: 10, charniere: 0, serrure: 0 },
  door:    { montant: 5, osb: 3.00, visserie: 1, boulon: 10, charniere: 2, serrure: 1 },
  opening: { montant: 3, osb: 0,    visserie: 0.5,boulon: 6, charniere: 0, serrure: 0 },
};

// Default business parameters
const DEFAULT_BUSINESS = {
  margin:       35,   // %
  delivery:     500,  // € HT
  installation: 1500, // € HT
};

// Preset room templates — offset is applied on load to avoid (0,0) area
const TEMPLATES = {
  simple: {
    label: 'Cellule simple',
    modules: [
      // top (3 walls)
      { type:'wall', gx:0, gy:0, rot:0 }, { type:'wall', gx:1, gy:0, rot:0 }, { type:'wall', gx:2, gy:0, rot:0 },
      // left (2 walls)
      { type:'wall', gx:0, gy:0, rot:90 }, { type:'wall', gx:0, gy:1, rot:90 },
      // right (2 walls)
      { type:'wall', gx:3, gy:0, rot:90 }, { type:'wall', gx:3, gy:1, rot:90 },
      // bottom: 2 walls + 1 door
      { type:'wall', gx:0, gy:2, rot:0 }, { type:'door', gx:1, gy:2, rot:0 }, { type:'wall', gx:2, gy:2, rot:0 },
    ],
  },
  traversante: {
    label: 'Cellule traversante',
    modules: [
      // top: 2 walls + door
      { type:'wall', gx:0, gy:0, rot:0 }, { type:'door', gx:1, gy:0, rot:0 }, { type:'wall', gx:2, gy:0, rot:0 },
      { type:'wall', gx:0, gy:0, rot:90 }, { type:'wall', gx:0, gy:1, rot:90 },
      { type:'wall', gx:3, gy:0, rot:90 }, { type:'wall', gx:3, gy:1, rot:90 },
      // bottom: 2 walls + door
      { type:'wall', gx:0, gy:2, rot:0 }, { type:'door', gx:1, gy:2, rot:0 }, { type:'wall', gx:2, gy:2, rot:0 },
    ],
  },
  observation: {
    label: 'Cellule observation',
    modules: [
      // top: 1 wall + window + 1 wall
      { type:'wall', gx:0, gy:0, rot:0 }, { type:'window', gx:1, gy:0, rot:0 }, { type:'wall', gx:2, gy:0, rot:0 },
      { type:'wall', gx:0, gy:0, rot:90 }, { type:'wall', gx:0, gy:1, rot:90 },
      { type:'wall', gx:3, gy:0, rot:90 }, { type:'wall', gx:3, gy:1, rot:90 },
      { type:'wall', gx:0, gy:2, rot:0 }, { type:'door', gx:1, gy:2, rot:0 }, { type:'wall', gx:2, gy:2, rot:0 },
    ],
  },
};
