const { Sequelize } = require('sequelize');
require('pg');
require('pg-hstore');

const databaseUrl = (process.env.DATABASE_URL || '').trim();

// Ensure the URL is actually a postgres URL and not an HTTP URL
if (databaseUrl && databaseUrl.startsWith('http')) {
  console.warn('WARNING: DATABASE_URL seems to be an HTTP URL instead of a PostgreSQL connection string. Database connection will likely fail.');
}

const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', '..', 'database.sqlite'),
  logging: false
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Skip sync in Vercel to prevent timeouts
    if (!process.env.VERCEL) {
      await sequelize.sync({ alter: true });
      console.log('Database tables synced');
    }
  } catch (error) {
    console.error('Database connection error:', error.message);
    if (process.env.VERCEL) {
      throw error; // Throw error in Vercel to let the request handler catch it instead of crashing the lambda container
    } else {
      process.exit(1);
    }
  }
};

module.exports = { sequelize, connectDB };
