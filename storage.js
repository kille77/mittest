class _StorageKeys {
  static config(plate) { return "config_" + plate; }
  static history() { return "history"; }
  static plates() { return "plates"; }
  static companies() { return "companies"; }
  static tyreSizes() { return "tyreSizes"; }
  static tyreMakes() { return "tyreMakes"; }
  static etValues() { return "etValues"; }
  static plateCompanyMap() { return "plateCompanyMap"; }
  static plateTypeMap() { return "plateTypeMap"; }
}

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

class ConfigManager {
  static load(plate) {
    const raw = localStorage.getItem(_StorageKeys.config(plate));
    return raw ? JSON.parse(raw) : null;
  }
  static save(plate, config) {
    localStorage.setItem(_StorageKeys.config(plate), JSON.stringify(config));
  }
}

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

window.StorageKeys = _StorageKeys;
window.loadList = loadList;
window.saveList = saveList;
window.loadMap = loadMap;
window.saveMap = saveMap;
window.ConfigManager = ConfigManager;
window.HistoryManager = HistoryManager;
