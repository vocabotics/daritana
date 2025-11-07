import dotenv from 'dotenv'
import { sequelize } from '../database/connection'
import { logger } from '../utils/logger'
import '../models' // Import all models to register them

dotenv.config()

const migrate = async () => {
  try {
    logger.info('Starting database migration...')
    
    // Test connection
    await sequelize.authenticate()
    logger.info('Database connection established')
    
    // Sync all models with database
    // Use force: true only in development to drop tables and recreate
    const force = process.env.NODE_ENV === 'development' && process.argv.includes('--force')
    
    await sequelize.sync({ force, alter: !force })
    
    logger.info(`Database migration completed successfully${force ? ' (tables recreated)' : ''}`)
    
    process.exit(0)
  } catch (error) {
    logger.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrate()