// Comprueba la conexion a la base configurada en DATABASE_URL (no la modifica).
import 'dotenv/config';
import { clientePostgres } from './conexion';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no esta definida.');
  const sql = clientePostgres(url, { max: 1, connect_timeout: 15 });
  const [r] = await sql`select current_database() as db`;
  const [t] = await sql`select count(*)::int as n from information_schema.tables where table_schema = 'public'`;
  console.log(`Conectado a ${JSON.stringify(r.db)} | tablas en public: ${t.n}`);
  await sql.end();
}
main().then(() => process.exit(0)).catch((e) => { console.error('ERROR', e.message); process.exit(1); });
