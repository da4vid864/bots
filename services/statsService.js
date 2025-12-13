// services/statsService.js
const pool = require('./db');
const botDbService = require('./botDbService');
const baileysManager = require('./baileysManager');

/**
 * Devuelve métricas de dashboard para el owner (admin logueado)
 */
async function getDashboardStats(ownerEmail) {
  // 1) Bots del owner
  const allBots = await botDbService.getAllBots();
  const bots = allBots.filter(b => b.owneremail === ownerEmail || b.ownerEmail === ownerEmail);
  const botIds = bots.map(b => b.id);

  let botsConnected = 0;
  let botsDisconnected = 0;

  bots.forEach(bot => {
    const status = baileysManager.getBotStatus(bot.id);
    if (status === 'CONNECTED') botsConnected += 1;
    else botsDisconnected += 1;
  });

  // Si no tiene bots, devolvemos ceros directamente
  if (botIds.length === 0) {
    return {
      botsTotal: 0,
      botsConnected: 0,
      botsDisconnected: 0,
      totalLeads: 0,
      qualifiedLeads: 0,
      newLeadsToday: 0,
    };
  }

  // 2) Leads totales para esos bots
  const totalLeadsRes = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM leads
     WHERE bot_id = ANY($1::text[])`,
    [botIds]
  );

  // 3) Leads calificados
  const qualifiedLeadsRes = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM leads
     WHERE bot_id = ANY($1::text[])
       AND is_qualified = TRUE`,
    [botIds]
  );

  // 4) Leads creados hoy
  const todayLeadsRes = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM leads
     WHERE bot_id = ANY($1::text[])
       AND created_at::date = CURRENT_DATE`,
    [botIds]
  );

  return {
    botsTotal: bots.length,
    botsConnected,
    botsDisconnected,
    totalLeads: totalLeadsRes.rows[0]?.count || 0,
    qualifiedLeads: qualifiedLeadsRes.rows[0]?.count || 0,
    newLeadsToday: todayLeadsRes.rows[0]?.count || 0,
  };
}

module.exports = { getDashboardStats };