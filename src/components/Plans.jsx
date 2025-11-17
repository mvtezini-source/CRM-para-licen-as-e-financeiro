import React, { useState, useEffect } from 'react';
import dataService from '../services/dataService';

function formatPrice(value) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  } catch (e) {
    return `R$ ${value}`;
  }
}

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [seats, setSeats] = useState(1);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setPlans(dataService.getPlans());
  }, []);

  function handleAdd(e) {
    e.preventDefault();
    if (!name) return;
    
    if (editingId) {
      // Atualizar plano existente
      const updatedPlans = plans.map(p => 
        p.id === editingId ? { id: p.id, name, price: Number(price), seats: Number(seats) } : p
      );
      setPlans(updatedPlans);
      dataService.updatePlan(editingId, { name, price: Number(price), seats: Number(seats) });
      setEditingId(null);
    } else {
      // Criar novo plano
      const plan = { id: Date.now().toString(), name, price: Number(price), seats: Number(seats) };
      dataService.addPlan(plan);
      setPlans(dataService.getPlans());
    }
    
    setName('');
    setPrice(0);
    setSeats(1);
  }

  function handleEdit(plan) {
    setName(plan.name);
    setPrice(plan.price);
    setSeats(plan.seats);
    setEditingId(plan.id);
  }

  function handleDelete(id) {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      setPlans(plans.filter(p => p.id !== id));
      dataService.deletePlan(id);
    }
  }

  function handleCancel() {
    setName('');
    setPrice(0);
    setSeats(1);
    setEditingId(null);
  }

  return (
    <div className="crm-container">
      <div className="crm-card">
        <h2>Gerenciar Planos</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          {plans.length} plano{plans.length !== 1 ? 's' : ''} cadastrado{plans.length !== 1 ? 's' : ''}
        </p>

        <div className="plans-grid">
          {plans.map(p => (
            <div key={p.id} className="plan-card">
              <div className="plan-header">
                <h3>{p.name}</h3>
              </div>
              <div className="plan-details">
                <div className="plan-detail-row">
                  <span className="label">Preço:</span>
                  <span className="value price">{formatPrice(p.price)}</span>
                </div>
                <div className="plan-detail-row">
                  <span className="label">Assentos:</span>
                  <span className="value">{p.seats}</span>
                </div>
              </div>
              <div className="plan-actions">
                <button className="btn btn-edit" onClick={() => handleEdit(p)}>Editar</button>
                <button className="btn btn-delete" onClick={() => handleDelete(p.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>

        <div className="form-section">
          <h3>{editingId ? 'Editar Plano' : 'Criar Novo Plano'}</h3>
          <form onSubmit={handleAdd} className="form-grid">
            <input 
              placeholder="Nome do plano" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="form-input"
            />
            <input 
              type="number" 
              placeholder="Preço (R$)"
              step="0.01"
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              className="form-input"
            />
            <input 
              type="number" 
              placeholder="Quantidade de assentos"
              value={seats} 
              onChange={e => setSeats(e.target.value)} 
              className="form-input"
            />
            <div className="form-buttons">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Atualizar' : 'Adicionar'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
