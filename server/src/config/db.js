const mongoose = require('mongoose');
const autoSeed = require('../utils/autoSeed');

const sanitizeMongoError = (message = '') => {
  if (typeof message !== 'string') return 'Unknown database error';
  return message.replace(/mongodb(\+srv)?:\/\/([^@/\s]+)@/gi, 'mongodb$1://<redacted>@');
};

const connectDB = async (options = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const mongoUri = (process.env.MONGODB_URI || '').trim();
  const timeoutMS = options.serverSelectionTimeoutMS || (isProduction ? 15000 : 3000);

  if (isProduction && !mongoUri) {
    const errMsg = 'MONGODB_URI environment variable is missing in production. Please configure a valid MongoDB Atlas connection string.';
    console.error(`❌ MongoDB Configuration Error: ${errMsg}`);
    throw new Error(errMsg);
  }

  if (mongoUri) {
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: timeoutMS,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      await autoSeed();
      return conn;
    } catch (error) {
      const safeMessage = sanitizeMongoError(error.message);
      if (isProduction) {
        const localhostHint = /(localhost|127\.0\.0\.1|::1)/.test(mongoUri)
          ? ' (MONGODB_URI points to localhost; configure your MongoDB Atlas mongodb+srv:// connection string in Render)'
          : '';
        console.error(`❌ Production MongoDB Connection Failed (${safeMessage})${localhostHint}. In-memory fallback is disabled in production.`);
        throw new Error(`Production MongoDB connection failed: ${safeMessage}${localhostHint}`);
      }
      console.warn(`⚠️ Primary MongoDB Connection failed (${safeMessage}). Attempting in-memory MongoDB fallback for ${process.env.NODE_ENV || 'development'}...`);
    }
  } else {
    console.warn(`⚠️ MONGODB_URI is not set. Attempting in-memory MongoDB fallback for ${process.env.NODE_ENV || 'development'}...`);
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create({
      instance: { dbName: 'munnalal_painter' },
      spawnTimeoutMS: 60000,
    });
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`✅ In-Memory MongoDB Connected (${process.env.NODE_ENV || 'development'}): ${conn.connection.host}`);
    await autoSeed();
    return conn;
  } catch (memError) {
    const safeMemError = sanitizeMongoError(memError.message);
    console.error(`❌ MongoDB Connection Error: ${safeMemError}`);
    throw new Error(`MongoDB connection failed: ${safeMemError}`);
  }
};

module.exports = connectDB;


