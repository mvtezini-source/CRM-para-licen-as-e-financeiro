import React, { useState } from 'react';
import { login } from '../services/apiService';

export default function Login({ onLogin, onRegister }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!id || !password) {
      setError('Preencha usuário e senha');
      setLoading(false);
      return;
    }

    try {
      const res = await login(id, password);
      if (res && res.token) {
        if (onLogin) onLogin();
      } else {
        setError(res?.error || 'Credenciais inválidas');
      }
    } catch (e) {
      setError('Erro ao conectar ao servidor');
    }
    setLoading(false);
  }

  return (
    <div style={{width:'100%', maxWidth:'400px'}}>
      <div className="crm-card">
        <h2 style={{textAlign:'center', marginBottom:'24px'}}>🔐 Entrar no CRM</h2>
        
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          <div>
            <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Usuário</label>
            <input 
              type="text"
              placeholder="Digite seu usuário" 
              value={id} 
              onChange={e => setId(e.target.value)}
              style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'14px'}}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Senha</label>
            <input 
              type="password"
              placeholder="Digite sua senha" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'14px'}}
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor:'#f8d7da',
              color:'#721c24',
              padding:'10px',
              borderRadius:'6px',
              fontSize:'14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding:'10px',
              backgroundColor:'#007bff',
              color:'white',
              border:'none',
              borderRadius:'6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontSize:'16px',
              fontWeight:'bold',
              marginTop:'8px'
            }}
          >
            {loading ? '⏳ Entrando...' : '🔓 Entrar'}
          </button>
        </form>

        <div style={{
          marginTop:'20px',
          paddingTop:'20px',
          borderTop:'1px solid #eee',
          textAlign:'center',
          fontSize:'14px'
        }}>
          <p style={{color:'#666', marginBottom:'10px'}}>Não tem conta?</p>
          <button 
            type="button"
            onClick={onRegister}
            disabled={loading}
            style={{
              padding:'8px 16px',
              backgroundColor:'#28a745',
              color:'white',
              border:'none',
              borderRadius:'6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize:'14px',
              fontWeight:'bold'
            }}
          >
            📝 Criar Conta
          </button>
        </div>
      </div>

      <div style={{marginTop:'20px', padding:'16px', backgroundColor:'#e7f3ff', borderRadius:'6px', fontSize:'12px', color:'#004085'}}>
        <strong>👨‍💼 Usuário teste:</strong><br/>
        Usuário: <code>admin</code><br/>
        Senha: <code>senha123</code>
      </div>
    </div>
  );
}
