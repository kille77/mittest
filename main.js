// Using globals attached to window instead of ES module imports to allow file:// usage
const StorageKeys = window.StorageKeys;
const loadList = window.loadList;
const loadMap = window.loadMap;
const saveList = window.saveList;
const saveMap = window.saveMap;
const ConfigManager = window.ConfigManager;
const HistoryManager = window.HistoryManager;

const formatTyreSize = window.formatTyreSize;
const setupAutocomplete = window.setupAutocomplete;
const setupTyreAutocomplete = window.setupTyreAutocomplete;
const buildAxleUI = window.buildAxleUI;
const buildPositions = window.buildPositions;
const buildMeasurementUI = window.buildMeasurementUI;
const renderHistory = window.renderHistory;

// Elements
const plateInput = document.getElementById("plate");
const companyInput = document.getElementById("company");
const typeInput = document.getElementById("vehicleType");
const axleSelector = document.getElementById("axleSelector");
const configAxles = document.getElementById("configAxles");
const measureList = document.getElementById("measureList");
const historyList = document.getElementById("historyList");

const plateSuggestions = document.getElementById("plateSuggestions");
const companySuggestions = document.getElementById("companySuggestions");

let currentConfig = null;
let currentPositions = null;

// Autocomplete setup
setupAutocomplete(
  plateInput,
  plateSuggestions,
  ()=>loadList(StorageKeys.plates()),
  (plate)=>{
    const map = loadMap(StorageKeys.plateCompanyMap());
    if (map[plate]) companyInput.value = map[plate];
  },
  (val)=>val.toUpperCase()
);

setupAutocomplete(
  companyInput,
  companySuggestions,
  ()=>loadList(StorageKeys.companies()),
  ()=>{}
);

// Build axle chips
[2,3,4,5].forEach(n=>{
  const chip = document.createElement('div');
  chip.className = 'chip';
  chip.dataset.axles = n;
  chip.textContent = n + ' akselia';
  if (n===2) chip.classList.add('active');
  axleSelector.appendChild(chip);
});

// Open config
document.getElementById("btnOpenConfig").onclick = ()=>{
  const plate = plateInput.value.trim().toUpperCase();
  if (!plate) return alert("Syötä rekisterinumero");
  plateInput.value = plate;

  const map = loadMap(StorageKeys.plateCompanyMap());
  if (map[plate]) companyInput.value = map[plate];

  const cfg = ConfigManager.load(plate) || { axles:2, data:[] };
  currentConfig = cfg;

  axleSelector.querySelectorAll(".chip").forEach(c=>{ c.classList.toggle("active", Number(c.dataset.axles)===cfg.axles); });

  buildAxleUI(configAxles, cfg.axles, cfg.data, StorageKeys, formatTyreSize);
  showView('view-config');
};

// Show view helper
function showView(id) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Back buttons
document.querySelectorAll('[data-back]').forEach(btn=> btn.addEventListener('click', ()=> showView('view-home')));

// Axle selector click
axleSelector.onclick = e=>{
  const chip = e.target.closest('.chip'); if (!chip) return;
  axleSelector.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
  const count = Number(chip.dataset.axles);
  currentConfig = currentConfig || { axles:count, data:[] };
  currentConfig.axles = count;
  buildAxleUI(configAxles, count, currentConfig.data, StorageKeys, formatTyreSize);
};

// Save config
document.getElementById('btnSaveConfig').onclick = ()=>{
  const plate = plateInput.value.trim().toUpperCase();
  if (!plate) return alert('Syötä rekisterinumero');
  plateInput.value = plate;

  const cards = configAxles.querySelectorAll('.axle-card');
  const data = [...cards].map((c,idx)=>({
    type:c.querySelector('.axle-type').value,
    size:formatTyreSize(c.querySelector('.axle-size').value),
    make:c.querySelector('.axle-make').value,
    rim:c.querySelector("input[name='rim-"+idx+"']:checked").value,
    et:c.querySelector('.axle-et').value
  }));

  currentConfig.data = data;
  ConfigManager.save(plate, currentConfig);

  alert('Konfiguraatio tallennettu');
  showView('view-home');
};

// Start inspection
document.getElementById('btnStartInspection').onclick = ()=>{
  const plate = plateInput.value.trim().toUpperCase();
  if (!plate) return alert('Syötä rekisterinumero');
  plateInput.value = plate;

  const map = loadMap(StorageKeys.plateCompanyMap());
  if (map[plate]) companyInput.value = map[plate];

  const cfg = ConfigManager.load(plate);
  if (!cfg) return alert('Tee konfiguraatio ensin');

  currentConfig = cfg;
  currentPositions = buildPositions(cfg);

  const last = HistoryManager.lastForPlate(plate);
  const prevValues = last?last.values:null;
  const prevNotes = last?last.notes:null;
  const prevPhotos = last?last.photos:null;

  buildMeasurementUI(currentPositions, measureList, prevValues, prevNotes, prevPhotos);
  showView('view-measure');
};

// Save inspection
document.getElementById('btnSaveInspection').onclick = ()=>{
  const plate = plateInput.value.trim().toUpperCase();
  const company = companyInput.value.trim();
  const type = typeInput.value;

  if (!plate) return alert('Rekisterinumero puuttuu');
  if (!currentConfig) return alert('Konfiguraatio puuttuu');

  plateInput.value = plate;

  const inputs = measureList.querySelectorAll("input.tyre-slider");
  const values = [...inputs].map(i=>parseFloat(i.value||0));

  const noteInputs = measureList.querySelectorAll('.note-input');
  const notes = [...noteInputs].map(t=>t.value.trim() || null);

  const rows = measureList.querySelectorAll('.tyre-row');
  const photos = [...rows].map(r=> r.dataset.photo || null);

  const last = HistoryManager.lastForPlate(plate);
  const wear = values.map((v,i)=>{
    if (!last || !last.values || last.values[i]==null) return null;
    return (last.values[i]-v).toFixed(1);
  });

  const record = {
    plate,
    company,
    type,
    date:new Date().toLocaleString(),
    values,
    wear,
    config:currentConfig,
    positions:currentPositions,
    notes,
    photos
  };

  HistoryManager.add(record);

  const plates = loadList(StorageKeys.plates());
  if (!plates.includes(plate)) { plates.push(plate); saveList(StorageKeys.plates(), plates); }

  if (company) {
    const companies = loadList(StorageKeys.companies());
    if (!companies.includes(company)) { companies.push(company); saveList(StorageKeys.companies(), companies); }
  }

  const map = loadMap(StorageKeys.plateCompanyMap());
  if (company) { map[plate] = company; saveMap(StorageKeys.plateCompanyMap(), map); }

  currentConfig.data.forEach(a=>{
    if (a.size) {
      const list = loadList(StorageKeys.tyreSizes()); if (!list.includes(a.size)) { list.push(a.size); saveList(StorageKeys.tyreSizes(), list); }
    }
    if (a.make) {
      const list = loadList(StorageKeys.tyreMakes()); if (!list.includes(a.make)) { list.push(a.make); saveList(StorageKeys.tyreMakes(), list); }
    }
    if (a.et) {
      const list = loadList(StorageKeys.etValues()); if (!list.includes(a.et)) { list.push(a.et); saveList(StorageKeys.etValues(), list); }
    }
  });

  alert('Tarkastus tallennettu');
  showView('view-home');
  renderHistory(historyList, HistoryManager);
};

// Initial render
renderHistory(historyList, HistoryManager);

// Expose helper for other scripts
window.__app = { renderHistory };
