import React, { useState, useEffect } from 'react';
import api from '../services/apiService';
import dataService from '../services/dataService';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    role: 'Usuário Padrão',
    clientId: '',
    cpfCnpj: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUsers();
    loadClients();
  }, []);

  async function loadUsers() {
    try {
      const result = await api.getUsers();
      setUsers(result || []);
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
    }
  }

  async function loadClients() {
    try {
      const result = await api.getClients();
      setClients(result || []);
    } catch (e) {
      console.error('Erro ao carregar clientes:', e);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.id || !formData.name) {
        setError('Usuário (id) e Nome são obrigatórios');
        return;
      }

      // Validações de senha
      if (!editingId) {
        // Criando novo usuário: senha obrigatória
        if (!formData.password || formData.password.length < 6) {
          setError('Senha é obrigatória e deve ter ao menos 6 caracteres');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Senha e confirmação não coincidem');
          return;
        }
      } else {
        // Atualizando usuário: senha opcional — se fornecida valida
        if (formData.password) {
          if (formData.password.length < 6) {
            setError('Senha deve ter ao menos 6 caracteres');
            return;
          }
          if (formData.password !== formData.confirmPassword) {
            setError('Senha e confirmação não coincidem');
            return;
          }
        }
      }

      if (editingId) {
        // Atualizar usuário
        const payload = {
          id: formData.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) payload.password = formData.password;

        await api.updateUser(editingId, payload);
        
        // Se tem cliente vinculado, atualizar
        if (formData.clientId) {
          const client = clients.find(c => c.id === formData.clientId);
          if (client) {
            const userDoc = {
              userId: formData.id,
              cpfCnpj: formData.cpfCnpj,
            };
            dataService.linkUserToClient(formData.clientId, userDoc);
          }
        }
      } else {
        // Criar novo usuário
        const payload = {
          id: formData.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password,
        };
        await api.createUser(payload);

        // Vincular ao cliente se especificado
        if (formData.clientId) {
          const client = clients.find(c => c.id === formData.clientId);
          if (client) {
            const userDoc = {
              userId: formData.id,
              cpfCnpj: formData.cpfCnpj,
            };
            dataService.linkUserToClient(formData.clientId, userDoc);
          }
        }
      }

      await loadUsers();
      setFormData({
        id: '',
        name: '',
        email: '',
        role: 'Usuário Padrão',
        clientId: '',
        cpfCnpj: '',
      });
      setEditingId(null);
      setShowForm(false);
    } catch (e) {
      setError(e.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(user) {
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email || '',
      role: user.role || 'Usuário Padrão',
      clientId: '',
      cpfCnpj: '',
    });
    setEditingId(user.id);
    setShowForm(true);
  }

  async function handleDelete(userId) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      setLoading(true);
      await api.deleteUser(userId);
      await loadUsers();
    } catch (e) {
      setError('Erro ao deletar usuário');
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setFormData({
      id: '',
      name: '',
      email: '',
      role: 'Usuário Padrão',
      clientId: '',
      cpfCnpj: '',
    });
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div className="crm-container">
      <div className="crm-card">
        <div className="card-header">
          <div>
            <h2>Gerenciar Usuários</h2>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
              {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Novo Usuário'}
          </button>
        </div>

        {error && <div style={{ background: '#fee', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

        {/* Formulário */}
        {showForm && (
          <form onSubmit={handleSubmit} className="form-section">
            <h3>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            
            <div className="form-grid-2">
              <div>
                <label>Usuário (id) *</label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  placeholder="Nome único do usuário"
                  disabled={editingId !== null}
                  className="form-input"
                />
              </div>
              <div>
                <label>Nome Completo *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome do usuário"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="form-input"
                />
              </div>
              <div>
                <label>Função</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="Usuário Padrão">Usuário Padrão</option>
                  <option value="Gerente">Gerente</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div>
                <label>Cliente Vinculado</label>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">-- Nenhum --</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>CPF/CNPJ</label>
                <input
                  type="text"
                  name="cpfCnpj"
                  value={formData.cpfCnpj}
                  onChange={handleChange}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar Usuário'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista de usuários */}
        <div className="users-grid">
          {users.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
              Nenhum usuário cadastrado
            </div>
          ) : (
            users.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <h3>{user.name}</h3>
                  <span className="role-badge" style={{ background: getRoleColor(user.role) }}>
                    {user.role}
                  </span>
                </div>
                <div className="user-details">
                  <div><strong>Usuário:</strong> {user.id}</div>
                  {user.email && <div><strong>Email:</strong> {user.email}</div>}
                </div>
                <div className="user-actions">
                  <button className="btn btn-edit" onClick={() => handleEdit(user)}>Editar</button>
                  <button className="btn btn-delete" onClick={() => handleDelete(user.id)}>Excluir</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getRoleColor(role) {
  switch (role) {
    case 'Administrador':
      return '#7c3aed';
    case 'Gerente':
      return '#2563eb';
    default:
      return '#10b981';
  }
}
