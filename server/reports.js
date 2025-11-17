import pool from './db.js';

export async function getRevenueReport(period = 'month') {
  const [invoices] = await pool.query(`
    SELECT 
      DATE_FORMAT(issued_at, '%Y-%m') as month,
      COALESCE(SUM(amount), 0) as revenue,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as received,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending
    FROM invoices
    WHERE issued_at >= DATE_SUB(NOW(), INTERVAL ${getPeriodInterval(period)})
    GROUP BY month
    ORDER BY month DESC
  `);

  const totalRevenue = invoices.reduce((sum, row) => sum + Number(row.revenue), 0);
  const totalReceived = invoices.reduce((sum, row) => sum + Number(row.received), 0);
  const totalPending = invoices.reduce((sum, row) => sum + Number(row.pending), 0);
  const conversionRate = totalRevenue > 0 ? Math.round((totalReceived / totalRevenue) * 100) : 0;

  const months = invoices.map(row => ({
    month: row.month,
    revenue: Number(row.revenue),
    received: Number(row.received),
    pending: Number(row.pending),
    rate: row.revenue > 0 ? Math.round((Number(row.received) / Number(row.revenue)) * 100) : 0
  }));

  return {
    totalRevenue,
    totalReceived,
    totalPending,
    conversionRate,
    months
  };
}

export async function getChurnReport(period = 'month') {
  const [clients] = await pool.query(`
    SELECT COUNT(*) as total FROM clients
  `);

  const [canceledInvoices] = await pool.query(`
    SELECT 
      DATE_FORMAT(issued_at, '%Y-%m') as month,
      COUNT(*) as canceled
    FROM invoices
    WHERE status = 'cancelled'
    AND issued_at >= DATE_SUB(NOW(), INTERVAL ${getPeriodInterval(period)})
    GROUP BY month
    ORDER BY month DESC
  `);

  const [churnByMonth] = await pool.query(`
    SELECT 
      DATE_FORMAT(issued_at, '%Y-%m') as month,
      COUNT(DISTINCT client_id) as lost_clients
    FROM invoices
    WHERE status = 'cancelled'
    AND issued_at >= DATE_SUB(NOW(), INTERVAL ${getPeriodInterval(period)})
    GROUP BY month
  `);

  const totalClients = clients[0]?.total || 0;
  const totalLost = churnByMonth.reduce((sum, row) => sum + Number(row.lost_clients), 0);
  const churnRate = totalClients > 0 ? Math.round((totalLost / totalClients) * 100) : 0;

  const months = canceledInvoices.map(row => ({
    month: row.month,
    total: totalClients,
    canceled: row.canceled,
    rate: totalClients > 0 ? Math.round((row.canceled / totalClients) * 100) : 0
  }));

  return {
    activeClients: totalClients - totalLost,
    clientsLost: totalLost,
    churnRate,
    months
  };
}

export async function getForecastReport(period = 'month') {
  const [recentInvoices] = await pool.query(`
    SELECT 
      DATE_FORMAT(issued_at, '%Y-%m') as month,
      SUM(amount) as total,
      COUNT(*) as count
    FROM invoices
    WHERE issued_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY month
    ORDER BY month DESC
  `);

  // Calcular tendência
  let avgRevenue = 0;
  let avgGrowth = 0;
  
  if (recentInvoices.length > 1) {
    avgRevenue = recentInvoices.reduce((sum, row) => sum + Number(row.total), 0) / recentInvoices.length;
    
    const growthRates = [];
    for (let i = 1; i < recentInvoices.length; i++) {
      const prev = Number(recentInvoices[i].total);
      const curr = Number(recentInvoices[i-1].total);
      if (prev > 0) {
        growthRates.push(((curr - prev) / prev) * 100);
      }
    }
    avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  }

  const forecastedRevenue = avgRevenue * (1 + (avgGrowth / 100));
  const growthRate = Math.round(avgGrowth);

  const [clients] = await pool.query('SELECT COUNT(*) as total FROM clients');
  const forecastedClients = Math.round(clients[0].total * (1 + (avgGrowth / 100)));

  // Gerar previsões para próximos 3 meses
  const forecast = [];
  const nextMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const currentMonth = new Date().getMonth();
  
  for (let i = 1; i <= 3; i++) {
    const monthIndex = (currentMonth + i) % 12;
    forecast.push({
      month: nextMonths[monthIndex],
      revenue: Math.round(avgRevenue * (1 + ((avgGrowth * i) / 100))),
      clients: Math.round(clients[0].total + (clients[0].total * (avgGrowth / 100) * i / 100)),
      confidence: Math.max(50, 95 - (i * 10)) // Confiança diminui com o tempo
    });
  }

  return {
    forecastedRevenue: Math.round(forecastedRevenue),
    forecastedClients,
    growthRate,
    forecast
  };
}

export async function getLicensesReport(period = 'month') {
  const [active] = await pool.query(`
    SELECT COUNT(*) as total FROM licenses
    WHERE expires_at > NOW()
  `);

  const [expiring] = await pool.query(`
    SELECT COUNT(*) as total FROM licenses
    WHERE expires_at > NOW()
    AND expires_at <= DATE_ADD(NOW(), INTERVAL 30 DAY)
  `);

  const [expired] = await pool.query(`
    SELECT COUNT(*) as total FROM licenses
    WHERE expires_at <= NOW()
  `);

  const [byPlan] = await pool.query(`
    SELECT 
      p.name as plan,
      COUNT(CASE WHEN l.expires_at > NOW() THEN 1 END) as active,
      COUNT(CASE WHEN l.expires_at > NOW() AND l.expires_at <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 1 END) as expiring,
      COUNT(CASE WHEN l.expires_at <= NOW() THEN 1 END) as expired
    FROM licenses l
    LEFT JOIN plans p ON l.plan_id = p.id
    GROUP BY p.name
  `);

  return {
    activeLicenses: active[0]?.total || 0,
    expiringSoon: expiring[0]?.total || 0,
    expired: expired[0]?.total || 0,
    totalLicenses: (active[0]?.total || 0) + (expiring[0]?.total || 0) + (expired[0]?.total || 0),
    byPlan: byPlan || []
  };
}

export async function getPaymentsReport(period = 'month') {
  const [byStatus] = await pool.query(`
    SELECT 
      status,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total
    FROM payments
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${getPeriodInterval(period)})
    GROUP BY status
  `);

  const [byMethod] = await pool.query(`
    SELECT 
      payment_type as method,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total
    FROM payments
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${getPeriodInterval(period)})
    GROUP BY payment_type
  `);

  let confirmed = 0, pending = 0, overdue = 0, refunded = 0;
  
  byStatus.forEach(row => {
    if (row.status === 'approved') confirmed += row.count;
    else if (row.status === 'pending') pending += row.count;
    else if (row.status === 'overdue') overdue += row.count;
    else if (row.status === 'refunded') refunded += row.count;
  });

  const methods = byMethod.map(m => ({
    method: m.method || 'Desconhecido',
    count: m.count,
    total: Number(m.total),
    successRate: confirmed > 0 ? Math.round((confirmed / (confirmed + pending + overdue)) * 100) : 0
  }));

  return {
    confirmed,
    pending,
    overdue,
    refunded,
    byMethod: methods
  };
}

function getPeriodInterval(period) {
  switch (period) {
    case 'week': return '1 WEEK';
    case 'month': return '1 MONTH';
    case 'quarter': return '3 MONTH';
    case 'year': return '1 YEAR';
    case 'all': return '100 YEAR';
    default: return '1 MONTH';
  }
}

export default {
  getRevenueReport,
  getChurnReport,
  getForecastReport,
  getLicensesReport,
  getPaymentsReport
};
