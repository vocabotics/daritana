import { Pool, PoolClient, QueryResult } from 'pg';
import type { QueryResultRow } from 'pg';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Database configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'daritana',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(poolConfig);

// Pool error handling
pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err);
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Query helper with automatic client management
export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query error', { text, error });
    throw error;
  }
};

// Transaction helper
export const transaction = async <T extends QueryResultRow = any>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get a client for manual transaction control
export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  return client;
};

// Paginated query helper
export const paginatedQuery = async <T extends QueryResultRow = any>(
  baseQuery: string,
  countQuery: string,
  params: any[],
  page: number = 1,
  limit: number = 10
): Promise<{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const offset = (page - 1) * limit;
  
  // Add pagination to query
  const paginatedSQL = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const paginatedParams = [...params, limit, offset];
  
  // Execute both queries in parallel
  const [dataResult, countResult] = await Promise.all([
    query<T>(paginatedSQL, paginatedParams),
    query<{ count: string }>(countQuery, params)
  ]);
  
  const total = parseInt(countResult.rows[0]?.count || '0');
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
};

// Batch insert helper
export const batchInsert = async <T extends QueryResultRow = any>(
  table: string,
  columns: string[],
  values: any[][],
  returning?: string
): Promise<T[]> => {
  if (values.length === 0) return [];
  
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const placeholders = values.map((_, rowIndex) => 
      `(${columns.map((_, colIndex) => 
        `$${rowIndex * columns.length + colIndex + 1}`
      ).join(', ')})`
    ).join(', ');
    
    const flatValues = values.flat();
    const returningClause = returning ? `RETURNING ${returning}` : '';
    
    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${placeholders}
      ${returningClause}
    `;
    
    const result = await client.query<T>(sql, flatValues);
    await client.query('COMMIT');
    
    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Close pool (for graceful shutdown)
export const closePool = async (): Promise<void> => {
  await pool.end();
  logger.info('Database pool closed');
};

export default pool;