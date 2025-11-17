import cron from 'node-cron';
import pool from './db.js';

async function logJob(key, status, message=''){
  await pool.query('INSERT INTO job_logs (job_key, status, message, ran_at) VALUES (?, ?, ?, NOW())', [key, status, message]);
}

// Job: daily check expired licenses
export function registerJobs() {
  // daily at 02:00
  cron.schedule('0 2 * * *', async () => {
    const key = 'daily_check_expired';
    try {
      const [rows] = await pool.query('SELECT c.id, c.name, l.license_key, l.expires_at FROM clients c JOIN licenses l ON l.client_id = c.id WHERE l.expires_at <= NOW()');
      for (const r of rows) {
        await pool.query('INSERT INTO notifications (text, created_at, read_flag) VALUES (?, NOW(), 0)', [`Licença expirada: ${r.name} (${r.license_key})`]);
      }
      await logJob(key, 'success', `Found ${rows.length} expired licenses`);
    } catch (err) {
      await logJob(key, 'error', String(err));
    }
  });

  // weekly: check licenses with >30 days inactivity (scheduled weekly on Monday at 03:00)
  cron.schedule('0 3 * * 1', async () => {
    const key = 'weekly_inactive_30d';
    try {
      // define inactivity as last license issued older than 30 days
      const [rows] = await pool.query("SELECT c.id,c.name,l.license_key,l.issued_at FROM clients c JOIN licenses l ON l.client_id=c.id WHERE l.issued_at <= DATE_SUB(NOW(), INTERVAL 30 DAY)");
      for (const r of rows) {
        await pool.query('INSERT INTO notifications (text, created_at, read_flag) VALUES (?, NOW(), 0)', [`Licença inativa >30d: ${r.name} (${r.license_key})`]);
      }
      await logJob(key, 'success', `Found ${rows.length} inactive licenses`);
    } catch (err) {
      await logJob(key, 'error', String(err));
    }
  });

  // monthly: check inactive clients (no licenses, created > 30 days)
  cron.schedule('0 4 1 * *', async () => {
    const key = 'monthly_inactive_clients';
    try {
      const [rows] = await pool.query("SELECT c.id,c.name FROM clients c LEFT JOIN licenses l ON l.client_id=c.id WHERE l.id IS NULL AND c.created_at <= DATE_SUB(NOW(), INTERVAL 30 DAY)");
      for (const r of rows) {
        await pool.query('INSERT INTO notifications (text, created_at, read_flag) VALUES (?, NOW(), 0)', [`Cliente inativo: ${r.name}`]);
      }
      await logJob(key, 'success', `Found ${rows.length} inactive clients`);
    } catch (err) {
      await logJob(key, 'error', String(err));
    }
  });

  // cleanup notifications older than 90 days - daily at 05:00
  cron.schedule('0 5 * * *', async () => {
    const key = 'cleanup_notifications';
    try {
      const [result] = await pool.query("DELETE FROM notifications WHERE created_at <= DATE_SUB(NOW(), INTERVAL 90 DAY)");
      await logJob(key, 'success', `Deleted ${result.affectedRows} notifications`);
    } catch (err) {
      await logJob(key, 'error', String(err));
    }
  });
}

export async function runJobNow(jobKey){
  // allow manual trigger; map to internal handlers
  if (jobKey === 'daily_check_expired'){
    const [rows] = await pool.query('SELECT c.id, c.name, l.license_key, l.expires_at FROM clients c JOIN licenses l ON l.client_id = c.id WHERE l.expires_at <= NOW()');
    for (const r of rows) await pool.query('INSERT INTO notifications (text, created_at, read_flag) VALUES (?, NOW(), 0)', [`Licença expirada: ${r.name} (${r.license_key})`]);
    await logJob(jobKey, 'success', `Manual run found ${rows.length} expired`);
    return { count: rows.length };
  }
  if (jobKey === 'cleanup_notifications'){
    const [result] = await pool.query("DELETE FROM notifications WHERE created_at <= DATE_SUB(NOW(), INTERVAL 90 DAY)");
    await logJob(jobKey, 'success', `Manual cleanup deleted ${result.affectedRows}`);
    return { deleted: result.affectedRows };
  }
  // other jobs can reuse schedule handlers similarly
  return { message: 'job not implemented for manual run' };
}
