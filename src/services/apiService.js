import dataService from './dataService';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function safeFetch(path, opts = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, opts);
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
};
