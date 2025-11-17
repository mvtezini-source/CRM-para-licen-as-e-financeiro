import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import { attachUser, requireRole, requirePermission } from './auth.js';
import { registerJobs, runJobNow } from './jobs.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { signTokenForUser } from './auth.js';
import * as paymentService from './asaas.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const app = express();
app.use(cors());
app.use(express.json());
app.use(attachUser);

// Plans
app.get('/api/plans', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM plans ORDER BY id');
  res.json(rows);
});

// current user
app.get('/api/me', (req, res) => {
  if (!req.user) return res.json(null);
  const { id, name, email, role_name, permissions } = req.user;
  res.json({ id, name, email, role: role_name, permissions });
});

// Auth: register/login
app.post('/api/auth/register', async (req, res) => {
  const { id, name, email, password } = req.body;
  if (!id || !password || !name) return res.status(400).json({ error: 'missing fields' });
  // default role: Usuário Padrão
  const [rr] = await pool.query("SELECT id FROM roles WHERE name = 'Usuário Padrão' LIMIT 1");
  const roleId = rr && rr[0] ? rr[0].id : null;
  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (id,name,email,password,role_id) VALUES (?, ?, ?, ?, ?)', [id, name, email, hash, roleId]);
  const token = signTokenForUser(id);
  res.json({ token });
});

app.post('/api/auth/login', async (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) return res.status(400).json({ error: 'missing' });
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  const user = rows && rows[0] ? rows[0] : null;
  if (!user) return res.status(401).json({ error: 'invalid' });
  const ok = await bcrypt.compare(password, user.password || '');
  if (!ok) return res.status(401).json({ error: 'invalid' });
  const token = signTokenForUser(user.id);
  res.json({ token });
});

app.post('/api/plans', requirePermission('manage_clients'), async (req, res) => {
  const { id, name, price, seats } = req.body;
  await pool.query('INSERT INTO plans (id, name, price, seats) VALUES (?, ?, ?, ?)', [id, name, price, seats]);
  res.status(201).json({ id, name, price, seats });
});

// Clients
app.get('/api/clients', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clients ORDER BY id DESC');
  res.json(rows);
});

app.post('/api/clients', requirePermission('manage_clients'), async (req, res) => {
  const { id, name, email, planId } = req.body;
  await pool.query('INSERT INTO clients (id, name, email, plan_id) VALUES (?, ?, ?, ?)', [id, name, email, planId]);
  res.status(201).json({ id, name, email, planId });
});

// Licenses
// Licenses (protected)
app.post('/api/licenses', requirePermission('manage_licenses'), async (req, res) => {
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
app.post('/api/notifications', requirePermission('manage_notifications'), async (req, res) => {
  const { text } = req.body;
  const [result] = await pool.query('INSERT INTO notifications (text, created_at, read_flag) VALUES (?, NOW(), 0)', [text]);
  res.status(201).json({ id: result.insertId, text });
});

app.post('/api/notifications/:id/read', async (req, res) => {
  const id = req.params.id;
  await pool.query('UPDATE notifications SET read_flag = 1 WHERE id = ?', [id]);
  res.json({ ok: true });
});

// Users management (simple)
app.get('/api/users', requirePermission('manage_users'), async (req, res) => {
  const [rows] = await pool.query('SELECT u.id,u.name,u.email,r.name as role FROM users u LEFT JOIN roles r ON u.role_id=r.id');
  res.json(rows);
});

app.post('/api/users', requirePermission('manage_users'), async (req, res) => {
  const { id, name, email, role } = req.body;
  // find role id
  const [rr] = await pool.query('SELECT id FROM roles WHERE name = ? LIMIT 1', [role]);
  const roleId = rr && rr[0] ? rr[0].id : null;
  await pool.query('INSERT INTO users (id,name,email,role_id) VALUES (?, ?, ?, ?)', [id, name, email, roleId]);
  res.status(201).json({ id, name, email, role });
});

app.put('/api/users/:id', requirePermission('manage_users'), async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  const [rr] = await pool.query('SELECT id FROM roles WHERE name = ? LIMIT 1', [role]);
  const roleId = rr && rr[0] ? rr[0].id : null;
  await pool.query('UPDATE users SET name = ?, email = ?, role_id = ? WHERE id = ?', [name, email, roleId, id]);
  res.json({ id, name, email, role });
});

app.delete('/api/users/:id', requirePermission('manage_users'), async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
  res.json({ ok: true });
});

// Roles
app.get('/api/roles', async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, description FROM roles ORDER BY id');
  res.json(rows);
});

// Permissions
app.get('/api/permissions', async (req, res) => {
  const [rows] = await pool.query('SELECT id, slug, name, description FROM permissions ORDER BY id');
  res.json(rows);
});

// Role Permissions
app.get('/api/role-permissions', async (req, res) => {
  const [rows] = await pool.query('SELECT role_id, permission_id FROM role_permissions ORDER BY role_id, permission_id');
  res.json(rows);
});

app.post('/api/role-permissions', requirePermission('manage_users'), async (req, res) => {
  const { role_id, permission_id } = req.body;
  if (!role_id || !permission_id) return res.status(400).json({ error: 'missing fields' });
  try {
    await pool.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [role_id, permission_id]);
    res.status(201).json({ ok: true, role_id, permission_id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/role-permissions/:roleId/:permissionId', requirePermission('manage_users'), async (req, res) => {
  const { roleId, permissionId } = req.params;
  try {
    await pool.query('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?', [roleId, permissionId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Admin: job logs
app.get('/api/admin/jobs', requirePermission('view_logs'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM job_logs ORDER BY ran_at DESC LIMIT 200');
  res.json(rows);
});

app.post('/api/admin/jobs/run', requirePermission('manage_jobs'), async (req, res) => {
  const { jobKey } = req.body;
  try {
    const result = await runJobNow(jobKey);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ===== FINANCIAL ENDPOINTS =====

// Get invoices for a client
app.get('/api/invoices/:clientId', async (req, res) => {
  const { clientId } = req.params;
  try {
    const [invoices] = await pool.query(
      `SELECT i.*, p.name as plan_name, p.price as plan_price 
       FROM invoices i 
       LEFT JOIN plans p ON i.plan_id = p.id 
       WHERE i.client_id = ? 
       ORDER BY i.issued_at DESC`,
      [clientId]
    );
    res.json(invoices || []);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get all invoices (admin)
app.get('/api/invoices', requirePermission('manage_clients'), async (req, res) => {
  try {
    const [invoices] = await pool.query(
      `SELECT i.*, c.name as client_name, c.email as client_email, p.name as plan_name 
       FROM invoices i 
       LEFT JOIN clients c ON i.client_id = c.id 
       LEFT JOIN plans p ON i.plan_id = p.id 
       ORDER BY i.issued_at DESC`
    );
    res.json(invoices || []);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Create invoice
app.post('/api/invoices', requirePermission('manage_clients'), async (req, res) => {
  const { client_id, plan_id, amount, due_date, notes } = req.body;
  try {
    const invoiceId = `INV-${Date.now()}`;
    await pool.query(
      `INSERT INTO invoices (id, client_id, plan_id, amount, due_date, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [invoiceId, client_id, plan_id, amount, due_date, notes]
    );
    res.status(201).json({ id: invoiceId, client_id, plan_id, amount, due_date, notes, status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get payments for an invoice
app.get('/api/payments/invoice/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  try {
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC',
      [invoiceId]
    );
    res.json(payments || []);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Create payment (Boleto or PIX)
app.post('/api/payments/create', async (req, res) => {
  const { invoice_id, client_id, payment_method } = req.body;
  
  try {
    // Get invoice and client details
    const [invoices] = await pool.query('SELECT * FROM invoices WHERE id = ?', [invoice_id]);
    const [clients] = await pool.query('SELECT * FROM clients WHERE id = ?', [client_id]);
    
    if (!invoices || !invoices[0] || !clients || !clients[0]) {
      return res.status(404).json({ error: 'Invoice or client not found' });
    }

    const invoice = invoices[0];
    const client = clients[0];

    // Create payment with ASAAS
    const paymentResult = await paymentService.createPayment({
      invoiceId: invoice_id,
      clientEmail: client.email || 'noemail@example.com',
      clientName: client.name,
      amount: invoice.amount,
      dueDate: invoice.due_date || new Date().toISOString().split('T')[0],
      description: `Fatura ${invoice_id}`,
    });

    if (!paymentResult.success) {
      return res.status(400).json({ error: paymentResult.error });
    }

    // Store payment in database
    const paymentId = `PAY-${Date.now()}`;

    await pool.query(
      `INSERT INTO payments (id, invoice_id, payment_method, payment_type, status, amount, external_id, qr_code, copy_paste, external_url) 
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [paymentId, invoice_id, payment_method || 'asaas', 'asaas', invoice.amount, paymentResult.external_id, paymentResult.pix_qr_code, paymentResult.pix_copy_paste, paymentResult.invoice_url]
    );

    res.status(201).json({
      payment_id: paymentId,
      external_id: paymentResult.external_id,
      status: 'pending',
      pix_qr_code: paymentResult.pix_qr_code,
      pix_copy_paste: paymentResult.pix_copy_paste,
      barcode: paymentResult.barcode,
      invoice_url: paymentResult.invoice_url,
      customer_id: paymentResult.customer_id,
    });
  } catch (err) {
    console.error('Payment creation error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// Webhook to receive payment notifications from ASAAS
app.post('/api/webhooks/asaas', async (req, res) => {
  try {
    const webhookData = req.body;

    // Parse webhook
    const parsedWebhook = await paymentService.parseWebhook(webhookData);
    
    if (parsedWebhook.success && parsedWebhook.status === 'approved') {
      // Find and update payment
      const [payments] = await pool.query(
        'SELECT * FROM payments WHERE external_id = ?',
        [parsedWebhook.payment_id]
      );

      if (payments && payments[0]) {
        const payment = payments[0];
        
        // Update payment status
        await pool.query(
          'UPDATE payments SET status = ?, paid_at = NOW() WHERE external_id = ?',
          ['approved', parsedWebhook.payment_id]
        );

        // Update invoice status
        await pool.query(
          'UPDATE invoices SET status = ?, paid_at = NOW() WHERE id = ?',
          ['paid', payment.invoice_id]
        );

        // Create notification for admin
        await pool.query(
          'INSERT INTO notifications (text, read_flag) VALUES (?, 0)',
          [`Pagamento recebido: Fatura ${payment.invoice_id} - R$ ${payment.amount}`]
        );
      }
    }

    // Store webhook for logging
    await pool.query(
      'INSERT INTO payment_webhooks (external_id, event_type, status, data, processed) VALUES (?, ?, ?, ?, 1)',
      [parsedWebhook.payment_id, parsedWebhook.event_type, parsedWebhook.status, JSON.stringify(webhookData)]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// Check payment status
app.get('/api/payments/:paymentId/status', async (req, res) => {
  const { paymentId } = req.params;
  try {
    const [payments] = await pool.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
    
    if (!payments || !payments[0]) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = payments[0];
    
    // Get current status from ASAAS if we have external_id
    if (payment.external_id) {
      const statusResult = await paymentService.getPaymentStatus(payment.external_id);
      if (statusResult.success) {
        // Map ASAAS status to our status
        const statusMap = {
          'PENDING': 'pending',
          'CONFIRMED': 'approved',
          'RECEIVED': 'approved',
          'RECEIVED_IN_CASH': 'approved',
          'OVERDUE': 'overdue',
          'REFUNDED': 'refunded',
        };
        
        const mappedStatus = statusMap[statusResult.status] || statusResult.status;
        
        // Update status in database if changed
        if (mappedStatus !== payment.status) {
          await pool.query(
            'UPDATE payments SET status = ? WHERE id = ?',
            [mappedStatus, paymentId]
          );
          
          // If approved, update invoice too
          if (mappedStatus === 'approved' && payment.status !== 'approved') {
            await pool.query(
              'UPDATE invoices SET status = ?, paid_at = NOW() WHERE id = ?',
              ['paid', payment.invoice_id]
            );
          }
          
          payment.status = mappedStatus;
        }
      }
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Start scheduled jobs when server starts
registerJobs();

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
