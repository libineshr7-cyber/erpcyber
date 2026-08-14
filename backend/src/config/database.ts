import { Pool, PoolConfig } from 'pg';
import { config } from './env';

const dbUrl = process.env.DATABASE_URL || process.env.INTERNAL_DATABASE_URL || config.databaseUrl;

let poolConfig: PoolConfig;

if (dbUrl) {
  poolConfig = {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
} else {
  poolConfig = {
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  if (config.db.ssl || config.isProduction) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

pool.on('connect', () => {
  if (config.nodeEnv === 'development') {
    console.log('📦 PostgreSQL client connected');
  }
});

export default pool;
