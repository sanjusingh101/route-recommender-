const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // No real Mongo URI configured -> spin up a throwaway in-memory MongoDB
    if (!uri || uri.trim() === '') {
      const memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      console.log('Using in-memory MongoDB (data resets on restart):', uri);
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;