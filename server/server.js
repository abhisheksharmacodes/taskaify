require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');

// Import configurations
const { connectDB, getDB } = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const verifyFirebaseToken = require('./middleware/auth');
const { getOrCreateUser } = require('./utils/userHelper');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase
initializeFirebase();

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Logging
app.use(limiter); // Rate limiting
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Validation schemas
const createTaskValidation = [
  body('content').trim().isLength({ min: 1, max: 255 }).withMessage('Content must be between 1 and 255 characters'),
  body('category').optional().trim().isLength({ max: 50 }).withMessage('Category must be less than 50 characters'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date')
];

const updateTaskValidation = [
  body('content').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Content must be between 1 and 255 characters'),
  body('category').optional().trim().isLength({ max: 50 }).withMessage('Category must be less than 50 characters'),
  body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date')
];

const createSubtaskValidation = [
  body('content').trim().isLength({ min: 1, max: 255 }).withMessage('Content must be between 1 and 255 characters'),
  body('completed').optional().isBoolean().withMessage('Completed must be a boolean')
];

const updateSubtaskValidation = [
  body('content').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Content must be between 1 and 255 characters'),
  body('completed').optional().isBoolean().withMessage('Completed must be a boolean')
];

const createCategoryValidation = [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Category name must be between 1 and 50 characters')
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== TASKS API ====================

// GET /api/tasks - Get all tasks for user
app.get('/api/tasks', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const tasksCollection = db.collection('tasks');
    
    // Build query filters
    const filter = { userId: user._id };
    const { completed, category } = req.query;
    
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }
    
    if (category) {
      filter.category = category;
    }
    
    const tasks = await tasksCollection.find(filter).sort({ createdAt: -1 }).toArray();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks - Create new task
app.post('/api/tasks', verifyFirebaseToken, createTaskValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const tasksCollection = db.collection('tasks');
    
    const taskData = {
      userId: user._id,
      content: req.body.content,
      completed: false,
      category: req.body.category || null,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await tasksCollection.insertOne(taskData);
    const task = { ...taskData, _id: result.insertedId };
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/:id - Get single task
app.get('/api/tasks/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const tasksCollection = db.collection('tasks');
    
    let taskId;
    try {
      taskId = new ObjectId(req.params.id);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }
    
    const task = await tasksCollection.findOne({ 
      _id: taskId, 
      userId: user._id 
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id - Update task
app.put('/api/tasks/:id', verifyFirebaseToken, updateTaskValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const tasksCollection = db.collection('tasks');
    
    let taskId;
    try {
      taskId = new ObjectId(req.params.id);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }
    
    const updateData = { updatedAt: new Date() };
    if (req.body.content !== undefined) updateData.content = req.body.content;
    if (req.body.completed !== undefined) updateData.completed = req.body.completed;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.dueDate !== undefined) {
      updateData.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }
    
    const result = await tasksCollection.findOneAndUpdate(
      { _id: taskId, userId: user._id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.value);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const tasksCollection = db.collection('tasks');
    
    let taskId;
    try {
      taskId = new ObjectId(req.params.id);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }
    
    const result = await tasksCollection.findOneAndDelete({ 
      _id: taskId, 
      userId: user._id 
    });
    
    if (!result.value) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== SUBTASKS API ====================

// GET /api/tasks/:taskId/subtasks - Get all subtasks for a task
app.get('/api/tasks/:taskId/subtasks', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const tasksCollection = db.collection('tasks');
    const subtasksCollection = db.collection('subtasks');
    
    let taskId;
    try {
      taskId = new ObjectId(req.params.taskId);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }
    
    // Verify task belongs to user
    const task = await tasksCollection.findOne({ 
      _id: taskId, 
      userId: user._id 
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const subtasks = await subtasksCollection.find({ taskId: taskId }).sort({ createdAt: -1 }).toArray();
    res.json(subtasks);
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks/:taskId/subtasks - Create new subtask
app.post('/api/tasks/:taskId/subtasks', verifyFirebaseToken, createSubtaskValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const tasksCollection = db.collection('tasks');
    const subtasksCollection = db.collection('subtasks');
    
    let taskId;
    try {
      taskId = new ObjectId(req.params.taskId);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }
    
    // Verify task belongs to user
    const task = await tasksCollection.findOne({ 
      _id: taskId, 
      userId: user._id 
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const subtaskData = {
      taskId: taskId,
      content: req.body.content,
      completed: req.body.completed || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await subtasksCollection.insertOne(subtaskData);
    const subtask = { ...subtaskData, _id: result.insertedId };
    
    res.status(201).json(subtask);
  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/:taskId/subtasks/:subtaskId - Get single subtask
app.get('/api/tasks/:taskId/subtasks/:subtaskId', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const tasksCollection = db.collection('tasks');
    const subtasksCollection = db.collection('subtasks');
    
    let taskId, subtaskId;
    try {
      taskId = new ObjectId(req.params.taskId);
      subtaskId = new ObjectId(req.params.subtaskId);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Verify task belongs to user
    const task = await tasksCollection.findOne({ 
      _id: taskId, 
      userId: user._id 
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const subtask = await subtasksCollection.findOne({ 
      _id: subtaskId, 
      taskId: taskId 
    });
    
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    
    res.json(subtask);
  } catch (error) {
    console.error('Error fetching subtask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:taskId/subtasks/:subtaskId - Update subtask
app.put('/api/tasks/:taskId/subtasks/:subtaskId', verifyFirebaseToken, updateSubtaskValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const tasksCollection = db.collection('tasks');
    const subtasksCollection = db.collection('subtasks');
    
    let taskId, subtaskId;
    try {
      taskId = new ObjectId(req.params.taskId);
      subtaskId = new ObjectId(req.params.subtaskId);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Verify task belongs to user
    const task = await tasksCollection.findOne({ 
      _id: taskId, 
      userId: user._id 
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const updateData = { updatedAt: new Date() };
    if (req.body.content !== undefined) updateData.content = req.body.content;
    if (req.body.completed !== undefined) updateData.completed = req.body.completed;
    
    const result = await subtasksCollection.findOneAndUpdate(
      { _id: subtaskId, taskId: taskId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    
    res.json(result.value);
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:taskId/subtasks/:subtaskId - Delete subtask
app.delete('/api/tasks/:taskId/subtasks/:subtaskId', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const tasksCollection = db.collection('tasks');
    const subtasksCollection = db.collection('subtasks');
    
    let taskId, subtaskId;
    try {
      taskId = new ObjectId(req.params.taskId);
      subtaskId = new ObjectId(req.params.subtaskId);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Verify task belongs to user
    const task = await tasksCollection.findOne({ 
      _id: taskId, 
      userId: user._id 
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const result = await subtasksCollection.findOneAndDelete({ 
      _id: subtaskId, 
      taskId: taskId 
    });
    
    if (!result.value) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== CATEGORIES API ====================

// GET /api/categories - Get all categories for user
app.get('/api/categories', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const categoriesCollection = db.collection('categories');
    
    const categories = await categoriesCollection.find({ userId: user._id }).sort({ name: 1 }).toArray();
    const categoryNames = categories.map(cat => cat.name);
    
    res.json(categoryNames);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories - Create new category
app.post('/api/categories', verifyFirebaseToken, createCategoryValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const categoriesCollection = db.collection('categories');
    
    const categoryData = {
      userId: user._id,
      name: req.body.name.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      await categoriesCollection.insertOne(categoryData);
      res.status(201).json({ success: true });
    } catch (error) {
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Category already exists' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== USERS API ====================

// GET /api/users/profile - Get user profile
app.get('/api/users/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    
    // Return user data without sensitive information
    const userProfile = {
      id: user._id,
      email: user.email,
      name: user.name,
      firebaseUid: user.firebaseUid,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/profile - Update user profile
app.put('/api/users/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    const db = getDB();
    const usersCollection = db.collection('users');
    
    const updateData = { updatedAt: new Date() };
    if (req.body.name !== undefined) {
      updateData.name = req.body.name.trim();
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { _id: user._id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return updated user data without sensitive information
    const userProfile = {
      id: result.value._id,
      email: result.value.email,
      name: result.value.name,
      firebaseUid: result.value.firebaseUid,
      createdAt: result.value.createdAt,
      updatedAt: result.value.updatedAt
    };
    
    res.json(userProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: Object.values(err.errors).map(e => e.message) 
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
