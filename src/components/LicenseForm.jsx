import React, { useState } from 'react';
import api from '../services/apiService';

export default function LicenseForm({ client, onIssued }) {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  async function handleIssue(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const license = await api.createLicense(client.id, client.planId, Number(days));
      if (onIssued) await onIssued();
      // optionally show license key
      if (license && license.key) {
        alert(`Licença emitida: ${license.key}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao emitir licença');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleIssue} className="form-inline">
      <input type="number" min="1" value={days} onChange={e => setDays(e.target.value)} />
      <button type="submit" disabled={loading}>Emitir Licença</button>
    </form>
  );
}
