import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const createDatabase = async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default postgres database first
  })

  try {
    await client.connect()
    console.log('Connected to PostgreSQL')
    
    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'daritana_dev'"
    )
    
    if (result.rows.length === 0) {
      // Create database
      await client.query('CREATE DATABASE daritana_dev')
      console.log('Database daritana_dev created successfully')
    } else {
      console.log('Database daritana_dev already exists')
    }
    
    // Also create test database
    const testResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'daritana_test'"
    )
    
    if (testResult.rows.length === 0) {
      await client.query('CREATE DATABASE daritana_test')
      console.log('Database daritana_test created successfully')
    } else {
      console.log('Database daritana_test already exists')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
  }
}

createDatabase()