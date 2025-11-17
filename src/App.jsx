import './App.css';
import { useState, useEffect } from 'react';
import Plans from './components/Plans';
import Clients from './components/Clients';
import Notifications from './components/Notifications';
import Licenses from './components/Licenses';
import Dashboard from './components/Dashboard';
import SystemAdmin from './components/SystemAdmin';
import Users from './components/Users';
import Permissions from './components/Permissions';
import Financial from './components/Financial';
import Reports from './components/Reports';
import Tickets from './components/Tickets';
import Login from './components/Login';
import Register from './components/Register';
import api, { getCurrentUser, setUserId, logout } from './services/apiService';

function App() {
  const [view, setView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(()=>{
    (async ()=>{
      try {
        const u = await getCurrentUser();
        setCurrentUser(u);
      } catch (e) {
        setCurrentUser(null);
      }
      setIsLoading(false);
    })();
  },[]);

  async function handleLogin() {
    const u = await getCurrentUser();
    setCurrentUser(u);
    setAuthView(null);
    setView('dashboard');
  }

  async function handleLogout(){
    await logout();
    setCurrentUser(null);
    setView('dashboard');
  }

  // Se não está logado, mostra tela de login
  if (!currentUser) {
    return (
      <div className="App crm-root">
        <nav className="crm-nav">
          <div className="crm-brand">CRM Licenciamento</div>
        </nav>
        <main className="crm-main" style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'80vh'}}>
          {authView === 'register' ? (
            <Register onRegister={handleLogin} onBack={() => setAuthView(null)} />
          ) : (
            <Login onLogin={handleLogin} onRegister={() => setAuthView('register')} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="App crm-root">
      <nav className="crm-nav">
        <div className="crm-brand">CRM Licenciamento</div>
        <div className="crm-links">
          <button onClick={() => setView('dashboard')}>Painel</button>
          <button onClick={() => setView('plans')}>Planos</button>
          <button onClick={() => setView('clients')}>Clientes</button>
          <button onClick={() => setView('users')}>Usuários</button>
          <button onClick={() => setView('permissions')}>Permissões</button>
          <button onClick={() => setView('notifications')}>Notificações</button>
          <button onClick={() => setView('licenses')}>Licenças</button>
          <button onClick={() => setView('financial')}>Financeiro</button>
          <button onClick={() => setView('reports')}>📊 Relatórios</button>
          <button onClick={() => setView('tickets')}>🎫 Tickets</button>
          <button onClick={() => setView('admin')}>Administração</button>
           </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          {currentUser && (
            <>
              <div style={{marginLeft:12}}>Olá, {currentUser.name}</div>
              <button onClick={handleLogout} style={{backgroundColor:'#dc3545', color:'white'}}>Sair</button>
            </>
          )}
        </div>
      </nav>

      <main className="crm-main">
        {view === 'dashboard' && <Dashboard />}
        {view === 'plans' && <Plans />}
        {view === 'clients' && <Clients />}
        {view === 'licenses' && <Licenses />}
        {view === 'notifications' && <Notifications />}
        {view === 'users' && <Users />}
        {view === 'permissions' && <Permissions />}
        {view === 'financial' && <Financial />}
        {view === 'reports' && <Reports />}
        {view === 'tickets' && <Tickets />}
        {view === 'admin' && <SystemAdmin />}
      </main>
    </div>
  );
}

export default App;
