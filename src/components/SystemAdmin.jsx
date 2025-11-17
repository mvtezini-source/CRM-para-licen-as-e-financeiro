import React, { useEffect, useState } from 'react';
import api, { getCurrentUser } from '../services/apiService';

export default function SystemAdmin(){
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [jobKey, setJobKey] = useState('daily_check_expired');

  useEffect(()=>{ load(); }, []);

  async function load(){
    try{
      const user = await getCurrentUser();
      if (!user || !user.permissions || !user.permissions.includes('view_logs')){
        setLogs([]);
        return;
      }
      const rows = await api.getJobLogs();
      setLogs(rows || []);
    }catch(e){ console.warn(e); }
  }

  async function run(){
    setRunning(true);
    try{
      const user = await getCurrentUser();
      const j = await api.runJob(jobKey);
      alert('Execução: ' + JSON.stringify(j));
      await load();
    }catch(e){ alert('Erro: '+e.message); }
    setRunning(false);
  }

  return (
    <div className="crm-card">
      <h3>Administração do Sistema</h3>
      <div className="form-inline">
        <select value={jobKey} onChange={e=>setJobKey(e.target.value)}>
          <option value="daily_check_expired">Verificação diária de licenças expiradas</option>
          <option value="weekly_inactive_30d">Verificação semanal de licenças inativas (&gt;30d)</option>
          <option value="monthly_inactive_clients">Verificação mensal de clientes inativos</option>
          <option value="cleanup_notifications">Limpeza de notificações antigas</option>
        </select>
        <button onClick={run} disabled={running}>{running? 'Executando...':'Executar Agora'}</button>
      </div>

      <h4 style={{marginTop:12}}>Logs de Execução (recente)</h4>
      <ul style={{maxHeight:320, overflow:'auto'}}>
        {logs.map(l=> (
          <li key={l.id}><strong>{l.job_key}</strong> — {l.status} — {l.message} <small className="muted">{new Date(l.ran_at).toLocaleString()}</small></li>
        ))}
      </ul>
    </div>
  );
}
