import React, { useEffect, useState } from 'react';
import api from '../services/apiService';

// NOTE: react-chartjs-2 and chart.js are imported dynamically inside the component
// to avoid Vite failing the build when the packages are not installed. If you
// want the full charts, run `npm install chart.js react-chartjs-2` in the
// frontend project root.

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [ChartLib, setChartLib] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const cs = await api.getClients();
      const nots = await api.getNotifications();
      if (!mounted) return;
      setClients(cs || []);
      setNotifications(nots || []);

      // Try to dynamically import chart libraries. If they aren't installed
      // the import will fail and we just keep ChartLib as null (fallback UI).
      try {
        await import('chart.js/auto'); // registers controllers/elements automatically
        const rc = await import('react-chartjs-2');
        if (!mounted) return;
        setChartLib({ Bar: rc.Bar, Doughnut: rc.Doughnut });
      } catch (err) {
        // silent fallback — charts will show placeholders
        if (!mounted) return;
        setChartLib(null);
        console.warn('chart libs not available, showing fallback visuals');
      }
    }

    loadData();
    return () => { mounted = false; };
  }, []);

  const activeClients = clients.length;
  const activeLicenses = clients.filter(c => c.license && new Date(c.license.expiresAt) > new Date()).length;
  const blockedLicenses = clients.filter(c => c.license && new Date(c.license.expiresAt) <= new Date()).length;
  const messagesSent = 0; // placeholder — integrar métricas reais depois

  // distribution by plan
  const planCounts = {};
  clients.forEach(c => {
    const plan = c.planId || 'Sem Plano';
    planCounts[plan] = (planCounts[plan] || 0) + 1;
  });

  const planLabels = Object.keys(planCounts);
  const planData = Object.values(planCounts);

  const barData = {
    labels: planLabels,
    datasets: [
      {
        label: 'Clientes por plano',
        data: planData,
        backgroundColor: 'rgba(11,108,255,0.8)',
      },
    ],
  };

  const doughnutData = {
    labels: ['Ativas', 'Bloqueadas'],
    datasets: [
      {
        data: [activeLicenses, blockedLicenses],
        backgroundColor: ['#16a34a', '#ef4444'],
      },
    ],
  };

  return (
    <div className="crm-dashboard">
      <h2>Painel</h2>
      <p className="muted">Visão geral do sistema de mensageria</p>

      <div className="dash-cards">
        <div className="dash-card">
          <div className="card-title">Clientes Ativos</div>
          <div className="card-value">{activeClients}</div>
          <div className="card-sub">↗︎ 12% vs. mês anterior</div>
        </div>

        <div className="dash-card">
          <div className="card-title">Licenças Ativas</div>
          <div className="card-value">{activeLicenses}</div>
          <div className="card-sub">↗︎ 8% vs. mês anterior</div>
        </div>

        <div className="dash-card">
          <div className="card-title">Licenças Bloqueadas</div>
          <div className="card-value">{blockedLicenses}</div>
          <div className="card-sub">0</div>
        </div>

        <div className="dash-card">
          <div className="card-title">Mensagens Enviadas</div>
          <div className="card-value">{messagesSent}</div>
          <div className="card-sub">↗︎ 23% vs. mês anterior</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-panel">
          <h4>Status das Licenças</h4>
          <div className="panel-body large-box">{/* Placeholder for status timeline */}</div>
        </div>

        <div className="dash-panel">
          <h4>Distribuição por Plano</h4>
          <div className="panel-body">
            {ChartLib && planLabels.length ? (
              <ChartLib.Bar data={barData} />
            ) : planLabels.length ? (
              <div style={{padding:24, textAlign:'center'}}>
                <svg width="200" height="120" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="30" width="30" height="60" fill="#c7d2fe" rx="4"/>
                  <rect x="50" y="15" width="30" height="75" fill="#93c5fd" rx="4"/>
                  <rect x="90" y="45" width="30" height="45" fill="#60a5fa" rx="4"/>
                  <rect x="130" y="5" width="30" height="85" fill="#0b6cff" rx="4"/>
                </svg>
                <div className="muted">Instale `chart.js` e `react-chartjs-2` para gráficos completos</div>
              </div>
            ) : (
              <div>Sem dados</div>
            )}
          </div>
        </div>

        <div className="dash-panel">
          <h4>Notificações Recentes</h4>
          <div className="panel-body">
            {notifications.length === 0 && <div className="empty">Nenhuma notificação recente</div>}
            <ul className="notes-list">
              {notifications.slice(0,5).map(n => (
                <li key={n.id}>{n.text} <small className="muted">{new Date(n.at || n.created_at).toLocaleString()}</small></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="dash-activity">
        <h4>Atividade Recente</h4>
        <div className="panel-body">Nenhuma atividade registrada</div>
      </div>
    </div>
  );
}
