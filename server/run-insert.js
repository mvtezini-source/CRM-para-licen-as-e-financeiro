import pool from './db.js';

async function executeInsert() {
  try {
    const connection = await pool.getConnection();
    
    const result = await connection.execute(
      'INSERT IGNORE INTO users (id, name, email, role_id) VALUES (?, ?, ?, ?)',
      ['admin', 'Administrador', 'admin@admin', 2]
    );
    
    console.log('INSERT executado com sucesso!');
    console.log('Resultado:', result);
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar INSERT:', error);
    process.exit(1);
  }
}

executeInsert();
