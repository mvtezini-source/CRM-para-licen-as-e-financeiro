import dataService from './dataService';

// Detectar se está em desenvolvimento ou produção
const isDev = import.meta.env.DEV;
const API_BASE = isDev ? '/api' : (import.meta.env.VITE_API_BASE || 'http://localhost:4000/api');

let currentUserId = import.meta.env.VITE_USER_ID || null;
export function setUserId(id){ currentUserId = id; }

function getToken(){
  return localStorage.getItem('token');
}

export function setToken(t){
  if(t) localStorage.setItem('token', t); else localStorage.removeItem('token');
}

async function safeFetch(path, opts = {}) {
  try {
    const headers = opts.headers ? { ...opts.headers } : {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentUserId) headers['x-user-id'] = currentUserId;
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (e) {
    // fallback to local dataService for offline or if server not available
    console.warn('API indisponível, usando fallback local (dataService):', e.message);
    return null;
  }
}

async function getPlans() {
  const server = await safeFetch('/plans');
  return server ?? dataService.getPlans();
}

async function addPlan(plan) {
  const server = await safeFetch('/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) });
  if (server) return server;
  return dataService.addPlan(plan);
}

async function getClients() {
  const server = await safeFetch('/clients');
  return server ?? dataService.getClients();
}

async function addClient(client) {
  const server = await safeFetch('/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(client) });
  if (server) return server;
  return dataService.addClient(client);
}

async function createLicense(clientId, planId, expiresDays) {
  const license = dataService.createLicense(clientId, planId, expiresDays);
  // try to post to server but ignore errors
  safeFetch('/licenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, planId, key: license.key, issuedAt: license.issuedAt, expiresAt: license.expiresAt }) });
  return license;
}

async function getNotifications() {
  const server = await safeFetch('/notifications');
  return server ?? dataService.getNotifications();
}

async function addNotification(text) {
  const server = await safeFetch('/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
  if (server) return server;
  return dataService.addNotification(text);
}

export default {
  getPlans,
  addPlan,
  getClients,
  addClient,
  createLicense,
  getNotifications,
  addNotification,
  // users
  getUsers: async () => {
    const server = await safeFetch('/users');
    return server ?? [];
  },
  createUser: async (user) => {
    const server = await safeFetch('/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
    return server;
  },
  updateUser: async (userId, updates) => {
    const server = await safeFetch(`/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    return server;
  },
  deleteUser: async (userId) => {
    const server = await safeFetch(`/users/${userId}`, { method: 'DELETE' });
    return server;
  },
  // admin
  getJobLogs: async () => {
    const res = await safeFetch('/admin/jobs');
    return res;
  },
  runJob: async (jobKey) => {
    const res = await safeFetch('/admin/jobs/run', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ jobKey }) });
    return res;
  }
};

export async function getCurrentUser() {
  const res = await safeFetch('/me');
  return res;
}

async function login(id, password){
  try {
    const resp = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, password }) });
    const body = await resp.json().catch(()=>null);
    if (resp.ok) {
      if (body && body.token) setToken(body.token);
      return body;
    }
    return { error: body && (body.error || body.message) ? (body.error || body.message) : `HTTP ${resp.status}` };
  } catch (err) {
    return { error: 'Erro de conexão' };
  }
}

async function register(id, name, email, password){
  try {
    const resp = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name, email, password }) });
    const body = await resp.json().catch(()=>null);
    if (resp.ok) {
      if (body && body.token) setToken(body.token);
      return body;
    }
    return { error: body && (body.error || body.message) ? (body.error || body.message) : `HTTP ${resp.status}` };
  } catch (err) {
    return { error: 'Erro de conexão' };
  }
}

async function logout(){
  setToken(null);
}

export { login, register, logout };

async function markNotificationRead(id) {
  try {
    const res = await safeFetch(`/notifications/${id}/read`, { method: 'POST' });
    return res;
  } catch (e) {
    return null;
  }
}

export { markNotificationRead };

