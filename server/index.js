import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Plans
app.get('/api/plans', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM plans ORDER BY id');
  res.json(rows);
});

app.post('/api/plans', async (req, res) => {
  const { id, name, price, seats } = req.body;
  await pool.query('INSERT INTO plans (id, name, price, seats) VALUES (?, ?, ?, ?)', [id, name, price, seats]);
  res.status(201).json({ id, name, price, seats });
});

// Clients
app.get('/api/clients', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clients ORDER BY id DESC');
  res.json(rows);
});

app.post('/api/clients', async (req, res) => {
  const { id, name, email, planId } = req.body;
  await pool.query('INSERT INTO clients (id, name, email, plan_id) VALUES (?, ?, ?, ?)', [id, name, email, planId]);
  res.status(201).json({ id, name, email, planId });
});

// Licenses
app.post('/api/licenses', async (req, res) => {
  const { clientId, planId, key, issuedAt, expiresAt } = req.body;
  await pool.query('INSERT INTO licenses (client_id, plan_id, license_key, issued_at, expires_at) VALUES (?, ?, ?, ?, ?)', [clientId, planId, key, issuedAt, expiresAt]);
  // update clients table license_id optional
  res.status(201).json({ clientId, planId, key, issuedAt, expiresAt });
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
  res.json(rows);
});

app.post('/api/notifications', async (req, res) => {
  const { text } = req.body;
  const [result] = await pool.query('INSERT INTO notifications (text, created_at, read_flag) VALUES (?, NOW(), 0)', [text]);
  res.status(201).json({ id: result.insertId, text });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
