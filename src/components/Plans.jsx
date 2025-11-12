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

  useEffect(() => {
    setPlans(dataService.getPlans());
  }, []);

  function handleAdd(e) {
    e.preventDefault();
    if (!name) return;
    const plan = { id: Date.now().toString(), name, price: Number(price), seats: Number(seats) };
    dataService.addPlan(plan);
    setPlans(dataService.getPlans());
    setName('');
    setPrice(0);
    setSeats(1);
  }

  return (
    <div className="crm-card">
      <h3>Planos</h3>
      <ul>
        {plans.map(p => (
          <li key={p.id}>{p.name} — {formatPrice(p.price)} — {p.seats} assentos</li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="form-inline">
        <input placeholder="Nome do plano" value={name} onChange={e => setName(e.target.value)} />
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} />
        <input type="number" value={seats} onChange={e => setSeats(e.target.value)} />
        <button type="submit">Adicionar</button>
      </form>
    </div>
  );
}
