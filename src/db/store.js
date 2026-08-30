/**
 * PASHU-RAKSHA — localStorage-backed Data Store
 * Behaves like a synchronous in-browser database.
 * Collections are stored as JSON arrays keyed by collection name.
 * On first load, collections are seeded from seed.js.
 */
import {
  SPECIES_SEED, BREEDS_SEED, DISEASES_SEED, DISEASE_SPECIES_SEED,
  FARMS_SEED, ANIMALS_SEED, VACCINATIONS_SEED, OBSERVATIONS_SEED,
  ALERTS_SEED, CASES_SEED, LAB_SAMPLES_SEED, EXPOSURE_EVENTS_SEED,
  CONTAINMENT_ZONES_SEED, AUDIT_LOG_SEED, USERS_SEED, DISTRICTS_SEED,
} from './seed.js';

const STORE_KEY   = 'PASHU_RAKSHA_DB_v1';
const SESSION_KEY = 'PASHU_RAKSHA_SESSION';

// ─── Internal helpers ────────────────────────────────────────────────────────
function loadRaw() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveRaw(db) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch(e) { console.error('Store save failed', e); }
}

function buildFreshDB() {
  return {
    species:          SPECIES_SEED,
    breeds:           BREEDS_SEED,
    diseases:         DISEASES_SEED,
    diseaseSpecies:   DISEASE_SPECIES_SEED,
    farms:            FARMS_SEED,
    animals:          ANIMALS_SEED,
    vaccinations:     VACCINATIONS_SEED,
    observations:     OBSERVATIONS_SEED,
    alerts:           ALERTS_SEED,
    cases:            CASES_SEED,
    labSamples:       LAB_SAMPLES_SEED,
    exposureEvents:   EXPOSURE_EVENTS_SEED,
    containmentZones: CONTAINMENT_ZONES_SEED,
    auditLog:         AUDIT_LOG_SEED,
    users:            USERS_SEED,
    districts:        DISTRICTS_SEED,
    syncQueue:        [],
    offlineMode:      false,
    lastSynced:       new Date().toISOString(),
  };
}

// ─── In-memory cache (hydrated once) ─────────────────────────────────────────
let _db = null;

function getDB() {
  if (!_db) {
    _db = loadRaw();
    if (!_db) {
      _db = buildFreshDB();
      saveRaw(_db);
    }
  }
  return _db;
}

function commitDB() {
  saveRaw(_db);
}

// ─── Public Store API ─────────────────────────────────────────────────────────

export const store = {
  /** Return a shallow copy of a collection */
  getAll(collection) {
    const db = getDB();
    return [...(db[collection] || [])];
  },

  /** Find one by id field */
  getById(collection, id) {
    return getDB()[collection]?.find(item => item.id === id) || null;
  },

  /** Filter by arbitrary predicate */
  query(collection, predicate) {
    return (getDB()[collection] || []).filter(predicate);
  },

  /** Insert a new record — generates id if not provided */
  insert(collection, record) {
    const db = getDB();
    if (!db[collection]) db[collection] = [];
    const newRecord = { ...record, id: record.id || `${collection.toUpperCase().slice(0,3)}_${Date.now()}` };
    db[collection].push(newRecord);
    commitDB();
    return newRecord;
  },

  /** Update a record by id — merges partial fields */
  update(collection, id, patch) {
    const db = getDB();
    const idx = db[collection]?.findIndex(item => item.id === id);
    if (idx === undefined || idx === -1) return null;
    db[collection][idx] = { ...db[collection][idx], ...patch };
    commitDB();
    return db[collection][idx];
  },

  /** Delete a record by id */
  remove(collection, id) {
    const db = getDB();
    if (!db[collection]) return false;
    const before = db[collection].length;
    db[collection] = db[collection].filter(item => item.id !== id);
    commitDB();
    return db[collection].length < before;
  },

  /** Replace an entire collection (use carefully) */
  replaceCollection(collection, data) {
    const db = getDB();
    db[collection] = data;
    commitDB();
  },

  /** Return entire DB snapshot (read-only reference) */
  snapshot() {
    const db = getDB();
    return JSON.parse(JSON.stringify(db));  // deep clone
  },

  /** Reset DB to seed data (for demo reset) */
  reset() {
    _db = buildFreshDB();
    commitDB();
    return _db;
  },

  /** Add to offline sync queue */
  enqueueSync(operation) {
    const db = getDB();
    if (!db.syncQueue) db.syncQueue = [];
    db.syncQueue.push({ ...operation, queuedAt: new Date().toISOString(), id: `SQ_${Date.now()}` });
    commitDB();
  },

  /** Drain sync queue (called when back online) */
  drainSyncQueue() {
    const db = getDB();
    const drained = [...(db.syncQueue || [])];
    db.syncQueue = [];
    db.lastSynced = new Date().toISOString();
    commitDB();
    return drained;
  },

  /** Audit log helper */
  audit(action, entityId, userId, detail) {
    this.insert('auditLog', {
      action, entityId, userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(), detail
    });
  },
};

// ─── Session helpers ──────────────────────────────────────────────────────────
export const session = {
  get() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  },
  set(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
  },
};
