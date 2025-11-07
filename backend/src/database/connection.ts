import { Sequelize } from 'sequelize'
import { logger } from '../utils/logger'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_SSL,
  DATABASE_URL,
  NODE_ENV
} = process.env

// Create Sequelize instance
export const sequelize = DATABASE_URL 
  ? new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      dialectOptions: {
        ssl: DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000
      }
    })
  : new Sequelize({
      database: DB_NAME || 'daritana_dev',
      username: DB_USER || 'postgres',
      password: DB_PASSWORD || 'postgres',
      host: DB_HOST || 'localhost',
      port: parseInt(DB_PORT || '5432'),
      dialect: 'postgres',
      logging: NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      dialectOptions: {
        ssl: DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000
      }
    })

// Test database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate()
    logger.info('Database connection established successfully')
    
    // Sync models in development
    if (NODE_ENV === 'development') {
      await sequelize.sync({ alter: true })
      logger.info('Database models synchronized')
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error)
    throw error
  }
}

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close()
    logger.info('Database connection closed')
  } catch (error) {
    logger.error('Error closing database connection:', error)
    throw error
  }
}