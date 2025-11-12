const PLANS_KEY = 'crm_plans';
const CLIENTS_KEY = 'crm_clients';
const NOTIF_KEY = 'crm_notifications';

function read(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function seedDefaults() {
  const plans = read(PLANS_KEY, null);
  if (!plans) {
    const defaultPlans = [
      { id: 'basic', name: 'Basic', price: 0, seats: 1 },
      { id: 'standard', name: 'Standard', price: 49, seats: 5 },
      { id: 'enterprise', name: 'Enterprise', price: 199, seats: 50 },
    ];
    write(PLANS_KEY, defaultPlans);
  }
  if (!read(CLIENTS_KEY, null)) write(CLIENTS_KEY, []);
  if (!read(NOTIF_KEY, null)) write(NOTIF_KEY, []);
}

function getPlans() {
  seedDefaults();
  return read(PLANS_KEY, []);
}

function addPlan(plan) {
  const plans = getPlans();
  plans.push(plan);
  write(PLANS_KEY, plans);
  addNotification(`Plano criado: ${plan.name}`);
}

function getClients() {
  return read(CLIENTS_KEY, []);
}

function addClient(client) {
  const clients = getClients();
  clients.push(client);
  write(CLIENTS_KEY, clients);
  addNotification(`Cliente criado: ${client.name}`);
}

function updateClient(updated) {
  const clients = getClients().map(c => (c.id === updated.id ? updated : c));
  write(CLIENTS_KEY, clients);
}

function generateLicenseKey() {
  const rand = () => Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${rand()}-${rand()}-${Date.now().toString(36).toUpperCase()}`;
}

function createLicense(clientId, planId, expiresDays = 30) {
  const clients = getClients();
  const client = clients.find(c => c.id === clientId);
  if (!client) throw new Error('Cliente não encontrado');
  const license = {
    key: generateLicenseKey(),
    planId,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiresDays * 24 * 3600 * 1000).toISOString(),
  };
  client.license = license;
  updateClient(client);
  addNotification(`Licença emitida para ${client.name}: ${license.key}`);
  return license;
}

function getNotifications() {
  return read(NOTIF_KEY, []);
}

function addNotification(text) {
  const notifs = getNotifications();
  const n = { id: Date.now().toString(), text, at: new Date().toISOString(), read: false };
  notifs.unshift(n);
  write(NOTIF_KEY, notifs);
}

function markNotificationRead(id) {
  const notifs = getNotifications().map(n => (n.id === id ? { ...n, read: true } : n));
  write(NOTIF_KEY, notifs);
}

export default {
  getPlans,
  addPlan,
  getClients,
  addClient,
  createLicense,
  getNotifications,
  markNotificationRead,
};
