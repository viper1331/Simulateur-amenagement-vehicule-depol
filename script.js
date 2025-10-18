import * as THREE from './libs/three.module.js';
import { unzipSync, strFromU8 } from './libs/fflate.module.js';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TubeGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/src/geometries/TubeGeometry.js';
import { LineSegments2 } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/lines/LineMaterial.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/SMAAPass.js';
import { SSAOPass } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/SSAOPass.js';

const mmToM = (value) => (Number.isFinite(value) ? value / 1000 : null);
const mToMm = (value) => (Number.isFinite(value) ? value * 1000 : null);
const DEFAULT_SNAP_STEP = 0.001;
const snapValue = (value, step = DEFAULT_SNAP_STEP) => Math.round(value / step) * step;
const degToRad = (deg) => deg * Math.PI / 180;
const radToDeg = (rad) => rad * 180 / Math.PI;

const MATERIAL_PROFILES = {
  paintedMetal: {
    metalness: 0.15,
    roughness: 0.35,
    sheen: 0.0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3
  },
  stainless: {
    metalness: 0.9,
    roughness: 0.2,
    clearcoat: 0.4,
    clearcoatRoughness: 0.15
  },
  rubber: {
    metalness: 0.0,
    roughness: 0.8
  }
};

const RAL_COLORS = {
  chassis: 0x9DA3A6,
  chassisAccent: 0x778087,
  hydroTank: 0x2A6BB1,
  waterTank: 0x3C8DFF,
  pumps: 0x6D55C2,
  hose: 0x2A9771,
  cabinets: 0xB7C1C9
};

const QUALITY_STORAGE_KEY = 'sim-quality-mode';
const QUALITY_PROFILES = {
  draft: {
    label: 'Draft',
    toneMappingExposure: 0.95,
    shadowMapSize: 512,
    shadows: false,
    ssao: false,
    clearcoatBoost: 0,
    gridDivisions: 10
  },
  balanced: {
    label: 'Balanced',
    toneMappingExposure: 1.05,
    shadowMapSize: 1024,
    shadows: true,
    ssao: true,
    ssaoKernel: 8,
    clearcoatBoost: 0.05,
    gridDivisions: 20
  },
  high: {
    label: 'High',
    toneMappingExposure: 1.1,
    shadowMapSize: 2048,
    shadows: true,
    ssao: true,
    ssaoKernel: 12,
    clearcoatBoost: 0.1,
    gridDivisions: 40
  }
};

function getStoredQualityMode() {
  try {
    const saved = window.localStorage.getItem(QUALITY_STORAGE_KEY);
    if (saved && QUALITY_PROFILES[saved]) {
      return saved;
    }
  } catch (error) {
    console.warn('Impossible de charger la qualité enregistrée', error);
  }
  return 'balanced';
}

function storeQualityMode(mode) {
  try {
    window.localStorage.setItem(QUALITY_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Impossible de sauvegarder la qualité', error);
  }
}

let qualityMode = getStoredQualityMode();
const sharedMaterials = new Map();
const lineMaterials = new Set();

const chassisCatalog = [
  {
    id: 'midliner',
    name: 'Midliner 16T',
    length: 7.8,
    width: 2.45,
    height: 0.9,
    mass: 5200,
    ptac: 16000,
    wheelbase: 4.3,
    frontAxleOffset: 1.3,
    payload: null,
    maxTowableBraked: null,
    maxAuthorizedWeight: null,
    overallWidthMirrors: null,
    heightUnladen: null,
    groundClearanceLoaded: null,
    floorHeightUnladen: null,
    overallLengthMM: null,
    overallWidthMM: null,
    overallHeightMM: null,
    maxLoadingLength: null,
    rearOverhang: null,
    heightWithRack: null,
    frontOverhang: null,
    rearOpeningHeight: null,
    cargoVolume: null,
    interiorWidthWheelarches: null,
    sideDoorEntryWidth: null,
    rearDoorLowerEntryWidth: null,
    interiorHeight: null,
    color: RAL_COLORS.chassis
  },
  {
    id: 'kerax',
    name: 'Kerax 19T',
    length: 8.4,
    width: 2.5,
    height: 1.0,
    mass: 6400,
    ptac: 19000,
    wheelbase: 4.6,
    frontAxleOffset: 1.45,
    payload: null,
    maxTowableBraked: null,
    maxAuthorizedWeight: null,
    overallWidthMirrors: null,
    heightUnladen: null,
    groundClearanceLoaded: null,
    floorHeightUnladen: null,
    overallLengthMM: null,
    overallWidthMM: null,
    overallHeightMM: null,
    maxLoadingLength: null,
    rearOverhang: null,
    heightWithRack: null,
    frontOverhang: null,
    rearOpeningHeight: null,
    cargoVolume: null,
    interiorWidthWheelarches: null,
    sideDoorEntryWidth: null,
    rearDoorLowerEntryWidth: null,
    interiorHeight: null,
    color: RAL_COLORS.chassisAccent
  },
  {
    id: 'premium',
    name: 'Premium Lander 26T',
    length: 9.2,
    width: 2.55,
    height: 1.05,
    mass: 7800,
    ptac: 26000,
    wheelbase: 5.1,
    frontAxleOffset: 1.6,
    payload: null,
    maxTowableBraked: null,
    maxAuthorizedWeight: null,
    overallWidthMirrors: null,
    heightUnladen: null,
    groundClearanceLoaded: null,
    floorHeightUnladen: null,
    overallLengthMM: null,
    overallWidthMM: null,
    overallHeightMM: null,
    maxLoadingLength: null,
    rearOverhang: null,
    heightWithRack: null,
    frontOverhang: null,
    rearOpeningHeight: null,
    cargoVolume: null,
    interiorWidthWheelarches: null,
    sideDoorEntryWidth: null,
    rearDoorLowerEntryWidth: null,
    interiorHeight: null,
    color: RAL_COLORS.chassis
  }
];

const BUILTIN_MODULE_LIBRARY = {
  id: 'library-standard',
  name: 'Bibliothèque standard',
  description: 'Modules fournis avec le simulateur.',
  source: 'Simulateur 3D de dépollution',
  license: 'Usage interne',
  website: null,
  isSystem: true
};

const CUSTOM_MODULE_LIBRARY = {
  id: 'library-custom',
  name: 'Modules personnalisés',
  description: 'Modules créés ou importés par l\'utilisateur.',
  source: 'Utilisateur',
  license: 'Selon vos propres ressources',
  website: null,
  isSystem: true
};

const moduleCatalog = [
  {
    id: 'tank-medium',
    type: 'Tank',
    name: 'Cuve 5m³',
    shape: 'box',
    size: { x: 1.6, y: 1.6, z: 2.4 },
    color: RAL_COLORS.hydroTank,
    massEmpty: 680,
    fluidVolume: 5000,
    defaultFill: 60,
    density: 1000,
    containsFluid: true,
    libraryId: BUILTIN_MODULE_LIBRARY.id,
    libraryName: BUILTIN_MODULE_LIBRARY.name,
    librarySource: BUILTIN_MODULE_LIBRARY.source,
    libraryLicense: BUILTIN_MODULE_LIBRARY.license,
    libraryWebsite: BUILTIN_MODULE_LIBRARY.website,
    isCustom: false
  },
  {
    id: 'tank-compact',
    type: 'Tank',
    name: 'Cuve 3m³',
    shape: 'box',
    size: { x: 1.4, y: 1.4, z: 2.0 },
    color: RAL_COLORS.waterTank,
    massEmpty: 520,
    fluidVolume: 3000,
    defaultFill: 50,
    density: 1000,
    containsFluid: true,
    libraryId: BUILTIN_MODULE_LIBRARY.id,
    libraryName: BUILTIN_MODULE_LIBRARY.name,
    librarySource: BUILTIN_MODULE_LIBRARY.source,
    libraryLicense: BUILTIN_MODULE_LIBRARY.license,
    libraryWebsite: BUILTIN_MODULE_LIBRARY.website,
    isCustom: false
  },
  {
    id: 'pump-high',
    type: 'Pump',
    name: 'Pompe haute pression',
    shape: 'box',
    size: { x: 1.2, y: 1.4, z: 1.6 },
    color: RAL_COLORS.pumps,
    massEmpty: 320,
    fluidVolume: 40,
    defaultFill: 0,
    density: 900,
    containsFluid: true,
    libraryId: BUILTIN_MODULE_LIBRARY.id,
    libraryName: BUILTIN_MODULE_LIBRARY.name,
    librarySource: BUILTIN_MODULE_LIBRARY.source,
    libraryLicense: BUILTIN_MODULE_LIBRARY.license,
    libraryWebsite: BUILTIN_MODULE_LIBRARY.website,
    isCustom: false
  },
  {
    id: 'hosereel-duo',
    type: 'HoseReel',
    name: 'Enrouleur double',
    shape: 'box',
    size: { x: 1.4, y: 1.2, z: 1.2 },
    color: RAL_COLORS.hose,
    massEmpty: 210,
    fluidVolume: 120,
    defaultFill: 20,
    density: 950,
    containsFluid: true,
    libraryId: BUILTIN_MODULE_LIBRARY.id,
    libraryName: BUILTIN_MODULE_LIBRARY.name,
    librarySource: BUILTIN_MODULE_LIBRARY.source,
    libraryLicense: BUILTIN_MODULE_LIBRARY.license,
    libraryWebsite: BUILTIN_MODULE_LIBRARY.website,
    isCustom: false
  },
  {
    id: 'cabinet-large',
    type: 'Cabinet',
    name: 'Armoire équipement',
    shape: 'box',
    size: { x: 1.6, y: 2.0, z: 1.0 },
    color: RAL_COLORS.cabinets,
    massEmpty: 180,
    fluidVolume: 0,
    defaultFill: 0,
    density: 1,
    containsFluid: false,
    libraryId: BUILTIN_MODULE_LIBRARY.id,
    libraryName: BUILTIN_MODULE_LIBRARY.name,
    librarySource: BUILTIN_MODULE_LIBRARY.source,
    libraryLicense: BUILTIN_MODULE_LIBRARY.license,
    libraryWebsite: BUILTIN_MODULE_LIBRARY.website,
    isCustom: false,
    doors: [
      {
        id: 'cabinet-large-left',
        label: 'Porte gauche',
        type: 'swing',
        hingeSide: 'left',
        axis: 'y',
        widthRatio: 0.48,
        heightRatio: 0.85,
        thickness: 0.04,
        openAngleDeg: 110,
        openTimeMs: 1200
      },
      {
        id: 'cabinet-large-right',
        label: 'Porte droite',
        type: 'swing',
        hingeSide: 'right',
        axis: 'y',
        widthRatio: 0.48,
        heightRatio: 0.85,
        thickness: 0.04,
        openAngleDeg: 110,
        openTimeMs: 1200
      }
    ]
  },
  {
    id: 'cabinet-ops',
    type: 'Cabinet',
    name: 'Pupitre opérateur',
    shape: 'box',
    size: { x: 1.0, y: 1.5, z: 1.2 },
    color: RAL_COLORS.cabinets,
    massEmpty: 140,
    fluidVolume: 0,
    defaultFill: 0,
    density: 1,
    containsFluid: false,
    libraryId: BUILTIN_MODULE_LIBRARY.id,
    libraryName: BUILTIN_MODULE_LIBRARY.name,
    librarySource: BUILTIN_MODULE_LIBRARY.source,
    libraryLicense: BUILTIN_MODULE_LIBRARY.license,
    libraryWebsite: BUILTIN_MODULE_LIBRARY.website,
    isCustom: false,
    doors: [
      {
        id: 'cabinet-ops-front',
        label: 'Volet opérateur',
        type: 'lift',
        axis: 'z',
        widthRatio: 0.9,
        heightRatio: 0.7,
        thickness: 0.035,
        slideDistanceMm: 400,
        openTimeMs: 1500
      }
    ]
  }
];

const moduleLibraries = new Map([
  [BUILTIN_MODULE_LIBRARY.id, { ...BUILTIN_MODULE_LIBRARY }],
  [CUSTOM_MODULE_LIBRARY.id, { ...CUSTOM_MODULE_LIBRARY }]
]);

const MODULE_SHAPES = ['box', 'cylinder'];
const DEFAULT_MAGNET_DISTANCE = 0.15;
const DEFAULT_PASTE_OFFSET = 0.25;

function slugify(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return value
    .toString()
    .normalize('NFD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function ensureUniqueModuleId(baseId) {
  let candidate = (baseId && baseId.toString().trim()) || '';
  if (!candidate) {
    candidate = `module-${Date.now()}`;
  }
  let uniqueId = candidate;
  let suffix = 1;
  while (moduleCatalog.some((item) => item.id === uniqueId)) {
    uniqueId = `${candidate}-${suffix++}`;
  }
  return uniqueId;
}

function sanitizeModuleLibrary(rawLibrary, fileName = '') {
  if (!rawLibrary || typeof rawLibrary !== 'object') {
    throw new Error('Le fichier sélectionné ne contient pas de bibliothèque valide.');
  }
  const modules = Array.isArray(rawLibrary.modules)
    ? rawLibrary.modules
    : Array.isArray(rawLibrary.items)
      ? rawLibrary.items
      : null;
  if (!modules || modules.length === 0) {
    throw new Error('La bibliothèque ne contient aucun module exploitable.');
  }
  const nameSource = rawLibrary.name || rawLibrary.title || fileName.replace(/\.[^.]+$/, '');
  const name = (nameSource || 'Bibliothèque de modules').toString().trim() || 'Bibliothèque de modules';
  const rawId = rawLibrary.id || slugify(name);
  const baseId = slugify(rawId) || slugify(name) || `library-${Date.now()}`;
  let libraryId = baseId;
  let suffix = 1;
  while (moduleLibraries.has(libraryId) && rawLibrary.id === undefined) {
    libraryId = `${baseId}-${suffix++}`;
  }
  const description = rawLibrary.description || rawLibrary.summary || null;
  const source = rawLibrary.source || rawLibrary.origin || null;
  const website = rawLibrary.website || rawLibrary.url || rawLibrary.homepage || null;
  const license = rawLibrary.license || rawLibrary.licence || rawLibrary.rights || null;

  return {
    id: libraryId,
    name,
    description: description ? description.toString().trim() : null,
    source: source ? source.toString().trim() : null,
    website: website ? website.toString().trim() : null,
    license: license ? license.toString().trim() : null,
    modules,
    isSystem: false
  };
}

function registerModuleLibraryMeta(meta) {
  if (!meta || !meta.id) {
    return;
  }
  const current = moduleLibraries.get(meta.id) || {};
  moduleLibraries.set(meta.id, {
    id: meta.id,
    name: meta.name || current.name || meta.id,
    description: meta.description ?? current.description ?? null,
    source: meta.source ?? current.source ?? null,
    license: meta.license ?? current.license ?? null,
    website: meta.website ?? current.website ?? null,
    isSystem: current.isSystem ?? meta.isSystem ?? false
  });
}

function normalizeWebsiteUrl(url) {
  if (!url) {
    return '';
  }
  const trimmed = url.toString().trim();
  if (!trimmed) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function formatWebsiteLabel(url) {
  if (!url) {
    return '';
  }
  try {
    const normalized = normalizeWebsiteUrl(url);
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./i, '');
  } catch (error) {
    return url.toString().replace(/^https?:\/\//i, '');
  }
}

function normalizeModuleShape(value) {
  if (!value && value !== 0) {
    return 'box';
  }
  const normalized = value.toString().trim().toLowerCase();
  return MODULE_SHAPES.includes(normalized) ? normalized : 'box';
}

function getMaterialKey(color, profileKey, overrides) {
  const overrideKey = overrides ? JSON.stringify(overrides) : '';
  return `${color}-${profileKey}-${overrideKey}-${qualityMode}`;
}

function getPhysicalMaterial(color, profileKey = 'paintedMetal', overrides = {}) {
  const profile = MATERIAL_PROFILES[profileKey] || MATERIAL_PROFILES.paintedMetal;
  const quality = QUALITY_PROFILES[qualityMode] || QUALITY_PROFILES.balanced;
  const key = getMaterialKey(color, profileKey, overrides);
  if (sharedMaterials.has(key)) {
    return sharedMaterials.get(key);
  }
  const material = new THREE.MeshPhysicalMaterial({
    color,
    metalness: profile.metalness,
    roughness: profile.roughness,
    sheen: profile.sheen ?? 0,
    clearcoat: (profile.clearcoat ?? 0) + (quality.clearcoatBoost || 0),
    clearcoatRoughness: profile.clearcoatRoughness ?? 0.25,
    transparent: false,
    ...overrides
  });
  sharedMaterials.set(key, material);
  return material;
}

function registerLineMaterial(material) {
  lineMaterials.add(material);
  material.resolution = material.resolution || new THREE.Vector2();
  material.resolution.set(getViewportWidth(), getViewportHeight());
}

function createEdgeLines(geometry, color = 0x0f1924, linewidth = 1.4) {
  const edgesGeo = new THREE.EdgesGeometry(geometry);
  const lineGeo = new LineSegmentsGeometry();
  lineGeo.fromEdgesGeometry(edgesGeo);
  const lineMat = new LineMaterial({
    color,
    linewidth,
    transparent: true,
    opacity: 0.8,
    depthTest: true
  });
  registerLineMaterial(lineMat);
  const line = new LineSegments2(lineGeo, lineMat);
  line.computeLineDistances();
  return line;
}

function createModuleGeometry(shape, size) {
  const safeSize = {
    x: Number(size?.x) || 0.2,
    y: Number(size?.y) || 0.2,
    z: Number(size?.z) || 0.2
  };
  if (shape === 'cylinder') {
    const diameter = Math.max(safeSize.x, safeSize.z);
    const radius = Math.max(diameter / 2, 0.05);
    return new THREE.CylinderGeometry(radius, radius, Math.max(safeSize.y, 0.05), 32);
  }
  const minDim = Math.max(Math.min(safeSize.x, safeSize.y, safeSize.z), 0.01);
  const radius = THREE.MathUtils.clamp(minDim * 0.18, 0.01, 0.02);
  return new RoundedBoxGeometry(
    Math.max(safeSize.x, 0.05),
    Math.max(safeSize.y, 0.05),
    Math.max(safeSize.z, 0.05),
    radius,
    4
  );
}

function attachIndustrialEdges(target, geometry, color, linewidth) {
  const edges = createEdgeLines(geometry, color, linewidth);
  edges.name = 'edges';
  target.add(edges);
  return edges;
}

function createGenericModuleVisual(shape, size, color, profileKey) {
  const geometry = createModuleGeometry(shape, size);
  const material = getPhysicalMaterial(color, profileKey);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  attachIndustrialEdges(mesh, geometry, 0x0b131f, 1.2);
  return { mesh, geometry };
}

function createHoseHelix(radius, height, turns, thickness) {
  class HelixCurve extends THREE.Curve {
    constructor(r, h, t) {
      super();
      this.radius = r;
      this.height = h;
      this.turns = t;
    }

    getPoint(t) {
      const angle = this.turns * Math.PI * 2 * t;
      const x = Math.cos(angle) * this.radius;
      const z = Math.sin(angle) * this.radius;
      const y = -this.height / 2 + this.height * t;
      return new THREE.Vector3(x, y, z);
    }
  }

  const curve = new HelixCurve(radius, height, turns);
  const tubularSegments = Math.max(120, Math.floor(turns * 120));
  return new TubeGeometry(curve, tubularSegments, thickness, 16, false);
}

function createHoseReelVisual(size, frameColor) {
  const group = new THREE.Group();
  group.name = 'hosereel';

  const frame = createGenericModuleVisual('box', size, frameColor, 'paintedMetal');
  frame.mesh.scale.set(1, 0.45, 1);
  frame.mesh.position.y = size.y * 0.225;
  group.add(frame.mesh);

  const supportHeight = size.y * 0.6;
  const supportWidth = size.x * 0.85;
  const drumRadius = Math.min(size.y, size.z) * 0.38;
  const drumWidth = supportWidth * 0.45;
  const flangeThickness = Math.max(size.x * 0.05, 0.05);

  const flangeGeometry = new THREE.CylinderGeometry(drumRadius, drumRadius, flangeThickness, 48);
  const flangeMaterial = getPhysicalMaterial(frameColor, 'paintedMetal');
  const flangeOffset = drumWidth / 2;

  const flangeLeft = new THREE.Mesh(flangeGeometry, flangeMaterial);
  flangeLeft.rotation.z = Math.PI / 2;
  flangeLeft.position.set(0, supportHeight / 2, -flangeOffset);
  flangeLeft.castShadow = flangeLeft.receiveShadow = true;
  attachIndustrialEdges(flangeLeft, flangeGeometry, 0x11161f, 1.0);

  const flangeRight = flangeLeft.clone();
  flangeRight.position.z = flangeOffset;

  const coreRadius = drumRadius * 0.35;
  const coreGeometry = new THREE.CylinderGeometry(coreRadius, coreRadius, drumWidth, 24);
  const coreMaterial = getPhysicalMaterial(RAL_COLORS.chassisAccent, 'stainless');
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.rotation.z = Math.PI / 2;
  core.position.set(0, supportHeight / 2, 0);
  core.castShadow = core.receiveShadow = true;
  attachIndustrialEdges(core, coreGeometry, 0x202a33, 1.0);

  const hoseGeometry = createHoseHelix(coreRadius * 1.1, drumWidth * 0.9, 6, Math.max(size.y, size.z) * 0.03);
  const hoseMaterial = getPhysicalMaterial(RAL_COLORS.hose, 'rubber');
  const hose = new THREE.Mesh(hoseGeometry, hoseMaterial);
  hose.rotation.x = Math.PI / 2;
  hose.position.set(0, supportHeight / 2, 0);
  hose.castShadow = hose.receiveShadow = true;

  group.add(flangeLeft, flangeRight, core, hose);

  group.userData.visualType = 'hosereel';
  return group;
}

function createPumpVisual(size, color) {
  const group = new THREE.Group();
  group.name = 'pump';

  const body = createGenericModuleVisual('box', size, color, 'paintedMetal');
  body.mesh.position.y = size.y / 2;
  group.add(body.mesh);

  const inletRadius = Math.min(size.x, size.z) * 0.12;
  const inletGeometry = new THREE.CylinderGeometry(inletRadius, inletRadius, size.z * 0.6, 24);
  const connectorMaterial = getPhysicalMaterial(RAL_COLORS.chassisAccent, 'stainless');
  const inlet = new THREE.Mesh(inletGeometry, connectorMaterial);
  inlet.rotation.x = Math.PI / 2;
  inlet.position.set(-size.x * 0.35, size.y * 0.6, 0);
  inlet.castShadow = inlet.receiveShadow = true;
  attachIndustrialEdges(inlet, inletGeometry, 0x1b2230, 1.0);

  const outlet = inlet.clone();
  outlet.position.x = size.x * 0.35;

  const curvePoints = [
    new THREE.Vector3(-size.x * 0.35, size.y * 0.6, 0),
    new THREE.Vector3(-size.x * 0.15, size.y * 0.8, size.z * 0.2),
    new THREE.Vector3(size.x * 0.15, size.y * 0.8, -size.z * 0.2),
    new THREE.Vector3(size.x * 0.35, size.y * 0.6, 0)
  ];
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const pipeGeometry = new TubeGeometry(curve, 48, inletRadius * 0.6, 16, false);
  const pipeMaterial = getPhysicalMaterial(RAL_COLORS.hose, 'rubber');
  const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
  pipe.castShadow = pipe.receiveShadow = true;

  const jointGeometry = new THREE.TorusGeometry(inletRadius * 0.9, inletRadius * 0.3, 16, 24);
  const jointLeft = new THREE.Mesh(jointGeometry, connectorMaterial);
  jointLeft.rotation.set(Math.PI / 2, 0, 0);
  jointLeft.position.copy(curvePoints[1]);
  jointLeft.castShadow = jointLeft.receiveShadow = true;
  const jointRight = jointLeft.clone();
  jointRight.position.copy(curvePoints[2]);

  group.add(inlet, outlet, pipe, jointLeft, jointRight);
  return group;
}

function createCabinetVisual(size, color) {
  const group = new THREE.Group();
  group.name = 'cabinet';
  const body = createGenericModuleVisual('box', size, color, 'paintedMetal');
  body.mesh.position.y = size.y / 2;
  group.add(body.mesh);

  const grooveGeometry = new THREE.PlaneGeometry(size.x * 0.9, 0.001);
  const grooveMaterial = new THREE.MeshBasicMaterial({
    color: 0x1d2a33,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  });
  const grooveCount = 3;
  for (let i = 0; i < grooveCount; i++) {
    const groove = new THREE.Mesh(grooveGeometry, grooveMaterial.clone());
    groove.rotation.y = Math.PI / 2;
    groove.position.set(0, size.y * (0.25 + 0.2 * i), size.z / 2 + 0.001);
    group.add(groove);
  }

  const handleCount = 4;
  const handleRadius = Math.min(size.x, size.y) * 0.025;
  const handleHeight = size.y * 0.1;
  const handleGeometry = new THREE.CylinderGeometry(handleRadius, handleRadius, handleHeight, 12);
  const handleMaterial = getPhysicalMaterial(RAL_COLORS.chassisAccent, 'stainless');
  const handles = new THREE.InstancedMesh(handleGeometry, handleMaterial, handleCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < handleCount; i++) {
    const v = (i % 2 === 0 ? -1 : 1) * size.x * 0.35;
    const h = size.y * (0.25 + 0.2 * Math.floor(i / 2));
    dummy.position.set(v, h, size.z / 2 + handleHeight / 2);
    dummy.rotation.x = Math.PI / 2;
    dummy.updateMatrix();
    handles.setMatrixAt(i, dummy.matrix);
  }
  handles.castShadow = handles.receiveShadow = true;
  group.add(handles);

  return group;
}

function createSwingDoor(door, size, color) {
  const group = new THREE.Group();
  group.name = door.id || 'swing-door';
  const width = size.x * (door.widthRatio || 0.5);
  const height = size.y * (door.heightRatio || 0.8);
  const thickness = door.thickness ?? 0.04;
  const radius = THREE.MathUtils.clamp(Math.min(width, height) * 0.1, 0.005, 0.05);
  const geometry = new RoundedBoxGeometry(width, height, thickness, radius, 3);
  const material = getPhysicalMaterial(color, 'paintedMetal', { roughness: 0.35 });
  const panel = new THREE.Mesh(geometry, material);
  panel.castShadow = true;
  panel.receiveShadow = true;
  attachIndustrialEdges(panel, geometry, 0x121c24, 1.0);
  const hingeSide = (door.hingeSide || 'left').toLowerCase() === 'right' ? 1 : -1;
  const pivot = new THREE.Group();
  pivot.position.set(hingeSide * (size.x / 2), height / 2, size.z / 2 + thickness / 2 + 0.001);
  panel.position.set(hingeSide * (-width / 2), 0, 0);
  pivot.add(panel);

  const handleGeometry = new THREE.CylinderGeometry(thickness * 0.25, thickness * 0.25, height * 0.12, 12);
  const handleMaterial = getPhysicalMaterial(RAL_COLORS.chassisAccent, 'stainless');
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(-hingeSide * (width * 0.35), 0, thickness * 0.6);
  panel.add(handle);

  group.add(pivot);
  group.userData = {
    type: 'swing',
    config: door,
    panel,
    pivot,
    openAngleDeg: door.openAngleDeg ?? 110,
    openTimeMs: door.openTimeMs ?? 1200,
    progress: 0,
    hingeSide,
    baseRotation: 0
  };
  return group;
}

function createLiftDoor(door, size, color) {
  const group = new THREE.Group();
  group.name = door.id || 'lift-door';
  const width = size.x * (door.widthRatio || 0.8);
  const height = size.y * (door.heightRatio || 0.6);
  const thickness = door.thickness ?? 0.035;
  const radius = THREE.MathUtils.clamp(Math.min(width, height) * 0.12, 0.005, 0.05);
  const geometry = new RoundedBoxGeometry(width, height, thickness, radius, 3);
  const material = getPhysicalMaterial(color, 'paintedMetal', { roughness: 0.3 });
  const panel = new THREE.Mesh(geometry, material);
  panel.castShadow = true;
  panel.receiveShadow = true;
  attachIndustrialEdges(panel, geometry, 0x121c24, 1.0);
  panel.position.set(0, height / 2, size.z / 2 + thickness / 2 + 0.001);
  panel.userData = { basePosition: panel.position.clone() };
  group.add(panel);
  group.userData = {
    type: 'lift',
    config: door,
    panel,
    openTimeMs: door.openTimeMs ?? 1400,
    slideDistance: (door.slideDistanceMm ?? 400) / 1000,
    progress: 0
  };
  return group;
}

function attachModuleDoors(pivot, definition, size, baseColor) {
  if (!pivot || !definition) return [];
  const doors = Array.isArray(definition.doors) ? definition.doors : [];
  const created = [];
  doors.forEach((door) => {
    let doorGroup = null;
    if (door.type === 'swing') {
      doorGroup = createSwingDoor(door, size, baseColor);
    } else if (door.type === 'lift') {
      doorGroup = createLiftDoor(door, size, baseColor);
    }
    if (doorGroup) {
      pivot.add(doorGroup);
      created.push({
        id: door.id,
        label: door.label || door.id,
        type: doorGroup.userData.type,
        group: doorGroup,
        config: door,
        progress: 0,
        open: false,
        alert: false
      });
    }
  });
  return created;
}

function configureDirectionalLight(light) {
  if (!light) return;
  light.castShadow = true;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 50;
  const span = 16;
  light.shadow.camera.left = -span;
  light.shadow.camera.right = span;
  light.shadow.camera.top = span;
  light.shadow.camera.bottom = -span;
  light.shadow.bias = -0.00018;
  updateShadowMapSize(light, QUALITY_PROFILES[qualityMode].shadowMapSize);
}

function updateShadowMapSize(light, size) {
  if (!light || !light.shadow) return;
  const mapSize = Math.max(256, size || 1024);
  light.shadow.mapSize.set(mapSize, mapSize);
  if (light.shadow.map) {
    light.shadow.map.dispose();
  }
}

function createContactShadowMesh() {
  const geometry = new THREE.PlaneGeometry(18, 18);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x000000) },
      uOpacity: { value: 0.28 },
      uRadius: { value: 0.85 }
    },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uRadius;
      void main() {
        float dist = length(vUv);
        float softness = smoothstep(uRadius, uRadius - 0.35, dist);
        float alpha = (1.0 - softness) * uOpacity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.0005;
  mesh.renderOrder = -1;
  return mesh;
}

function initPostProcessing() {
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  ssaoPass = new SSAOPass(scene, camera, getViewportWidth(), getViewportHeight());
  ssaoPass.kernelRadius = 8;
  ssaoPass.minDistance = 0.005;
  ssaoPass.maxDistance = 0.2;
  composer.addPass(ssaoPass);
  smaaPass = new SMAAPass(getViewportWidth(), getViewportHeight());
  composer.addPass(smaaPass);
}

function updateComposerSize(width, height) {
  if (!composer) return;
  composer.setSize(width, height);
  if (ssaoPass) ssaoPass.setSize(width, height);
  if (smaaPass && smaaPass.setSize) smaaPass.setSize(width, height);
}

function updateLineMaterialsResolution(width, height) {
  lineMaterials.forEach((material) => {
    if (!material.resolution) {
      material.resolution = new THREE.Vector2();
    }
    material.resolution.set(width, height);
  });
}

function invalidateMaterialCache() {
  sharedMaterials.forEach((material) => material.dispose());
  sharedMaterials.clear();
  if (state.chassisMesh) {
    const color = state.chassisMesh.material?.color?.getHex() ?? RAL_COLORS.chassis;
    const newMaterial = getPhysicalMaterial(color, 'paintedMetal', {
      transparent: state.chassisOpacity < 1,
      opacity: state.chassisOpacity
    });
    state.chassisMesh.material.dispose();
    state.chassisMesh.material = newMaterial;
  }
  state.modules.forEach((mod) => {
    if (!mod || !mod.mesh || !mod.definitionId) return;
    const definition = moduleCatalog.find((item) => item.id === mod.definitionId) || mod;
    const previousDoors = Array.isArray(mod.doors)
      ? mod.doors.map((door) => ({ id: door.id, open: door.open, progress: door.progress }))
      : [];
    const doorMap = new Map(previousDoors.map((door) => [door.id, door]));
    const rebuild = updateMeshGeometryFromDefinition(mod.mesh, definition);
    if (rebuild && rebuild.mesh) {
      mod.mesh = rebuild.mesh;
      mod.color = rebuild.color !== undefined ? rebuild.color : mod.color;
      mod.doors = Array.isArray(rebuild.mesh.userData?.doors)
        ? rebuild.mesh.userData.doors.map((door) => {
            const snapshot = doorMap.get(door.id);
            const restored = {
              id: door.id,
              label: door.label,
              type: door.type,
              config: door.config,
              group: door.group,
              open: snapshot ? snapshot.open : false,
              progress: snapshot ? snapshot.progress : 0,
              alert: false,
              isAnimating: false
            };
            applyDoorTransform(mod, restored);
            return restored;
          })
        : [];
    }
  });
}

function updateGridQuality(divisions) {
  if (grid) {
    scene.remove(grid);
    if (grid.geometry) grid.geometry.dispose();
  }
  grid = new THREE.GridHelper(20, divisions, 0x3ea6ff, 0x1f2b3d);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);
  grid.visible = state.showGrid;
}

function updateContactShadowVisibility(visible, opacity) {
  if (!contactShadowMesh) return;
  contactShadowMesh.visible = visible;
  if (contactShadowMesh.material && contactShadowMesh.material.uniforms) {
    contactShadowMesh.material.uniforms.uOpacity.value = opacity;
  }
}

function applyQualityMode(mode, { skipSave = false } = {}) {
  if (!QUALITY_PROFILES[mode]) {
    mode = 'balanced';
  }
  qualityMode = mode;
  state.qualityMode = mode;
  if (!skipSave) {
    storeQualityMode(mode);
  }
  const profile = QUALITY_PROFILES[mode];
  renderer.toneMappingExposure = profile.toneMappingExposure;
  renderer.shadowMap.enabled = profile.shadows;
  updateShadowMapSize(keyLight, profile.shadowMapSize);
  updateShadowMapSize(fillLight, profile.shadowMapSize);
  updateGridQuality(profile.gridDivisions);
  updateContactShadowVisibility(profile.shadows, profile.shadows ? 0.3 : 0.12);

  if (ssaoPass) {
    ssaoPass.enabled = Boolean(profile.ssao);
    ssaoPass.kernelRadius = profile.ssaoKernel || 8;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.2;
  }
  if (smaaPass) {
    smaaPass.enabled = mode === 'high';
  }
  postProcessingEnabled = (profile.ssao || mode === 'high');

  invalidateMaterialCache();
  updateQualityButtons();
}

function createCogLabelSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(8, 12, 18, 0.85)';
  ctx.fillRect(0, canvas.height * 0.45, canvas.width, canvas.height * 0.55);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height * 0.72);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.8, 0.4, 1);
  sprite.userData.canvas = canvas;
  sprite.userData.context = ctx;
  sprite.userData.texture = texture;
  return sprite;
}

function updateCogLabel(sprite, text) {
  if (!sprite || !sprite.userData) return;
  const canvas = sprite.userData.canvas;
  const ctx = sprite.userData.context;
  const texture = sprite.userData.texture;
  if (!canvas || !ctx || !texture) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(8, 12, 18, 0.85)';
  ctx.fillRect(0, canvas.height * 0.45, canvas.width, canvas.height * 0.55);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height * 0.72);
  texture.needsUpdate = true;
}

function ensureCogVisual() {
  if (cogGroup) return cogGroup;
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 24, 24),
    getPhysicalMaterial(0xffd166, 'stainless', { emissive: new THREE.Color(0x332100) })
  );
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  group.add(sphere);

  const axisGeometry = new LineSegmentsGeometry();
  axisGeometry.setPositions([0, 0, 0, 0, -3, 0]);
  const axisMaterial = new LineMaterial({ color: 0xffb347, linewidth: 2.2, transparent: true, opacity: 0.9 });
  registerLineMaterial(axisMaterial);
  const axis = new LineSegments2(axisGeometry, axisMaterial);
  axis.computeLineDistances();
  axis.position.y = -0.05;
  group.add(axis);

  const label = createCogLabelSprite('CoG');
  if (label) {
    label.position.set(0, 0.3, 0);
    group.add(label);
  }

  group.visible = false;
  scene.add(group);
  cogGroup = group;
  cogGroup.userData = { sphere, axis, label };
  return group;
}

function updateCogVisual(analysis) {
  if (!analysis || !analysis.center) return;
  const group = ensureCogVisual();
  group.position.copy(analysis.center);
  group.visible = true;
  const label = group.userData?.label;
  if (label) {
    const text = `CoG ${analysis.center.x.toFixed(2)} / ${analysis.center.y.toFixed(2)} / ${analysis.center.z.toFixed(2)} m`;
    updateCogLabel(label, text);
  }
}

function updateMeshGeometryFromDefinition(mesh, definition) {
  if (!mesh) return null;
  const parent = mesh.parent || null;
  const position = mesh.position.clone();
  const rotation = mesh.rotation.clone();
  if (parent) {
    parent.remove(mesh);
  }
  disposeObject3D(mesh);
  const { mesh: rebuilt, color } = createModuleMesh(definition);
  rebuilt.position.copy(position);
  rebuilt.rotation.copy(rotation);
  if (parent) {
    parent.add(rebuilt);
  }
  return { mesh: rebuilt, color };
}

function createModuleMesh(definition, { size, color } = {}) {
  const resolvedSize = size ? { ...definition.size, ...size } : { ...definition.size };
  const shape = normalizeModuleShape(definition.shape);
  const type = (definition.type || '').toLowerCase();
  const baseColor = color !== undefined
    ? color
    : (definition.color !== undefined ? definition.color : RAL_COLORS.cabinets);

  let visual;
  if (type === 'hosereel') {
    visual = createHoseReelVisual(resolvedSize, baseColor);
  } else if (type === 'pump') {
    visual = createPumpVisual(resolvedSize, baseColor);
  } else if (type === 'cabinet') {
    visual = createCabinetVisual(resolvedSize, baseColor);
  } else {
    const profile = type === 'tank' ? 'stainless' : 'paintedMetal';
    const { mesh } = createGenericModuleVisual(shape, resolvedSize, baseColor, profile);
    mesh.position.y = resolvedSize.y / 2;
    visual = mesh;
  }

  const root = new THREE.Group();
  root.name = definition.name || 'module';
  root.userData.moduleSize = { ...resolvedSize };
  root.userData.definition = definition;
  const pivot = new THREE.Group();
  pivot.name = 'visual';
  pivot.position.y = -resolvedSize.y / 2;
  root.add(pivot);

  if (visual.isMesh || visual.isGroup || visual.isObject3D) {
    pivot.add(visual);
  } else {
    const placeholder = new THREE.Mesh(
      createModuleGeometry(shape, resolvedSize),
      getPhysicalMaterial(baseColor, 'paintedMetal')
    );
    placeholder.position.y = resolvedSize.y / 2;
    attachIndustrialEdges(placeholder, placeholder.geometry, 0x0b131f, 1.2);
    pivot.add(placeholder);
  }

  const doors = attachModuleDoors(pivot, definition, resolvedSize, baseColor);
  root.position.set(0, resolvedSize.y / 2, 0);
  root.castShadow = true;
  root.receiveShadow = true;
  root.userData.doors = doors;

  return { mesh: root, color: baseColor, shape, size: { ...resolvedSize }, doors };
}

function createModuleInstance(definition, overrides = {}) {
  if (!definition) return null;

  const sizeOverride = overrides.size ? { ...overrides.size } : null;
  const colorOverride = overrides.color;
  const { mesh, color, shape, size } = createModuleMesh(definition, {
    size: sizeOverride || undefined,
    color: colorOverride
  });

  const resolvedContainsFluid = overrides.containsFluid !== undefined
    ? Boolean(overrides.containsFluid)
    : Boolean(definition.containsFluid);

  const overrideFluidVolume = toNullableNumber(overrides.fluidVolume);
  const definitionFluidVolume = toNullableNumber(definition.fluidVolume);
  const resolvedFluidVolume = resolvedContainsFluid
    ? (overrideFluidVolume ?? definitionFluidVolume ?? 0)
    : 0;

  const overrideDensity = toNullableNumber(overrides.density);
  const definitionDensity = toNullableNumber(definition.density);
  const resolvedDensity = resolvedContainsFluid
    ? (overrideDensity ?? definitionDensity ?? 0)
    : 0;

  const overrideFill = toNullableNumber(overrides.fill);
  const definitionFill = toNullableNumber(definition.defaultFill);
  const resolvedFill = resolvedContainsFluid
    ? Math.min(100, Math.max(0, overrideFill ?? definitionFill ?? 0))
    : 0;

  const overrideMass = toNullableNumber(overrides.massEmpty);
  const definitionMass = toNullableNumber(definition.massEmpty);
  const resolvedMassEmpty = overrideMass ?? definitionMass ?? 0;

  const instance = {
    id: overrides.instanceId || `module-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    definitionId: definition.id,
    type: overrides.type || definition.type,
    name: overrides.name || definition.name,
    mesh,
    shape: overrides.shape ? normalizeModuleShape(overrides.shape) : shape,
    fill: resolvedFill,
    massEmpty: resolvedMassEmpty,
    fluidVolume: resolvedFluidVolume,
    density: resolvedDensity,
    containsFluid: resolvedContainsFluid,
    size: { ...size },
    color: colorOverride !== undefined ? colorOverride : color,
    isCustom: overrides.isCustom !== undefined ? Boolean(overrides.isCustom) : Boolean(definition.isCustom),
    libraryId: overrides.libraryId || definition.libraryId,
    libraryName: overrides.libraryName || definition.libraryName,
    librarySource: overrides.librarySource || definition.librarySource,
    libraryLicense: overrides.libraryLicense || definition.libraryLicense,
    libraryWebsite: overrides.libraryWebsite || definition.libraryWebsite,
    labelSprite: null
  };

  if (overrides.position instanceof THREE.Vector3) {
    mesh.position.copy(overrides.position);
  }
  if (overrides.rotation !== undefined) {
    mesh.rotation.y = overrides.rotation;
  }

  return instance;
}

function parseNumberField(value, label, { min = -Infinity, max = Infinity } = {}) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`Valeur invalide pour ${label}.`);
  }
  if (numberValue < min) {
    throw new Error(`${label} doit être supérieur ou égal à ${min}.`);
  }
  if (numberValue > max) {
    throw new Error(`${label} doit être inférieur ou égal à ${max}.`);
  }
  return numberValue;
}

function parseMillimeterField(value, label, { min = -Infinity, max = Infinity } = {}) {
  const mmValue = parseNumberField(value, label, { min, max });
  return mmToM(mmValue);
}

function parseOptionalNumberField(value, label, options) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return parseNumberField(value, label, options);
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function parseColorValue(value, fallback) {
  if (!value) return fallback;
  const sanitized = value.trim().replace('#', '').toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(sanitized)) {
    throw new Error('Veuillez choisir une couleur valide (format hexadécimal).');
  }
  return parseInt(sanitized, 16);
}

function toHexColor(value, fallback) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const clamped = Math.max(0, Math.min(0xffffff, Number(value)));
  return `#${clamped.toString(16).padStart(6, '0')}`;
}

function formatMillimeters(value) {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const millimeters = mToMm(value);
  if (millimeters === null) {
    return '—';
  }
  return `${millimeters.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} mm`;
}

function formatMillimeterInput(value) {
  if (!Number.isFinite(value)) {
    return '';
  }
  const millimeters = mToMm(value);
  if (millimeters === null) {
    return '';
  }
  if (Number.isInteger(millimeters)) {
    return millimeters.toString();
  }
  return millimeters.toFixed(3).replace(/\.?(?:0+)$/, '');
}

function setOptionalFieldValue(form, fieldName, value) {
  if (!form) return;
  const input = form.querySelector(`[name="${fieldName}"]`);
  if (!input) return;
  const toggle = input.id ? form.querySelector(`[data-field-toggle="${input.id}"]`) : null;
  if (value === null || value === undefined) {
    input.value = '';
    if (toggle) {
      toggle.checked = false;
      toggle.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } else {
    input.value = value;
    if (toggle) {
      toggle.checked = true;
      toggle.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

function sanitizeChassisDefinition(definition) {
  const sanitized = {
    id: definition.id || `custom-chassis-${Date.now()}`,
    name: definition.name || 'Châssis personnalisé',
    length: Number(definition.length) || 1,
    width: Number(definition.width) || 1,
    height: Number(definition.height) || 1,
    mass: Number(definition.mass) || 0,
    ptac: Number(definition.ptac) || 0,
    wheelbase: Number(definition.wheelbase) || 1,
    frontAxleOffset: Number(definition.frontAxleOffset) || 0,
    payload: toNullableNumber(definition.payload),
    maxTowableBraked: toNullableNumber(definition.maxTowableBraked),
    maxAuthorizedWeight: toNullableNumber(definition.maxAuthorizedWeight),
    overallWidthMirrors: toNullableNumber(definition.overallWidthMirrors),
    heightUnladen: toNullableNumber(definition.heightUnladen),
    groundClearanceLoaded: toNullableNumber(definition.groundClearanceLoaded),
    floorHeightUnladen: toNullableNumber(definition.floorHeightUnladen),
    overallLengthMM: toNullableNumber(definition.overallLengthMM),
    overallWidthMM: toNullableNumber(definition.overallWidthMM),
    overallHeightMM: toNullableNumber(definition.overallHeightMM),
    maxLoadingLength: toNullableNumber(definition.maxLoadingLength),
    rearOverhang: toNullableNumber(definition.rearOverhang),
    heightWithRack: toNullableNumber(definition.heightWithRack),
    frontOverhang: toNullableNumber(definition.frontOverhang),
    rearOpeningHeight: toNullableNumber(definition.rearOpeningHeight),
    cargoVolume: toNullableNumber(definition.cargoVolume),
    interiorWidthWheelarches: toNullableNumber(definition.interiorWidthWheelarches),
    sideDoorEntryWidth: toNullableNumber(definition.sideDoorEntryWidth),
    rearDoorLowerEntryWidth: toNullableNumber(definition.rearDoorLowerEntryWidth),
    interiorHeight: toNullableNumber(definition.interiorHeight),
    usableLength: toNullableNumber(definition.usableLength),
    usableWidth: toNullableNumber(definition.usableWidth),
    usableHeight: toNullableNumber(definition.usableHeight),
    usableCenterOffsetX: toNullableNumber(definition.usableCenterOffsetX),
    usableCenterOffsetZ: toNullableNumber(definition.usableCenterOffsetZ),
    color: definition.color !== undefined ? definition.color : 0x8d939c,
    isCustom: definition.isCustom !== undefined ? definition.isCustom : true
  };
  return sanitized;
}

function pickFirstFinite(values, fallback) {
  for (const value of values) {
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return fallback;
}

function computeChassisSpatialMetrics(chassis) {
  const baseLength = Number.isFinite(chassis.length) ? chassis.length : 1;
  const baseWidth = Number.isFinite(chassis.width) ? chassis.width : 1;
  const baseHeight = Number.isFinite(chassis.height) ? chassis.height : 1;

  const exteriorLength = pickFirstFinite([
    mmToM(chassis.overallLengthMM),
    baseLength
  ], baseLength);

  const exteriorWidth = pickFirstFinite([
    mmToM(chassis.overallWidthMM),
    mmToM(chassis.overallWidthMirrors),
    baseWidth
  ], baseWidth);

  const exteriorHeight = pickFirstFinite([
    mmToM(chassis.overallHeightMM),
    mmToM(chassis.heightWithRack),
    mmToM(chassis.heightUnladen),
    baseHeight
  ], baseHeight);

  const frontOverhang = mmToM(chassis.frontOverhang);
  const rearOverhang = mmToM(chassis.rearOverhang);
  let usableLength = pickFirstFinite([
    Number.isFinite(chassis.usableLength) ? chassis.usableLength : null,
    mmToM(chassis.maxLoadingLength)
  ], null);

  if (!Number.isFinite(usableLength) && Number.isFinite(exteriorLength)) {
    const front = Number.isFinite(frontOverhang) ? frontOverhang : 0;
    const rear = Number.isFinite(rearOverhang) ? rearOverhang : 0;
    const candidate = exteriorLength - front - rear;
    if (candidate > 0.1) {
      usableLength = candidate;
    }
  }

  if (!Number.isFinite(usableLength)) {
    usableLength = exteriorLength;
  }

  const usableWidth = pickFirstFinite([
    Number.isFinite(chassis.usableWidth) ? chassis.usableWidth : null,
    mmToM(chassis.interiorWidthWheelarches),
    exteriorWidth
  ], exteriorWidth);

  const usableHeight = pickFirstFinite([
    Number.isFinite(chassis.usableHeight) ? chassis.usableHeight : null,
    mmToM(chassis.interiorHeight),
    exteriorHeight
  ], exteriorHeight);

  const usableCenterOffsetX = Number.isFinite(chassis.usableCenterOffsetX)
    ? chassis.usableCenterOffsetX
    : 0;

  const usableCenterOffsetZ = (() => {
    if (Number.isFinite(chassis.usableCenterOffsetZ)) {
      return chassis.usableCenterOffsetZ;
    }
    const front = Number.isFinite(frontOverhang) ? frontOverhang : 0;
    const rear = Number.isFinite(rearOverhang) ? rearOverhang : 0;
    if (front || rear) {
      return (front - rear) / 2;
    }
    return 0;
  })();

  return {
    exteriorLength,
    exteriorWidth,
    exteriorHeight,
    usableLength,
    usableWidth,
    usableHeight,
    usableCenterOffsetX,
    usableCenterOffsetZ
  };
}

function sanitizeModuleDefinition(definition, libraryMeta = null) {
  const shape = normalizeModuleShape(definition.shape);
  const sizeSource = definition.size || definition;
  let sizeX = Number(sizeSource.x ?? sizeSource.sizeX ?? sizeSource.width ?? 0.2) || 0.2;
  let sizeY = Number(sizeSource.y ?? sizeSource.sizeY ?? sizeSource.height ?? 0.2) || 0.2;
  let sizeZ = Number(sizeSource.z ?? sizeSource.sizeZ ?? sizeSource.length ?? 0.2) || 0.2;
  if (shape === 'cylinder') {
    const diameter = Math.max(sizeX, sizeZ);
    sizeX = diameter;
    sizeZ = diameter;
  }
  const fluidVolumeRaw = Math.max(0, Number(definition.fluidVolume ?? definition.volume ?? 0) || 0);
  const containsFluid = definition.containsFluid !== undefined
    ? Boolean(definition.containsFluid)
    : fluidVolumeRaw > 0;
  const defaultFillRaw = Number(definition.defaultFill ?? definition.fill ?? 0) || 0;
  const densityCandidate = Number(definition.density ?? 1000);
  const densityRaw = Number.isFinite(densityCandidate) ? densityCandidate : 1000;
  const libraryId = definition.libraryId || libraryMeta?.id || null;
  const libraryName = definition.libraryName || libraryMeta?.name || null;
  const librarySource = definition.librarySource || libraryMeta?.source || null;
  const libraryLicense = definition.libraryLicense || libraryMeta?.license || null;
  const libraryWebsite = definition.libraryWebsite || libraryMeta?.website || null;
  let id = definition.id ? definition.id.toString() : '';
  if (!id) {
    const slugBaseRaw = slugify(definition.name || libraryName || 'module');
    const slugBase = slugBaseRaw || `module-${Date.now()}`;
    const prefixedBase = libraryId && libraryId !== CUSTOM_MODULE_LIBRARY.id
      ? `${libraryId}-${slugBase}`
      : slugBase;
    const existingByName = libraryId
      ? moduleCatalog.find((item) => item.libraryId === libraryId && slugify(item.name) === slugBaseRaw)
      : null;
    id = existingByName ? existingByName.id : ensureUniqueModuleId(prefixedBase);
  }
  const resolvedLibraryId = libraryId
    || (definition.isCustom === false ? BUILTIN_MODULE_LIBRARY.id : CUSTOM_MODULE_LIBRARY.id);
  let resolvedLibraryMeta = moduleLibraries.get(resolvedLibraryId) || null;
  if (!resolvedLibraryMeta && libraryMeta) {
    moduleLibraries.set(resolvedLibraryId, { ...libraryMeta, id: resolvedLibraryId });
    resolvedLibraryMeta = moduleLibraries.get(resolvedLibraryId);
  }
  if (!resolvedLibraryMeta) {
    if (resolvedLibraryId === BUILTIN_MODULE_LIBRARY.id) {
      resolvedLibraryMeta = BUILTIN_MODULE_LIBRARY;
    } else if (resolvedLibraryId === CUSTOM_MODULE_LIBRARY.id) {
      resolvedLibraryMeta = CUSTOM_MODULE_LIBRARY;
    } else {
      resolvedLibraryMeta = {
        id: resolvedLibraryId,
        name: libraryName || resolvedLibraryId,
        description: libraryMeta?.description || null,
        source: librarySource || null,
        license: libraryLicense || null,
        website: libraryWebsite || null,
        isSystem: false
      };
      moduleLibraries.set(resolvedLibraryId, resolvedLibraryMeta);
    }
  } else if (libraryMeta) {
    moduleLibraries.set(resolvedLibraryId, {
      ...resolvedLibraryMeta,
      name: resolvedLibraryMeta.name || libraryMeta.name,
      description: resolvedLibraryMeta.description || libraryMeta.description || null,
      source: resolvedLibraryMeta.source || libraryMeta.source || null,
      license: resolvedLibraryMeta.license || libraryMeta.license || null,
      website: resolvedLibraryMeta.website || libraryMeta.website || null
    });
    resolvedLibraryMeta = moduleLibraries.get(resolvedLibraryId);
  }
  const sanitized = {
    id,
    type: definition.type || 'Custom',
    name: definition.name || 'Module personnalisé',
    size: { x: sizeX, y: sizeY, z: sizeZ },
    shape,
    color: definition.color !== undefined ? definition.color : 0x2c7ef4,
    massEmpty: Number(definition.massEmpty ?? definition.mass ?? 0) || 0,
    fluidVolume: containsFluid ? fluidVolumeRaw : 0,
    defaultFill: containsFluid ? Math.min(100, Math.max(0, defaultFillRaw)) : 0,
    density: containsFluid ? Math.max(1, densityRaw) : Math.max(0, densityRaw),
    containsFluid,
    libraryId: resolvedLibraryId,
    libraryName: libraryName || resolvedLibraryMeta?.name || null,
    librarySource: librarySource || resolvedLibraryMeta?.source || null,
    libraryLicense: libraryLicense || resolvedLibraryMeta?.license || null,
    libraryWebsite: libraryWebsite || resolvedLibraryMeta?.website || null,
    isCustom: definition.isCustom !== undefined
      ? definition.isCustom
      : resolvedLibraryId === CUSTOM_MODULE_LIBRARY.id
  };
  return sanitized;
}

function addChassisDefinition(definition) {
  const sanitized = sanitizeChassisDefinition(definition);
  const index = chassisCatalog.findIndex((item) => item.id === sanitized.id);
  if (index !== -1) {
    chassisCatalog[index] = sanitized;
  } else {
    chassisCatalog.push(sanitized);
  }
  populateChassisOptions(sanitized.id);
  return sanitized;
}

function addModuleDefinition(definition, libraryMeta = null) {
  const sanitized = sanitizeModuleDefinition(definition, libraryMeta);
  const index = moduleCatalog.findIndex((item) => item.id === sanitized.id);
  if (index !== -1) {
    moduleCatalog[index] = sanitized;
  } else {
    moduleCatalog.push(sanitized);
  }
  populateModuleButtons();
  updateModuleLibrarySummary();
  return moduleCatalog[index !== -1 ? index : moduleCatalog.length - 1];
}

async function readModuleLibraryFile(file) {
  if (!file) {
    throw new Error('Aucun fichier sélectionné.');
  }
  const fileName = file.name || 'bibliotheque';
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.zip')) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const entries = unzipSync(buffer);
    const entryName = Object.keys(entries).find((name) => name.toLowerCase().endsWith('.json'));
    if (!entryName) {
      throw new Error('Le fichier ZIP ne contient pas de description JSON de bibliothèque.');
    }
    const jsonText = strFromU8(entries[entryName]);
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      throw new Error('Impossible de lire le fichier JSON contenu dans l\'archive.');
    }
    return sanitizeModuleLibrary(parsed, fileName);
  }
  let text;
  try {
    text = await file.text();
  } catch (error) {
    throw new Error('Lecture du fichier impossible.');
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error('Le fichier sélectionné n\'est pas un JSON valide.');
  }
  return sanitizeModuleLibrary(data, fileName);
}

async function importModuleLibraryFile(file) {
  const library = await readModuleLibraryFile(file);
  const meta = {
    id: library.id,
    name: library.name,
    description: library.description,
    source: library.source,
    license: library.license,
    website: library.website,
    isSystem: library.isSystem
  };
  registerModuleLibraryMeta(meta);
  const modules = Array.isArray(library.modules) ? library.modules : [];
  let imported = 0;
  modules.forEach((moduleDefinition) => {
    if (!moduleDefinition) return;
    const prepared = {
      ...moduleDefinition,
      libraryId: meta.id,
      libraryName: moduleDefinition.libraryName || meta.name,
      librarySource: moduleDefinition.librarySource || meta.source,
      libraryLicense: moduleDefinition.libraryLicense || meta.license,
      libraryWebsite: moduleDefinition.libraryWebsite || meta.website,
      isCustom: false
    };
    const added = addModuleDefinition(prepared, meta);
    if (added) {
      imported += 1;
    }
  });
  updateModuleLibrarySummary();
  return { meta, count: imported };
}

async function handleModuleLibraryInput(event) {
  const input = event.target;
  const file = input.files && input.files[0];
  if (!file) {
    return;
  }
  try {
    const result = await importModuleLibraryFile(file);
    const count = result.count;
    const libraryName = result.meta.name || result.meta.id;
    const message = count > 0
      ? `La bibliothèque « ${libraryName} » a été importée (${count} module${count > 1 ? 's' : ''}).`
      : `La bibliothèque « ${libraryName} » a été importée, mais aucun module supplémentaire n'a été détecté.`;
    showModal('Import réussi', message);
  } catch (error) {
    console.error(error);
    showModal('Import impossible', error.message || 'Une erreur est survenue lors de l\'import.');
  } finally {
    input.value = '';
  }
}

function setFormCollapsed(button, form, collapsed) {
  if (!button || !form) return;
  const collapsedLabel = button.dataset.collapsedLabel || button.textContent;
  const expandedLabel = button.dataset.expandedLabel || collapsedLabel;
  form.classList.toggle('is-collapsed', collapsed);
  button.textContent = collapsed ? collapsedLabel : expandedLabel;
}

function toggleInlineForm(button, form) {
  if (!button || !form) return;
  const shouldCollapse = !form.classList.contains('is-collapsed');
  setFormCollapsed(button, form, shouldCollapse);
}

function closeInlineForm(button, form, reset = false) {
  if (!button || !form) return;
  setFormCollapsed(button, form, true);
  if (reset) {
    form.reset();
  }
}

function resetChassisFormState() {
  if (!ui.chassisForm) return;
  ui.chassisForm.dataset.mode = 'create';
  delete ui.chassisForm.dataset.targetId;
  const submitButton = ui.chassisForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = 'Enregistrer';
  }
}

function populateChassisForm(chassis) {
  if (!ui.chassisForm) return;
  const form = ui.chassisForm;
  const setValue = (selector, value) => {
    const input = form.querySelector(selector);
    if (input) {
      input.value = value !== undefined && value !== null ? value : '';
    }
  };

  setValue('#chassis-name', chassis.name ?? '');
  setValue('#chassis-length', chassis.length ?? '');
  setValue('#chassis-width', chassis.width ?? '');
  setValue('#chassis-height', chassis.height ?? '');
  setValue('#chassis-mass-input', chassis.mass ?? '');
  setValue('#chassis-ptac-input', chassis.ptac ?? '');
  setValue('#chassis-wheelbase-input', chassis.wheelbase ?? '');
  setValue('#chassis-front-axle', chassis.frontAxleOffset ?? '');

  setOptionalFieldValue(form, 'payload', chassis.payload);
  setOptionalFieldValue(form, 'maxTowableBraked', chassis.maxTowableBraked);
  setOptionalFieldValue(form, 'maxAuthorizedWeight', chassis.maxAuthorizedWeight);
  setOptionalFieldValue(form, 'overallWidthMirrors', chassis.overallWidthMirrors);
  setOptionalFieldValue(form, 'heightUnladen', chassis.heightUnladen);
  setOptionalFieldValue(form, 'groundClearanceLoaded', chassis.groundClearanceLoaded);
  setOptionalFieldValue(form, 'floorHeightUnladen', chassis.floorHeightUnladen);
  setOptionalFieldValue(form, 'overallLengthMM', chassis.overallLengthMM);
  setOptionalFieldValue(form, 'overallWidthMM', chassis.overallWidthMM);
  setOptionalFieldValue(form, 'overallHeightMM', chassis.overallHeightMM);
  setOptionalFieldValue(form, 'maxLoadingLength', chassis.maxLoadingLength);
  setOptionalFieldValue(form, 'rearOverhang', chassis.rearOverhang);
  setOptionalFieldValue(form, 'heightWithRack', chassis.heightWithRack);
  setOptionalFieldValue(form, 'frontOverhang', chassis.frontOverhang);
  setOptionalFieldValue(form, 'rearOpeningHeight', chassis.rearOpeningHeight);
  setOptionalFieldValue(form, 'cargoVolume', chassis.cargoVolume);
  setOptionalFieldValue(form, 'interiorWidthWheelarches', chassis.interiorWidthWheelarches);
  setOptionalFieldValue(form, 'sideDoorEntryWidth', chassis.sideDoorEntryWidth);
  setOptionalFieldValue(form, 'rearDoorLowerEntryWidth', chassis.rearDoorLowerEntryWidth);
  setOptionalFieldValue(form, 'interiorHeight', chassis.interiorHeight);

  const colorInput = form.querySelector('#chassis-color');
  if (colorInput) {
    colorInput.value = toHexColor(chassis.color ?? 0x6b7a8f, '#6b7a8f');
  }
}

function startChassisEdit(chassis) {
  if (!ui.chassisForm || !ui.btnAddChassis) return;
  ui.chassisForm.reset();
  ui.chassisForm.dataset.mode = 'edit';
  ui.chassisForm.dataset.targetId = chassis.id;
  const submitButton = ui.chassisForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = 'Mettre à jour';
  }
  populateChassisForm(chassis);
  setFormCollapsed(ui.btnAddChassis, ui.chassisForm, false);
}

function updateModuleFormFluidState(enabled) {
  if (!ui.moduleForm) return;
  const rows = ui.moduleForm.querySelectorAll('[data-fluid-row]');
  rows.forEach((row) => {
    row.classList.toggle('is-disabled', !enabled);
  });
  const inputs = ui.moduleForm.querySelectorAll('[data-fluid-input]');
  inputs.forEach((input) => {
    input.disabled = !enabled;
  });
}

function resetModuleFormState() {
  if (!ui.moduleForm) return;
  ui.moduleForm.dataset.mode = 'create';
  delete ui.moduleForm.dataset.targetId;
  const submitButton = ui.moduleForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = 'Enregistrer';
  }
  if (ui.moduleShapeSelect) {
    ui.moduleShapeSelect.value = 'box';
  }
  if (ui.moduleFluidToggle) {
    ui.moduleFluidToggle.checked = false;
  }
  updateModuleFormFluidState(false);
}

function populateModuleForm(definition) {
  if (!ui.moduleForm) return;
  const form = ui.moduleForm;
  const setValue = (selector, value) => {
    const input = form.querySelector(selector);
    if (input) {
      input.value = value !== undefined && value !== null ? value : '';
    }
  };

  const setMillimeterField = (selector, value) => {
    const input = form.querySelector(selector);
    if (!input) return;
    const numericValue = Number(value);
    input.value = Number.isFinite(numericValue)
      ? formatMillimeterInput(numericValue)
      : '';
  };

  setValue('#module-name', definition.name ?? '');
  setValue('#module-type', definition.type ?? '');
  setValue('#module-shape', normalizeModuleShape(definition.shape));
  setMillimeterField('#module-length', definition.size?.z ?? definition.sizeZ);
  setMillimeterField('#module-width', definition.size?.x ?? definition.sizeX);
  setMillimeterField('#module-height', definition.size?.y ?? definition.sizeY);
  setValue('#module-mass', definition.massEmpty ?? definition.mass ?? '');
  setOptionalFieldValue(form, 'fluidVolume', definition.fluidVolume ?? definition.volume);
  setOptionalFieldValue(form, 'defaultFill', definition.defaultFill ?? definition.fill);
  setOptionalFieldValue(form, 'density', definition.density);

  const colorInput = form.querySelector('#module-color');
  if (colorInput) {
    colorInput.value = toHexColor(definition.color ?? 0x2c7ef4, '#2c7ef4');
  }

  const fluidToggle = form.querySelector('#module-has-fluid');
  if (fluidToggle) {
    fluidToggle.checked = Boolean(definition.containsFluid);
    updateModuleFormFluidState(fluidToggle.checked);
  } else {
    updateModuleFormFluidState(false);
  }
}

function startModuleEdit(definition) {
  if (!ui.moduleForm || !ui.btnAddModule) return;
  ui.moduleForm.reset();
  ui.moduleForm.dataset.mode = 'edit';
  ui.moduleForm.dataset.targetId = definition.id;
  const submitButton = ui.moduleForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = 'Mettre à jour';
  }
  populateModuleForm(definition);
  setFormCollapsed(ui.btnAddModule, ui.moduleForm, false);
}

function applyModuleDefinitionUpdate(definition) {
  let updated = false;
  state.modules.forEach((mod) => {
    if (mod.definitionId !== definition.id) {
      return;
    }
    updated = true;
    mod.type = definition.type;
    mod.name = definition.name;
    mod.massEmpty = definition.massEmpty;
    mod.containsFluid = Boolean(definition.containsFluid);
    mod.fluidVolume = mod.containsFluid ? definition.fluidVolume : 0;
    mod.density = mod.containsFluid ? definition.density : 0;
    mod.size = { ...definition.size };
    mod.fill = mod.containsFluid ? Math.min(100, Math.max(0, mod.fill ?? definition.defaultFill ?? 0)) : 0;
    mod.shape = normalizeModuleShape(definition.shape);
    mod.libraryId = definition.libraryId;
    mod.libraryName = definition.libraryName;
    mod.librarySource = definition.librarySource;
    mod.libraryLicense = definition.libraryLicense;
    mod.libraryWebsite = definition.libraryWebsite;
    mod.isCustom = Boolean(definition.isCustom);
    const color = definition.color !== undefined ? definition.color : mod.color;
    const rebuild = updateMeshGeometryFromDefinition(mod.mesh, definition);
    if (rebuild && rebuild.mesh) {
      mod.mesh = rebuild.mesh;
      mod.color = rebuild.color !== undefined ? rebuild.color : color;
      mod.doors = Array.isArray(rebuild.mesh.userData?.doors)
        ? rebuild.mesh.userData.doors.map((door) => ({
            id: door.id,
            label: door.label,
            type: door.type,
            config: door.config,
            group: door.group,
            open: false,
            progress: 0,
            alert: false,
            isAnimating: false
          }))
        : [];
    } else {
      mod.color = color;
    }

    updateModuleLabel(mod);
    if (mod.mesh) {
      clampToBounds(mod.mesh.position, mod);
      syncModuleState(mod);
    }
  });

  if (updated) {
    updateModuleList();
    updateSelectionDetails();
    updateAnalysis();
    pushHistory();
  }
}

function initOptionalFieldToggles(form) {
  if (!form) return;
  const toggles = Array.from(form.querySelectorAll('[data-field-toggle]'));
  const syncState = (toggle) => {
    const targetId = toggle.dataset.fieldToggle;
    if (!targetId) return;
    const target = form.querySelector(`#${targetId}`);
    if (!target) return;
    const row = target.closest('.form-row');
    const active = toggle.checked;
    target.disabled = !active;
    target.required = active;
    if (row) {
      row.classList.toggle('is-disabled', !active);
    }
    if (!active) {
      target.dataset.cachedValue = target.value;
    }
    if (active && target.dataset.cachedValue !== undefined && target.value === '') {
      target.value = target.dataset.cachedValue;
    }
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener('change', () => syncState(toggle));
    syncState(toggle);
  });

  form.addEventListener('reset', () => {
    window.requestAnimationFrame(() => {
      toggles.forEach((toggle) => {
        syncState(toggle);
      });
    });
  });
}

function initModuleFluidToggleDependencies() {
  if (!ui.moduleForm) return;
  const form = ui.moduleForm;
  const volumeToggle = form.querySelector('#toggle-module-volume');
  if (!volumeToggle) return;
  const dependentSelectors = ['#toggle-module-fill', '#toggle-module-density'];
  const dependentToggles = dependentSelectors
    .map((selector) => form.querySelector(selector))
    .filter((toggle) => toggle);
  const previousStates = new Map();

  const syncDependents = () => {
    if (!volumeToggle.checked) {
      dependentToggles.forEach((toggle) => {
        previousStates.set(toggle, toggle.checked);
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        toggle.disabled = true;
      });
    } else {
      dependentToggles.forEach((toggle) => {
        toggle.disabled = false;
        const previous = previousStates.has(toggle) ? previousStates.get(toggle) : true;
        toggle.checked = previous;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  };

  volumeToggle.addEventListener('change', syncDependents);
  form.addEventListener('reset', () => {
    previousStates.clear();
    window.requestAnimationFrame(syncDependents);
  });
  syncDependents();
}

const state = {
  chassis: null,
  chassisMesh: null,
  chassisData: null,
  chassisOpacity: 1,
  qualityMode,
  showChassis: true,
  showGrid: true,
  showGabarit: true,
  showUsableVolume: true,
  showUsableBoundaries: true,
  showModuleLabels: true,
  walkwayWidth: 0.8,
  walkwayVisible: true,
  walkwayOffsetX: 0,
  walkwayOffsetZ: 0,
  modulesSolid: false,
  magnetismEnabled: false,
  magnetSnapDistance: DEFAULT_MAGNET_DISTANCE,
  modules: [],
  selected: null,
  clipboard: null,
  mode: 'translate',
  compareReference: null,
  lastAnalysis: null
};

const history = {
  undo: [],
  redo: []
};

const DEFAULT_ORBIT_AZIMUTH = Math.PI / 4;
const DEFAULT_ORBIT_POLAR = Math.PI / 4;
const DEFAULT_ORBIT_RADIUS = 14;
const DEFAULT_ORBIT_TARGET_Y = 1.2;

let scene, camera, renderer, grid, hemiLight, keyLight, fillLight, floorMesh;
let composer, renderPass, ssaoPass, smaaPass, postProcessingEnabled = false;
let contactShadowMesh = null;
let cogGroup = null;
const doorAnimations = new Set();
let doorAnimationFrame = null;
const measurementState = {
  active: false,
  points: [],
  group: null,
  line: null,
  label: null
};
let raycaster, pointer, dragPlane, dragActive = false;
let dragOffset = new THREE.Vector3();
let dragMode = 'horizontal';
let dragKind = null;
let workspaceBounds = new THREE.Box3();
let walkwayMesh, chassisGroup, gabaritGroup, usableVisualGroup, usableHandleGroup;
let activeHandle = null;
let handleDragState = null;
const usableHandles = {};

function formatModuleDimensions(size) {
  if (!size || !Number.isFinite(size.x) || !Number.isFinite(size.y) || !Number.isFinite(size.z)) {
    return 'Dimensions inconnues';
  }
  return `${formatMillimeters(size.x)} × ${formatMillimeters(size.y)} × ${formatMillimeters(size.z)}`;
}

function formatModuleShape(shape) {
  const normalized = normalizeModuleShape(shape);
  if (normalized === 'cylinder') {
    return 'Cylindre';
  }
  return 'Parallélépipède';
}

function formatMass(value) {
  return Number.isFinite(value) ? `${value.toLocaleString('fr-FR')} kg` : '—';
}

function formatFluidVolume(value) {
  return Number.isFinite(value) ? `${value.toLocaleString('fr-FR')} L` : '—';
}

function formatDensity(value) {
  return Number.isFinite(value) ? `${value.toLocaleString('fr-FR')} kg/m³` : '—';
}

function formatPercentage(value) {
  return Number.isFinite(value) ? `${value.toLocaleString('fr-FR')} %` : '—';
}

function disposeModuleLabel(module) {
  if (!module || !module.labelSprite) return;
  if (module.labelSprite.material) {
    if (module.labelSprite.material.map) {
      module.labelSprite.material.map.dispose();
    }
    module.labelSprite.material.dispose();
  }
  if (module.mesh) {
    module.mesh.remove(module.labelSprite);
  }
  module.labelSprite = null;
}

function setModuleHighlight(module, active) {
  if (!module || !module.mesh) return;
  module.mesh.traverse((child) => {
    const material = child.material;
    if (!material) return;
    if (Array.isArray(material)) {
      material.forEach((mat) => {
        if (mat && mat.opacity !== undefined) {
          if (mat.userData === undefined) {
            mat.userData = {};
          }
          if (mat.userData.baseOpacity === undefined) {
            mat.userData.baseOpacity = mat.opacity ?? 1;
          }
          mat.transparent = true;
          const target = active ? mat.userData.baseOpacity : mat.userData.baseOpacity * 0.55;
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, target, 0.35);
          mat.needsUpdate = true;
        }
      });
      return;
    }
    if (material.opacity !== undefined) {
      if (material.userData === undefined) {
        material.userData = {};
      }
      if (material.userData.baseOpacity === undefined) {
        material.userData.baseOpacity = material.opacity ?? 1;
      }
      material.transparent = true;
      const target = active ? material.userData.baseOpacity : material.userData.baseOpacity * 0.55;
      material.opacity = THREE.MathUtils.lerp(material.opacity, target, 0.35);
      material.needsUpdate = true;
    }
    if (material.linewidth !== undefined) {
      material.linewidth = active ? 1.6 : 1.1;
    }
  });
}

function updateModuleLabel(module) {
  if (!module || !module.mesh) return;

  disposeModuleLabel(module);

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  const text = formatModuleDimensions(module.size);
  const fontSize = 64;
  const padding = 32;
  context.font = `${fontSize}px 'Roboto', sans-serif`;
  const metrics = context.measureText(text);
  const width = Math.ceil(metrics.width + padding * 2);
  const height = Math.ceil(fontSize + padding * 2);

  canvas.width = width;
  canvas.height = height;

  context.font = `${fontSize}px 'Roboto', sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = 'rgba(16, 19, 26, 0.82)';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#ffffff';
  context.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  const scaleFactor = 0.0025;
  sprite.scale.set(width * scaleFactor, height * scaleFactor, 1);
  sprite.position.set(0, module.size.y + 0.25, 0);
  sprite.center.set(0.5, 0);
  sprite.visible = state.showModuleLabels;

  module.mesh.add(sprite);
  module.labelSprite = sprite;
}

function updateModuleLabelVisibility() {
  state.modules.forEach((mod) => {
    if (mod.labelSprite) {
      mod.labelSprite.visible = state.showModuleLabels;
    }
  });
}

function updateUsableBoundaryVisibility() {
  if (!usableVisualGroup) return;
  usableVisualGroup.children.forEach((child) => {
    const visualType = child.userData ? child.userData.visualType : null;
    if (visualType === 'boundary') {
      child.visible = state.showUsableVolume && state.showUsableBoundaries;
    } else if (visualType === 'usable-volume' || visualType === 'usable-edges') {
      child.visible = state.showUsableVolume;
    }
  });
}

function applyDisplayFilters() {
  if (grid) {
    grid.visible = state.showGrid;
  }
  if (chassisGroup) {
    chassisGroup.visible = state.showChassis;
  }
  if (state.chassisMesh) {
    state.chassisMesh.visible = state.showChassis;
  }
  if (gabaritGroup) {
    gabaritGroup.visible = state.showGabarit;
  }
  if (usableVisualGroup) {
    usableVisualGroup.visible = state.showUsableVolume;
  }
  if (usableHandleGroup) {
    usableHandleGroup.visible = state.showUsableVolume;
  }
  updateUsableBoundaryVisibility();
  updateModuleLabelVisibility();
}

const DEFAULT_WALKWAY_LENGTH = 12;
const WALKWAY_THICKNESS = 0.05;
const MIN_WALKWAY_WIDTH = 0.4;
const WALKWAY_SIDE_CLEARANCE = 0.05;
const WALKWAY_END_CLEARANCE = 0.2;
const COLLISION_EPSILON = 0.01;
const MIN_USABLE_WIDTH = 0.5;
const MIN_USABLE_LENGTH = 1.0;
const HANDLE_IDLE_COLOR = 0xff8c42;
const HANDLE_ACTIVE_COLOR = 0xffd166;
const orbitState = {
  active: false,
  pointer: new THREE.Vector2(),
  azimuth: DEFAULT_ORBIT_AZIMUTH,
  polar: DEFAULT_ORBIT_POLAR,
  radius: DEFAULT_ORBIT_RADIUS,
  target: new THREE.Vector3(0, DEFAULT_ORBIT_TARGET_Y, 0)
};

const ui = {};

function updateQualityButtons() {
  if (!ui.qualityButtons) return;
  ui.qualityButtons.forEach((button) => {
    const mode = button.dataset.qualityMode;
    button.classList.toggle('is-active', mode === state.qualityMode);
  });
}

function updateAxleIndicators(analysis) {
  if (!analysis) return;
  if (!ui.axleFrontBar || !ui.axleRearBar) return;
  const total = Math.max(analysis.totalMass, 1);
  const frontRatio = THREE.MathUtils.clamp(analysis.frontLoad / total, 0, 1);
  const rearRatio = THREE.MathUtils.clamp(analysis.rearLoad / total, 0, 1);
  const limits = { min: 0.45, max: 0.55 };
  setAxleBarState(ui.axleFrontBar, frontRatio, limits);
  setAxleBarState(ui.axleRearBar, rearRatio, limits);
  if (ui.axleFrontLabel) {
    ui.axleFrontLabel.textContent = `${Math.round(frontRatio * 100)} %`;
  }
  if (ui.axleRearLabel) {
    ui.axleRearLabel.textContent = `${Math.round(rearRatio * 100)} %`;
  }
}

function setAxleBarState(element, ratio, limits) {
  if (!element) return;
  element.style.setProperty('--axle-ratio', `${Math.round(ratio * 100)}%`);
  element.style.setProperty('--axle-scale', `${ratio}`);
  const within = ratio >= limits.min && ratio <= limits.max;
  element.classList.toggle('is-warning', !within);
}

function updateToleranceInfo(mod) {
  if (!ui.detailTolerance) return;
  if (!mod || !mod.mesh) {
    ui.detailTolerance.textContent = 'Δdim = —';
    return;
  }
  const target = mod.size || { x: 0, y: 0, z: 0 };
  const box = new THREE.Box3().setFromObject(mod.mesh);
  const actual = new THREE.Vector3().subVectors(box.max, box.min);
  const deltaX = Math.abs(actual.x - (target.x || 0));
  const deltaY = Math.abs(actual.y - (target.y || 0));
  const deltaZ = Math.abs(actual.z - (target.z || 0));
  const maxDelta = Math.max(deltaX, deltaY, deltaZ);
  ui.detailTolerance.textContent = `Δdim = ${(maxDelta * 1000).toFixed(1)} mm`;
}

function applyDoorTransform(module, door) {
  if (!door || !door.group) return;
  const userData = door.group.userData || {};
  if (userData.type === 'swing' && userData.pivot) {
    const angle = THREE.MathUtils.degToRad(userData.openAngleDeg || door.config?.openAngleDeg || 110) * door.progress;
    const hinge = userData.hingeSide === 1 || (door.config?.hingeSide || '').toLowerCase() === 'right';
    userData.pivot.rotation.y = hinge ? -angle : angle;
  } else if (userData.type === 'lift' && userData.panel) {
    const base = userData.panel.userData?.basePosition || new THREE.Vector3();
    const distance = userData.slideDistance || (door.config?.slideDistanceMm ?? 400) / 1000;
    userData.panel.position.y = base.y + distance * door.progress;
  }
  door.alert = detectDoorCollision(module, door);
}

function detectDoorCollision(module, door) {
  if (!door || !door.group) return false;
  const doorBox = new THREE.Box3().setFromObject(door.group);
  for (const other of state.modules) {
    if (!other.mesh || other === module) continue;
    const otherBox = new THREE.Box3().setFromObject(other.mesh);
    if (doorBox.intersectsBox(otherBox)) {
      return true;
    }
  }
  return false;
}

function requestDoorAnimation() {
  if (doorAnimationFrame !== null) return;
  doorAnimationFrame = requestAnimationFrame(stepDoorAnimations);
}

function stepDoorAnimations(time) {
  const finished = [];
  doorAnimations.forEach((anim) => {
    const elapsed = time - anim.startTime;
    const progress = THREE.MathUtils.clamp(elapsed / anim.duration, 0, 1);
    const eased = anim.easing ? anim.easing(progress) : progress;
    const value = THREE.MathUtils.lerp(anim.startProgress, anim.endProgress, eased);
    anim.door.progress = value;
    applyDoorTransform(anim.module, anim.door);
    if (progress >= 1) {
      anim.door.open = anim.targetOpen;
      anim.door.isAnimating = false;
      finished.push(anim);
    }
  });
  finished.forEach((anim) => doorAnimations.delete(anim));
  doorAnimationFrame = doorAnimations.size > 0 ? requestAnimationFrame(stepDoorAnimations) : null;
  updateDoorUi();
}

function scheduleDoorAnimation(module, door, targetOpen) {
  if (!door) return;
  doorAnimations.forEach((anim) => {
    if (anim.door === door) {
      doorAnimations.delete(anim);
    }
  });
  const duration = door.config?.openTimeMs ?? door.group.userData?.openTimeMs ?? 1200;
  door.isAnimating = true;
  doorAnimations.add({
    module,
    door,
    targetOpen,
    startTime: performance.now(),
    duration,
    startProgress: door.progress,
    endProgress: targetOpen ? 1 : 0,
    easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  });
  requestDoorAnimation();
}

function toggleDoor(module, doorId, open) {
  if (!module || !Array.isArray(module.doors)) return;
  const door = module.doors.find((item) => item.id === doorId);
  if (!door) return;
  if (door.open === open && !door.isAnimating) {
    return;
  }
  scheduleDoorAnimation(module, door, open);
  updateDoorUi();
}

function updateDoorUi() {
  if (!ui.doorControls) return;
  ui.doorControls.innerHTML = '';
  const module = state.selected;
  if (!module || !Array.isArray(module.doors) || module.doors.length === 0) {
    ui.doorControls.classList.add('is-empty');
    const empty = document.createElement('p');
    empty.className = 'door-empty';
    empty.textContent = 'Aucune cinématique disponible pour ce module.';
    ui.doorControls.appendChild(empty);
    return;
  }
  ui.doorControls.classList.remove('is-empty');
  module.doors.forEach((door) => {
    const row = document.createElement('div');
    row.className = 'door-row';
    if (door.alert) {
      row.classList.add('has-alert');
    }
    const label = document.createElement('div');
    label.className = 'door-label';
    label.textContent = door.label || door.id;
    row.appendChild(label);

    const status = document.createElement('div');
    status.className = 'door-status';
    status.textContent = door.open ? 'Ouverte' : 'Fermée';
    row.appendChild(status);

    const progress = document.createElement('div');
    progress.className = 'door-progress';
    progress.style.setProperty('--progress', `${Math.round(door.progress * 100)}%`);
    row.appendChild(progress);

    const actions = document.createElement('div');
    actions.className = 'door-actions';
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.dataset.doorId = door.id;
    openBtn.dataset.action = 'open-door';
    openBtn.textContent = 'Ouvrir';
    openBtn.disabled = door.open || door.isAnimating;
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.dataset.doorId = door.id;
    closeBtn.dataset.action = 'close-door';
    closeBtn.textContent = 'Fermer';
    closeBtn.disabled = !door.open || door.isAnimating;
    actions.append(openBtn, closeBtn);
    row.appendChild(actions);

    if (door.alert) {
      const alert = document.createElement('div');
      alert.className = 'door-alert';
      alert.textContent = 'Accès obstrué';
      row.appendChild(alert);
    }

    ui.doorControls.appendChild(row);
  });
}

function handleDoorControlClick(event) {
  const target = event.target.closest('button[data-action][data-door-id]');
  if (!target) return;
  event.preventDefault();
  const doorId = target.dataset.doorId;
  const action = target.dataset.action;
  const module = state.selected;
  if (!module) return;
  toggleDoor(module, doorId, action === 'open-door');
}

function ensureMeasurementGroup() {
  if (!measurementState.group) {
    measurementState.group = new THREE.Group();
    measurementState.group.name = 'measurement-tools';
    scene.add(measurementState.group);
  }
  return measurementState.group;
}

function createMeasurementLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = 'rgba(5, 9, 14, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.7, 0.35, 1);
  sprite.userData = { canvas, ctx, texture };
  return sprite;
}

function updateMeasurementLabel(distance) {
  if (!measurementState.label) {
    measurementState.label = createMeasurementLabel('');
    if (!measurementState.label) return;
    ensureMeasurementGroup().add(measurementState.label);
  }
  const { canvas, ctx, texture } = measurementState.label.userData;
  if (!canvas || !ctx || !texture) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(5, 9, 14, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${distance.toFixed(1)} mm`, canvas.width / 2, canvas.height / 2);
  texture.needsUpdate = true;
}

function clearMeasurementVisuals() {
  measurementState.points = [];
  if (measurementState.line) {
    if (measurementState.line.material) {
      measurementState.line.material.dispose();
    }
    if (measurementState.line.geometry) {
      measurementState.line.geometry.dispose();
    }
    measurementState.group?.remove(measurementState.line);
    measurementState.line = null;
  }
  if (measurementState.label) {
    measurementState.group?.remove(measurementState.label);
    if (measurementState.label.material?.map) {
      measurementState.label.material.map.dispose();
    }
    measurementState.label.material?.dispose();
    measurementState.label = null;
  }
}

function toggleMeasurementMode() {
  measurementState.active = !measurementState.active;
  clearMeasurementVisuals();
  if (measurementState.active) {
    ui.hud.innerHTML = 'Mode mesure : cliquez deux points (M pour quitter)';
  } else {
    ui.hud.innerHTML = '';
  }
}

function addMeasurementPoint(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(plane, hit)) {
    return;
  }
  if (measurementState.points.length >= 2) {
    clearMeasurementVisuals();
  }
  measurementState.points.push(hit.clone());
  if (measurementState.points.length === 2) {
    updateMeasurementVisual();
  }
}

function updateMeasurementVisual() {
  if (measurementState.points.length !== 2) return;
  const [a, b] = measurementState.points;
  const distance = a.clone().sub(b).length() * 1000;
  ensureMeasurementGroup();
  const positions = [a.x, a.y + 0.01, a.z, b.x, b.y + 0.01, b.z];
  if (!measurementState.line) {
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);
    const material = new LineMaterial({ color: 0xffe27a, linewidth: 3, transparent: true, opacity: 0.9 });
    registerLineMaterial(material);
    measurementState.line = new LineSegments2(geometry, material);
    measurementState.line.computeLineDistances();
    measurementState.group.add(measurementState.line);
  } else {
    measurementState.line.geometry.setPositions(positions);
    measurementState.line.geometry.needsUpdate = true;
    measurementState.line.computeLineDistances();
  }
  updateMeasurementLabel(distance);
  if (measurementState.label) {
    const midpoint = a.clone().add(b).multiplyScalar(0.5);
    measurementState.label.position.copy(midpoint).add(new THREE.Vector3(0, 0.4, 0));
  }
}

function disposeObject3D(object) {
  if (!object) return;
  if (object.children && object.children.length) {
    for (let i = object.children.length - 1; i >= 0; i--) {
      const child = object.children[i];
      disposeObject3D(child);
      object.remove(child);
    }
  }
  if (object.geometry) {
    object.geometry.dispose();
  }
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach((mat) => {
        if (mat && typeof mat.dispose === 'function') {
          mat.dispose();
        }
      });
    } else if (typeof object.material.dispose === 'function') {
      object.material.dispose();
    }
  }
}

function disposeGroupChildren(group) {
  if (!group) return;
  for (let i = group.children.length - 1; i >= 0; i--) {
    const child = group.children[i];
    group.remove(child);
    disposeObject3D(child);
  }
}

function getUsableBounds(chassis) {
  if (!chassis) return null;
  const width = Number.isFinite(chassis.usableWidth) ? chassis.usableWidth : chassis.width;
  const length = Number.isFinite(chassis.usableLength) ? chassis.usableLength : chassis.length;
  const centerX = Number.isFinite(chassis.usableCenterOffsetX) ? chassis.usableCenterOffsetX : 0;
  const centerZ = Number.isFinite(chassis.usableCenterOffsetZ) ? chassis.usableCenterOffsetZ : 0;
  return {
    minX: centerX - width / 2,
    maxX: centerX + width / 2,
    minZ: centerZ - length / 2,
    maxZ: centerZ + length / 2,
    width,
    length,
    centerX,
    centerZ
  };
}

function clampInterval(minValue, maxValue, minBound, maxBound, minSize) {
  let min = Math.min(minValue, maxValue);
  let max = Math.max(minValue, maxValue);
  min = Math.max(min, minBound);
  max = Math.min(max, maxBound);
  const available = Math.max(maxBound - minBound, 0);
  const requiredSize = Math.min(minSize, available);
  if (max - min < requiredSize) {
    const halfSize = requiredSize / 2;
    let center = (min + max) / 2;
    center = THREE.MathUtils.clamp(center, minBound + halfSize, maxBound - halfSize);
    min = center - halfSize;
    max = center + halfSize;
    if (min < minBound) {
      min = minBound;
      max = minBound + requiredSize;
    }
    if (max > maxBound) {
      max = maxBound;
      min = maxBound - requiredSize;
    }
  }
  min = THREE.MathUtils.clamp(min, minBound, maxBound);
  max = THREE.MathUtils.clamp(max, minBound, maxBound);
  if (max - min < requiredSize) {
    min = max - requiredSize;
    if (min < minBound) {
      min = minBound;
      max = minBound + requiredSize;
    }
  }
  return { min, max };
}

function commitUsableBounds(bounds) {
  if (!state.chassisData) return;
  const chassis = state.chassisData;
  const halfWidth = chassis.width / 2;
  const halfLength = chassis.length / 2;
  const clampedX = clampInterval(bounds.minX, bounds.maxX, -halfWidth, halfWidth, MIN_USABLE_WIDTH);
  const clampedZ = clampInterval(bounds.minZ, bounds.maxZ, -halfLength, halfLength, MIN_USABLE_LENGTH);

  chassis.usableWidth = clampedX.max - clampedX.min;
  chassis.usableLength = clampedZ.max - clampedZ.min;
  chassis.usableCenterOffsetX = (clampedX.min + clampedX.max) / 2;
  chassis.usableCenterOffsetZ = (clampedZ.min + clampedZ.max) / 2;

  updateWorkspaceBounds(chassis);
  relocateWalkway();
  updateUsableVolumeVisuals();
  updateUsableHandlePositions();
  refreshChassisInfo();
  updateAnalysis();
}

function ensureUsableHandles() {
  if (!usableHandleGroup) return;
  const ensureHandle = (key, geometryFactory) => {
    if (usableHandles[key]) return;
    const geometry = geometryFactory();
    const material = new THREE.MeshBasicMaterial({
      color: HANDLE_IDLE_COLOR,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: false
    });
    const handle = new THREE.Mesh(geometry, material);
    handle.userData.handleType = key;
    handle.userData.baseColor = HANDLE_IDLE_COLOR;
    handle.userData.activeColor = HANDLE_ACTIVE_COLOR;
    usableHandleGroup.add(handle);
    usableHandles[key] = handle;
  };

  const defaultBarGeometry = () => new THREE.BoxGeometry(0.12, 0.5, 0.5);
  ensureHandle('left', defaultBarGeometry);
  ensureHandle('right', defaultBarGeometry);
  ensureHandle('front', defaultBarGeometry);
  ensureHandle('back', defaultBarGeometry);
  if (!usableHandles.center) {
    const centerMaterial = new THREE.MeshBasicMaterial({
      color: HANDLE_IDLE_COLOR,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: false
    });
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 18), centerMaterial);
    center.userData.handleType = 'center';
    center.userData.baseColor = HANDLE_IDLE_COLOR;
    center.userData.activeColor = HANDLE_ACTIVE_COLOR;
    usableHandleGroup.add(center);
    usableHandles.center = center;
  }
}

function updateUsableHandleGeometry(handle, width, height, depth) {
  if (!handle) return;
  if (handle.geometry) {
    handle.geometry.dispose();
  }
  handle.geometry = new THREE.BoxGeometry(Math.max(width, 0.08), Math.max(height, 0.1), Math.max(depth, 0.08));
}

function updateUsableHandlePositions() {
  ensureUsableHandles();
  if (!state.chassisData || !usableHandleGroup) {
    Object.values(usableHandles).forEach((handle) => {
      if (handle) handle.visible = false;
    });
    return;
  }
  const bounds = getUsableBounds(state.chassisData);
  if (!bounds) {
    Object.values(usableHandles).forEach((handle) => {
      if (handle) handle.visible = false;
    });
    return;
  }
  const usableHeight = Number.isFinite(state.chassisData.usableHeight)
    ? state.chassisData.usableHeight
    : state.chassisData.height;
  const clampedHeight = Math.max(usableHeight, 0.2);
  const handleHeight = Math.min(Math.max(clampedHeight * 0.8, 0.25), clampedHeight + 0.2);
  const handleDepth = Math.max(Math.min(bounds.length, 3), 0.3);
  const handleWidth = Math.max(Math.min(bounds.width, 3), 0.3);
  const midY = clampedHeight / 2;

  updateUsableHandleGeometry(usableHandles.left, 0.12, handleHeight, handleDepth);
  updateUsableHandleGeometry(usableHandles.right, 0.12, handleHeight, handleDepth);
  updateUsableHandleGeometry(usableHandles.front, handleWidth, handleHeight, 0.12);
  updateUsableHandleGeometry(usableHandles.back, handleWidth, handleHeight, 0.12);

  if (usableHandles.left) {
    usableHandles.left.visible = true;
    usableHandles.left.position.set(bounds.minX, midY, bounds.centerZ);
  }
  if (usableHandles.right) {
    usableHandles.right.visible = true;
    usableHandles.right.position.set(bounds.maxX, midY, bounds.centerZ);
  }
  if (usableHandles.front) {
    usableHandles.front.visible = true;
    usableHandles.front.position.set(bounds.centerX, midY, bounds.maxZ);
  }
  if (usableHandles.back) {
    usableHandles.back.visible = true;
    usableHandles.back.position.set(bounds.centerX, midY, bounds.minZ);
  }
  if (usableHandles.center) {
    usableHandles.center.visible = true;
    usableHandles.center.position.set(bounds.centerX, clampedHeight + 0.25, bounds.centerZ);
  }

  if (usableHandleGroup) {
    usableHandleGroup.visible = state.showUsableVolume;
  }
}

function updateUsableVolumeVisuals() {
  disposeGroupChildren(usableVisualGroup);
  if (!state.chassisData || !usableVisualGroup) return;

  const chassis = state.chassisData;
  const bounds = getUsableBounds(chassis);
  if (!bounds) return;

  const usableHeight = Number.isFinite(chassis.usableHeight) ? chassis.usableHeight : chassis.height;
  const usableMaterial = new THREE.MeshBasicMaterial({
    color: 0x2be8a2,
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });
  const usableGeometry = new THREE.BoxGeometry(bounds.width, usableHeight, bounds.length);
  const usableMesh = new THREE.Mesh(usableGeometry, usableMaterial);
  usableMesh.position.set(bounds.centerX, usableHeight / 2, bounds.centerZ);
  usableMesh.raycast = () => {};
  usableMesh.userData.visualType = 'usable-volume';
  usableMesh.visible = state.showUsableVolume;
  usableVisualGroup.add(usableMesh);

  const usableEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(usableGeometry),
    new THREE.LineBasicMaterial({ color: 0x2be8a2, transparent: true, opacity: 0.9 })
  );
  usableEdges.position.copy(usableMesh.position);
  usableEdges.raycast = () => {};
  usableEdges.userData.visualType = 'usable-edges';
  usableEdges.visible = state.showUsableVolume;
  usableVisualGroup.add(usableEdges);

  const boundaryMaterial = new THREE.MeshBasicMaterial({
    color: 0xff7d5c,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const chassisHalfWidth = chassis.width / 2;
  const chassisHalfLength = chassis.length / 2;
  const chassisHeight = chassis.height;

  const usableMinX = bounds.minX;
  const usableMaxX = bounds.maxX;
  const usableMinZ = bounds.minZ;
  const usableMaxZ = bounds.maxZ;

  if (usableMinX > -chassisHalfWidth + 1e-3) {
    const width = usableMinX - (-chassisHalfWidth);
    const sideGeom = new THREE.BoxGeometry(width, chassisHeight, chassis.length);
    const sideMesh = new THREE.Mesh(sideGeom, boundaryMaterial.clone());
    sideMesh.position.set(-chassisHalfWidth + width / 2, chassisHeight / 2, 0);
    sideMesh.raycast = () => {};
    sideMesh.userData.visualType = 'boundary';
    sideMesh.visible = state.showUsableVolume && state.showUsableBoundaries;
    usableVisualGroup.add(sideMesh);
  }
  if (usableMaxX < chassisHalfWidth - 1e-3) {
    const width = chassisHalfWidth - usableMaxX;
    const sideGeom = new THREE.BoxGeometry(width, chassisHeight, chassis.length);
    const sideMesh = new THREE.Mesh(sideGeom, boundaryMaterial.clone());
    sideMesh.position.set(chassisHalfWidth - width / 2, chassisHeight / 2, 0);
    sideMesh.raycast = () => {};
    sideMesh.userData.visualType = 'boundary';
    sideMesh.visible = state.showUsableVolume && state.showUsableBoundaries;
    usableVisualGroup.add(sideMesh);
  }
  if (usableMinZ > -chassisHalfLength + 1e-3) {
    const length = usableMinZ - (-chassisHalfLength);
    const frontGeom = new THREE.BoxGeometry(chassis.width, chassisHeight, length);
    const frontMesh = new THREE.Mesh(frontGeom, boundaryMaterial.clone());
    frontMesh.position.set(0, chassisHeight / 2, -chassisHalfLength + length / 2);
    frontMesh.raycast = () => {};
    frontMesh.userData.visualType = 'boundary';
    frontMesh.visible = state.showUsableVolume && state.showUsableBoundaries;
    usableVisualGroup.add(frontMesh);
  }
  if (usableMaxZ < chassisHalfLength - 1e-3) {
    const length = chassisHalfLength - usableMaxZ;
    const rearGeom = new THREE.BoxGeometry(chassis.width, chassisHeight, length);
    const rearMesh = new THREE.Mesh(rearGeom, boundaryMaterial.clone());
    rearMesh.position.set(0, chassisHeight / 2, chassisHalfLength - length / 2);
    rearMesh.raycast = () => {};
    rearMesh.userData.visualType = 'boundary';
    rearMesh.visible = state.showUsableVolume && state.showUsableBoundaries;
    usableVisualGroup.add(rearMesh);
  }

  if (usableHeight < chassisHeight - 1e-3) {
    const height = chassisHeight - usableHeight;
    const topGeom = new THREE.BoxGeometry(bounds.width, height, bounds.length);
    const topMesh = new THREE.Mesh(topGeom, boundaryMaterial.clone());
    topMesh.position.set(bounds.centerX, usableHeight + height / 2, bounds.centerZ);
    topMesh.raycast = () => {};
    topMesh.userData.visualType = 'boundary';
    topMesh.visible = state.showUsableVolume && state.showUsableBoundaries;
    usableVisualGroup.add(topMesh);
  }

  if (usableVisualGroup) {
    usableVisualGroup.visible = state.showUsableVolume;
  }
  updateUsableBoundaryVisibility();
}

function intersectUsableHandles(event) {
  if (!usableHandleGroup) return [];
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(usableHandleGroup.children, false);
}

function updateHandleHud() {
  if (!ui.hud || !state.chassisData) return;
  ui.hud.innerHTML = `Volume utile <span>Largeur : ${state.chassisData.usableWidth.toFixed(2)} m</span><span>Longueur : ${state.chassisData.usableLength.toFixed(2)} m</span>`;
}

function beginHandleDrag(handle, event) {
  if (!handle || !handle.userData || !handle.userData.handleType) return;
  dragActive = true;
  dragKind = 'usable-handle';
  activeHandle = handle;
  const startBounds = getUsableBounds(state.chassisData);
  if (!startBounds) {
    dragActive = false;
    dragKind = null;
    activeHandle = null;
    return;
  }
  handleDragState = {
    type: handle.userData.handleType,
    startBounds,
    offsetX: 0,
    offsetZ: 0
  };
  dragPlane.set(new THREE.Vector3(0, 1, 0), 0);
  const point = getPlaneIntersection(event, dragPlane);
  if (point) {
    const worldPos = handle.getWorldPosition(new THREE.Vector3());
    handleDragState.offsetX = worldPos.x - point.x;
    handleDragState.offsetZ = worldPos.z - point.z;
  }
  if (handle.material && handle.material.color && handle.userData.activeColor) {
    handle.material.color.setHex(handle.userData.activeColor);
  }
  renderer.domElement.setPointerCapture(event.pointerId);
  updateHandleHud();
}

function updateHandleDrag(event) {
  if (!handleDragState || !handleDragState.startBounds) return;
  const point = getPlaneIntersection(event, dragPlane);
  if (!point) return;
  const { type, startBounds, offsetX, offsetZ } = handleDragState;
  let minX = startBounds.minX;
  let maxX = startBounds.maxX;
  let minZ = startBounds.minZ;
  let maxZ = startBounds.maxZ;

  if (type === 'left') {
    minX = snapValue(point.x + offsetX);
    maxX = startBounds.maxX;
  } else if (type === 'right') {
    maxX = snapValue(point.x + offsetX);
    minX = startBounds.minX;
  } else if (type === 'front') {
    maxZ = snapValue(point.z + offsetZ);
    minZ = startBounds.minZ;
  } else if (type === 'back') {
    minZ = snapValue(point.z + offsetZ);
    maxZ = startBounds.maxZ;
  } else if (type === 'center') {
    const width = startBounds.width;
    const length = startBounds.length;
    const centerX = snapValue(point.x + offsetX);
    const centerZ = snapValue(point.z + offsetZ);
    minX = centerX - width / 2;
    maxX = centerX + width / 2;
    minZ = centerZ - length / 2;
    maxZ = centerZ + length / 2;
  }

  commitUsableBounds({ minX, maxX, minZ, maxZ });
  updateHandleHud();
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c12);

  camera = new THREE.PerspectiveCamera(52, getViewportRatio(), 0.1, 200);
  camera.position.set(8, 7.5, 9.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(getViewportWidth(), getViewportHeight());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = QUALITY_PROFILES[qualityMode].toneMappingExposure;
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.touchAction = 'none';
  document.getElementById('canvas-container').appendChild(renderer.domElement);
  renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());

  hemiLight = new THREE.HemisphereLight(0xf1f5ff, 0x1b2230, 0.68);
  scene.add(hemiLight);

  keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(6, 10, 5);
  configureDirectionalLight(keyLight);
  scene.add(keyLight);

  fillLight = new THREE.DirectionalLight(0xd9e2ff, 0.55);
  fillLight.position.set(-8, 6, -6);
  configureDirectionalLight(fillLight);
  scene.add(fillLight);

  grid = new THREE.GridHelper(20, QUALITY_PROFILES[qualityMode].gridDivisions, 0x3ea6ff, 0x1f2b3d);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    getPhysicalMaterial(0x10161d, 'paintedMetal', { roughness: 0.7, metalness: 0.05 })
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -0.002;
  floorMesh.receiveShadow = true;
  floorMesh.material.transparent = true;
  floorMesh.material.opacity = 0.98;
  scene.add(floorMesh);

  contactShadowMesh = createContactShadowMesh();
  scene.add(contactShadowMesh);

  chassisGroup = new THREE.Group();
  scene.add(chassisGroup);

  gabaritGroup = new THREE.Group();
  scene.add(gabaritGroup);

  usableVisualGroup = new THREE.Group();
  scene.add(usableVisualGroup);

  usableHandleGroup = new THREE.Group();
  scene.add(usableHandleGroup);

  walkwayMesh = createWalkwayMesh(state.walkwayWidth, DEFAULT_WALKWAY_LENGTH, state.walkwayVisible);
  scene.add(walkwayMesh);
  ensureCogVisual();

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  initPostProcessing();
  applyQualityMode(qualityMode, { skipSave: true });
  applyDisplayFilters();

  updateCameraFromOrbit();
  animate();
}

function getViewportWidth() {
  return document.getElementById('canvas-container').clientWidth || window.innerWidth;
}

function getViewportHeight() {
  return document.getElementById('canvas-container').clientHeight || window.innerHeight - 160;
}

function getViewportRatio() {
  return getViewportWidth() / getViewportHeight();
}

function toMillimeters(value) {
  return Math.round(value * 1000);
}

function getEffectiveWalkwayLength() {
  if (!state.chassisData || !Number.isFinite(state.chassisData.usableLength)) {
    return DEFAULT_WALKWAY_LENGTH;
  }
  const usableLength = state.chassisData.usableLength - WALKWAY_END_CLEARANCE * 2;
  return Math.max(usableLength, 0.5);
}

function getEffectiveWalkwayWidth() {
  let width = state.walkwayWidth;
  if (state.chassisData && Number.isFinite(state.chassisData.usableWidth)) {
    const maxWidth = Math.max(state.chassisData.usableWidth - WALKWAY_SIDE_CLEARANCE * 2, 0.1);
    width = Math.min(width, maxWidth);
    const minWidth = Math.min(MIN_WALKWAY_WIDTH, maxWidth);
    width = Math.max(width, minWidth);
    width = Math.min(width, state.chassisData.usableWidth);
  } else {
    width = Math.max(width, MIN_WALKWAY_WIDTH);
  }
  return Math.max(width, 0.1);
}

function syncWalkwayControls(width) {
  if (!ui.walkwayRange || !ui.walkwayValue) return;
  const widthMm = toMillimeters(width);
  const defaultMin = Number(ui.walkwayRange.dataset.minDefault || ui.walkwayRange.min || widthMm);
  const defaultMax = Number(ui.walkwayRange.dataset.maxDefault || ui.walkwayRange.max || widthMm);
  const nextMin = widthMm < defaultMin ? widthMm : defaultMin;
  const nextMax = widthMm > defaultMax ? widthMm : defaultMax;
  ui.walkwayRange.min = nextMin;
  ui.walkwayRange.max = nextMax;
  ui.walkwayRange.value = widthMm;
  ui.walkwayValue.textContent = `${widthMm} mm`;
}

function getWalkwayOffsetLimits(width, length) {
  let maxX = 0;
  let maxZ = 0;
  if (state.chassisData && Number.isFinite(state.chassisData.usableWidth)) {
    const halfChassisWidth = state.chassisData.usableWidth / 2;
    const halfWalkwayWidth = width / 2;
    maxX = Math.max(halfChassisWidth - halfWalkwayWidth - WALKWAY_SIDE_CLEARANCE, 0);
  }
  if (state.chassisData && Number.isFinite(state.chassisData.usableLength)) {
    const halfChassisLength = state.chassisData.usableLength / 2;
    const halfWalkwayLength = length / 2;
    maxZ = Math.max(halfChassisLength - halfWalkwayLength, 0);
  } else {
    const halfDefaultLength = DEFAULT_WALKWAY_LENGTH / 2;
    const halfWalkwayLength = length / 2;
    maxZ = Math.max(halfDefaultLength - halfWalkwayLength, 0);
  }
  return { maxX, maxZ };
}

function getWalkwayBounds() {
  const width = getEffectiveWalkwayWidth();
  const length = getEffectiveWalkwayLength();
  const limits = getWalkwayOffsetLimits(width, length);
  const offsetX = THREE.MathUtils.clamp(state.walkwayOffsetX || 0, -limits.maxX, limits.maxX);
  const offsetZ = THREE.MathUtils.clamp(state.walkwayOffsetZ || 0, -limits.maxZ, limits.maxZ);
  const baseX = state.chassisData && Number.isFinite(state.chassisData.usableCenterOffsetX)
    ? state.chassisData.usableCenterOffsetX
    : 0;
  const baseZ = state.chassisData && Number.isFinite(state.chassisData.usableCenterOffsetZ)
    ? state.chassisData.usableCenterOffsetZ
    : 0;
  const centerX = baseX + offsetX;
  const centerZ = baseZ + offsetZ;
  return {
    width,
    length,
    centerX,
    centerZ,
    minX: centerX - width / 2,
    maxX: centerX + width / 2,
    minZ: centerZ - length / 2,
    maxZ: centerZ + length / 2
  };
}

function clampWalkwayOffsets(width, length) {
  const limits = getWalkwayOffsetLimits(width, length);
  const currentX = Number.isFinite(state.walkwayOffsetX) ? state.walkwayOffsetX : 0;
  const currentZ = Number.isFinite(state.walkwayOffsetZ) ? state.walkwayOffsetZ : 0;
  state.walkwayOffsetX = THREE.MathUtils.clamp(currentX, -limits.maxX, limits.maxX);
  state.walkwayOffsetZ = THREE.MathUtils.clamp(currentZ, -limits.maxZ, limits.maxZ);
  return limits;
}

function syncWalkwayPositionControls(width, length, limits) {
  if (!ui.walkwayOffsetXRange || !ui.walkwayOffsetXValue || !ui.walkwayOffsetZRange || !ui.walkwayOffsetZValue) {
    return;
  }
  const bounds = limits || getWalkwayOffsetLimits(width, length);
  const limitXmm = Math.round(bounds.maxX * 1000);
  const limitZmm = Math.round(bounds.maxZ * 1000);
  const offsetXmm = toMillimeters(state.walkwayOffsetX);
  const offsetZmm = toMillimeters(state.walkwayOffsetZ);

  ui.walkwayOffsetXRange.min = `${-limitXmm}`;
  ui.walkwayOffsetXRange.max = `${limitXmm}`;
  ui.walkwayOffsetXRange.value = `${offsetXmm}`;
  ui.walkwayOffsetXRange.disabled = limitXmm === 0;
  ui.walkwayOffsetXValue.textContent = `${offsetXmm.toLocaleString('fr-FR')} mm`;

  ui.walkwayOffsetZRange.min = `${-limitZmm}`;
  ui.walkwayOffsetZRange.max = `${limitZmm}`;
  ui.walkwayOffsetZRange.value = `${offsetZmm}`;
  ui.walkwayOffsetZRange.disabled = limitZmm === 0;
  ui.walkwayOffsetZValue.textContent = `${offsetZmm.toLocaleString('fr-FR')} mm`;
}

function applyWalkwayOffset(width, length) {
  if (!walkwayMesh) return;
  const limits = clampWalkwayOffsets(width, length);
  const baseX = state.chassisData && Number.isFinite(state.chassisData.usableCenterOffsetX)
    ? state.chassisData.usableCenterOffsetX
    : 0;
  const baseZ = state.chassisData && Number.isFinite(state.chassisData.usableCenterOffsetZ)
    ? state.chassisData.usableCenterOffsetZ
    : 0;
  walkwayMesh.position.set(baseX + state.walkwayOffsetX, WALKWAY_THICKNESS / 2, baseZ + state.walkwayOffsetZ);
  syncWalkwayPositionControls(width, length, limits);
  relocateModulesInsideBounds();
}

function syncChassisTransparencyControls() {
  if (!ui.chassisTransparencyRange || !ui.chassisTransparencyValue) return;
  const transparencyPercent = Math.round((1 - state.chassisOpacity) * 100);
  ui.chassisTransparencyRange.value = `${transparencyPercent}`;
  ui.chassisTransparencyValue.textContent = `${transparencyPercent}%`;
}

function setChassisOpacity(opacity) {
  const clamped = Math.min(1, Math.max(0, opacity));
  state.chassisOpacity = clamped;
  syncChassisTransparencyControls();
  if (state.chassisMesh && state.chassisMesh.material) {
    const material = state.chassisMesh.material;
    material.opacity = clamped;
    material.transparent = clamped < 1;
    material.depthWrite = clamped >= 0.999;
    material.needsUpdate = true;
  }
}

function createWalkwayMesh(width, length, visible) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x21c77a,
    opacity: 0.18,
    transparent: true,
    depthWrite: false
  });
  const geom = new THREE.BoxGeometry(width, WALKWAY_THICKNESS, length);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.y = WALKWAY_THICKNESS / 2;
  mesh.visible = visible;
  mesh.name = 'walkway';
  return mesh;
}

function updateWalkway() {
  const width = getEffectiveWalkwayWidth();
  const length = getEffectiveWalkwayLength();
  if (Math.abs(width - state.walkwayWidth) > 1e-6) {
    state.walkwayWidth = width;
    syncWalkwayControls(width);
  } else if (ui.walkwayRange && ui.walkwayValue) {
    syncWalkwayControls(width);
  }
  walkwayMesh.geometry.dispose();
  walkwayMesh.geometry = new THREE.BoxGeometry(width, WALKWAY_THICKNESS, length);
  walkwayMesh.visible = state.walkwayVisible;
  applyWalkwayOffset(width, length);
}

function initUI() {
  ui.chassisSelect = document.getElementById('chassis-select');
  ui.chassisPtac = document.getElementById('chassis-ptac');
  ui.chassisWheelbase = document.getElementById('chassis-wheelbase');
  ui.chassisMass = document.getElementById('chassis-mass');
  ui.chassisDims = document.getElementById('chassis-dims');
  ui.moduleButtons = document.getElementById('module-buttons');
  ui.moduleList = document.getElementById('module-list');
  ui.btnImportModuleLibrary = document.getElementById('btn-import-module-library');
  ui.moduleLibraryInput = document.getElementById('module-library-input');
  ui.moduleLibraryList = document.getElementById('module-library-list');
  ui.walkwayRange = document.getElementById('walkway-width');
  ui.walkwayValue = document.getElementById('walkway-width-value');
  ui.walkwayOffsetXRange = document.getElementById('walkway-offset-x');
  ui.walkwayOffsetXValue = document.getElementById('walkway-offset-x-value');
  ui.walkwayOffsetZRange = document.getElementById('walkway-offset-z');
  ui.walkwayOffsetZValue = document.getElementById('walkway-offset-z-value');
  ui.walkwayToggle = document.getElementById('walkway-toggle');
  ui.chassisTransparencyRange = document.getElementById('chassis-transparency');
  ui.chassisTransparencyValue = document.getElementById('chassis-transparency-value');
  ui.btnRecenterView = document.getElementById('btn-recenter-view');
  ui.detailName = document.getElementById('detail-name');
  ui.detailMass = document.getElementById('detail-mass');
  ui.detailCapacity = document.getElementById('detail-capacity');
  ui.detailFill = document.getElementById('detail-fill');
  ui.detailFillValue = document.getElementById('detail-fill-value');
  ui.detailLibrary = document.getElementById('detail-library');
  ui.detailLibraryRow = document.querySelector('[data-detail-row="library"]');
  ui.detailLibrarySource = document.getElementById('detail-library-source');
  ui.detailLibrarySourceRow = document.querySelector('[data-detail-row="library-source"]');
  ui.detailLibraryLicense = document.getElementById('detail-library-license');
  ui.detailLibraryLicenseRow = document.querySelector('[data-detail-row="library-license"]');
  ui.detailLibraryLink = document.getElementById('detail-library-link');
  ui.detailLibraryWebsiteRow = document.querySelector('[data-detail-row="library-website"]');
  ui.detailPosX = document.getElementById('detail-pos-x');
  ui.detailPosY = document.getElementById('detail-pos-y');
  ui.detailPosZ = document.getElementById('detail-pos-z');
  ui.detailRotX = document.getElementById('detail-rot-x');
  ui.detailRotY = document.getElementById('detail-rot-y');
  ui.detailTolerance = document.getElementById('detail-tolerance');
  ui.analysisMass = document.getElementById('analysis-mass');
  ui.analysisCoG = document.getElementById('analysis-cog');
  ui.analysisFront = document.getElementById('analysis-front');
  ui.analysisRear = document.getElementById('analysis-rear');
  ui.analysisMargin = document.getElementById('analysis-margin');
  ui.axleFrontBar = document.getElementById('axle-front-bar');
  ui.axleRearBar = document.getElementById('axle-rear-bar');
  ui.axleFrontLabel = document.getElementById('axle-front-label');
  ui.axleRearLabel = document.getElementById('axle-rear-label');
  ui.indicatorPtac = document.getElementById('indicator-ptac');
  ui.indicatorWalkway = document.getElementById('indicator-walkway');
  ui.indicatorErrors = document.getElementById('indicator-errors');
  ui.hud = document.getElementById('hud');
  ui.modal = document.getElementById('modal');
  ui.modalTitle = document.getElementById('modal-title');
  ui.modalBody = document.getElementById('modal-body');
  ui.modalClose = document.getElementById('modal-close');
  ui.modalOk = document.getElementById('modal-ok');
  ui.fileInput = document.getElementById('file-input');
  ui.btnAddChassis = document.getElementById('btn-add-chassis');
  ui.btnEditChassis = document.getElementById('btn-edit-chassis');
  ui.chassisForm = document.getElementById('chassis-form');
  ui.btnAddModule = document.getElementById('btn-add-module');
  ui.moduleForm = document.getElementById('module-form');
  ui.moduleFluidToggle = document.getElementById('module-has-fluid');
  ui.moduleShapeSelect = document.getElementById('module-shape');
  ui.filterShowChassis = document.getElementById('filter-show-chassis');
  ui.filterShowGrid = document.getElementById('filter-show-grid');
  ui.filterShowGabarit = document.getElementById('filter-show-gabarit');
  ui.filterShowUsable = document.getElementById('filter-show-usable');
  ui.filterShowUsableBoundaries = document.getElementById('filter-show-usable-boundaries');
  ui.filterShowLabels = document.getElementById('filter-show-labels');
  ui.doorControls = document.getElementById('door-controls');
  ui.qualityButtons = Array.from(document.querySelectorAll('[data-quality-mode]'));

  if (ui.modulesSolidToggle) {
    state.modulesSolid = ui.modulesSolidToggle.checked;
  }
  if (ui.modulesMagnetToggle) {
    state.magnetismEnabled = ui.modulesMagnetToggle.checked;
  }

  if (ui.filterShowChassis) ui.filterShowChassis.checked = state.showChassis;
  if (ui.filterShowGrid) ui.filterShowGrid.checked = state.showGrid;
  if (ui.filterShowGabarit) ui.filterShowGabarit.checked = state.showGabarit;
  if (ui.filterShowUsable) ui.filterShowUsable.checked = state.showUsableVolume;
  if (ui.filterShowUsableBoundaries) ui.filterShowUsableBoundaries.checked = state.showUsableBoundaries;
  if (ui.filterShowLabels) ui.filterShowLabels.checked = state.showModuleLabels;

  resetChassisFormState();
  resetModuleFormState();

  setFormCollapsed(ui.btnAddChassis, ui.chassisForm, true);
  setFormCollapsed(ui.btnAddModule, ui.moduleForm, true);

  initOptionalFieldToggles(ui.chassisForm);
  initOptionalFieldToggles(ui.moduleForm);
  initModuleFluidToggleDependencies();

  const initialChassis = populateChassisOptions();
  if (initialChassis) {
    applyChassis(initialChassis);
  }
  populateModuleButtons();
  updateModuleLibrarySummary();
  syncWalkwayControls(state.walkwayWidth);
  syncWalkwayPositionControls(state.walkwayWidth, getEffectiveWalkwayLength());
  syncChassisTransparencyControls();
  updateQualityButtons();

  bindUIEvents();
  updateDoorUi();
}

function populateChassisOptions(preferredId) {
  if (!ui.chassisSelect) return null;
  const previousValue = preferredId || (state.chassisData ? state.chassisData.id : ui.chassisSelect.value);
  ui.chassisSelect.innerHTML = '';
  let fallback = null;
  chassisCatalog.forEach((chassis) => {
    const opt = document.createElement('option');
    opt.value = chassis.id;
    opt.textContent = chassis.name;
    ui.chassisSelect.appendChild(opt);
    if (!fallback) {
      fallback = chassis;
    }
  });
  let selected = chassisCatalog.find((item) => item.id === previousValue) || fallback;
  if (selected) {
    ui.chassisSelect.value = selected.id;
  }
  return selected || null;
}

function populateModuleButtons() {
  if (!ui.moduleButtons) return;
  ui.moduleButtons.innerHTML = '';

  if (moduleCatalog.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'module-empty-state';
    emptyState.textContent = "Aucun module n'est disponible pour le moment.";
    ui.moduleButtons.appendChild(emptyState);
    return;
  }

  const createMetaLine = (label, value) => {
    const line = document.createElement('div');
    line.className = 'module-card-meta-line';
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    const valueSpan = document.createElement('span');
    valueSpan.textContent = value;
    line.appendChild(labelSpan);
    line.appendChild(valueSpan);
    return line;
  };

  const groups = new Map();
  moduleCatalog.forEach((module) => {
    const type = module.type || 'Autres';
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type).push(module);
  });

  const sortedTypes = [...groups.keys()].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

  sortedTypes.forEach((type) => {
    const groupWrapper = document.createElement('section');
    groupWrapper.className = 'module-group';

    const header = document.createElement('div');
    header.className = 'module-group-header';

    const title = document.createElement('h3');
    title.className = 'module-group-title';
    title.textContent = type;

    const count = document.createElement('span');
    count.className = 'module-group-count';
    const modules = groups.get(type).slice().sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
    count.textContent = `${modules.length} module${modules.length > 1 ? 's' : ''}`;

    header.appendChild(title);
    header.appendChild(count);
    groupWrapper.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'module-card-grid';

    modules.forEach((module) => {
      const card = document.createElement('article');
      card.className = 'module-card';

      const name = document.createElement('h4');
      name.className = 'module-card-title';
      name.textContent = module.name;
      card.appendChild(name);

      if (module.containsFluid) {
        const flags = document.createElement('div');
        flags.className = 'module-card-flags';

        const fluidFlag = document.createElement('span');
        fluidFlag.textContent = 'Fluide';
        flags.appendChild(fluidFlag);

        const fillText = formatPercentage(module.defaultFill);
        if (fillText !== '—') {
          const fillFlag = document.createElement('span');
          fillFlag.textContent = `Remplissage ${fillText}`;
          flags.appendChild(fillFlag);
        }

        card.appendChild(flags);
      }

      const meta = document.createElement('div');
      meta.className = 'module-card-meta';
      meta.appendChild(createMetaLine('Forme', formatModuleShape(module.shape)));
      meta.appendChild(createMetaLine('Masse', formatMass(module.massEmpty)));
      meta.appendChild(createMetaLine('Dimensions', formatModuleDimensions(module.size)));

      if (module.containsFluid) {
        const volumeText = formatFluidVolume(module.fluidVolume);
        if (volumeText !== '—') {
          meta.appendChild(createMetaLine('Volume', volumeText));
        }
        const densityText = formatDensity(module.density);
        if (densityText !== '—') {
          meta.appendChild(createMetaLine('Densité', densityText));
        }
      }

      if (module.libraryName && module.libraryId !== BUILTIN_MODULE_LIBRARY.id) {
        meta.appendChild(createMetaLine('Bibliothèque', module.libraryName));
      }

      card.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'module-card-actions';

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.textContent = 'Ajouter';
      addBtn.addEventListener('click', () => {
        addModuleInstance(module.id);
      });

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.classList.add('ghost');
      editBtn.textContent = 'Modifier';
      editBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        startModuleEdit(module);
      });

      actions.appendChild(addBtn);
      actions.appendChild(editBtn);
      card.appendChild(actions);

      grid.appendChild(card);
    });

    groupWrapper.appendChild(grid);
    ui.moduleButtons.appendChild(groupWrapper);
  });
}

function updateModuleLibrarySummary() {
  if (!ui.moduleLibraryList) return;
  const groups = new Map();
  moduleCatalog.forEach((module) => {
    const libraryId = module.libraryId || CUSTOM_MODULE_LIBRARY.id;
    if (!groups.has(libraryId)) {
      const fallbackMeta = {
        id: libraryId,
        name: module.libraryName || libraryId,
        description: null,
        source: module.librarySource || null,
        license: module.libraryLicense || null,
        website: module.libraryWebsite || null,
        isSystem: libraryId === BUILTIN_MODULE_LIBRARY.id || libraryId === CUSTOM_MODULE_LIBRARY.id
      };
      registerModuleLibraryMeta(fallbackMeta);
      groups.set(libraryId, { meta: moduleLibraries.get(libraryId), modules: [] });
    }
    groups.get(libraryId).modules.push(module);
  });

  ui.moduleLibraryList.innerHTML = '';

  if (groups.size === 0) {
    const empty = document.createElement('li');
    empty.className = 'module-library-empty';
    empty.textContent = 'Aucune bibliothèque importée pour le moment.';
    ui.moduleLibraryList.appendChild(empty);
    return;
  }

  const entries = [...groups.values()].sort((a, b) => {
    const nameA = a.meta?.name || a.meta?.id || '';
    const nameB = b.meta?.name || b.meta?.id || '';
    return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
  });

  entries.forEach((entry) => {
    const { meta, modules } = entry;
    const li = document.createElement('li');
    li.className = 'module-library-item';

    const header = document.createElement('div');
    header.className = 'module-library-header';

    const nameEl = document.createElement('span');
    nameEl.className = 'module-library-name';
    nameEl.textContent = meta?.name || meta?.id || 'Bibliothèque';

    const countEl = document.createElement('span');
    countEl.className = 'module-library-count';
    const count = modules.length;
    countEl.textContent = `${count} module${count > 1 ? 's' : ''}`;

    header.appendChild(nameEl);
    header.appendChild(countEl);
    li.appendChild(header);

    if (meta?.description) {
      const descriptionEl = document.createElement('p');
      descriptionEl.className = 'module-library-description';
      descriptionEl.textContent = meta.description;
      li.appendChild(descriptionEl);
    }

    const metaList = document.createElement('ul');
    metaList.className = 'module-library-meta';

    if (meta?.source) {
      const sourceItem = document.createElement('li');
      const labelSpan = document.createElement('span');
      labelSpan.textContent = 'Source';
      const valueSpan = document.createElement('span');
      valueSpan.textContent = meta.source;
      sourceItem.appendChild(labelSpan);
      sourceItem.appendChild(valueSpan);
      metaList.appendChild(sourceItem);
    }

    if (meta?.license) {
      const licenseItem = document.createElement('li');
      const labelSpan = document.createElement('span');
      labelSpan.textContent = 'Licence';
      const valueSpan = document.createElement('span');
      valueSpan.textContent = meta.license;
      licenseItem.appendChild(labelSpan);
      licenseItem.appendChild(valueSpan);
      metaList.appendChild(licenseItem);
    }

    if (meta?.website) {
      const websiteItem = document.createElement('li');
      const labelSpan = document.createElement('span');
      labelSpan.textContent = 'Site';
      const linkWrapper = document.createElement('span');
      const anchor = document.createElement('a');
      anchor.href = normalizeWebsiteUrl(meta.website);
      anchor.target = '_blank';
      anchor.rel = 'noreferrer noopener';
      anchor.textContent = formatWebsiteLabel(meta.website) || meta.website;
      linkWrapper.appendChild(anchor);
      websiteItem.appendChild(labelSpan);
      websiteItem.appendChild(linkWrapper);
      metaList.appendChild(websiteItem);
    }

    if (metaList.children.length > 0) {
      li.appendChild(metaList);
    }

    ui.moduleLibraryList.appendChild(li);
  });
}

function bindUIEvents() {
  if (ui.btnAddChassis && ui.chassisForm) {
    ui.btnAddChassis.addEventListener('click', () => {
      const isCollapsed = ui.chassisForm.classList.contains('is-collapsed');
      if (isCollapsed) {
        ui.chassisForm.reset();
        resetChassisFormState();
      }
      toggleInlineForm(ui.btnAddChassis, ui.chassisForm);
      if (!isCollapsed) {
        resetChassisFormState();
        ui.chassisForm.reset();
      }
    });
    const cancelButton = ui.chassisForm.querySelector('[data-close-form]');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        resetChassisFormState();
        closeInlineForm(ui.btnAddChassis, ui.chassisForm, true);
      });
    }
    ui.chassisForm.addEventListener('submit', handleCustomChassisSubmit);
  }

  if (ui.btnEditChassis) {
    ui.btnEditChassis.addEventListener('click', () => {
      if (!ui.chassisSelect) return;
      const selectedId = ui.chassisSelect.value;
      const chassis = chassisCatalog.find((item) => item.id === selectedId);
      if (!chassis) {
        showModal('Information', 'Veuillez sélectionner un châssis à modifier.');
        return;
      }
      startChassisEdit(chassis);
    });
  }

  if (ui.btnImportModuleLibrary && ui.moduleLibraryInput) {
    ui.btnImportModuleLibrary.addEventListener('click', () => {
      ui.moduleLibraryInput.click();
    });
    ui.moduleLibraryInput.addEventListener('change', handleModuleLibraryInput);
  }

  if (ui.btnAddModule && ui.moduleForm) {
    ui.btnAddModule.addEventListener('click', () => {
      const isCollapsed = ui.moduleForm.classList.contains('is-collapsed');
      if (isCollapsed) {
        ui.moduleForm.reset();
        resetModuleFormState();
      }
      toggleInlineForm(ui.btnAddModule, ui.moduleForm);
      if (!isCollapsed) {
        resetModuleFormState();
        ui.moduleForm.reset();
      }
    });
    const cancelButton = ui.moduleForm.querySelector('[data-close-form]');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        resetModuleFormState();
        closeInlineForm(ui.btnAddModule, ui.moduleForm, true);
      });
    }
    ui.moduleForm.addEventListener('submit', handleCustomModuleSubmit);
  }

  if (ui.moduleFluidToggle) {
    ui.moduleFluidToggle.addEventListener('change', () => {
      updateModuleFormFluidState(ui.moduleFluidToggle.checked);
    });
  }

  if (ui.modulesSolidToggle) {
    ui.modulesSolidToggle.addEventListener('change', () => {
      state.modulesSolid = ui.modulesSolidToggle.checked;
      if (state.modulesSolid) {
        separateOverlappingModules();
      }
      pushHistory();
    });
  }

  if (ui.modulesMagnetToggle) {
    ui.modulesMagnetToggle.addEventListener('change', () => {
      state.magnetismEnabled = ui.modulesMagnetToggle.checked;
      pushHistory();
    });
  }

  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointercancel', onPointerUp);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

  document.addEventListener('keydown', onKeyDown);

  ui.chassisSelect.addEventListener('change', () => {
    const next = chassisCatalog.find((c) => c.id === ui.chassisSelect.value);
    if (next) {
      pushHistory();
      applyChassis(next);
      updateAnalysis();
    }
  });

  ui.walkwayRange.addEventListener('input', () => {
    state.walkwayWidth = mmToM(Number(ui.walkwayRange.value));
    updateWalkway();
    updateAnalysis();
  });
  ui.walkwayRange.addEventListener('change', () => {
    pushHistory();
  });

  if (ui.walkwayOffsetXRange) {
    ui.walkwayOffsetXRange.addEventListener('input', () => {
      state.walkwayOffsetX = mmToM(Number(ui.walkwayOffsetXRange.value));
      applyWalkwayOffset(state.walkwayWidth, getEffectiveWalkwayLength());
      updateAnalysis();
    });
    ui.walkwayOffsetXRange.addEventListener('change', () => {
      pushHistory();
    });
  }

  if (ui.walkwayOffsetZRange) {
    ui.walkwayOffsetZRange.addEventListener('input', () => {
      state.walkwayOffsetZ = mmToM(Number(ui.walkwayOffsetZRange.value));
      applyWalkwayOffset(state.walkwayWidth, getEffectiveWalkwayLength());
      updateAnalysis();
    });
    ui.walkwayOffsetZRange.addEventListener('change', () => {
      pushHistory();
    });
  }

  ui.walkwayToggle.addEventListener('change', () => {
    state.walkwayVisible = ui.walkwayToggle.checked;
    walkwayMesh.visible = state.walkwayVisible;
    updateAnalysis();
    pushHistory();
  });

  if (ui.filterShowChassis) {
    ui.filterShowChassis.addEventListener('change', () => {
      state.showChassis = ui.filterShowChassis.checked;
      applyDisplayFilters();
      pushHistory();
    });
  }

  if (ui.filterShowGrid) {
    ui.filterShowGrid.addEventListener('change', () => {
      state.showGrid = ui.filterShowGrid.checked;
      applyDisplayFilters();
      pushHistory();
    });
  }

  if (ui.filterShowGabarit) {
    ui.filterShowGabarit.addEventListener('change', () => {
      state.showGabarit = ui.filterShowGabarit.checked;
      applyDisplayFilters();
      pushHistory();
    });
  }

  if (ui.filterShowUsable) {
    ui.filterShowUsable.addEventListener('change', () => {
      state.showUsableVolume = ui.filterShowUsable.checked;
      applyDisplayFilters();
      pushHistory();
    });
  }

  if (ui.filterShowUsableBoundaries) {
    ui.filterShowUsableBoundaries.addEventListener('change', () => {
      state.showUsableBoundaries = ui.filterShowUsableBoundaries.checked;
      applyDisplayFilters();
      pushHistory();
    });
  }

  if (ui.filterShowLabels) {
    ui.filterShowLabels.addEventListener('change', () => {
      state.showModuleLabels = ui.filterShowLabels.checked;
      applyDisplayFilters();
      pushHistory();
    });
  }

  if (ui.qualityButtons) {
    ui.qualityButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const mode = button.dataset.qualityMode;
        if (mode && QUALITY_PROFILES[mode]) {
          applyQualityMode(mode);
        }
      });
    });
  }

  if (ui.doorControls) {
    ui.doorControls.addEventListener('click', handleDoorControlClick);
  }

  ui.chassisTransparencyRange.addEventListener('input', () => {
    const transparency = Number(ui.chassisTransparencyRange.value) / 100;
    setChassisOpacity(1 - transparency);
  });
  ui.chassisTransparencyRange.addEventListener('change', () => {
    pushHistory();
  });

  if (ui.btnRecenterView) {
    ui.btnRecenterView.addEventListener('click', () => {
      resetOrbitToChassis();
    });
  }

  ui.detailFill.addEventListener('input', () => {
    if (!state.selected || !state.selected.containsFluid) {
      ui.detailFillValue.textContent = '-';
      return;
    }
    ui.detailFillValue.textContent = `${ui.detailFill.value}%`;
    state.selected.fill = Number(ui.detailFill.value);
    updateAnalysis();
  });
  ui.detailFill.addEventListener('change', () => {
    if (state.selected && state.selected.containsFluid) {
      pushHistory();
    }
  });

  const positionInputs = [ui.detailPosX, ui.detailPosY, ui.detailPosZ];
  positionInputs.forEach((input, idx) => {
    input.addEventListener('change', () => {
      if (!state.selected) return;
      const value = snapValue(Number(input.value));
      if (idx === 0) state.selected.mesh.position.x = value;
      if (idx === 1) state.selected.mesh.position.y = value;
      if (idx === 2) state.selected.mesh.position.z = value;
      clampToBounds(state.selected.mesh.position, state.selected);
      syncModuleState(state.selected);
      updateSelectionDetails();
      updateAnalysis();
      pushHistory();
    });
  });

  const rotationInputs = [
    { element: ui.detailRotX, axis: 'x' },
    { element: ui.detailRotY, axis: 'y' },
    { element: ui.detailRotZ, axis: 'z' }
  ];
  rotationInputs.forEach(({ element, axis }) => {
    if (!element) return;
    element.addEventListener('change', () => {
      if (!state.selected) return;
      const value = Number(element.value);
      if (!Number.isFinite(value)) return;
      state.selected.mesh.rotation[axis] = degToRad(value);
      clampToBounds(state.selected.mesh.position, state.selected);
      syncModuleState(state.selected);
      updateSelectionDetails();
      updateAnalysis();
      pushHistory();
    });
  });

  document.getElementById('btn-new').addEventListener('click', () => {
    confirmAction('Réinitialisation', 'Confirmer la création d\'une nouvelle configuration ?', () => {
      resetScene();
    });
  });

  document.getElementById('btn-open').addEventListener('click', () => {
    ui.fileInput.click();
  });

  ui.fileInput.addEventListener('change', handleImport);

  document.getElementById('btn-save').addEventListener('click', handleExportJSON);
  document.getElementById('btn-export-png').addEventListener('click', handleExportPNG);
  document.getElementById('btn-analyze').addEventListener('click', () => {
    updateAnalysis(true);
  });
  document.getElementById('btn-compare').addEventListener('click', handleCompare);
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);
  ui.modalClose.addEventListener('click', hideModal);
  ui.modalOk.addEventListener('click', hideModal);
}

function handleCustomChassisSubmit(event) {
  event.preventDefault();
  if (!ui.chassisForm) return;
  const form = ui.chassisForm;
  const data = new FormData(form);
  try {
    const name = (data.get('name') || '').toString().trim();
    if (!name) {
      throw new Error('Veuillez renseigner un nom pour le châssis.');
    }
    const length = parseNumberField(data.get('length'), 'Longueur', { min: 1 });
    const width = parseNumberField(data.get('width'), 'Largeur', { min: 1 });
    const height = parseNumberField(data.get('height'), 'Hauteur', { min: 0.5 });
    const mass = parseNumberField(data.get('mass'), 'Masse à vide', { min: 0 });
    const ptac = parseNumberField(data.get('ptac'), 'PTAC', { min: 0 });
    const wheelbase = parseNumberField(data.get('wheelbase'), 'Empattement', { min: 1, max: length });
    const frontAxleOffset = parseNumberField(data.get('frontAxleOffset'), 'Décalage essieu avant', { min: 0, max: length / 2 });
    const payload = parseOptionalNumberField(data.get('payload'), 'Charge utile', { min: 0 });
    const maxTowableBraked = parseOptionalNumberField(data.get('maxTowableBraked'), 'Poids maxi remorquable freiné', { min: 0 });
    const maxAuthorizedWeight = parseOptionalNumberField(data.get('maxAuthorizedWeight'), 'Poids maxi autorisé', { min: 0 });
    const overallWidthMirrors = parseOptionalNumberField(data.get('overallWidthMirrors'), 'Largeur hors tout avec rétroviseurs', { min: 0 });
    const heightUnladen = parseOptionalNumberField(data.get('heightUnladen'), 'Hauteur à vide', { min: 0 });
    const groundClearanceLoaded = parseOptionalNumberField(data.get('groundClearanceLoaded'), 'Garde au sol en charge', { min: 0 });
    const floorHeightUnladen = parseOptionalNumberField(data.get('floorHeightUnladen'), 'Hauteur seuil à vide', { min: 0 });
    const overallLengthMM = parseOptionalNumberField(data.get('overallLengthMM'), 'Longueur hors tout (mm)', { min: 0 });
    const overallWidthMM = parseOptionalNumberField(data.get('overallWidthMM'), 'Largeur hors tout (mm)', { min: 0 });
    const overallHeightMM = parseOptionalNumberField(data.get('overallHeightMM'), 'Hauteur hors tout (mm)', { min: 0 });
    const maxLoadingLength = parseOptionalNumberField(data.get('maxLoadingLength'), 'Longueur de chargement maxi', { min: 0 });
    const rearOverhang = parseOptionalNumberField(data.get('rearOverhang'), 'Porte à faux arrière', { min: 0 });
    const heightWithRack = parseOptionalNumberField(data.get('heightWithRack'), 'Hauteur à vide avec galerie', { min: 0 });
    const frontOverhang = parseOptionalNumberField(data.get('frontOverhang'), 'Porte à faux avant', { min: 0 });
    const rearOpeningHeight = parseOptionalNumberField(data.get('rearOpeningHeight'), 'Hauteur ouverture arrière', { min: 0 });
    const cargoVolume = parseOptionalNumberField(data.get('cargoVolume'), 'Volume de chargement', { min: 0 });
    const interiorWidthWheelarches = parseOptionalNumberField(data.get('interiorWidthWheelarches'), 'Largeur intérieure entre passage de roues', { min: 0 });
    const sideDoorEntryWidth = parseOptionalNumberField(data.get('sideDoorEntryWidth'), 'Largeur entrée porte latérale coulissante', { min: 0 });
    const rearDoorLowerEntryWidth = parseOptionalNumberField(data.get('rearDoorLowerEntryWidth'), "Largeur d'entrée inférieure de porte(s) arrière(s)", { min: 0 });
    const interiorHeight = parseOptionalNumberField(data.get('interiorHeight'), 'Hauteur intérieure sous pavillon', { min: 0 });
    const color = parseColorValue(data.get('color'), 0x6b7a8f);
    const isEdit = form.dataset.mode === 'edit';
    let existing = null;
    if (isEdit) {
      const targetId = form.dataset.targetId;
      existing = chassisCatalog.find((item) => item.id === targetId);
      if (!existing) {
        throw new Error("Le châssis sélectionné n'existe plus.");
      }
    }
    const id = isEdit && existing ? existing.id : `custom-chassis-${Date.now()}`;
    const chassis = addChassisDefinition({
      id,
      name,
      length,
      width,
      height,
      mass,
      ptac,
      wheelbase,
      frontAxleOffset,
      payload,
      maxTowableBraked,
      maxAuthorizedWeight,
      overallWidthMirrors,
      heightUnladen,
      groundClearanceLoaded,
      floorHeightUnladen,
      overallLengthMM,
      overallWidthMM,
      overallHeightMM,
      maxLoadingLength,
      rearOverhang,
      heightWithRack,
      frontOverhang,
      rearOpeningHeight,
      cargoVolume,
      interiorWidthWheelarches,
      sideDoorEntryWidth,
      rearDoorLowerEntryWidth,
      interiorHeight,
      color,
      isCustom: isEdit && existing ? (existing.isCustom !== undefined ? existing.isCustom : false) : true
    });
    const catalogChassis = chassisCatalog.find((item) => item.id === chassis.id) || chassis;
    ui.chassisSelect.value = catalogChassis.id;
    applyChassis(catalogChassis);
    resetChassisFormState();
    closeInlineForm(ui.btnAddChassis, ui.chassisForm, true);
    pushHistory();
  } catch (error) {
    showModal('Erreur', error.message);
  }
}

function handleCustomModuleSubmit(event) {
  event.preventDefault();
  if (!ui.moduleForm) return;
  const form = ui.moduleForm;
  const data = new FormData(form);
  try {
    const name = (data.get('name') || '').toString().trim();
    if (!name) {
      throw new Error('Veuillez renseigner un nom pour le module.');
    }
    const type = (data.get('type') || '').toString().trim() || 'Custom';
    const shape = normalizeModuleShape(data.get('shape') || 'box');
    const sizeX = parseMillimeterField(data.get('sizeX'), 'Largeur', { min: 1 });
    const sizeY = parseMillimeterField(data.get('sizeY'), 'Hauteur', { min: 1 });
    const sizeZ = parseMillimeterField(data.get('sizeZ'), 'Longueur', { min: 1 });
    const massEmpty = parseNumberField(data.get('massEmpty'), 'Masse à vide', { min: 0 });
    const containsFluid = data.get('containsFluid') === 'on';
    const fluidVolume = containsFluid
      ? parseNumberField(data.get('fluidVolume'), 'Volume de fluide', { min: 0 })
      : 0;
    const defaultFill = containsFluid
      ? parseNumberField(data.get('defaultFill'), 'Remplissage par défaut', { min: 0, max: 100 })
      : 0;
    const density = containsFluid
      ? parseNumberField(data.get('density'), 'Densité', { min: 1 })
      : 0;
    const color = parseColorValue(data.get('color'), 0x2c7ef4);
    const isEdit = form.dataset.mode === 'edit';
    let existing = null;
    if (isEdit) {
      const targetId = form.dataset.targetId;
      existing = moduleCatalog.find((item) => item.id === targetId);
      if (!existing) {
        throw new Error("Le module sélectionné n'existe plus.");
      }
    }
    const libraryContext = isEdit && existing
      ? moduleLibraries.get(existing.libraryId) || null
      : CUSTOM_MODULE_LIBRARY;
    const payload = {
      type,
      shape,
      name,
      size: { x: sizeX, y: sizeY, z: sizeZ },
      massEmpty,
      fluidVolume,
      defaultFill,
      density,
      containsFluid,
      color,
      libraryId: isEdit && existing ? existing.libraryId : CUSTOM_MODULE_LIBRARY.id,
      libraryName: isEdit && existing ? existing.libraryName : CUSTOM_MODULE_LIBRARY.name,
      librarySource: isEdit && existing ? existing.librarySource : CUSTOM_MODULE_LIBRARY.source,
      libraryLicense: isEdit && existing ? existing.libraryLicense : CUSTOM_MODULE_LIBRARY.license,
      libraryWebsite: isEdit && existing ? existing.libraryWebsite : CUSTOM_MODULE_LIBRARY.website,
      isCustom: isEdit && existing
        ? (existing.isCustom !== undefined ? existing.isCustom : existing.libraryId === CUSTOM_MODULE_LIBRARY.id)
        : true
    };
    if (isEdit && existing) {
      payload.id = existing.id;
    }
    const definition = addModuleDefinition(payload, libraryContext);
    if (isEdit) {
      applyModuleDefinitionUpdate(definition);
      resetModuleFormState();
      closeInlineForm(ui.btnAddModule, ui.moduleForm, true);
    } else {
      resetModuleFormState();
      closeInlineForm(ui.btnAddModule, ui.moduleForm, true);
      addModuleInstance(definition.id);
    }
  } catch (error) {
    showModal('Erreur', error.message);
  }
}

function onResize() {
  const width = getViewportWidth();
  const height = getViewportHeight();
  renderer.setSize(width, height);
  camera.aspect = getViewportRatio();
  camera.updateProjectionMatrix();
  updateComposerSize(width, height);
  updateLineMaterialsResolution(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  if (postProcessingEnabled && composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

function applyChassis(chassis) {
  const spatial = computeChassisSpatialMetrics(chassis);
  state.chassisData = {
    ...chassis,
    length: spatial.exteriorLength,
    width: spatial.exteriorWidth,
    height: spatial.exteriorHeight,
    usableLength: spatial.usableLength,
    usableWidth: spatial.usableWidth,
    usableHeight: spatial.usableHeight,
    usableCenterOffsetX: spatial.usableCenterOffsetX,
    usableCenterOffsetZ: spatial.usableCenterOffsetZ
  };
  if (state.chassisMesh) {
    chassisGroup.remove(state.chassisMesh);
    state.chassisMesh.geometry.dispose();
    state.chassisMesh.material.dispose();
  }

  const chassisRadius = THREE.MathUtils.clamp(
    Math.min(state.chassisData.width, state.chassisData.height, state.chassisData.length) * 0.08,
    0.02,
    0.12
  );
  const geometry = new RoundedBoxGeometry(
    state.chassisData.width,
    state.chassisData.height,
    state.chassisData.length,
    chassisRadius,
    4
  );
  const material = getPhysicalMaterial(state.chassisData.color ?? RAL_COLORS.chassis, 'paintedMetal', {
    transparent: state.chassisOpacity < 1,
    opacity: state.chassisOpacity,
    depthWrite: state.chassisOpacity >= 0.999
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = state.chassisData.height / 2;
  mesh.name = 'chassis';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const edges = createEdgeLines(geometry, 0x0d141d, 1.4);
  mesh.add(edges);

  chassisGroup.add(mesh);
  state.chassisMesh = mesh;

  applyDisplayFilters();

  setChassisOpacity(state.chassisOpacity);

  updateGabaritPlanes(state.chassisData);
  updateWorkspaceBounds(state.chassisData);
  relocateWalkway();
  updateUsableVolumeVisuals();
  updateUsableHandlePositions();
  refreshChassisInfo();
  resetOrbitToChassis();
  relocateModulesInsideBounds();
  updateAnalysis();
}

function updateWorkspaceBounds(chassis) {
  const usableWidth = Number.isFinite(chassis.usableWidth) ? chassis.usableWidth : chassis.width;
  const usableLength = Number.isFinite(chassis.usableLength) ? chassis.usableLength : chassis.length;
  const usableHeight = Number.isFinite(chassis.usableHeight) ? chassis.usableHeight : chassis.height;
  const offsetX = Number.isFinite(chassis.usableCenterOffsetX) ? chassis.usableCenterOffsetX : 0;
  const offsetZ = Number.isFinite(chassis.usableCenterOffsetZ) ? chassis.usableCenterOffsetZ : 0;
  const min = new THREE.Vector3(offsetX - usableWidth / 2, 0, offsetZ - usableLength / 2);
  const max = new THREE.Vector3(offsetX + usableWidth / 2, usableHeight * 3, offsetZ + usableLength / 2);
  workspaceBounds.set(min, max);
}

function updateGabaritPlanes(chassis) {
  gabaritGroup.clear();
  const mat = new THREE.MeshBasicMaterial({
    color: 0x4ac6ff,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide
  });
  const planeHeight = Math.max(chassis.height, 0.1);
  const planeGeom = new THREE.PlaneGeometry(chassis.length, planeHeight);

  const leftPlane = new THREE.Mesh(planeGeom, mat.clone());
  leftPlane.rotation.y = Math.PI / 2;
  leftPlane.position.set(-chassis.width / 2, planeHeight / 2, 0);

  const rightPlane = new THREE.Mesh(planeGeom, mat.clone());
  rightPlane.rotation.y = Math.PI / 2;
  rightPlane.position.set(chassis.width / 2, planeHeight / 2, 0);

  gabaritGroup.add(leftPlane, rightPlane);
}

function relocateWalkway() {
  updateWalkway();
}

function refreshChassisInfo() {
  const chassis = state.chassisData;
  if (!chassis) return;
  ui.chassisPtac.textContent = `${chassis.ptac.toLocaleString('fr-FR')} kg`;
  ui.chassisWheelbase.textContent = `${chassis.wheelbase.toFixed(2)} m`;
  ui.chassisMass.textContent = `${chassis.mass.toLocaleString('fr-FR')} kg`;
  const formatMeters = (value) => Number.isFinite(value) ? `${value.toFixed(2)} m` : 'N/A';
  const exteriorDims = `${formatMeters(chassis.length)} × ${formatMeters(chassis.width)} × ${formatMeters(chassis.height)}`;
  const usableDiffers = (
    Number.isFinite(chassis.usableLength) && Math.abs(chassis.usableLength - chassis.length) > 0.01
  ) || (
    Number.isFinite(chassis.usableWidth) && Math.abs(chassis.usableWidth - chassis.width) > 0.01
  ) || (
    Number.isFinite(chassis.usableHeight) && Math.abs(chassis.usableHeight - chassis.height) > 0.01
  );
  if (usableDiffers) {
    const usableDims = `${formatMeters(chassis.usableLength)} × ${formatMeters(chassis.usableWidth)} × ${formatMeters(chassis.usableHeight)}`;
    ui.chassisDims.textContent = `${exteriorDims} (utile : ${usableDims})`;
  } else {
    ui.chassisDims.textContent = exteriorDims;
  }
}

function addModuleInstance(moduleId, options = {}) {
  const { definition: fallbackDefinition } = options;
  const definition = moduleCatalog.find((m) => m.id === moduleId) || fallbackDefinition;
  if (!definition) return null;

  const { mesh, color, doors } = createModuleMesh(definition);

  const containsFluid = Boolean(definition.containsFluid);
  const initialFill = containsFluid ? Math.min(100, Math.max(0, definition.defaultFill ?? 0)) : 0;
  const instance = {
    id: `module-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    definitionId: moduleId,
    type: definition.type,
    name: definition.name,
    mesh,
    shape: normalizeModuleShape(definition.shape),
    fill: initialFill,
    massEmpty: definition.massEmpty,
    fluidVolume: containsFluid ? definition.fluidVolume : 0,
    density: containsFluid ? definition.density : 0,
    containsFluid,
    size: { ...definition.size },
    color,
    isCustom: Boolean(definition.isCustom),
    libraryId: definition.libraryId,
    libraryName: definition.libraryName,
    librarySource: definition.librarySource,
    libraryLicense: definition.libraryLicense,
    libraryWebsite: definition.libraryWebsite,
    labelSprite: null,
    doors: Array.isArray(doors) ? doors.map((door) => ({
      id: door.id,
      label: door.label,
      type: door.type,
      config: door.config,
      group: door.group,
      open: false,
      progress: 0,
      alert: false,
      isAnimating: false
    })) : []
  };

  scene.add(instance.mesh);
  state.modules.push(instance);
  instance.doors.forEach((door) => applyDoorTransform(instance, door));
  clampToBounds(mesh.position, instance);
  syncModuleState(instance);
  updateModuleLabel(instance);
  if (skipSelect) {
    updateModuleList();
    updateSelectionDetails();
  } else {
    selectModule(instance);
  }
  if (!skipAnalysis) {
    updateAnalysis();
  }
  if (!skipHistory) {
    pushHistory();
  }
  return instance;
}

function selectModule(instance) {
  state.selected = instance;
  state.modules.forEach((mod) => {
    setModuleHighlight(mod, mod === instance);
  });
  updateModuleList();
  updateSelectionDetails();
}

function setDetailRowText(row, element, value) {
  if (!row || !element) return;
  if (value && value.toString().trim()) {
    element.textContent = value;
    row.classList.remove('hidden');
  } else {
    element.textContent = '-';
    row.classList.add('hidden');
  }
}

function updateSelectionDetails() {
  const mod = state.selected;
  if (!mod) {
    ui.detailName.textContent = '-';
    ui.detailMass.textContent = '-';
    ui.detailCapacity.textContent = '-';
    ui.detailFill.value = 0;
    ui.detailFill.disabled = true;
    ui.detailFillValue.textContent = '-';
    ui.detailPosX.value = '';
    ui.detailPosY.value = '';
    ui.detailPosZ.value = '';
    if (ui.detailRotX) ui.detailRotX.value = '';
    if (ui.detailRotY) ui.detailRotY.value = '';
    if (ui.detailRotZ) ui.detailRotZ.value = '';
    if (ui.detailLibraryRow) ui.detailLibraryRow.classList.add('hidden');
    if (ui.detailLibrarySourceRow) ui.detailLibrarySourceRow.classList.add('hidden');
    if (ui.detailLibraryLicenseRow) ui.detailLibraryLicenseRow.classList.add('hidden');
    if (ui.detailLibraryWebsiteRow) ui.detailLibraryWebsiteRow.classList.add('hidden');
    updateDoorUi();
    updateToleranceInfo(null);
    return;
  }
  ui.detailName.textContent = mod.name;
  ui.detailMass.textContent = `${mod.massEmpty.toFixed(0)} kg`;
  if (mod.containsFluid) {
    ui.detailCapacity.textContent = `${mod.fluidVolume.toFixed(0)} L`;
    ui.detailFill.disabled = false;
    ui.detailFill.value = mod.fill;
    ui.detailFillValue.textContent = `${mod.fill}%`;
  } else {
    ui.detailCapacity.textContent = '-';
    ui.detailFill.disabled = true;
    ui.detailFill.value = 0;
    ui.detailFillValue.textContent = '-';
  }
  ui.detailPosX.value = mod.mesh.position.x.toFixed(3);
  ui.detailPosY.value = mod.mesh.position.y.toFixed(3);
  ui.detailPosZ.value = mod.mesh.position.z.toFixed(3);
  if (ui.detailRotX) ui.detailRotX.value = Math.round(radToDeg(mod.mesh.rotation.x));
  if (ui.detailRotY) ui.detailRotY.value = Math.round(radToDeg(mod.mesh.rotation.y));
  if (ui.detailRotZ) ui.detailRotZ.value = Math.round(radToDeg(mod.mesh.rotation.z));

  if (ui.detailLibrary && ui.detailLibraryRow) {
    setDetailRowText(ui.detailLibraryRow, ui.detailLibrary, mod.libraryName || mod.libraryId || '');
  }
  if (ui.detailLibrarySource && ui.detailLibrarySourceRow) {
    setDetailRowText(ui.detailLibrarySourceRow, ui.detailLibrarySource, mod.librarySource || '');
  }
  if (ui.detailLibraryLicense && ui.detailLibraryLicenseRow) {
    setDetailRowText(ui.detailLibraryLicenseRow, ui.detailLibraryLicense, mod.libraryLicense || '');
  }
  if (ui.detailLibraryLink && ui.detailLibraryWebsiteRow) {
    if (mod.libraryWebsite) {
      const href = normalizeWebsiteUrl(mod.libraryWebsite);
      ui.detailLibraryLink.href = href || '#';
      ui.detailLibraryLink.textContent = formatWebsiteLabel(mod.libraryWebsite) || href || mod.libraryWebsite;
      ui.detailLibraryWebsiteRow.classList.remove('hidden');
    } else {
      ui.detailLibraryLink.removeAttribute('href');
      ui.detailLibraryLink.textContent = '-';
      ui.detailLibraryWebsiteRow.classList.add('hidden');
    }
  }
  updateDoorUi();
  updateToleranceInfo(mod);
}

function updateModuleList() {
  ui.moduleList.innerHTML = '';
  state.modules.forEach((mod) => {
    const li = document.createElement('li');
    li.textContent = mod.name;
    if (state.selected && state.selected.id === mod.id) {
      li.classList.add('selected');
    }
    li.addEventListener('click', () => selectModule(mod));
    ui.moduleList.appendChild(li);
  });
}

function onPointerDown(event) {
  if (measurementState.active && event.button === 0 && !event.ctrlKey) {
    addMeasurementPoint(event);
    return;
  }
  if (event.button === 2 || event.ctrlKey) {
    orbitState.active = true;
    orbitState.pointer.set(event.clientX, event.clientY);
    renderer.domElement.setPointerCapture(event.pointerId);
    return;
  }
  const handleHits = intersectUsableHandles(event);
  if (handleHits.length > 0) {
    const target = handleHits[0].object.userData.handleType
      ? handleHits[0].object
      : handleHits[0].object.parent;
    if (target && target.userData && target.userData.handleType) {
      selectModule(null);
      beginHandleDrag(target, event);
      return;
    }
  }
  const intersects = intersectModules(event);
  if (intersects.length > 0) {
    const module = state.modules.find((mod) => mod.mesh === intersects[0].object || mod.mesh === intersects[0].object.parent);
    if (module) {
      selectModule(module);
      if (state.mode === 'translate' || state.mode === 'rotate') {
        dragActive = true;
        dragKind = state.mode === 'translate' ? 'module-translate' : 'module-rotate';
        dragMode = 'horizontal';
        if (state.mode === 'translate' && event.shiftKey) {
          dragMode = 'vertical';
        }
        if (state.mode === 'translate' && dragMode === 'vertical') {
          dragPlane.set(new THREE.Vector3(0, 0, 1), -module.mesh.position.z);
        } else {
          dragPlane.set(new THREE.Vector3(0, 1, 0), 0);
        }
        const point = getPlaneIntersection(event, dragPlane);
        if (point) {
          if (state.mode === 'translate' && dragMode === 'vertical') {
            dragOffset.set(0, module.mesh.position.y - point.y, 0);
          } else {
            dragOffset.copy(module.mesh.position).sub(point);
          }
        }
        renderer.domElement.setPointerCapture(event.pointerId);
      }
    }
  } else {
    selectModule(null);
    dragKind = null;
  }
}

function onPointerMove(event) {
  if (orbitState.active) {
    const deltaX = (event.clientX - orbitState.pointer.x) * 0.005;
    const deltaY = (event.clientY - orbitState.pointer.y) * 0.005;
    orbitState.azimuth -= deltaX;
    orbitState.polar -= deltaY;
    orbitState.pointer.set(event.clientX, event.clientY);
    updateCameraFromOrbit();
    return;
  }
  if (dragActive && dragKind === 'usable-handle') {
    updateHandleDrag(event);
    return;
  }
  if (!dragActive || !state.selected) {
    updateHud(event);
    return;
  }
  if (dragKind === 'module-translate') {
    const point = getPlaneIntersection(event, dragPlane);
    if (!point) return;
    let target;
    if (dragMode === 'vertical') {
      const newY = snapValue(point.y + dragOffset.y);
      target = state.selected.mesh.position.clone();
      target.y = newY;
    } else {
      target = point.clone().add(dragOffset);
      target.y = state.selected.mesh.position.y;
      target.x = snapValue(target.x);
      target.z = snapValue(target.z);
    }
    clampToBounds(target, state.selected);
    state.selected.mesh.position.copy(target);
    syncModuleState(state.selected);
    updateSelectionDetails();
    updateAnalysis();
  } else if (dragKind === 'module-rotate') {
    const delta = event.movementX;
    const rotationStep = degToRad(5);
    const newRot = snapValue(state.selected.mesh.rotation.y + delta * 0.01, rotationStep);
    state.selected.mesh.rotation.y = newRot;
    clampToBounds(state.selected.mesh.position, state.selected);
    syncModuleState(state.selected);
    updateSelectionDetails();
    updateAnalysis();
  }
}

function onPointerUp(event) {
  if (orbitState.active) {
    orbitState.active = false;
    try {
      renderer.domElement.releasePointerCapture(event.pointerId);
    } catch (err) {
      /* noop */
    }
    return;
  }
  if (dragActive && dragKind === 'usable-handle') {
    dragActive = false;
    dragKind = null;
    dragMode = 'horizontal';
    handleDragState = null;
    if (activeHandle && activeHandle.material && activeHandle.userData && activeHandle.userData.baseColor) {
      activeHandle.material.color.setHex(activeHandle.userData.baseColor);
    }
    activeHandle = null;
    try {
      renderer.domElement.releasePointerCapture(event.pointerId);
    } catch (err) {
      /* noop */
    }
    pushHistory();
    updateHud(event);
    return;
  }
  if (dragActive) {
    dragActive = false;
    dragMode = 'horizontal';
    dragKind = null;
    renderer.domElement.releasePointerCapture(event.pointerId);
    pushHistory();
  }
}

function onWheel(event) {
  event.preventDefault();
  const zoomFactor = event.deltaY > 0 ? 1.08 : 0.92;
  orbitState.radius *= zoomFactor;
  updateCameraFromOrbit();
}

function updateHud(event) {
  const previewPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const point = getPlaneIntersection(event, previewPlane);
  if (!point) return;
  const modeLabel = state.mode === 'translate' ? 'Translation' : 'Rotation';
  const hint = state.mode === 'translate' ? '<span class="hint">Maintenez Shift pour ajuster la hauteur</span>' : '';
  ui.hud.innerHTML = `Mode: ${modeLabel}<span>X: ${point.x.toFixed(3)} m</span><span>Y: ${state.selected ? state.selected.mesh.position.y.toFixed(3) : point.y.toFixed(3)} m</span><span>Z: ${point.z.toFixed(3)} m</span>${hint}`;
}

function getPlaneIntersection(event, plane) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, point);
  return point;
}

function updateCameraFromOrbit() {
  orbitState.polar = THREE.MathUtils.clamp(orbitState.polar, 0.1, Math.PI / 2.05);
  orbitState.radius = THREE.MathUtils.clamp(orbitState.radius, 4, 40);
  const r = orbitState.radius;
  const sinPhi = Math.sin(orbitState.polar);
  const cosPhi = Math.cos(orbitState.polar);
  const sinTheta = Math.sin(orbitState.azimuth);
  const cosTheta = Math.cos(orbitState.azimuth);
  camera.position.set(
    orbitState.target.x + r * cosPhi * sinTheta,
    orbitState.target.y + r * sinPhi,
    orbitState.target.z + r * cosPhi * cosTheta
  );
  camera.lookAt(orbitState.target);
}

function resetOrbitToChassis() {
  orbitState.azimuth = DEFAULT_ORBIT_AZIMUTH;
  orbitState.polar = DEFAULT_ORBIT_POLAR;
  if (state.chassisData) {
    const targetX = Number.isFinite(state.chassisData.usableCenterOffsetX) ? state.chassisData.usableCenterOffsetX : 0;
    const targetZ = Number.isFinite(state.chassisData.usableCenterOffsetZ) ? state.chassisData.usableCenterOffsetZ : 0;
    orbitState.target.set(targetX, state.chassisData.height / 2, targetZ);
    orbitState.radius = Math.max(6, state.chassisData.length * 0.9);
  } else {
    orbitState.target.set(0, DEFAULT_ORBIT_TARGET_Y, 0);
    orbitState.radius = DEFAULT_ORBIT_RADIUS;
  }
  updateCameraFromOrbit();
}

function intersectModules(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const meshes = state.modules.map((mod) => mod.mesh);
  return raycaster.intersectObjects(meshes, false);
}

function moduleFootprintHalfExtents(mod) {
  const rotation = mod.mesh
    ? mod.mesh.rotation.y
    : (typeof mod.rotation === 'number'
        ? mod.rotation
        : (mod.rotation && typeof mod.rotation.y === 'number' ? mod.rotation.y : 0));
  const halfXLocal = mod.size.x / 2;
  const halfZLocal = mod.size.z / 2;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const absCos = Math.abs(cos);
  const absSin = Math.abs(sin);
  return {
    halfX: absCos * halfXLocal + absSin * halfZLocal,
    halfZ: absCos * halfZLocal + absSin * halfXLocal
  };
}

function computeModuleBounds(center, halfX, halfZ) {
  return {
    minX: center.x - halfX,
    maxX: center.x + halfX,
    minZ: center.z - halfZ,
    maxZ: center.z + halfZ
  };
}

function enforceWalkwayClearance(target, halfX, halfZ, clampMinX, clampMaxX, clampMinZ, clampMaxZ) {
  const walkway = getWalkwayBounds();
  if (!walkway) return;

  const bounds = computeModuleBounds(target, halfX, halfZ);
  const overlapX = Math.min(bounds.maxX, walkway.maxX) - Math.max(bounds.minX, walkway.minX);
  const overlapZ = Math.min(bounds.maxZ, walkway.maxZ) - Math.max(bounds.minZ, walkway.minZ);

  if (overlapX > 0 && overlapZ > 0) {
    const candidates = [];

    const leftLimit = walkway.minX - halfX;
    if (leftLimit >= clampMinX - 1e-6) {
      candidates.push({ axis: 'x', value: leftLimit });
    }

    const rightLimit = walkway.maxX + halfX;
    if (rightLimit <= clampMaxX + 1e-6) {
      candidates.push({ axis: 'x', value: rightLimit });
    }

    const frontLimit = walkway.minZ - halfZ;
    if (frontLimit >= clampMinZ - 1e-6) {
      candidates.push({ axis: 'z', value: frontLimit });
    }

    const backLimit = walkway.maxZ + halfZ;
    if (backLimit <= clampMaxZ + 1e-6) {
      candidates.push({ axis: 'z', value: backLimit });
    }

    if (candidates.length > 0) {
      let best = candidates[0];
      let bestDistance = Math.abs((best.axis === 'x' ? target.x : target.z) - best.value);
      for (let i = 1; i < candidates.length; i++) {
        const candidate = candidates[i];
        const distance = Math.abs((candidate.axis === 'x' ? target.x : target.z) - candidate.value);
        if (distance < bestDistance) {
          best = candidate;
          bestDistance = distance;
        }
      }
      if (best.axis === 'x') {
        target.x = THREE.MathUtils.clamp(best.value, clampMinX, clampMaxX);
      } else {
        target.z = THREE.MathUtils.clamp(best.value, clampMinZ, clampMaxZ);
      }
    } else {
      target.x = target.x <= walkway.centerX ? clampMinX : clampMaxX;
    }
  }
}

function addMagnetCandidate(candidates, newValue, currentValue, clampMin, clampMax) {
  if (!Number.isFinite(newValue)) return;
  if (newValue < clampMin - 1e-6 || newValue > clampMax + 1e-6) return;
  const delta = newValue - currentValue;
  if (Math.abs(delta) < 1e-4) return;
  candidates.push(delta);
}

function pickMagnetDelta(candidates, threshold) {
  let bestDelta = 0;
  let bestAbs = threshold + 1;
  for (const delta of candidates) {
    if (!Number.isFinite(delta)) continue;
    const absDelta = Math.abs(delta);
    if (absDelta > 0 && absDelta <= threshold && absDelta < bestAbs) {
      bestDelta = delta;
      bestAbs = absDelta;
    }
  }
  return bestAbs <= threshold ? bestDelta : 0;
}

function applyModuleMagnetism(target, module, halfX, halfZ, clampMinX, clampMaxX, clampMinZ, clampMaxZ) {
  if (!state.magnetismEnabled) return;
  const threshold = Number.isFinite(state.magnetSnapDistance)
    ? Math.max(state.magnetSnapDistance, 0)
    : DEFAULT_MAGNET_DISTANCE;
  if (threshold <= 0) return;

  const walkway = getWalkwayBounds();
  const magnetCandidatesX = [];
  const magnetCandidatesZ = [];

  addMagnetCandidate(magnetCandidatesX, clampMinX, target.x, clampMinX, clampMaxX);
  addMagnetCandidate(magnetCandidatesX, clampMaxX, target.x, clampMinX, clampMaxX);
  addMagnetCandidate(magnetCandidatesZ, clampMinZ, target.z, clampMinZ, clampMaxZ);
  addMagnetCandidate(magnetCandidatesZ, clampMaxZ, target.z, clampMinZ, clampMaxZ);

  if (walkway) {
    addMagnetCandidate(magnetCandidatesX, walkway.centerX, target.x, clampMinX, clampMaxX);
    addMagnetCandidate(magnetCandidatesX, walkway.maxX + halfX, target.x, clampMinX, clampMaxX);
    addMagnetCandidate(magnetCandidatesX, walkway.minX - halfX, target.x, clampMinX, clampMaxX);
    addMagnetCandidate(magnetCandidatesZ, walkway.centerZ, target.z, clampMinZ, clampMaxZ);
    addMagnetCandidate(magnetCandidatesZ, walkway.maxZ + halfZ, target.z, clampMinZ, clampMaxZ);
    addMagnetCandidate(magnetCandidatesZ, walkway.minZ - halfZ, target.z, clampMinZ, clampMaxZ);
  }

  state.modules.forEach((other) => {
    if (other === module || !other.mesh) return;
    const { halfX: otherHalfX, halfZ: otherHalfZ } = moduleFootprintHalfExtents(other);
    const otherPos = other.mesh.position;
    addMagnetCandidate(magnetCandidatesX, otherPos.x, target.x, clampMinX, clampMaxX);
    addMagnetCandidate(magnetCandidatesZ, otherPos.z, target.z, clampMinZ, clampMaxZ);

    const otherMinX = otherPos.x - otherHalfX;
    const otherMaxX = otherPos.x + otherHalfX;
    const otherMinZ = otherPos.z - otherHalfZ;
    const otherMaxZ = otherPos.z + otherHalfZ;

    addMagnetCandidate(magnetCandidatesX, otherMaxX + halfX, target.x, clampMinX, clampMaxX);
    addMagnetCandidate(magnetCandidatesX, otherMinX - halfX, target.x, clampMinX, clampMaxX);
    addMagnetCandidate(magnetCandidatesZ, otherMaxZ + halfZ, target.z, clampMinZ, clampMaxZ);
    addMagnetCandidate(magnetCandidatesZ, otherMinZ - halfZ, target.z, clampMinZ, clampMaxZ);
  });

  const deltaX = pickMagnetDelta(magnetCandidatesX, threshold);
  if (deltaX !== 0) {
    target.x = THREE.MathUtils.clamp(target.x + deltaX, clampMinX, clampMaxX);
  }
  const deltaZ = pickMagnetDelta(magnetCandidatesZ, threshold);
  if (deltaZ !== 0) {
    target.z = THREE.MathUtils.clamp(target.z + deltaZ, clampMinZ, clampMaxZ);
  }
}

function enforceSolidCollisions(target, module, halfX, halfZ, clampMinX, clampMaxX, clampMinZ, clampMaxZ) {
  if (!state.modulesSolid) return;
  const maxIterations = Math.max(1, state.modules.length);
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let resolved = false;
    for (const other of state.modules) {
      if (other === module || !other.mesh) continue;
      const { halfX: otherHalfX, halfZ: otherHalfZ } = moduleFootprintHalfExtents(other);
      const otherPos = other.mesh.position;
      const otherBounds = computeModuleBounds(otherPos, otherHalfX, otherHalfZ);
      const targetBounds = computeModuleBounds(target, halfX, halfZ);
      const overlapX = Math.min(targetBounds.maxX, otherBounds.maxX) - Math.max(targetBounds.minX, otherBounds.minX);
      const overlapZ = Math.min(targetBounds.maxZ, otherBounds.maxZ) - Math.max(targetBounds.minZ, otherBounds.minZ);
      if (overlapX > 0 && overlapZ > 0) {
        if (overlapX < overlapZ) {
          const direction = target.x >= otherPos.x ? 1 : -1;
          target.x += direction * (overlapX + COLLISION_EPSILON);
          target.x = THREE.MathUtils.clamp(target.x, clampMinX, clampMaxX);
        } else {
          const direction = target.z >= otherPos.z ? 1 : -1;
          target.z += direction * (overlapZ + COLLISION_EPSILON);
          target.z = THREE.MathUtils.clamp(target.z, clampMinZ, clampMaxZ);
        }
        enforceWalkwayClearance(target, halfX, halfZ, clampMinX, clampMaxX, clampMinZ, clampMaxZ);
        resolved = true;
        break;
      }
    }
    if (!resolved) {
      break;
    }
  }
}

function clampToBounds(target, module) {
  if (!state.chassisData) return;
  const { halfX, halfZ } = moduleFootprintHalfExtents(module);
  const clampMinX = workspaceBounds.min.x + halfX;
  const clampMaxX = workspaceBounds.max.x - halfX;
  const clampMinZ = workspaceBounds.min.z + halfZ;
  const clampMaxZ = workspaceBounds.max.z - halfZ;

  target.x = THREE.MathUtils.clamp(target.x, clampMinX, clampMaxX);
  target.z = THREE.MathUtils.clamp(target.z, clampMinZ, clampMaxZ);

  applyModuleMagnetism(target, module, halfX, halfZ, clampMinX, clampMaxX, clampMinZ, clampMaxZ);
  enforceWalkwayClearance(target, halfX, halfZ, clampMinX, clampMaxX, clampMinZ, clampMaxZ);
  enforceSolidCollisions(target, module, halfX, halfZ, clampMinX, clampMaxX, clampMinZ, clampMaxZ);

  target.x = THREE.MathUtils.clamp(target.x, clampMinX, clampMaxX);
  target.z = THREE.MathUtils.clamp(target.z, clampMinZ, clampMaxZ);
  enforceWalkwayClearance(target, halfX, halfZ, clampMinX, clampMaxX, clampMinZ, clampMaxZ);

  const halfHeight = module.size.y / 2;
  target.y = THREE.MathUtils.clamp(target.y, workspaceBounds.min.y + halfHeight, workspaceBounds.max.y - halfHeight);
}

function syncModuleState(mod) {
  mod.position = mod.mesh.position.clone();
  mod.rotation = mod.mesh.rotation.clone();
}

function relocateModulesInsideBounds() {
  state.modules.forEach((mod) => {
    clampToBounds(mod.mesh.position, mod);
    syncModuleState(mod);
  });
  updateSelectionDetails();
}

function separateOverlappingModules() {
  if (!state.modulesSolid) return;
  state.modules.forEach((mod) => {
    if (!mod.mesh) return;
    const target = mod.mesh.position.clone();
    clampToBounds(target, mod);
    mod.mesh.position.copy(target);
    syncModuleState(mod);
  });
  updateSelectionDetails();
  updateAnalysis();
}

function isTextInputTarget(target) {
  if (!target) return false;
  const tag = target.tagName ? target.tagName.toUpperCase() : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return Boolean(target.isContentEditable);
}

function copySelectedModule() {
  if (!state.selected) return;
  const mod = state.selected;
  state.clipboard = {
    definitionId: mod.definitionId,
    fallbackDefinition: {
      id: mod.definitionId,
      type: mod.type,
      name: mod.name,
      shape: mod.shape,
      size: { ...mod.size },
      massEmpty: mod.massEmpty,
      fluidVolume: mod.fluidVolume,
      defaultFill: mod.fill,
      density: mod.density,
      containsFluid: mod.containsFluid,
      color: mod.color,
      libraryId: mod.libraryId,
      libraryName: mod.libraryName,
      librarySource: mod.librarySource,
      libraryLicense: mod.libraryLicense,
      libraryWebsite: mod.libraryWebsite,
      isCustom: mod.isCustom
    },
    overrides: {
      type: mod.type,
      name: mod.name,
      size: { ...mod.size },
      color: mod.color,
      massEmpty: mod.massEmpty,
      fluidVolume: mod.fluidVolume,
      density: mod.density,
      containsFluid: mod.containsFluid,
      fill: mod.fill,
      libraryId: mod.libraryId,
      libraryName: mod.libraryName,
      librarySource: mod.librarySource,
      libraryLicense: mod.libraryLicense,
      libraryWebsite: mod.libraryWebsite,
      isCustom: mod.isCustom,
      shape: mod.shape
    },
    transform: {
      position: {
        x: mod.mesh.position.x,
        y: mod.mesh.position.y,
        z: mod.mesh.position.z
      },
      rotation: mod.mesh.rotation.y
    }
  };
}

function pasteModuleFromClipboard() {
  if (!state.clipboard) return;
  const clipboard = state.clipboard;
  const catalogDefinition = moduleCatalog.find((m) => m.id === clipboard.definitionId) || null;
  const fallbackDefinition = clipboard.fallbackDefinition
    ? {
        ...clipboard.fallbackDefinition,
        size: { ...clipboard.fallbackDefinition.size }
      }
    : null;
  const definition = catalogDefinition || fallbackDefinition;
  if (!definition) return;

  const overrides = clipboard.overrides ? { ...clipboard.overrides } : {};
  if (overrides.size) {
    overrides.size = { ...overrides.size };
  }

  const transform = clipboard.transform || null;
  const basePosition = transform && transform.position
    ? new THREE.Vector3(transform.position.x, transform.position.y, transform.position.z)
    : new THREE.Vector3(0, (overrides.size?.y || definition.size?.y || 0.2) / 2, 0);
  const position = basePosition.add(new THREE.Vector3(DEFAULT_PASTE_OFFSET, 0, DEFAULT_PASTE_OFFSET));

  const addOptions = {
    ...overrides,
    position,
    rotation: transform ? transform.rotation : undefined
  };
  if (!catalogDefinition && definition) {
    addOptions.definition = definition;
  }

  const instance = addModuleInstance(definition.id, addOptions);
  if (instance && state.clipboard) {
    state.clipboard.transform = {
      position: {
        x: instance.mesh.position.x,
        y: instance.mesh.position.y,
        z: instance.mesh.position.z
      },
      rotation: instance.mesh.rotation.y
    };
  }
}

function onKeyDown(event) {
  if (event.code === 'KeyM') {
    event.preventDefault();
    toggleMeasurementMode();
    return;
  }
  if (event.code === 'Escape' && measurementState.active) {
    toggleMeasurementMode();
    return;
  }
  if (event.code === 'Delete' && state.selected) {
    removeModule(state.selected);
    return;
  }
  if (event.code === 'KeyT') {
    state.mode = 'translate';
    ui.hud.innerHTML = 'Mode: Translation';
  }
  if (event.code === 'KeyR') {
    state.mode = 'rotate';
    ui.hud.innerHTML = 'Mode: Rotation';
  }
  if (event.ctrlKey && event.code === 'KeyZ') {
    event.preventDefault();
    undo();
  }
  if (event.ctrlKey && event.code === 'KeyY') {
    event.preventDefault();
    redo();
  }
  if (event.ctrlKey && event.code === 'KeyC') {
    if (isTextInputTarget(event.target)) return;
    event.preventDefault();
    copySelectedModule();
  }
  if (event.ctrlKey && event.code === 'KeyV') {
    if (isTextInputTarget(event.target)) return;
    event.preventDefault();
    pasteModuleFromClipboard();
  }
}

function removeModule(mod) {
  const index = state.modules.indexOf(mod);
  if (index !== -1) {
    disposeModuleLabel(mod);
    scene.remove(mod.mesh);
    mod.mesh.geometry.dispose();
    mod.mesh.material.dispose();
    state.modules.splice(index, 1);
    if (state.selected && state.selected.id === mod.id) {
      state.selected = null;
      updateSelectionDetails();
    }
    updateModuleList();
    updateAnalysis();
    pushHistory();
  }
}

function moduleSupportsFluid(mod) {
  return mod && mod.fluidVolume !== null && mod.fluidVolume !== undefined;
}

function massOfModule(mod) {
  if (!mod.containsFluid) {
    return mod.massEmpty;
  }
  const volume_m3 = (mod.fluidVolume / 1000);
  const density = mod.density ?? 1000;
  const fillRatio = (mod.fill ?? 0) / 100;
  const fluidMass = volume_m3 * fillRatio * density;
  return mod.massEmpty + fluidMass;
}

function computeAnalysis() {
  const modules = state.modules;
  const chassis = state.chassisData;
  const chassisMass = chassis ? chassis.mass : 0;
  const masses = [];
  let totalMass = chassisMass;
  let cogNumerator = new THREE.Vector3();

  if (chassis) {
    const chassisCoG = new THREE.Vector3(0, chassis.height / 2, 0);
    cogNumerator.add(chassisCoG.clone().multiplyScalar(chassisMass));
    masses.push({ mass: chassisMass, position: chassisCoG });
  }

  modules.forEach((mod) => {
    const moduleMass = massOfModule(mod);
    totalMass += moduleMass;
    const pos = mod.mesh.position.clone();
    cogNumerator.add(pos.multiplyScalar(moduleMass));
    masses.push({ mass: moduleMass, position: mod.mesh.position.clone() });
  });

  const center = totalMass > 0 ? cogNumerator.multiplyScalar(1 / totalMass) : new THREE.Vector3();
  const wheelbase = chassis ? chassis.wheelbase : 1;
  const frontAxle = chassis ? chassis.length / 2 - chassis.frontAxleOffset : 0;
  const rearAxle = frontAxle - wheelbase;
  const distFront = (center.z - rearAxle);
  const distRear = (frontAxle - center.z);
  const frontLoad = totalMass * (distRear / wheelbase);
  const rearLoad = totalMass * (distFront / wheelbase);
  const margin = chassis ? chassis.ptac - totalMass : 0;

  const walkwayIssues = detectWalkwayIssues();

  return {
    totalMass,
    center,
    frontLoad,
    rearLoad,
    margin,
    walkwayIssues
  };
}

function updateAnalysis(forceModal = false) {
  const analysis = computeAnalysis();
  state.lastAnalysis = analysis;

  ui.analysisMass.textContent = `${analysis.totalMass.toFixed(0)} kg`;
  ui.analysisCoG.textContent = `${analysis.center.x.toFixed(2)}, ${analysis.center.y.toFixed(2)}, ${analysis.center.z.toFixed(2)} m`;
  ui.analysisFront.textContent = `${analysis.frontLoad.toFixed(0)} kg`;
  ui.analysisRear.textContent = `${analysis.rearLoad.toFixed(0)} kg`;
  ui.analysisMargin.textContent = `${analysis.margin.toFixed(0)} kg`;

  updateCogVisual(analysis);
  updateAxleIndicators(analysis);
  ui.indicatorPtac.className = 'indicator';
  ui.indicatorWalkway.className = 'indicator';
  ui.indicatorErrors.className = 'indicator';

  if (analysis.margin < 0) {
    ui.indicatorPtac.classList.add('error');
  } else if (analysis.margin < state.chassisData.ptac * 0.05) {
    ui.indicatorPtac.classList.add('warn');
  } else {
    ui.indicatorPtac.classList.add('ok');
  }

  if (analysis.walkwayIssues.length > 0) {
    ui.indicatorWalkway.classList.add('warn');
  } else {
    ui.indicatorWalkway.classList.add('ok');
  }

  ui.indicatorErrors.classList.add(analysis.margin < 0 ? 'error' : analysis.walkwayIssues.length ? 'warn' : 'ok');

  if (forceModal) {
    const lines = [
      `Masse totale : ${analysis.totalMass.toFixed(0)} kg`,
      `Centre de gravité : (${analysis.center.x.toFixed(2)}, ${analysis.center.y.toFixed(2)}, ${analysis.center.z.toFixed(2)}) m`,
      `Charge essieu avant : ${analysis.frontLoad.toFixed(0)} kg`,
      `Charge essieu arrière : ${analysis.rearLoad.toFixed(0)} kg`,
      `Marge PTAC : ${analysis.margin.toFixed(0)} kg`,
      '',
      analysis.walkwayIssues.length ? 'Alerte couloir :' : 'Couloir libre'
    ];
    analysis.walkwayIssues.forEach((issue) => lines.push(`- ${issue}`));
    showModal('Résultat de l\'analyse', lines.join('\n'));
  }
}

function detectWalkwayIssues() {
  const issues = [];
  const walkway = getWalkwayBounds();

  state.modules.forEach((mod) => {
    const box = new THREE.Box3().setFromObject(mod.mesh);
    const minX = box.min.x;
    const maxX = box.max.x;
    const minZ = box.min.z;
    const maxZ = box.max.z;
    const overlapX = Math.max(0, Math.min(maxX, walkway.maxX) - Math.max(minX, walkway.minX));
    const overlapZ = Math.max(0, Math.min(maxZ, walkway.maxZ) - Math.max(minZ, walkway.minZ));
    if (overlapX > 0 && overlapZ > 0) {
      issues.push(`${mod.name} empiète sur le couloir (${(overlapX * 1000).toFixed(0)} mm)`);
    }
  });
  return issues;
}

function resetScene() {
  state.modules.forEach((mod) => {
    disposeModuleLabel(mod);
    scene.remove(mod.mesh);
    mod.mesh.geometry.dispose();
    mod.mesh.material.dispose();
  });
  state.modules = [];
  state.selected = null;
  state.clipboard = null;
  updateModuleList();
  updateSelectionDetails();
  updateAnalysis();
  measurementState.active = false;
  clearMeasurementVisuals();
  updateDoorUi();
  pushHistory();
}

function serializeState() {
  const serialized = {
    chassisId: state.chassisData ? state.chassisData.id : null,
    chassisOpacity: state.chassisOpacity,
    showChassis: state.showChassis,
    showGrid: state.showGrid,
    showGabarit: state.showGabarit,
    showUsableVolume: state.showUsableVolume,
    showUsableBoundaries: state.showUsableBoundaries,
    showModuleLabels: state.showModuleLabels,
    walkwayWidth: state.walkwayWidth,
    walkwayVisible: state.walkwayVisible,
    walkwayOffsetX: state.walkwayOffsetX,
    walkwayOffsetZ: state.walkwayOffsetZ,
    modulesSolid: state.modulesSolid,
    magnetismEnabled: state.magnetismEnabled,
    modules: state.modules.map((mod) => ({
      id: mod.definitionId,
      type: mod.type,
      name: mod.name,
      shape: mod.shape,
      fill: mod.fill,
      massEmpty: mod.massEmpty,
      fluidVolume: mod.fluidVolume,
      density: mod.density,
      containsFluid: mod.containsFluid,
      size: { ...mod.size },
      color: mod.color,
      libraryId: mod.libraryId,
      libraryName: mod.libraryName,
      librarySource: mod.librarySource,
      libraryLicense: mod.libraryLicense,
      libraryWebsite: mod.libraryWebsite,
      isCustom: mod.isCustom,
      position: mod.mesh.position.toArray(),
      rotationY: mod.mesh.rotation.y,
      doors: Array.isArray(mod.doors)
        ? mod.doors.map((door) => ({
            id: door.id,
            open: door.open,
            progress: door.progress
          }))
        : []
    }))
  };
  if (state.chassisData && state.chassisData.isCustom) {
    serialized.chassisDefinition = { ...state.chassisData };
  }
  return serialized;
}

function restoreState(data) {
  let chassis = chassisCatalog.find((c) => c.id === data.chassisId) || null;
  if (!chassis && data.chassisDefinition) {
    const restored = addChassisDefinition({ ...data.chassisDefinition, isCustom: true });
    chassis = chassisCatalog.find((c) => c.id === restored.id) || restored;
  }
  if (!chassis) {
    chassis = chassisCatalog[0];
  }
  if (chassis) {
    populateChassisOptions(chassis.id);
    applyChassis(chassis);
    ui.chassisSelect.value = chassis.id;
  }

  setChassisOpacity(data.chassisOpacity !== undefined ? data.chassisOpacity : 1);

  state.walkwayWidth = data.walkwayWidth || 0.8;
  state.walkwayVisible = data.walkwayVisible !== undefined ? data.walkwayVisible : true;
  state.walkwayOffsetX = typeof data.walkwayOffsetX === 'number' ? data.walkwayOffsetX : 0;
  state.walkwayOffsetZ = typeof data.walkwayOffsetZ === 'number' ? data.walkwayOffsetZ : 0;
  syncWalkwayControls(state.walkwayWidth);
  ui.walkwayToggle.checked = state.walkwayVisible;
  updateWalkway();
  walkwayMesh.visible = state.walkwayVisible;

  state.modulesSolid = data.modulesSolid !== undefined ? Boolean(data.modulesSolid) : state.modulesSolid;
  state.magnetismEnabled = data.magnetismEnabled !== undefined ? Boolean(data.magnetismEnabled) : state.magnetismEnabled;
  if (ui.modulesSolidToggle) ui.modulesSolidToggle.checked = state.modulesSolid;
  if (ui.modulesMagnetToggle) ui.modulesMagnetToggle.checked = state.magnetismEnabled;

  state.showChassis = data.showChassis !== undefined ? data.showChassis : true;
  state.showGrid = data.showGrid !== undefined ? data.showGrid : true;
  state.showGabarit = data.showGabarit !== undefined ? data.showGabarit : true;
  state.showUsableVolume = data.showUsableVolume !== undefined ? data.showUsableVolume : true;
  state.showUsableBoundaries = data.showUsableBoundaries !== undefined ? data.showUsableBoundaries : true;
  state.showModuleLabels = data.showModuleLabels !== undefined ? data.showModuleLabels : true;

  if (ui.filterShowChassis) ui.filterShowChassis.checked = state.showChassis;
  if (ui.filterShowGrid) ui.filterShowGrid.checked = state.showGrid;
  if (ui.filterShowGabarit) ui.filterShowGabarit.checked = state.showGabarit;
  if (ui.filterShowUsable) ui.filterShowUsable.checked = state.showUsableVolume;
  if (ui.filterShowUsableBoundaries) ui.filterShowUsableBoundaries.checked = state.showUsableBoundaries;
  if (ui.filterShowLabels) ui.filterShowLabels.checked = state.showModuleLabels;
  applyDisplayFilters();

  state.modules.forEach((mod) => {
    disposeModuleLabel(mod);
    scene.remove(mod.mesh);
    mod.mesh.geometry.dispose();
    mod.mesh.material.dispose();
  });
  state.modules = [];
  state.selected = null;
  state.clipboard = null;

  (data.modules || []).forEach((item) => {
    if (!item) return;
    if (item.libraryId) {
      registerModuleLibraryMeta({
        id: item.libraryId,
        name: item.libraryName,
        source: item.librarySource,
        license: item.libraryLicense,
        website: item.libraryWebsite
      });
    }
    let definition = moduleCatalog.find((m) => m.id === item.id) || null;
    if (!definition) {
      const libraryMeta = item.libraryId
        ? {
            id: item.libraryId,
            name: item.libraryName,
            source: item.librarySource,
            license: item.libraryLicense,
            website: item.libraryWebsite
          }
        : CUSTOM_MODULE_LIBRARY;
      definition = addModuleDefinition({
        id: item.id,
        type: item.type || 'Custom',
        shape: item.shape,
        name: item.name || 'Module personnalisé',
        size: item.size,
        massEmpty: item.massEmpty,
        fluidVolume: item.fluidVolume,
        defaultFill: item.fill,
        density: item.density,
        containsFluid: item.containsFluid,
        color: item.color,
        libraryId: item.libraryId,
        libraryName: item.libraryName,
        librarySource: item.librarySource,
        libraryLicense: item.libraryLicense,
        libraryWebsite: item.libraryWebsite,
        isCustom: item.isCustom !== undefined ? item.isCustom : true
      }, libraryMeta);
    }
    const size = item.size || definition.size;
    if (!size) return;
    const baseColor = item.color !== undefined ? item.color : (definition.color !== undefined ? definition.color : 0x777777);
    const resolvedShape = normalizeModuleShape(item.shape || definition.shape);
    const resolvedSize = { ...definition.size, ...size };
    const { mesh, doors } = createModuleMesh({
      ...definition,
      shape: resolvedShape,
      size: resolvedSize,
      color: baseColor
    });
    const positionArray = item.position && item.position.length === 3 ? item.position : [0, size.y / 2, 0];
    mesh.position.fromArray(positionArray);
    mesh.rotation.y = item.rotationY || 0;
    const containsFluid = item.containsFluid !== undefined ? item.containsFluid : definition.containsFluid;
    addModuleInstance(definition.id, {
      definition,
      position,
      rotation: item.rotationY || 0,
      containsFluid,
      fill: item.fill,
      fluidVolume: item.fluidVolume,
      density: item.density,
      massEmpty: item.massEmpty,
      size: resolvedSize,
      color: baseColor,
      type: item.type || definition.type,
      name: item.name || definition.name,
      libraryId: definition.libraryId,
      libraryName: definition.libraryName,
      librarySource: definition.librarySource,
      libraryLicense: definition.libraryLicense,
      libraryWebsite: definition.libraryWebsite,
      labelSprite: null,
      doors: Array.isArray(doors) ? doors.map((door) => ({
        id: door.id,
        label: door.label,
        type: door.type,
        config: door.config,
        group: door.group,
        open: item.doors?.find((d) => d.id === door.id)?.open ?? false,
        progress: item.doors?.find((d) => d.id === door.id)?.progress ?? 0,
      alert: false
    })) : []
    };
    instance.doors.forEach((door) => {
      const saved = (item.doors || []).find((entry) => entry.id === door.id);
      if (saved) {
        door.open = Boolean(saved.open);
        const target = saved.progress !== undefined ? saved.progress : (door.open ? 1 : 0);
        door.progress = THREE.MathUtils.clamp(target, 0, 1);
      }
      door.isAnimating = false;
      applyDoorTransform(instance, door);
    });
    syncModuleState(instance);
    scene.add(mesh);
    updateModuleLabel(instance);
    state.modules.push(instance);
  });

  relocateModulesInsideBounds();
  if (state.modulesSolid) {
    separateOverlappingModules();
  }
  updateModuleLibrarySummary();
  updateModuleList();
  selectModule(null);
  updateAnalysis();
}

function handleExportJSON() {
  const stateData = serializeState();
  const blob = new Blob([JSON.stringify(stateData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'configuration_depollution.json';
  a.click();
  URL.revokeObjectURL(url);
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      restoreState(data);
      pushHistory();
    } catch (err) {
      showModal('Erreur', `Import impossible : ${err.message}`);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function handleExportPNG() {
  const dataUrl = renderer.domElement.toDataURL('image/png');
  const message = `PNG encodé en base64 :\n${dataUrl}`;
  showModal('Capture de la vue 3D', message);
}

function handleCompare() {
  const serialized = serializeState();
  if (!state.compareReference) {
    state.compareReference = serialized;
    showModal('Comparaison A/B', 'Configuration A enregistrée. Modifiez la scène puis relancez la comparaison.');
    return;
  }
  const diff = compareStates(state.compareReference, serialized);
  const lines = ['Comparaison A ↔ B :', `Δ masse : ${diff.mass.toFixed(0)} kg`, `Δ CoG X : ${diff.cog.x.toFixed(2)} m`, `Δ CoG Y : ${diff.cog.y.toFixed(2)} m`, `Δ CoG Z : ${diff.cog.z.toFixed(2)} m`, `Modules ajoutés : ${diff.added.join(', ') || 'aucun'}`, `Modules retirés : ${diff.removed.join(', ') || 'aucun'}`];
  showModal('Comparaison A vs B', lines.join('\n'));
  state.compareReference = null;
}

function compareStates(a, b) {
  const analysisA = computeAnalysisForState(a);
  const analysisB = computeAnalysisForState(b);
  const modulesA = new Set(a.modules.map((m) => m.name));
  const modulesB = new Set(b.modules.map((m) => m.name));
  return {
    mass: analysisB.totalMass - analysisA.totalMass,
    cog: {
      x: analysisB.center.x - analysisA.center.x,
      y: analysisB.center.y - analysisA.center.y,
      z: analysisB.center.z - analysisA.center.z
    },
    added: [...modulesB].filter((name) => !modulesA.has(name)),
    removed: [...modulesA].filter((name) => !modulesB.has(name))
  };
}

function computeAnalysisForState(data) {
  const chassis = chassisCatalog.find((c) => c.id === data.chassisId) || chassisCatalog[0];
  let totalMass = chassis.mass;
  const cog = new THREE.Vector3(0, chassis.height / 2, 0).multiplyScalar(chassis.mass);
  data.modules.forEach((mod) => {
    const containsFluid = mod.containsFluid !== undefined ? mod.containsFluid : (mod.fluidVolume ?? 0) > 0;
    const volume_m3 = containsFluid ? (mod.fluidVolume ?? 0) / 1000 : 0;
    const fillRatio = containsFluid ? (mod.fill ?? 0) / 100 : 0;
    const density = containsFluid ? (mod.density ?? 0) : 0;
    const mass = mod.massEmpty + volume_m3 * fillRatio * density;
    totalMass += mass;
    const pos = new THREE.Vector3().fromArray(mod.position);
    cog.add(pos.multiplyScalar(mass));
  });
  if (totalMass > 0) {
    cog.multiplyScalar(1 / totalMass);
  }
  return { totalMass, center: cog };
}

function pushHistory() {
  const snapshot = serializeState();
  history.undo.push(JSON.stringify(snapshot));
  if (history.undo.length > 50) history.undo.shift();
  history.redo = [];
}

function undo() {
  if (history.undo.length < 2) return;
  const current = history.undo.pop();
  history.redo.push(current);
  const previous = JSON.parse(history.undo[history.undo.length - 1]);
  restoreState(previous);
}

function redo() {
  if (history.redo.length === 0) return;
  const stateJson = history.redo.pop();
  const data = JSON.parse(stateJson);
  history.undo.push(stateJson);
  restoreState(data);
}

function showModal(title, body) {
  ui.modalTitle.textContent = title;
  ui.modalBody.textContent = body;
  ui.modal.classList.remove('hidden');
}

function hideModal() {
  ui.modal.classList.add('hidden');
}

function confirmAction(title, message, onConfirm) {
  ui.modalTitle.textContent = title;
  ui.modalBody.textContent = message;
  ui.modal.classList.remove('hidden');
  const handler = () => {
    hideModal();
    onConfirm();
    ui.modalOk.removeEventListener('click', handler);
  };
  ui.modalOk.addEventListener('click', handler, { once: true });
}

function initApp() {
  initScene();
  initUI();
  pushHistory();
  updateAnalysis();
}

initApp();
