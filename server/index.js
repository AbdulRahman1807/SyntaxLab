require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Base connection config (no specific db)
const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT) || 5432,
};

// Helper to create a client for a specific database
async function createClient(dbName) {
  const client = new Client({ ...baseConfig, database: dbName || 'postgres' });
  await client.connect();
  return client;
}

// GET /api/databases - list all user (non-template) databases
app.get('/api/databases', async (req, res) => {
  let client;
  try {
    client = await createClient('postgres');
    const result = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"
    );
    res.json(result.rows.map(r => r.datname));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) await client.end();
  }
});

// GET /api/tables/:dbName - list public tables for a given database
app.get('/api/tables/:dbName', async (req, res) => {
  const { dbName } = req.params;
  let client;
  try {
    client = await createClient(dbName);
    const result = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`
    );
    res.json(result.rows.map(r => r.table_name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) await client.end();
  }
});

// POST /api/execute - run a SQL query against a specific database
app.post('/api/execute', async (req, res) => {
  const { dbName, query } = req.body;
  if (!dbName || !query) {
    return res.status(400).json({ error: 'dbName and query are required.' });
  }
  let client;
  const startTime = Date.now();
  try {
    client = await createClient(dbName);
    const result = await client.query(query);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);
    const columns = result.fields ? result.fields.map(f => f.name) : [];
    const rows = result.rows || [];
    res.json({ columns, rows, stats: { time: `${elapsed}s` } });
  } catch (err) {
    res.status(200).json({ error: err.message });
  } finally {
    if (client) await client.end();
  }
});

app.listen(PORT, () => {
  console.log(`SyntaxLab backend running on http://localhost:${PORT}`);
});
