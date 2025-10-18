import * as THREE from './libs/three.module.js';

const mmToM = (value) => value / 1000;
const snapValue = (value, step = 0.01) => Math.round(value / step) * step;
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
    size: { x: 1.6, y: 1.6, z: 2.4 },
    color: 0x2c7ef4,
    massEmpty: 680,
    fluidVolume: 5000,
    defaultFill: 60,
    density: 1000
  },
  {
    id: 'tank-compact',
    type: 'Tank',
    name: 'Cuve 3m³',
    size: { x: 1.4, y: 1.4, z: 2.0 },
    color: 0x368dfc,
    massEmpty: 520,
    fluidVolume: 3000,
    defaultFill: 50,
    density: 1000
  },
  {
    id: 'pump-high',
    type: 'Pump',
    name: 'Pompe haute pression',
    size: { x: 1.2, y: 1.4, z: 1.6 },
    color: 0xff6b3d,
    massEmpty: 320,
    fluidVolume: 40,
    defaultFill: 0,
    density: 900
  },
  {
    id: 'hosereel-duo',
    type: 'HoseReel',
    name: 'Enrouleur double',
    size: { x: 1.4, y: 1.2, z: 1.2 },
    color: 0xffc13d,
    massEmpty: 210,
    fluidVolume: 120,
    defaultFill: 20,
    density: 950
  },
  {
    id: 'cabinet-large',
    type: 'Cabinet',
    name: 'Armoire équipement',
    size: { x: 1.6, y: 2.0, z: 1.0 },
    color: 0x9b6ef3,
    massEmpty: 180,
    fluidVolume: 0,
    defaultFill: 0,
    density: 1
  },
  {
    id: 'cabinet-ops',
    type: 'Cabinet',
    name: 'Pupitre opérateur',
    size: { x: 1.0, y: 1.5, z: 1.2 },
    color: 0xb58ff9,
    massEmpty: 140,
    fluidVolume: 0,
    defaultFill: 0,
    density: 1
  }
];

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
    color: definition.color !== undefined ? definition.color : 0x8d939c,
    isCustom: definition.isCustom !== undefined ? definition.isCustom : true
  };
  return sanitized;
}

function sanitizeModuleDefinition(definition) {
  const sizeSource = definition.size || definition;
  const sizeX = Number(sizeSource.x ?? sizeSource.sizeX ?? sizeSource.width ?? 0.2) || 0.2;
  const sizeY = Number(sizeSource.y ?? sizeSource.sizeY ?? sizeSource.height ?? 0.2) || 0.2;
  const sizeZ = Number(sizeSource.z ?? sizeSource.sizeZ ?? sizeSource.length ?? 0.2) || 0.2;
  const sanitized = {
    id: definition.id || `custom-module-${Date.now()}`,
    type: definition.type || 'Custom',
    name: definition.name || 'Module personnalisé',
    size: { x: sizeX, y: sizeY, z: sizeZ },
    color: definition.color !== undefined ? definition.color : 0x2c7ef4,
    massEmpty: Number(definition.massEmpty ?? definition.mass ?? 0) || 0,
    fluidVolume: Number(definition.fluidVolume ?? definition.volume ?? 0) || 0,
    defaultFill: Math.min(100, Math.max(0, Number(definition.defaultFill ?? definition.fill ?? 0) || 0)),
    density: Number(definition.density ?? 1000) || 1000,
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

const state = {
  chassis: null,
  chassisMesh: null,
  chassisData: null,
  walkwayWidth: 0.8,
  walkwayVisible: true,
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

let scene, camera, renderer, grid, hemiLight, dirLight;
let raycaster, pointer, dragPlane, dragActive = false;
let dragOffset = new THREE.Vector3();
let workspaceBounds = new THREE.Box3();
let walkwayMesh, chassisGroup, gabaritGroup;

const DEFAULT_WALKWAY_LENGTH = 12;
const WALKWAY_THICKNESS = 0.05;
const MIN_WALKWAY_WIDTH = 0.4;
const WALKWAY_SIDE_CLEARANCE = 0.05;
const orbitState = {
  active: false,
  pointer: new THREE.Vector2(),
  azimuth: Math.PI / 4,
  polar: Math.PI / 4,
  radius: 14,
  target: new THREE.Vector3(0, 1.2, 0)
};

const ui = {};

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

  walkwayMesh = createWalkwayMesh(state.walkwayWidth, DEFAULT_WALKWAY_LENGTH, state.walkwayVisible);
  scene.add(walkwayMesh);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

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
  if (!state.chassisData || !Number.isFinite(state.chassisData.length)) {
    return DEFAULT_WALKWAY_LENGTH;
  }
  return Math.max(state.chassisData.length, 0.5);
}

function getEffectiveWalkwayWidth() {
  let width = state.walkwayWidth;
  if (state.chassisData && Number.isFinite(state.chassisData.width)) {
    const maxWidth = Math.max(state.chassisData.width - WALKWAY_SIDE_CLEARANCE * 2, 0.1);
    width = Math.min(width, maxWidth);
    const minWidth = Math.min(MIN_WALKWAY_WIDTH, maxWidth);
    width = Math.max(width, minWidth);
    width = Math.min(width, state.chassisData.width);
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
  ui.walkwayToggle = document.getElementById('walkway-toggle');
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
  ui.chassisForm = document.getElementById('chassis-form');
  ui.btnAddModule = document.getElementById('btn-add-module');
  ui.moduleForm = document.getElementById('module-form');

  if (ui.walkwayRange) {
    ui.walkwayRange.dataset.minDefault = ui.walkwayRange.min || '0';
    ui.walkwayRange.dataset.maxDefault = ui.walkwayRange.max || '0';
  }

  setFormCollapsed(ui.btnAddChassis, ui.chassisForm, true);
  setFormCollapsed(ui.btnAddModule, ui.moduleForm, true);

  initOptionalFieldToggles(ui.chassisForm);

  const initialChassis = populateChassisOptions();
  if (initialChassis) {
    applyChassis(initialChassis);
  }
  populateModuleButtons();
  syncWalkwayControls(state.walkwayWidth);

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
  moduleCatalog.forEach((module) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `${module.type} - ${module.name}`;
    btn.addEventListener('click', () => {
      addModuleInstance(module.id);
    });
    ui.moduleButtons.appendChild(btn);
  });
}

function bindUIEvents() {
  if (ui.btnAddChassis && ui.chassisForm) {
    ui.btnAddChassis.addEventListener('click', () => toggleInlineForm(ui.btnAddChassis, ui.chassisForm));
    const cancelButton = ui.chassisForm.querySelector('[data-close-form]');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        closeInlineForm(ui.btnAddChassis, ui.chassisForm, true);
      });
    }
    ui.chassisForm.addEventListener('submit', handleCustomChassisSubmit);
  }

  if (ui.btnAddModule && ui.moduleForm) {
    ui.btnAddModule.addEventListener('click', () => toggleInlineForm(ui.btnAddModule, ui.moduleForm));
    const cancelButton = ui.moduleForm.querySelector('[data-close-form]');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        closeInlineForm(ui.btnAddModule, ui.moduleForm, true);
      });
    }
    ui.moduleForm.addEventListener('submit', handleCustomModuleSubmit);
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

  ui.walkwayToggle.addEventListener('change', () => {
    state.walkwayVisible = ui.walkwayToggle.checked;
    walkwayMesh.visible = state.walkwayVisible;
    updateAnalysis();
    pushHistory();
  });

  ui.detailFill.addEventListener('input', () => {
    ui.detailFillValue.textContent = `${ui.detailFill.value}%`;
    if (state.selected) {
      state.selected.fill = Number(ui.detailFill.value);
      updateAnalysis();
    }
  });
  ui.detailFill.addEventListener('change', () => {
    if (state.selected) {
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
      syncModuleState(state.selected);
      updateAnalysis();
      pushHistory();
    });
  });

  ui.detailRotY.addEventListener('change', () => {
    if (!state.selected) return;
    const value = Number(ui.detailRotY.value);
    state.selected.mesh.rotation.y = degToRad(value);
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
    const id = `custom-chassis-${Date.now()}`;
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
      isCustom: true
    });
    const catalogChassis = chassisCatalog.find((item) => item.id === chassis.id) || chassis;
    ui.chassisSelect.value = catalogChassis.id;
    applyChassis(catalogChassis);
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
    const sizeX = parseNumberField(data.get('sizeX'), 'Largeur', { min: 0.1 });
    const sizeY = parseNumberField(data.get('sizeY'), 'Hauteur', { min: 0.1 });
    const sizeZ = parseNumberField(data.get('sizeZ'), 'Longueur', { min: 0.1 });
    const massEmpty = parseNumberField(data.get('massEmpty'), 'Masse à vide', { min: 0 });
    const fluidVolume = parseNumberField(data.get('fluidVolume'), 'Volume de fluide', { min: 0 });
    const defaultFill = parseNumberField(data.get('defaultFill'), 'Remplissage par défaut', { min: 0, max: 100 });
    const density = parseNumberField(data.get('density'), 'Densité', { min: 1 });
    const color = parseColorValue(data.get('color'), 0x2c7ef4);
    const id = `custom-module-${Date.now()}`;
    const definition = addModuleDefinition({
      id,
      type,
      name,
      size: { x: sizeX, y: sizeY, z: sizeZ },
      massEmpty,
      fluidVolume,
      defaultFill,
      density,
      color,
      isCustom: true
    });
    closeInlineForm(ui.btnAddModule, ui.moduleForm, true);
    addModuleInstance(definition.id);
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
  state.chassisData = { ...chassis };
  if (state.chassisMesh) {
    chassisGroup.remove(state.chassisMesh);
    state.chassisMesh.geometry.dispose();
    state.chassisMesh.material.dispose();
  }

  const geometry = new THREE.BoxGeometry(chassis.width, chassis.height, chassis.length);
  const material = new THREE.MeshStandardMaterial({ color: chassis.color, metalness: 0.4, roughness: 0.5 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = chassis.height / 2;
  mesh.name = 'chassis';
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  chassisGroup.add(mesh);
  state.chassisMesh = mesh;

  updateGabaritPlanes(chassis);
  updateWorkspaceBounds(chassis);
  relocateWalkway();
  refreshChassisInfo();
  orbitState.target.set(0, chassis.height / 2, 0);
  orbitState.radius = Math.max(6, chassis.length * 0.9);
  updateCameraFromOrbit();
  relocateModulesInsideBounds();
  updateAnalysis();
}

function updateWorkspaceBounds(chassis) {
  const min = new THREE.Vector3(-chassis.width / 2, 0, -chassis.length / 2);
  const max = new THREE.Vector3(chassis.width / 2, chassis.height * 3, chassis.length / 2);
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
  walkwayMesh.position.set(0, WALKWAY_THICKNESS / 2, 0);
  updateWalkway();
}

function refreshChassisInfo() {
  const chassis = state.chassisData;
  ui.chassisPtac.textContent = `${chassis.ptac.toLocaleString('fr-FR')} kg`;
  ui.chassisWheelbase.textContent = `${chassis.wheelbase.toFixed(2)} m`;
  ui.chassisMass.textContent = `${chassis.mass.toLocaleString('fr-FR')} kg`;
  ui.chassisDims.textContent = `${chassis.length.toFixed(2)} m × ${chassis.width.toFixed(2)} m × ${chassis.height.toFixed(2)} m`;
}

function addModuleInstance(moduleId) {
  const definition = moduleCatalog.find((m) => m.id === moduleId);
  if (!definition) return;

  const color = definition.color !== undefined ? definition.color : 0x777777;
  const geometry = new THREE.BoxGeometry(definition.size.x, definition.size.y, definition.size.z);
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: definition.type === 'Tank' ? 0.6 : 0.2,
    roughness: 0.45
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const y = definition.size.y / 2;
  mesh.position.set(0, y, 0);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
  );
  mesh.add(edges);

  const instance = {
    id: `module-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    definitionId: moduleId,
    type: definition.type,
    name: definition.name,
    mesh,
    fill: Math.min(100, Math.max(0, definition.defaultFill ?? 0)),
    massEmpty: definition.massEmpty,
    fluidVolume: definition.fluidVolume,
    density: definition.density,
    size: { ...definition.size },
    color
  };

  scene.add(mesh);
  state.modules.push(instance);
  selectModule(instance);
  updateModuleList();
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
    ui.detailFillValue.textContent = '0%';
    ui.detailPosX.value = '';
    ui.detailPosY.value = '';
    ui.detailPosZ.value = '';
    ui.detailRotY.value = '';
    return;
  }
  ui.detailName.textContent = mod.name;
  ui.detailMass.textContent = `${mod.massEmpty.toFixed(0)} kg`;
  ui.detailCapacity.textContent = `${mod.fluidVolume.toFixed(0)} L`;
  ui.detailFill.value = mod.fill;
  ui.detailFillValue.textContent = `${mod.fill}%`;
  ui.detailPosX.value = mod.mesh.position.x.toFixed(2);
  ui.detailPosY.value = mod.mesh.position.y.toFixed(2);
  ui.detailPosZ.value = mod.mesh.position.z.toFixed(2);
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
  const intersects = intersectModules(event);
  if (intersects.length > 0) {
    const module = state.modules.find((mod) => mod.mesh === intersects[0].object || mod.mesh === intersects[0].object.parent);
    if (module) {
      selectModule(module);
      if (state.mode === 'translate' || state.mode === 'rotate') {
        dragActive = true;
        dragPlane.set(new THREE.Vector3(0, 1, 0), 0);
        const point = getPlaneIntersection(event, dragPlane);
        if (point) {
          dragOffset.copy(module.mesh.position).sub(point);
        }
        renderer.domElement.setPointerCapture(event.pointerId);
      }
    }
  } else {
    selectModule(null);
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
  if (!dragActive || !state.selected) {
    updateHud(event);
    return;
  }
  const point = getPlaneIntersection(event, dragPlane);
  if (!point) return;
  if (state.mode === 'translate') {
    const target = point.clone().add(dragOffset);
    target.y = state.selected.mesh.position.y;
    target.x = snapValue(target.x);
    target.z = snapValue(target.z);
    clampToBounds(target, state.selected);
    state.selected.mesh.position.copy(target);
    syncModuleState(state.selected);
    updateSelectionDetails();
    updateAnalysis();
  } else if (state.mode === 'rotate') {
    const delta = event.movementX;
    const rotationStep = degToRad(5);
    const newRot = snapValue(state.selected.mesh.rotation.y + delta * 0.01, rotationStep);
    state.selected.mesh.rotation.y = newRot;
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
  if (dragActive) {
    dragActive = false;
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
  const point = getPlaneIntersection(event, dragPlane);
  if (!point) return;
  ui.hud.innerHTML = `Mode: ${state.mode === 'translate' ? 'Translation' : 'Rotation'}<span>X: ${point.x.toFixed(2)} m</span><span>Z: ${point.z.toFixed(2)} m</span>`;
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

function intersectModules(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const meshes = state.modules.map((mod) => mod.mesh);
  return raycaster.intersectObjects(meshes, false);
}

function moduleFootprintRadius(mod) {
  const halfX = mod.size.x / 2;
  const halfZ = mod.size.z / 2;
  return Math.sqrt(halfX * halfX + halfZ * halfZ);
}

function clampToBounds(target, module) {
  if (!state.chassisData) return;
  const radius = moduleFootprintRadius(module);
  target.x = THREE.MathUtils.clamp(target.x, workspaceBounds.min.x + radius, workspaceBounds.max.x - radius);
  target.z = THREE.MathUtils.clamp(target.z, workspaceBounds.min.z + radius, workspaceBounds.max.z - radius);
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

function massOfModule(mod) {
  const volume_m3 = (mod.fluidVolume / 1000);
  const fluidMass = volume_m3 * (mod.fill / 100) * mod.density;
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
  const walkwayWidth = state.walkwayWidth;
  const walkwayMinX = -walkwayWidth / 2;
  const walkwayMaxX = walkwayWidth / 2;
  const walkwayLength = state.chassisData ? state.chassisData.length - 0.4 : 12;
  const walkwayMinZ = -walkwayLength / 2;
  const walkwayMaxZ = walkwayLength / 2;

  state.modules.forEach((mod) => {
    const box = new THREE.Box3().setFromObject(mod.mesh);
    const minX = box.min.x;
    const maxX = box.max.x;
    const minZ = box.min.z;
    const maxZ = box.max.z;
    const overlapX = Math.max(0, Math.min(maxX, walkwayMaxX) - Math.max(minX, walkwayMinX));
    const overlapZ = Math.max(0, Math.min(maxZ, walkwayMaxZ) - Math.max(minZ, walkwayMinZ));
    if (overlapX > 0 && overlapZ > 0) {
      issues.push(`${mod.name} empiète sur le couloir (${(overlapX * 1000).toFixed(0)} mm)`);
    }
  });
  return issues;
}

function resetScene() {
  state.modules.forEach((mod) => {
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
    walkwayWidth: state.walkwayWidth,
    walkwayVisible: state.walkwayVisible,
    modules: state.modules.map((mod) => ({
      id: mod.definitionId,
      type: mod.type,
      name: mod.name,
      fill: mod.fill,
      massEmpty: mod.massEmpty,
      fluidVolume: mod.fluidVolume,
      density: mod.density,
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

  state.walkwayWidth = data.walkwayWidth || 0.8;
  state.walkwayVisible = data.walkwayVisible !== undefined ? data.walkwayVisible : true;
  syncWalkwayControls(state.walkwayWidth);
  ui.walkwayToggle.checked = state.walkwayVisible;
  updateWalkway();
  walkwayMesh.visible = state.walkwayVisible;

  state.modules.forEach((mod) => {
    scene.remove(mod.mesh);
    mod.mesh.geometry.dispose();
    mod.mesh.material.dispose();
  });
  state.modules = [];

  (data.modules || []).forEach((item) => {
    if (!item) return;
    let definition = moduleCatalog.find((m) => m.id === item.id) || null;
    if (!definition) {
      definition = addModuleDefinition({
        id: item.id,
        type: item.type || 'Custom',
        name: item.name || 'Module personnalisé',
        size: item.size,
        massEmpty: item.massEmpty,
        fluidVolume: item.fluidVolume,
        defaultFill: item.fill,
        density: item.density,
        color: item.color,
        isCustom: true
      });
    }
    const size = item.size || definition.size;
    if (!size) return;
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const baseColor = item.color !== undefined ? item.color : (definition.color !== undefined ? definition.color : 0x777777);
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: (definition.type || '').toLowerCase() === 'tank' ? 0.6 : 0.2,
      roughness: 0.45
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const positionArray = item.position && item.position.length === 3 ? item.position : [0, size.y / 2, 0];
    mesh.position.fromArray(positionArray);
    mesh.rotation.y = item.rotationY || 0;
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
    );
    mesh.add(edges);
    const instance = {
      id: `module-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      definitionId: item.id,
      type: item.type || definition.type,
      name: item.name || definition.name,
      mesh,
      fill: Math.min(100, Math.max(0, item.fill ?? definition.defaultFill ?? 0)),
      massEmpty: item.massEmpty ?? definition.massEmpty,
      fluidVolume: item.fluidVolume ?? definition.fluidVolume,
      density: item.density ?? definition.density,
      size: { ...size },
      color: baseColor
    };
    syncModuleState(instance);
    scene.add(mesh);
    state.modules.push(instance);
  });

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
    const volume_m3 = mod.fluidVolume / 1000;
    const mass = mod.massEmpty + volume_m3 * (mod.fill / 100) * mod.density;
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
