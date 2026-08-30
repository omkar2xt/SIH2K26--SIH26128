/** Auth Service — role-based session management via localStorage */
import { session, store } from '../db/store.js';

export const ROLES = {
  farmer:   { label: 'Farmer',                   avatar: '🌾', color: 'emerald' },
  vet:      { label: 'Veterinarian',              avatar: '🩺', color: 'teal' },
  official: { label: 'District / Govt. Official', avatar: '🏛️', color: 'blue' },
  field:    { label: 'Field Worker',              avatar: '🚜', color: 'amber' },
  admin:    { label: 'Administrator',             avatar: '⚙️',  color: 'slate' },
};

const DEMO_USERS = {
  farmer:   { id: 'USR_01', name: 'R. Deshmukh',    role: 'farmer',   district: 'Nashik',  farmId: 'FARM_A' },
  vet:      { id: 'USR_03', name: 'Dr. A. Kulkarni', role: 'vet',      district: 'Nashik',  farmId: null },
  official: { id: 'USR_05', name: 'Collector Singh', role: 'official', district: 'State',   farmId: null },
  field:    { id: 'USR_06', name: 'Field Officer T', role: 'field',    district: 'Nashik',  farmId: null },
  admin:    { id: 'USR_07', name: 'Admin',           role: 'admin',    district: 'State',   farmId: null },
};

export const authService = {
  login(role) {
    const user = DEMO_USERS[role];
    if (!user) throw new Error('Unknown role');
    const sess = { ...user, loginAt: new Date().toISOString(), token: `DEMO_${role.toUpperCase()}_${Date.now()}` };
    session.set(sess);
    store.audit('LOGIN', user.id, user.id, `${user.name} logged in as ${role}`);
    return sess;
  },

  getSession() {
    return session.get();
  },

  logout() {
    const s = session.get();
    if (s) store.audit('LOGOUT', s.id, s.id, `${s.name} logged out`);
    session.clear();
  },

  getRole() {
    return session.get()?.role || null;
  },

  getRoleLabel(role) {
    return ROLES[role]?.label || role;
  },

  canAccess(role, resource) {
    const permissions = {
      farmer:   ['dashboard','animals','report','vaccination','alerts'],
      field:    ['dashboard','animals','report','alerts'],
      vet:      ['dashboard','cases','animals','risk','exposure','gis','lab','diseases','alerts','prevention'],
      official: ['dashboard','gis','clusters','vaccination','prevention','alerts'],
      admin:    ['dashboard','animals','farms','diseases','sync','settings','alerts'],
    };
    return permissions[role]?.includes(resource) ?? false;
  },
};
