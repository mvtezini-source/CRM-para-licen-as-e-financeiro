import React, { useState, useEffect } from 'react';
import api, { getCurrentUser } from '../services/apiService';

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

  const [canIssue, setCanIssue] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await getCurrentUser();
        if (!mounted) return;
        setCanIssue(u && u.permissions && u.permissions.includes('manage_licenses'));
      } catch (e) {
        setCanIssue(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!canIssue) return <div className="muted">Você não tem permissão para emitir licenças.</div>;

  return (
    <form onSubmit={handleIssue} className="form-inline">
      <input type="number" min="1" value={days} onChange={e => setDays(e.target.value)} />
      <button type="submit" disabled={loading}>Emitir Licença</button>
    </form>
  );
}
