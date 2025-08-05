const { MongoClient } = require('mongodb');

let db = null;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    db = client.db();
    
    console.log(`MongoDB Connected: ${client.topology.s.state}`);
    
    // Create indexes for better performance
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 });
    
    // Tasks collection indexes
    await db.collection('tasks').createIndex({ userId: 1 });
    await db.collection('tasks').createIndex({ userId: 1, completed: 1 });
    await db.collection('tasks').createIndex({ userId: 1, category: 1 });
    await db.collection('tasks').createIndex({ userId: 1, dueDate: 1 });
    
    // Subtasks collection indexes
    await db.collection('subtasks').createIndex({ taskId: 1 });
    await db.collection('subtasks').createIndex({ taskId: 1, completed: 1 });
    
    // Categories collection indexes
    await db.collection('categories').createIndex({ userId: 1 });
    await db.collection('categories').createIndex({ userId: 1, name: 1 }, { unique: true });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
};

module.exports = { connectDB, getDB }; 