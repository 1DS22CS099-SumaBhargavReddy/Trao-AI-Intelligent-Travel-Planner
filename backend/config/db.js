const mongoose = require('mongoose');

async function connectDB() {
  try {
    let mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.warn('⚠️ MONGO_URI is missing in env variables.');
      console.log('🤖 Initializing mongodb-memory-server for local sandbox execution...');
      
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        mongoURI = mongoServer.getUri();
        console.log(`✅ Dynamic MongoDB Memory Server started successfully at: ${mongoURI}`);
      } catch (memError) {
        console.error('❌ Failed to initialize MongoDB Memory Server:', memError);
        process.exit(1);
      }
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`🌐 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
