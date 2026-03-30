// Storage Keys and Configuration
class _StorageKeys {
  static config(plate) { return "config_" + plate; }
  static history() { return "history"; }
  static plates() { return "plates"; }
  static companies() { return "companies"; }
  static makes() { return "makes"; }
  static models() { return "models"; }
  static tyreSizes() { return "tyreSizes"; }
  static tyreMakes() { return "tyreMakes"; }
  static etValues() { return "etValues"; }
  static plateCompanyMap() { return "plateCompanyMap"; }
  static plateTypeMap() { return "plateTypeMap"; }
  static plateMakeModelMap() { return "plateMakeModelMap"; }
  static companyMeasureThresholds() { return "companyMeasureThresholds"; }
  static companySettings() { return "companySettings"; }
}

const DEFAULT_MEASURE_THRESHOLDS = Object.freeze({
  danger: 5,
  warning: 9
});

// Basic storage functions
function loadList(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function loadMap(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : {};
}

function saveMap(key, map) {
  localStorage.setItem(key, JSON.stringify(map));
}

function getDefaultMeasureThresholds() {
  return { ...DEFAULT_MEASURE_THRESHOLDS };
}

function normalizeMeasureThresholds(raw) {
  const defaults = getDefaultMeasureThresholds();
  const parsedDanger = Number(String(raw && raw.danger != null ? raw.danger : defaults.danger).replace(',', '.'));
  const parsedWarning = Number(String(raw && raw.warning != null ? raw.warning : defaults.warning).replace(',', '.'));

  const danger = Number.isFinite(parsedDanger) && parsedDanger >= 0 ? parsedDanger : defaults.danger;
  const warningCandidate = Number.isFinite(parsedWarning) && parsedWarning >= danger ? parsedWarning : defaults.warning;
  const warning = warningCandidate >= danger ? warningCandidate : defaults.warning;

  return {
    danger: Number(danger.toFixed(1)),
    warning: Number(warning.toFixed(1))
  };
}

function normalizeCompanyPositionProducts(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map(item => ({
      position: String(item && item.position != null ? item.position : '').trim(),
      product: String(item && item.product != null ? item.product : '').trim()
    }))
    .filter(item => item.position || item.product);
}

function normalizeCompanySettings(raw, fallbackThresholds = null) {
  return {
    thresholds: normalizeMeasureThresholds((raw && raw.thresholds) || fallbackThresholds),
    instructions: String(raw && raw.instructions != null ? raw.instructions : '').trim(),
    positionProducts: normalizeCompanyPositionProducts(raw && raw.positionProducts)
  };
}

function getCompanySettings(company) {
  const normalizedCompany = String(company || '').trim();
  if (!normalizedCompany) {
    return normalizeCompanySettings(null, null);
  }

  const allSettings = loadMap(_StorageKeys.companySettings());
  const legacyThresholds = loadMap(_StorageKeys.companyMeasureThresholds());
  return normalizeCompanySettings(allSettings[normalizedCompany] || null, legacyThresholds[normalizedCompany] || null);
}

function saveCompanySettings(company, settings) {
  const normalizedCompany = String(company || '').trim();
  if (!normalizedCompany) return false;

  const allSettings = loadMap(_StorageKeys.companySettings());
  const normalizedSettings = normalizeCompanySettings(settings, null);
  allSettings[normalizedCompany] = normalizedSettings;
  saveMap(_StorageKeys.companySettings(), allSettings);

  const legacyThresholds = loadMap(_StorageKeys.companyMeasureThresholds());
  legacyThresholds[normalizedCompany] = normalizedSettings.thresholds;
  saveMap(_StorageKeys.companyMeasureThresholds(), legacyThresholds);
  return true;
}

function listCompanySettingsCompanies(extraCompanies = []) {
  const names = new Set();

  loadList(_StorageKeys.companies()).forEach(name => {
    const normalized = String(name || '').trim();
    if (normalized) names.add(normalized);
  });

  Object.keys(loadMap(_StorageKeys.companySettings())).forEach(name => {
    const normalized = String(name || '').trim();
    if (normalized) names.add(normalized);
  });

  Object.keys(loadMap(_StorageKeys.companyMeasureThresholds())).forEach(name => {
    const normalized = String(name || '').trim();
    if (normalized) names.add(normalized);
  });

  (extraCompanies || []).forEach(name => {
    const normalized = String(name || '').trim();
    if (normalized) names.add(normalized);
  });

  return [...names].sort((a, b) => a.localeCompare(b, 'fi-FI'));
}

function getCompanyMeasureThresholds(company) {
  return getCompanySettings(company).thresholds;
}

function saveCompanyMeasureThresholds(company, thresholds) {
  const current = getCompanySettings(company);
  return saveCompanySettings(company, {
    ...current,
    thresholds: normalizeMeasureThresholds(thresholds)
  });
}

// Config Manager
class ConfigManager {
  static load(plate) {
    const raw = localStorage.getItem(_StorageKeys.config(plate));
    return raw ? JSON.parse(raw) : null;
  }
  static save(plate, config) {
    localStorage.setItem(_StorageKeys.config(plate), JSON.stringify(config));
  }
}

// History Manager
class HistoryManager {
  static load() {
    const raw = localStorage.getItem(_StorageKeys.history());
    return raw ? JSON.parse(raw) : [];
  }
  static save(list) {
    localStorage.setItem(_StorageKeys.history(), JSON.stringify(list));
  }
  static add(record) {
    const list = this.load();
    list.push(record);
    this.save(list);
  }
  static lastForPlate(plate) {
    return [...this.load()].reverse().find(r => r.plate === plate) || null;
  }
}

// Draft Manager
class DraftManager {
  static load() {
    const raw = localStorage.getItem('drafts');
    return raw ? JSON.parse(raw) : [];
  }
  static save(list) {
    localStorage.setItem('drafts', JSON.stringify(list));
  }
  static add(draft) {
    const list = this.load();
    // Remove existing draft for same plate if exists
    const filtered = list.filter(d => d.plate !== draft.plate);
    filtered.push(draft);
    this.save(filtered);
  }
  static getForPlate(plate) {
    return this.load().find(d => d.plate === plate) || null;
  }
  static removeForPlate(plate) {
    const list = this.load();
    const filtered = list.filter(d => d.plate !== plate);
    this.save(filtered);
  }
}

// Export to window
window.StorageKeys = _StorageKeys;
window.loadList = loadList;
window.saveList = saveList;
window.loadMap = loadMap;
window.saveMap = saveMap;
window.getDefaultMeasureThresholds = getDefaultMeasureThresholds;
window.normalizeMeasureThresholds = normalizeMeasureThresholds;
window.getCompanySettings = getCompanySettings;
window.saveCompanySettings = saveCompanySettings;
window.listCompanySettingsCompanies = listCompanySettingsCompanies;
window.getCompanyMeasureThresholds = getCompanyMeasureThresholds;
window.saveCompanyMeasureThresholds = saveCompanyMeasureThresholds;
window.ConfigManager = ConfigManager;
window.HistoryManager = HistoryManager;
window.DraftManager = DraftManager;
