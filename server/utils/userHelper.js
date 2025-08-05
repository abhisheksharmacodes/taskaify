const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

const getOrCreateUser = async (firebaseUser) => {
  try {
    const db = getDB();
    const usersCollection = db.collection('users');
    
    // Try to find existing user
    let user = await usersCollection.findOne({ firebaseUid: firebaseUser.uid });
    
    if (!user) {
      // Create new user if not exists
      const newUser = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.name || firebaseUser.display_name || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }
    
    return user;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
};

module.exports = { getOrCreateUser }; 