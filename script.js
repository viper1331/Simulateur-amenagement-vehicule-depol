import * as THREE from './libs/three.module.js';

const mmToM = (value) => (Number.isFinite(value) ? value / 1000 : null);
const mToMm = (value) => (Number.isFinite(value) ? value * 1000 : null);
const DEFAULT_SNAP_STEP = 0.001;
const snapValue = (value, step = DEFAULT_SNAP_STEP) => Math.round(value / step) * step;
const degToRad = (deg) => deg * Math.PI / 180;
const radToDeg = (rad) => rad * 180 / Math.PI;

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
    color: 0x8c9aa8
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
    color: 0x9fa8b5
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
    color: 0x8d939c
  }
];

const moduleCatalog = [
  {
    id: 'tank-medium',
    type: 'Tank',
    name: 'Cuve 5m³',
    shape: 'box',
    size: { x: 1.6, y: 1.6, z: 2.4 },
    color: 0x2c7ef4,
    massEmpty: 680,
    fluidVolume: 5000,
    defaultFill: 60,
    density: 1000,
    containsFluid: true
  },
  {
    id: 'tank-compact',
    type: 'Tank',
    name: 'Cuve 3m³',
    shape: 'box',
    size: { x: 1.4, y: 1.4, z: 2.0 },
    color: 0x368dfc,
    massEmpty: 520,
    fluidVolume: 3000,
    defaultFill: 50,
    density: 1000,
    containsFluid: true
  },
  {
    id: 'pump-high',
    type: 'Pump',
    name: 'Pompe haute pression',
    shape: 'box',
    size: { x: 1.2, y: 1.4, z: 1.6 },
    color: 0xff6b3d,
    massEmpty: 320,
    fluidVolume: 40,
    defaultFill: 0,
    density: 900,
    containsFluid: true
  },
  {
    id: 'hosereel-duo',
    type: 'HoseReel',
    name: 'Enrouleur double',
    shape: 'box',
    size: { x: 1.4, y: 1.2, z: 1.2 },
    color: 0xffc13d,
    massEmpty: 210,
    fluidVolume: 120,
    defaultFill: 20,
    density: 950,
    containsFluid: true
  },
  {
    id: 'cabinet-large',
    type: 'Cabinet',
    name: 'Armoire équipement',
    shape: 'box',
    size: { x: 1.6, y: 2.0, z: 1.0 },
    color: 0x9b6ef3,
    massEmpty: 180,
    fluidVolume: 0,
    defaultFill: 0,
    density: 1,
    containsFluid: false
  },
  {
    id: 'cabinet-ops',
    type: 'Cabinet',
    name: 'Pupitre opérateur',
    shape: 'box',
    size: { x: 1.0, y: 1.5, z: 1.2 },
    color: 0xb58ff9,
    massEmpty: 140,
    fluidVolume: 0,
    defaultFill: 0,
    density: 1,
    containsFluid: false
  }
];

const MODULE_SHAPES = ['box', 'cylinder'];
const DEFAULT_MAGNET_DISTANCE = 0.15;

function normalizeModuleShape(value) {
  if (!value && value !== 0) {
    return 'box';
  }
  const normalized = value.toString().trim().toLowerCase();
  return MODULE_SHAPES.includes(normalized) ? normalized : 'box';
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
  return new THREE.BoxGeometry(Math.max(safeSize.x, 0.05), Math.max(safeSize.y, 0.05), Math.max(safeSize.z, 0.05));
}

function updateMeshGeometryFromDefinition(mesh, definition) {
  if (!mesh) return;
  const shape = normalizeModuleShape(definition.shape);
  const geometry = createModuleGeometry(shape, definition.size);
  if (mesh.geometry) {
    mesh.geometry.dispose();
  }
  mesh.geometry = geometry;
  mesh.position.y = definition.size.y / 2;
  mesh.children.forEach((child) => {
    if (child.isLineSegments) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      child.geometry = new THREE.EdgesGeometry(geometry);
    }
  });
}

function createModuleMesh(definition, { size, color } = {}) {
  const resolvedSize = size ? { ...definition.size, ...size } : definition.size;
  const shape = normalizeModuleShape(definition.shape);
  const geometry = createModuleGeometry(shape, resolvedSize);
  const baseColor = color !== undefined
    ? color
    : (definition.color !== undefined ? definition.color : 0x777777);
  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    metalness: (definition.type || '').toLowerCase() === 'tank' ? 0.6 : 0.2,
    roughness: 0.45
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(0, resolvedSize.y / 2, 0);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
  );
  mesh.add(edges);
  return { mesh, color: baseColor, shape, size: { ...resolvedSize } };
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

function sanitizeModuleDefinition(definition) {
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
  const sanitized = {
    id: definition.id || `custom-module-${Date.now()}`,
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
    isCustom: definition.isCustom !== undefined ? definition.isCustom : true
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

function addModuleDefinition(definition) {
  const sanitized = sanitizeModuleDefinition(definition);
  const index = moduleCatalog.findIndex((item) => item.id === sanitized.id);
  if (index !== -1) {
    moduleCatalog[index] = sanitized;
  } else {
    moduleCatalog.push(sanitized);
  }
  populateModuleButtons();
  return moduleCatalog[index !== -1 ? index : moduleCatalog.length - 1];
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
    const color = definition.color !== undefined ? definition.color : 0x777777;
    mod.color = color;
    if (mod.mesh && mod.mesh.material) {
      mod.mesh.material.color.setHex(color);
      mod.mesh.material.metalness = definition.type === 'Tank' ? 0.6 : 0.2;
      mod.mesh.material.roughness = 0.45;
    }
    updateMeshGeometryFromDefinition(mod.mesh, definition);

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
  showChassis: true,
  showGrid: true,
  showGabarit: true,
  showUsableVolume: true,
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

let scene, camera, renderer, grid, hemiLight, dirLight;
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
  usableVisualGroup.add(usableMesh);

  const usableEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(usableGeometry),
    new THREE.LineBasicMaterial({ color: 0x2be8a2, transparent: true, opacity: 0.9 })
  );
  usableEdges.position.copy(usableMesh.position);
  usableEdges.raycast = () => {};
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
    usableVisualGroup.add(sideMesh);
  }
  if (usableMaxX < chassisHalfWidth - 1e-3) {
    const width = chassisHalfWidth - usableMaxX;
    const sideGeom = new THREE.BoxGeometry(width, chassisHeight, chassis.length);
    const sideMesh = new THREE.Mesh(sideGeom, boundaryMaterial.clone());
    sideMesh.position.set(chassisHalfWidth - width / 2, chassisHeight / 2, 0);
    sideMesh.raycast = () => {};
    usableVisualGroup.add(sideMesh);
  }
  if (usableMinZ > -chassisHalfLength + 1e-3) {
    const length = usableMinZ - (-chassisHalfLength);
    const frontGeom = new THREE.BoxGeometry(chassis.width, chassisHeight, length);
    const frontMesh = new THREE.Mesh(frontGeom, boundaryMaterial.clone());
    frontMesh.position.set(0, chassisHeight / 2, -chassisHalfLength + length / 2);
    frontMesh.raycast = () => {};
    usableVisualGroup.add(frontMesh);
  }
  if (usableMaxZ < chassisHalfLength - 1e-3) {
    const length = chassisHalfLength - usableMaxZ;
    const rearGeom = new THREE.BoxGeometry(chassis.width, chassisHeight, length);
    const rearMesh = new THREE.Mesh(rearGeom, boundaryMaterial.clone());
    rearMesh.position.set(0, chassisHeight / 2, chassisHalfLength - length / 2);
    rearMesh.raycast = () => {};
    usableVisualGroup.add(rearMesh);
  }

  if (usableHeight < chassisHeight - 1e-3) {
    const height = chassisHeight - usableHeight;
    const topGeom = new THREE.BoxGeometry(bounds.width, height, bounds.length);
    const topMesh = new THREE.Mesh(topGeom, boundaryMaterial.clone());
    topMesh.position.set(bounds.centerX, usableHeight + height / 2, bounds.centerZ);
    topMesh.raycast = () => {};
    usableVisualGroup.add(topMesh);
  }

  if (usableVisualGroup) {
    usableVisualGroup.visible = state.showUsableVolume;
  }
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

  camera = new THREE.PerspectiveCamera(55, getViewportRatio(), 0.1, 200);
  camera.position.set(8, 8, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(getViewportWidth(), getViewportHeight());
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.domElement.style.touchAction = 'none';
  document.getElementById('canvas-container').appendChild(renderer.domElement);
  renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());

  hemiLight = new THREE.HemisphereLight(0xddeeff, 0x202328, 0.6);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(5, 10, 2);
  scene.add(dirLight);

  grid = new THREE.GridHelper(20, 20, 0x3ea6ff, 0x1f2b3d);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshPhongMaterial({ color: 0x0f1117, side: THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.001;
  floor.receiveShadow = true;
  scene.add(floor);

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

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

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
  ui.detailPosX = document.getElementById('detail-pos-x');
  ui.detailPosY = document.getElementById('detail-pos-y');
  ui.detailPosZ = document.getElementById('detail-pos-z');
  ui.detailRotY = document.getElementById('detail-rot-y');
  ui.analysisMass = document.getElementById('analysis-mass');
  ui.analysisCoG = document.getElementById('analysis-cog');
  ui.analysisFront = document.getElementById('analysis-front');
  ui.analysisRear = document.getElementById('analysis-rear');
  ui.analysisMargin = document.getElementById('analysis-margin');
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
  ui.filterShowLabels = document.getElementById('filter-show-labels');

  if (ui.filterShowChassis) ui.filterShowChassis.checked = state.showChassis;
  if (ui.filterShowGrid) ui.filterShowGrid.checked = state.showGrid;
  if (ui.filterShowGabarit) ui.filterShowGabarit.checked = state.showGabarit;
  if (ui.filterShowUsable) ui.filterShowUsable.checked = state.showUsableVolume;
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
  syncWalkwayControls(state.walkwayWidth);
  syncWalkwayPositionControls(state.walkwayWidth, getEffectiveWalkwayLength());
  syncChassisTransparencyControls();

  bindUIEvents();
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

  if (ui.filterShowLabels) {
    ui.filterShowLabels.addEventListener('change', () => {
      state.showModuleLabels = ui.filterShowLabels.checked;
      applyDisplayFilters();
      pushHistory();
    });
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

  ui.detailRotY.addEventListener('change', () => {
    if (!state.selected) return;
    const value = Number(ui.detailRotY.value);
    state.selected.mesh.rotation.y = degToRad(value);
    clampToBounds(state.selected.mesh.position, state.selected);
    syncModuleState(state.selected);
    updateAnalysis();
    pushHistory();
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
    const sizeX = parseMillimeterField(data.get('sizeX'), 'Largeur', { min: 200 });
    const sizeY = parseMillimeterField(data.get('sizeY'), 'Hauteur', { min: 200 });
    const sizeZ = parseMillimeterField(data.get('sizeZ'), 'Longueur', { min: 200 });
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
    const id = isEdit && existing ? existing.id : `custom-module-${Date.now()}`;
    const definition = addModuleDefinition({
      id,
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
      isCustom: isEdit && existing ? (existing.isCustom !== undefined ? existing.isCustom : false) : true
    });
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
  renderer.setSize(getViewportWidth(), getViewportHeight());
  camera.aspect = getViewportRatio();
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
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

  const geometry = new THREE.BoxGeometry(state.chassisData.width, state.chassisData.height, state.chassisData.length);
  const material = new THREE.MeshStandardMaterial({
    color: state.chassisData.color,
    metalness: 0.4,
    roughness: 0.5,
    transparent: state.chassisOpacity < 1,
    opacity: state.chassisOpacity,
    depthWrite: state.chassisOpacity >= 0.999
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = state.chassisData.height / 2;
  mesh.name = 'chassis';
  mesh.castShadow = true;
  mesh.receiveShadow = true;

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

function addModuleInstance(moduleId) {
  const definition = moduleCatalog.find((m) => m.id === moduleId);
  if (!definition) return;

  const { mesh, color } = createModuleMesh(definition);

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
    labelSprite: null
  };

  scene.add(mesh);
  state.modules.push(instance);
  clampToBounds(mesh.position, instance);
  syncModuleState(instance);
  updateModuleLabel(instance);
  selectModule(instance);
  updateAnalysis();
  pushHistory();
}

function selectModule(instance) {
  state.selected = instance;
  state.modules.forEach((mod) => {
    mod.mesh.children.forEach((child) => {
      if (child.material && child.material.opacity !== undefined) {
        child.material.opacity = mod === instance ? 0.85 : 0.4;
      }
    });
  });
  updateModuleList();
  updateSelectionDetails();
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
    ui.detailRotY.value = '';
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
  ui.detailRotY.value = Math.round(radToDeg(mod.mesh.rotation.y));
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
  const rotation = mod.mesh ? mod.mesh.rotation.y : (mod.rotation || 0);
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
  mod.rotation = mod.mesh.rotation.y;
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

function onKeyDown(event) {
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
  updateModuleList();
  updateSelectionDetails();
  updateAnalysis();
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
      position: mod.mesh.position.toArray(),
      rotationY: mod.mesh.rotation.y
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

  state.showChassis = data.showChassis !== undefined ? data.showChassis : true;
  state.showGrid = data.showGrid !== undefined ? data.showGrid : true;
  state.showGabarit = data.showGabarit !== undefined ? data.showGabarit : true;
  state.showUsableVolume = data.showUsableVolume !== undefined ? data.showUsableVolume : true;
  state.showModuleLabels = data.showModuleLabels !== undefined ? data.showModuleLabels : true;

  if (ui.filterShowChassis) ui.filterShowChassis.checked = state.showChassis;
  if (ui.filterShowGrid) ui.filterShowGrid.checked = state.showGrid;
  if (ui.filterShowGabarit) ui.filterShowGabarit.checked = state.showGabarit;
  if (ui.filterShowUsable) ui.filterShowUsable.checked = state.showUsableVolume;
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

  (data.modules || []).forEach((item) => {
    if (!item) return;
    let definition = moduleCatalog.find((m) => m.id === item.id) || null;
    if (!definition) {
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
        isCustom: true
      });
    }
    const size = item.size || definition.size;
    if (!size) return;
    const baseColor = item.color !== undefined ? item.color : (definition.color !== undefined ? definition.color : 0x777777);
    const resolvedShape = normalizeModuleShape(item.shape || definition.shape);
    const resolvedSize = { ...definition.size, ...size };
    const { mesh } = createModuleMesh({
      ...definition,
      shape: resolvedShape,
      size: resolvedSize,
      color: baseColor
    });
    const positionArray = item.position && item.position.length === 3 ? item.position : [0, size.y / 2, 0];
    mesh.position.fromArray(positionArray);
    mesh.rotation.y = item.rotationY || 0;
    const containsFluid = item.containsFluid !== undefined ? item.containsFluid : definition.containsFluid;
    const instanceFill = containsFluid
      ? Math.min(100, Math.max(0, item.fill ?? definition.defaultFill ?? 0))
      : 0;
    const instanceFluidVolume = containsFluid ? (item.fluidVolume ?? definition.fluidVolume) : 0;
    const instanceDensity = containsFluid ? (item.density ?? definition.density) : 0;
    const instance = {
      id: `module-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      definitionId: item.id,
      type: item.type || definition.type,
      name: item.name || definition.name,
      mesh,
      shape: resolvedShape,
      fill: instanceFill,
      massEmpty: item.massEmpty ?? definition.massEmpty,
      fluidVolume: instanceFluidVolume,
      density: instanceDensity,
      containsFluid: Boolean(containsFluid),
      size: { ...size },
      color: baseColor,
      labelSprite: null
    };
    syncModuleState(instance);
    scene.add(mesh);
    updateModuleLabel(instance);
    state.modules.push(instance);
  });

  relocateModulesInsideBounds();
  if (state.modulesSolid) {
    separateOverlappingModules();
  }
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
