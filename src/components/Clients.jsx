import React, { useEffect, useState } from 'react';
import api from '../services/apiService';
import LicenseForm from './LicenseForm';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState('');

  useEffect(() => {
    async function load() {
      const ps = await api.getPlans();
      const cs = await api.getClients();
      setPlans(ps);
      setClients(cs);
      if (!planId && ps.length) setPlanId(ps[0].id);
    }
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name) return;
    const client = { id: Date.now().toString(), name, email, planId, license: null };
    await api.addClient(client);
    setClients(await api.getClients());
    setName('');
    setEmail('');
  }

  async function refresh() {
    setClients(await api.getClients());
  }

  return (
    <div className="crm-card">
      <h3>Clientes</h3>

      <form onSubmit={handleCreate} className="form-inline">
        <input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <select value={planId} onChange={e => setPlanId(e.target.value)}>
          {plans.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button type="submit">Criar Cliente</button>
      </form>

      <ul className="client-list">
        {clients.map(c => {
          const plan = plans.find(p => p.id === c.planId);
          const planName = plan ? plan.name : c.planId || '—';
          return (
            <li key={c.id} className="client-item">
              <div>
                <strong>{c.name}</strong> — {c.email} — Plano: {planName}
              </div>
              <div>
                {c.license ? (
                  <div className="license-box">
                    <div>Licença: {c.license.key}</div>
                    <div>Expira: {new Date(c.license.expiresAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                ) : (
                  <LicenseForm client={c} onIssued={refresh} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
