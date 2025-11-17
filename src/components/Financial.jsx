import React, { useEffect, useState } from 'react';

export default function Financial() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payments, setPayments] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const [formData, setFormData] = useState({
    client_id: '',
    plan_id: '',
    amount: '',
    due_date: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [invoicesRes, clientsRes, plansRes] = await Promise.all([
        fetch('http://localhost:4000/api/invoices'),
        fetch('http://localhost:4000/api/clients'),
        fetch('http://localhost:4000/api/plans'),
      ]);

      if (invoicesRes.ok && clientsRes.ok && plansRes.ok) {
        const inv = await invoicesRes.json();
        const cls = await clientsRes.json();
        const pls = await plansRes.json();
        
        setInvoices(inv || []);
        setClients(cls || []);
        setPlans(pls || []);
      }
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar dados financeiros');
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleCreateInvoice(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.client_id || !formData.amount) {
      setError('Cliente e valor são obrigatórios');
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newInvoice = await res.json();
        setInvoices([newInvoice, ...invoices]);
        setSuccess('Fatura criada com sucesso!');
        setFormData({ client_id: '', plan_id: '', amount: '', due_date: '', notes: '' });
        setShowForm(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Erro ao criar fatura');
    }
  }

  async function handleCreatePayment(invoiceId, clientId, paymentType = 'asaas') {
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:4000/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          client_id: clientId,
          payment_method: 'asaas',
        }),
      });

      if (res.ok) {
        const payment = await res.json();
        setPayments(prev => ({
          ...prev,
          [invoiceId]: payment,
        }));
        setSuccess('Cobrança gerada com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erro ao gerar cobrança');
      }
    } catch (err) {
      setError('Erro ao criar pagamento');
    }
  }

  async function checkPaymentStatus(paymentId, invoiceId) {
    try {
      const res = await fetch(`http://localhost:4000/api/payments/${paymentId}/status`);
      if (res.ok) {
        const payment = await res.json();
        if (payment.status === 'approved') {
          // Refresh invoices to show updated status
          await loadData();
          setSuccess('Pagamento confirmado! Fatura marcada como paga.');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError('Pagamento ainda não foi recebido');
        }
      }
    } catch (err) {
      setError('Erro ao verificar status');
    }
  }

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const stats = {
    total: invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
    paid: invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
    pending: invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
    count: invoices.length,
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pendente', color: '#f59e0b', bg: '#fef3c7' },
      paid: { label: 'Paga', color: '#10b981', bg: '#d1fae5' },
      overdue: { label: 'Vencida', color: '#ef4444', bg: '#fee2e2' },
      cancelled: { label: 'Cancelada', color: '#6b7280', bg: '#f3f4f6' },
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="crm-container">
        <div className="crm-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-container">
      <div className="crm-card">
        <div className="card-header">
          <div>
            <h2>Gerenciamento Financeiro</h2>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
              Fature clientes e acompanhe pagamentos em tempo real
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Nova Fatura'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Stats Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total Faturado</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981', marginTop: '8px' }}>
              R$ {stats.total.toFixed(2)}
            </div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#d1fae5', borderRadius: '10px', borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Recebido</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#059669', marginTop: '8px' }}>
              R$ {stats.paid.toFixed(2)}
            </div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Pendente</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b', marginTop: '8px' }}>
              R$ {stats.pending.toFixed(2)}
            </div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#ede9fe', borderRadius: '10px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total de Faturas</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#8b5cf6', marginTop: '8px' }}>
              {stats.count}
            </div>
          </div>
        </div>

        {/* Create Invoice Form */}
        {showForm && (
          <form onSubmit={handleCreateInvoice} className="form-section">
            <h3>Criar Nova Fatura</h3>
            <div className="form-grid-2">
              <div>
                <label>Cliente *</label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Plano</label>
                <select name="plan_id" value={formData.plan_id} onChange={handleChange} className="form-input">
                  <option value="">Sem plano específico</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div>
                <label>Valor *</label>
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  className="form-input"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label>Data de Vencimento</label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
            <div>
              <label>Observações</label>
              <textarea
                name="notes"
                placeholder="Anotações sobre a fatura..."
                value={formData.notes}
                onChange={handleChange}
                className="form-input"
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Criar Fatura
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Filter */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
          {['all', 'pending', 'paid', 'overdue'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: filter === status ? '#0b6cff' : '#e2e8f0',
                color: filter === status ? '#fff' : '#0f172a',
                fontWeight: 600,
              }}
            >
              {status === 'all' ? 'Todas' : status === 'pending' ? 'Pendentes' : status === 'paid' ? 'Pagas' : 'Vencidas'}
            </button>
          ))}
        </div>

        {/* Invoices List */}
        <div className="invoices-grid">
          {filteredInvoices.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
              Nenhuma fatura encontrada
            </div>
          ) : (
            filteredInvoices.map(invoice => {
              const client = clients.find(c => c.id === invoice.client_id);
              const plan = plans.find(p => p.id === invoice.plan_id);
              const statusBadge = getStatusBadge(invoice.status);
              const payment = payments[invoice.id];

              return (
                <div key={invoice.id} className="invoice-card">
                  <div className="invoice-header">
                    <div>
                      <h4 style={{ margin: '0', color: '#0f172a' }}>{invoice.id}</h4>
                      <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                        {client?.name || 'Cliente não encontrado'}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '6px 12px',
                        backgroundColor: statusBadge.bg,
                        color: statusBadge.color,
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  <div style={{ margin: '12px 0', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280' }}>Valor:</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>R$ {parseFloat(invoice.amount).toFixed(2)}</span>
                    </div>
                    {plan && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#6b7280' }}>Plano:</span>
                        <span style={{ fontWeight: 600, color: '#0b6cff' }}>{plan.name}</span>
                      </div>
                    )}
                    {invoice.due_date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Vencimento:</span>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                          {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  {payment && (
                    <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                        💳 Cobrança ASAAS
                      </div>
                      {payment.pix_copy_paste && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0b6cff', marginBottom: '4px' }}>PIX Cópia e Cola:</div>
                          <div
                            style={{
                              padding: '8px',
                              backgroundColor: '#fff',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              wordBreak: 'break-all',
                              border: '1px solid #e2e8f0',
                              maxHeight: '60px',
                              overflow: 'auto',
                            }}
                          >
                            {payment.pix_copy_paste}
                          </div>
                        </div>
                      )}
                      {payment.barcode && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b', marginBottom: '4px' }}>Boleto Bancário:</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', fontFamily: 'monospace' }}>
                            {payment.barcode}
                          </div>
                        </div>
                      )}
                      {payment.invoice_url && (
                        <a
                          href={payment.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            marginBottom: '8px',
                            marginRight: '8px',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          🌐 Abrir Cobrança
                        </a>
                      )}
                      <button
                        onClick={() => checkPaymentStatus(payment.id || payment.payment_id, invoice.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.85rem',
                          backgroundColor: '#e0eaff',
                          color: '#0b6cff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        ✓ Verificar Pagamento
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {invoice.status === 'pending' && !payment && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleCreatePayment(invoice.id, invoice.client_id, 'asaas')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#06b6d4',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                        }}
                      >
                        📝 Gerar Cobrança ASAAS
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
