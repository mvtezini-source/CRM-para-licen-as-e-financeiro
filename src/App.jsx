import './App.css';
import { useState } from 'react';
import Plans from './components/Plans';
import Clients from './components/Clients';
import Notifications from './components/Notifications';
import Licenses from './components/Licenses';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState('dashboard');

  return (
    <div className="App crm-root">
      <nav className="crm-nav">
        <div className="crm-brand">CRM Licenciamento</div>
        <div className="crm-links">
          <button onClick={() => setView('dashboard')}>Painel</button>
          <button onClick={() => setView('plans')}>Planos</button>
          <button onClick={() => setView('clients')}>Clientes</button>
          <button onClick={() => setView('notifications')}>Notificações</button>
          <button onClick={() => setView('licenses')}>Licenças</button>
        </div>
      </nav>

      <main className="crm-main">
        {view === 'dashboard' && <Dashboard />}

        {view === 'plans' && <Plans />}
        {view === 'clients' && <Clients />}
        {view === 'licenses' && <Licenses />}
        {view === 'notifications' && <Notifications />}
      </main>
    </div>
  );
}

export default App;
