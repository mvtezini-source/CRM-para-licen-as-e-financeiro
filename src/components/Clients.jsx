import React, { useEffect, useState } from 'react';
import api from '../services/apiService';
import LicenseForm from './LicenseForm';
import dataService from '../services/dataService';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpfCnpj: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    planId: '',
  });

  useEffect(() => {
    async function load() {
      const ps = await api.getPlans();
      const cs = await api.getClients();
      setPlans(ps);
      setClients(cs);
      if (ps.length) {
        setFormData(prev => ({ ...prev, planId: ps[0].id }));
      }
    }
    load();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function fetchCEP(cep) {
    if (!cep || cep.length < 8) return;
    
    setLoadingCEP(true);
    setError('');
    try {
      const cleanCEP = cep.replace(/\D/g, '');
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        setError('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        street: data.logradouro,
        city: data.localidade,
        state: data.uf,
        complement: data.complemento,
      }));
    } catch (err) {
      setError('Erro ao buscar CEP');
    } finally {
      setLoadingCEP(false);
    }
  }

  function handleCEPBlur() {
    if (formData.cep) {
      fetchCEP(formData.cep);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.name || !formData.planId) {
      setError('Nome do cliente e plano são obrigatórios');
      return;
    }

    try {
      const clientData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpfCnpj: formData.cpfCnpj,
        address: {
          cep: formData.cep,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          city: formData.city,
          state: formData.state,
        },
        planId: formData.planId,
      };

      if (editingId) {
        clientData.id = editingId;
        const updatedClients = clients.map(c => c.id === editingId ? { ...clientData, license: c.license } : c);
        setClients(updatedClients);
        dataService.updateClient(clientData);
        setSuccess('Cliente atualizado com sucesso!');
      } else {
        const client = { ...clientData, id: Date.now().toString(), license: null };
        await api.addClient(client);
        setClients(await api.getClients());
        setSuccess('Cliente criado com sucesso!');
      }

      resetForm();
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(editingId ? 'Erro ao atualizar cliente' : 'Erro ao criar cliente');
    }
  }

  function handleEdit(client) {
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      cpfCnpj: client.cpfCnpj || '',
      cep: client.address?.cep || '',
      street: client.address?.street || '',
      number: client.address?.number || '',
      complement: client.address?.complement || '',
      city: client.address?.city || '',
      state: client.address?.state || '',
      planId: client.planId,
    });
    setEditingId(client.id);
    setShowForm(true);
  }

  async function handleDelete(clientId) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      setClients(clients.filter(c => c.id !== clientId));
      dataService.deleteClient(clientId);
      setSuccess('Cliente excluído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao excluir cliente');
    }
  }

  async function refresh() {
    setClients(await api.getClients());
  }

  function resetForm() {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cpfCnpj: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      city: '',
      state: '',
      planId: plans.length > 0 ? plans[0].id : '',
    });
    setEditingId(null);
    setError('');
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cpfCnpj && c.cpfCnpj.includes(searchTerm))
  );

  return (
    <div className="crm-container">
      <div className="crm-card">
        <div className="card-header">
          <div>
            <h2>Gerenciar Clientes</h2>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
              {filteredClients.length} de {clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
            {showForm ? 'Cancelar' : '+ Novo Cliente'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {showForm && (
          <form onSubmit={handleCreate} className="form-section">
            <h3>{editingId ? 'Editar Cliente' : 'Criar Novo Cliente'}</h3>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Dados Pessoais</h4>
              <div className="form-grid-2">
                <div>
                  <label>Nome do Cliente *</label>
                  <input type="text" name="name" placeholder="Nome completo" value={formData.name} onChange={handleChange} className="form-input" required />
                </div>
                <div>
                  <label>Email</label>
                  <input type="email" name="email" placeholder="email@example.com" value={formData.email} onChange={handleChange} className="form-input" />
                </div>
              </div>
              <div className="form-grid-2">
                <div>
                  <label>Telefone</label>
                  <input type="tel" name="phone" placeholder="(11) 99999-9999" value={formData.phone} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label>CPF/CNPJ</label>
                  <input type="text" name="cpfCnpj" placeholder="000.000.000-00 ou 00.000.000/0000-00" value={formData.cpfCnpj} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Endereço</h4>
              <div className="form-grid-2">
                <div>
                  <label>CEP</label>
                  <input type="text" name="cep" placeholder="00000-000" value={formData.cep} onChange={handleChange} onBlur={handleCEPBlur} className="form-input" />
                  {loadingCEP && <small style={{ color: '#0b6cff' }}>Buscando...</small>}
                </div>
                <div>
                  <label>Rua/Avenida</label>
                  <input type="text" name="street" placeholder="Rua..." value={formData.street} onChange={handleChange} className="form-input" />
                </div>
              </div>
              <div className="form-grid-3">
                <div>
                  <label>Número</label>
                  <input type="text" name="number" placeholder="Número" value={formData.number} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label>Complemento</label>
                  <input type="text" name="complement" placeholder="Apto, sala..." value={formData.complement} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label>Estado</label>
                  <input type="text" name="state" placeholder="SP" value={formData.state} onChange={handleChange} className="form-input" maxLength="2" />
                </div>
              </div>
              <div className="form-grid-2">
                <div>
                  <label>Cidade</label>
                  <input type="text" name="city" placeholder="Cidade" value={formData.city} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label>Plano *</label>
                  <select name="planId" value={formData.planId} onChange={handleChange} className="form-input" required>
                    <option value="">Selecione um plano</option>
                    {plans.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">{editingId ? 'Atualizar Cliente' : 'Criar Cliente'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</button>
            </div>
          </form>
        )}

        {!showForm && clients.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <input type="text" placeholder="🔍 Buscar cliente por nome, email ou CPF/CNPJ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
          </div>
        )}

        <div className="clients-grid">
          {filteredClients.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
              {clients.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
            </div>
          ) : (
            filteredClients.map(c => {
              const plan = plans.find(p => p.id === c.planId);
              const planName = plan ? plan.name : c.planId || '—';
              const address = c.address || {};
              return (
                <div key={c.id} className="client-card">
                  <div className="client-header">
                    <h3>{c.name}</h3>
                    <span className="plan-badge">{planName}</span>
                  </div>
                  <div className="client-details">
                    {c.email && <div><strong>📧 Email:</strong> {c.email}</div>}
                    {c.phone && <div><strong>📱 Telefone:</strong> {c.phone}</div>}
                    {c.cpfCnpj && <div><strong>🆔 CPF/CNPJ:</strong> {c.cpfCnpj}</div>}
                    {address.street && (
                      <>
                        <div style={{ marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}><strong>📍 Endereço:</strong></div>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>
                          {address.street} {address.number && `, ${address.number}`}{address.complement && ` - ${address.complement}`}<br />
                          {address.city} - {address.state} {address.cep && `- CEP ${address.cep}`}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="client-footer">
                    {c.license ? (
                      <div className="license-box-compact">
                        <div><strong>Licença:</strong> {c.license.key.substring(0, 20)}...</div>
                        <div><strong>Expira:</strong> {new Date(c.license.expiresAt).toLocaleDateString('pt-BR')}</div>
                      </div>
                    ) : (<LicenseForm client={c} onIssued={refresh} />)}
                    <div className="client-actions">
                      <button className="btn btn-edit" onClick={() => handleEdit(c)}>✏️ Editar</button>
                      <button className="btn btn-delete" onClick={() => handleDelete(c.id)}>🗑️ Excluir</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
