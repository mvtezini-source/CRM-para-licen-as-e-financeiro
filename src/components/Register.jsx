import React, { useState } from 'react';
import { register } from '../services/apiService';

export default function Register({ onRegister, onBack }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!id || !name || !password) {
      setError('Preencha usuário, nome e senha');
      return;
    }

    if (password !== confirm) {
      setError('Senhas não conferem');
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (email && !email.includes('@')) {
      setError('Email inválido');
      return;
    }

    setLoading(true);
    try {
      const res = await register(id, name, email, password);
      if (res && res.token) {
        setSuccess('✅ Conta criada com sucesso! Redirecionando...');
        setTimeout(() => {
          if (onRegister) onRegister();
        }, 1500);
      } else {
        setError(res?.error || 'Erro ao registrar');
      }
    } catch (e) {
      setError('Erro ao conectar ao servidor');
    }
    setLoading(false);
  }

  return (
    <div style={{width:'100%', maxWidth:'400px'}}>
      <div className="crm-card">
        <h2 style={{textAlign:'center', marginBottom:'24px'}}>📝 Criar Conta</h2>
        
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          <div>
            <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Usuário *</label>
            <input 
              type="text"
              placeholder="Escolha um usuário único" 
              value={id} 
              onChange={e => setId(e.target.value)}
              style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'14px'}}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Nome Completo *</label>
            <input 
              type="text"
              placeholder="Seu nome" 
              value={name} 
              onChange={e => setName(e.target.value)}
              style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'14px'}}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Email</label>
            <input 
              type="email"
              placeholder="seu@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'14px'}}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Senha *</label>
            <input 
              type="password"
              placeholder="Mínimo 6 caracteres" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'14px'}}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Confirmar Senha *</label>
            <input 
              type="password"
              placeholder="Repita sua senha" 
              value={confirm} 
              onChange={e => setConfirm(e.target.value)}
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

          {success && (
            <div style={{
              backgroundColor:'#d4edda',
              color:'#155724',
              padding:'10px',
              borderRadius:'6px',
              fontSize:'14px'
            }}>
              {success}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding:'10px',
              backgroundColor:'#28a745',
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
            {loading ? '⏳ Criando conta...' : '✓ Criar Conta'}
          </button>
        </form>

        <div style={{
          marginTop:'20px',
          paddingTop:'20px',
          borderTop:'1px solid #eee',
          textAlign:'center',
          fontSize:'14px'
        }}>
          <button 
            type="button"
            onClick={onBack}
            disabled={loading}
            style={{
              padding:'8px 16px',
              backgroundColor:'#6c757d',
              color:'white',
              border:'none',
              borderRadius:'6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize:'14px',
              fontWeight:'bold'
            }}
          >
            ← Voltar ao Login
          </button>
        </div>
      </div>

      <div style={{marginTop:'20px', padding:'16px', backgroundColor:'#fff3cd', borderRadius:'6px', fontSize:'12px', color:'#856404'}}>
        <strong>ℹ️ Informações:</strong><br/>
        * Campos obrigatórios<br/>
        Senha deve ter no mínimo 6 caracteres
      </div>
    </div>
  );
}
