import React, { useEffect, useState } from 'react';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [view, setView] = useState('list'); // list, form, detail
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState({ status: 'all', priority: 'all' });
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'suporte',
    priority: 'media',
    assignedTo: '',
    dueDate: ''
  });

  const [reply, setReply] = useState('');

  useEffect(() => {
    loadTickets();
  }, [filter]);

  async function loadTickets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status !== 'all') params.append('status', filter.status);
      if (filter.priority !== 'all') params.append('priority', filter.priority);
      
      const response = await fetch(`http://localhost:4000/api/tickets?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Erro ao carregar tickets:', err);
    }
    setLoading(false);
  }

  async function handleCreateTicket(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: localStorage.getItem('userId') || 'admin'
        })
      });
      if (response.ok) {
        const newTicket = await response.json();
        setTickets([newTicket, ...tickets]);
        setFormData({ title: '', description: '', category: 'suporte', priority: 'media', assignedTo: '', dueDate: '' });
        setView('list');
        alert('✅ Ticket criado com sucesso!');
      }
    } catch (err) {
      alert('Erro ao criar ticket: ' + err.message);
    }
    setLoading(false);
  }

  async function handleUpdateStatus(ticket, newStatus) {
    try {
      const response = await fetch(`http://localhost:4000/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setTickets(tickets.map(t => t.id === ticket.id ? { ...t, status: newStatus } : t));
        if (selectedTicket?.id === ticket.id) {
          setSelectedTicket({ ...selectedTicket, status: newStatus });
        }
      }
    } catch (err) {
      alert('Erro ao atualizar ticket');
    }
  }

  async function handleAddReply(ticketId) {
    if (!reply.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: reply,
          author: localStorage.getItem('userId') || 'admin'
        })
      });
      if (response.ok) {
        setReply('');
        const updatedTicket = await fetch(`http://localhost:4000/api/tickets/${ticketId}`).then(r => r.json());
        setSelectedTicket(updatedTicket);
        setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t));
      }
    } catch (err) {
      alert('Erro ao adicionar resposta');
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critica': return '#dc3545';
      case 'alta': return '#ff9800';
      case 'media': return '#ffc107';
      case 'baixa': return '#28a745';
      default: return '#666';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aberto': return '#0056b3';
      case 'em-progresso': return '#ff9800';
      case 'resolvido': return '#28a745';
      case 'fechado': return '#6c757d';
      default: return '#666';
    }
  };

  const calculateSLA = (ticket) => {
    if (!ticket.dueDate) return 'N/A';
    const now = new Date();
    const due = new Date(ticket.dueDate);
    const diff = due - now;
    const hours = Math.round(diff / (1000 * 60 * 60));
    
    if (hours < 0) return '⚠️ Vencido';
    if (hours < 24) return `⏰ ${hours}h`;
    return `📅 ${Math.round(hours / 24)}d`;
  };

  return (
    <div className="crm-card" style={{maxWidth:'1200px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2>🎫 Sistema de Tickets</h2>
        <button 
          onClick={() => { setView('form'); setFormData({ title: '', description: '', category: 'suporte', priority: 'media', assignedTo: '', dueDate: '' }); }}
          style={{padding:'10px 16px', backgroundColor:'#007bff', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}
        >
          ➕ Novo Ticket
        </button>
      </div>

      {/* Lista de Tickets */}
      {view === 'list' && (
        <div>
          <div style={{display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap'}}>
            <div>
              <label style={{display:'block', fontSize:'12px', marginBottom:'4px'}}>Status</label>
              <select 
                value={filter.status}
                onChange={e => setFilter({...filter, status: e.target.value})}
                style={{padding:'8px', borderRadius:'6px', border:'1px solid #ddd'}}
              >
                <option value="all">Todos</option>
                <option value="aberto">Aberto</option>
                <option value="em-progresso">Em Progresso</option>
                <option value="resolvido">Resolvido</option>
                <option value="fechado">Fechado</option>
              </select>
            </div>

            <div>
              <label style={{display:'block', fontSize:'12px', marginBottom:'4px'}}>Prioridade</label>
              <select 
                value={filter.priority}
                onChange={e => setFilter({...filter, priority: e.target.value})}
                style={{padding:'8px', borderRadius:'6px', border:'1px solid #ddd'}}
              >
                <option value="all">Todas</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>

            <div style={{flex:1}}></div>
            <div style={{alignSelf:'flex-end'}}>
              Total: <strong>{tickets.length}</strong> ticket{tickets.length !== 1 ? 's' : ''}
            </div>
          </div>

          {loading && <div style={{textAlign:'center', padding:'24px'}}>⏳ Carregando...</div>}

          {!loading && tickets.length === 0 && (
            <div style={{textAlign:'center', padding:'40px', backgroundColor:'#f9f9f9', borderRadius:'8px'}}>
              ✅ Nenhum ticket encontrado
            </div>
          )}

          {!loading && tickets.length > 0 && (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{backgroundColor:'#f5f5f5', borderBottom:'2px solid #ddd'}}>
                    <th style={{padding:'12px', textAlign:'left'}}>ID</th>
                    <th style={{padding:'12px', textAlign:'left'}}>Título</th>
                    <th style={{padding:'12px', textAlign:'center'}}>Categoria</th>
                    <th style={{padding:'12px', textAlign:'center'}}>Prioridade</th>
                    <th style={{padding:'12px', textAlign:'center'}}>Status</th>
                    <th style={{padding:'12px', textAlign:'center'}}>SLA</th>
                    <th style={{padding:'12px', textAlign:'center'}}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket.id} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'12px', fontWeight:'bold'}}>#{ticket.id?.substr(-4) || 'novo'}</td>
                      <td style={{padding:'12px'}}>{ticket.title}</td>
                      <td style={{padding:'12px', textAlign:'center', fontSize:'12px'}}>
                        {ticket.category === 'bug' && '🐛 Bug'}
                        {ticket.category === 'suporte' && '🛟 Suporte'}
                        {ticket.category === 'feature' && '✨ Feature'}
                        {ticket.category === 'outro' && '📝 Outro'}
                      </td>
                      <td style={{padding:'12px', textAlign:'center'}}>
                        <span style={{
                          display:'inline-block',
                          padding:'4px 8px',
                          backgroundColor: getPriorityColor(ticket.priority),
                          color:'white',
                          borderRadius:'4px',
                          fontSize:'12px',
                          fontWeight:'bold'
                        }}>
                          {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                        </span>
                      </td>
                      <td style={{padding:'12px', textAlign:'center'}}>
                        <span style={{
                          display:'inline-block',
                          padding:'4px 8px',
                          backgroundColor: getStatusColor(ticket.status),
                          color:'white',
                          borderRadius:'4px',
                          fontSize:'12px',
                          fontWeight:'bold'
                        }}>
                          {ticket.status?.replace('-', ' ')?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{padding:'12px', textAlign:'center', fontSize:'12px'}}>
                        {calculateSLA(ticket)}
                      </td>
                      <td style={{padding:'12px', textAlign:'center'}}>
                        <button 
                          onClick={() => { setSelectedTicket(ticket); setView('detail'); }}
                          style={{padding:'6px 12px', backgroundColor:'#007bff', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Formulário de Novo Ticket */}
      {view === 'form' && (
        <form onSubmit={handleCreateTicket} style={{maxWidth:'600px'}}>
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Título *</label>
            <input 
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ddd'}}
              placeholder="Resumo do problema"
            />
          </div>

          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Descrição *</label>
            <textarea 
              required
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ddd', minHeight:'120px', fontFamily:'inherit'}}
              placeholder="Descreva o problema em detalhes"
            />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px'}}>
            <div>
              <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Categoria *</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ddd'}}
              >
                <option value="suporte">🛟 Suporte</option>
                <option value="bug">🐛 Bug</option>
                <option value="feature">✨ Feature Request</option>
                <option value="outro">📝 Outro</option>
              </select>
            </div>

            <div>
              <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Prioridade *</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
                style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ddd'}}
              >
                <option value="baixa">🟢 Baixa</option>
                <option value="media">🟡 Média</option>
                <option value="alta">🔴 Alta</option>
                <option value="critica">🚨 Crítica</option>
              </select>
            </div>
          </div>

          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Prazo (Data)</label>
            <input 
              type="date"
              value={formData.dueDate}
              onChange={e => setFormData({...formData, dueDate: e.target.value})}
              style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ddd'}}
            />
          </div>

          <div style={{display:'flex', gap:'12px'}}>
            <button 
              type="submit"
              disabled={loading}
              style={{padding:'10px 24px', backgroundColor:'#28a745', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}
            >
              ✓ Criar Ticket
            </button>
            <button 
              type="button"
              onClick={() => setView('list')}
              style={{padding:'10px 24px', backgroundColor:'#6c757d', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}
            >
              ✕ Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Detalhe do Ticket */}
      {view === 'detail' && selectedTicket && (
        <div>
          <button 
            onClick={() => setView('list')}
            style={{marginBottom:'20px', padding:'8px 12px', backgroundColor:'#6c757d', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}
          >
            ← Voltar
          </button>

          <div style={{backgroundColor:'#f9f9f9', padding:'20px', borderRadius:'8px', marginBottom:'20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'16px'}}>
              <div>
                <h3 style={{margin:'0 0 8px 0'}}>#{selectedTicket.id?.substr(-4) || 'novo'} - {selectedTicket.title}</h3>
                <div style={{color:'#666', fontSize:'14px'}}>
                  Criado por: <strong>{selectedTicket.createdBy}</strong> em <strong>{new Date(selectedTicket.createdAt).toLocaleString('pt-BR')}</strong>
                </div>
              </div>
              <div style={{display:'flex', gap:'8px'}}>
                <span style={{
                  display:'inline-block',
                  padding:'6px 12px',
                  backgroundColor: getPriorityColor(selectedTicket.priority),
                  color:'white',
                  borderRadius:'4px',
                  fontSize:'12px',
                  fontWeight:'bold'
                }}>
                  {selectedTicket.priority?.toUpperCase()}
                </span>
                <span style={{
                  display:'inline-block',
                  padding:'6px 12px',
                  backgroundColor: getStatusColor(selectedTicket.status),
                  color:'white',
                  borderRadius:'4px',
                  fontSize:'12px',
                  fontWeight:'bold'
                }}>
                  {selectedTicket.status?.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginBottom:'16px'}}>
              <div>
                <strong style={{fontSize:'12px', color:'#666'}}>Categoria</strong>
                <div>{selectedTicket.category}</div>
              </div>
              <div>
                <strong style={{fontSize:'12px', color:'#666'}}>Atribuído a</strong>
                <div>{selectedTicket.assignedTo || 'Não atribuído'}</div>
              </div>
              <div>
                <strong style={{fontSize:'12px', color:'#666'}}>Prazo</strong>
                <div>{selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}</div>
              </div>
              <div>
                <strong style={{fontSize:'12px', color:'#666'}}>SLA</strong>
                <div>{calculateSLA(selectedTicket)}</div>
              </div>
            </div>

            <div style={{marginBottom:'16px'}}>
              <strong>Descrição</strong>
              <div style={{marginTop:'8px', padding:'12px', backgroundColor:'white', borderRadius:'4px', border:'1px solid #eee'}}>
                {selectedTicket.description}
              </div>
            </div>

            <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
              {selectedTicket.status !== 'fechado' && (
                <>
                  {selectedTicket.status !== 'em-progresso' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedTicket, 'em-progresso')}
                      style={{padding:'8px 16px', backgroundColor:'#ff9800', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}
                    >
                      ▶️ Iniciar
                    </button>
                  )}
                  {selectedTicket.status === 'em-progresso' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedTicket, 'resolvido')}
                      style={{padding:'8px 16px', backgroundColor:'#28a745', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}
                    >
                      ✓ Marcar como Resolvido
                    </button>
                  )}
                  <button 
                    onClick={() => handleUpdateStatus(selectedTicket, 'fechado')}
                    style={{padding:'8px 16px', backgroundColor:'#6c757d', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}
                  >
                    ✕ Fechar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Respostas */}
          <div style={{marginBottom:'20px'}}>
            <h4>💬 Respostas ({(selectedTicket.replies || []).length})</h4>
            {(!selectedTicket.replies || selectedTicket.replies.length === 0) && (
              <div style={{padding:'16px', backgroundColor:'#f9f9f9', borderRadius:'6px', textAlign:'center', color:'#666'}}>
                Nenhuma resposta ainda
              </div>
            )}
            {selectedTicket.replies && selectedTicket.replies.map((r, i) => (
              <div key={i} style={{padding:'12px', marginBottom:'12px', backgroundColor:'white', border:'1px solid #eee', borderRadius:'6px'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                  <strong>{r.author}</strong>
                  <small style={{color:'#666'}}>{new Date(r.createdAt).toLocaleString('pt-BR')}</small>
                </div>
                <div>{r.message}</div>
              </div>
            ))}
          </div>

          {/* Adicionar resposta */}
          {selectedTicket.status !== 'fechado' && (
            <div>
              <h4>Adicionar Resposta</h4>
              <div style={{display:'flex', gap:'12px'}}>
                <textarea 
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  style={{flex:1, padding:'10px', borderRadius:'6px', border:'1px solid #ddd', minHeight:'80px', fontFamily:'inherit'}}
                  placeholder="Escreva sua resposta..."
                />
                <div>
                  <button 
                    onClick={() => handleAddReply(selectedTicket.id)}
                    disabled={!reply.trim()}
                    style={{
                      padding:'10px 16px', 
                      backgroundColor:'#007bff', 
                      color:'white', 
                      border:'none', 
                      borderRadius:'6px', 
                      cursor: reply.trim() ? 'pointer' : 'not-allowed',
                      opacity: reply.trim() ? 1 : 0.6
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
