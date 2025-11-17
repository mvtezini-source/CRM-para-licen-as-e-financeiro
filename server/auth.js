import pool from './db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Simple auth middleware: expects header `x-user-id` containing user id.
// Attaches `req.user` with user record including role.
export async function attachUser(req, res, next) {
  // Check JWT Authorization header first
  const authHeader = req.headers['authorization'];
  let uid = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      uid = payload.sub;
    } catch (e) {
      uid = null;
    }
  }
  // fallback to x-user-id header (dev)
  if (!uid) uid = req.headers['x-user-id'] || req.query._user;
  if (!uid) {
    req.user = null;
    return next();
  }
  try {
    const [rows] = await pool.query('SELECT u.*, r.name as role_name, r.id as role_id FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ? LIMIT 1', [uid]);
    const user = rows && rows[0] ? rows[0] : null;
    if (user) {
      // load permissions for the role
      const [perms] = await pool.query('SELECT p.slug FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = ?', [user.role_id]);
      user.permissions = (perms || []).map(p => p.slug);
    }
    req.user = user;
  } catch (err) {
    req.user = null;
  }
  return next();
}

export function requireRole(minRoleName) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const role = req.user.role_name || '';
    const order = { 'Usuário Padrão': 1, 'Gerente': 2, 'Administrador': 3 };
    if ((order[role] || 0) >= (order[minRoleName] || 0)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const perms = req.user.permissions || [];
    if (perms.includes(permission)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

export function signTokenForUser(userId){
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}
