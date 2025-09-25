require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const connectAndCleanup = async () => {
  let client;
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    const db = client.db();
    console.log('Connected to MongoDB successfully');

    // Get all collections
    const tasksCollection = db.collection('tasks');
    const subtasksCollection = db.collection('subtasks');

    console.log('\n--- Starting cleanup of invalid tasks ---');

    // Find tasks with invalid ObjectIds
    const allTasks = await tasksCollection.find({}).toArray();
    const invalidTasks = [];
    const validTasks = [];

    allTasks.forEach(task => {
      try {
        // Check if _id is a valid ObjectId
        if (!task._id || !(task._id instanceof ObjectId)) {
          invalidTasks.push(task);
        } else {
          validTasks.push(task);
        }
      } catch (error) {
        invalidTasks.push(task);
      }
    });

    console.log(`Found ${allTasks.length} total tasks`);
    console.log(`Found ${invalidTasks.length} tasks with invalid IDs`);
    console.log(`Found ${validTasks.length} tasks with valid IDs`);

    if (invalidTasks.length > 0) {
      console.log('\nInvalid tasks found:');
      invalidTasks.forEach((task, index) => {
        console.log(`${index + 1}. ID: ${JSON.stringify(task._id)}, Content: "${task.content}"`);
      });

      // Ask for confirmation before deletion
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const shouldDelete = await new Promise((resolve) => {
        rl.question('\nDo you want to delete these invalid tasks? (y/N): ', (answer) => {
          rl.close();
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });

      if (shouldDelete) {
        // Delete invalid tasks
        const invalidIds = invalidTasks.map(task => task._id);
        const deleteResult = await tasksCollection.deleteMany({
          _id: { $in: invalidIds }
        });

        console.log(`Deleted ${deleteResult.deletedCount} invalid tasks`);

        // Also clean up any orphaned subtasks
        const subtaskCleanupResult = await subtasksCollection.deleteMany({
          taskId: { $in: invalidIds }
        });

        console.log(`Deleted ${subtaskCleanupResult.deletedCount} orphaned subtasks`);
      } else {
        console.log('Cleanup cancelled by user');
      }
    } else {
      console.log('No invalid tasks found - database is clean!');
    }

    console.log('\n--- Cleanup completed ---');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
};

// Run the cleanup
connectAndCleanup().catch(console.error);