import React, { useEffect, useState } from 'react';
import api from '../services/apiService';

export default function Licenses() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function load() {
      const cs = await api.getClients();
      setClients(cs);
      if (cs.length) setSelectedClient(cs[0].id);
    }
    load();
  }, []);

  async function handleIssue(e) {
    e.preventDefault();
    if (!selectedClient) return;
    await api.createLicense(selectedClient, clients.find(c => c.id === selectedClient)?.planId, Number(days));
    const cs = await api.getClients();
    setClients(cs);
    alert('Licença emitida');
  }

  const licenses = clients
    .filter(c => c.license)
    .map(c => ({ clientName: c.name, email: c.email, ...c.license, planId: c.planId, clientId: c.id }));

  return (
    <div className="crm-card">
      <h3>Licenças</h3>

      <form onSubmit={handleIssue} className="form-inline">
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
          ))}
        </select>
        <input type="number" min="1" value={days} onChange={e => setDays(e.target.value)} />
        <button type="submit">Emitir Licença</button>
      </form>

      <h4 style={{ marginTop: 16 }}>Licenças Ativas</h4>
      <ul>
        {licenses.length === 0 && <li>Sem licenças</li>}
        {licenses.map(l => (
          <li key={l.key}>
            <strong>{l.clientName}</strong> — {l.planId} — {l.key} — Expira: {new Date(l.expiresAt).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
