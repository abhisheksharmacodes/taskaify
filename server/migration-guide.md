# Migration Guide: Next.js API to Express Server

This guide helps you migrate from the Next.js API routes to the new Express.js server.

## API Endpoint Changes

### Base URL Change
- **Before**: `http://localhost:3000/api/*`
- **After**: `http://localhost:5000/api/*`

### Authentication
The authentication mechanism remains the same - Firebase tokens in the Authorization header.

## Endpoint Mapping

### Tasks

| Next.js Route | Express Route | Method | Description |
|---------------|---------------|--------|-------------|
| `/api/tasks` | `/api/tasks` | GET | Get all tasks (with filters) |
| `/api/tasks` | `/api/tasks` | POST | Create new task |
| `/api/tasks/[id]` | `/api/tasks/:id` | GET | Get single task |
| `/api/tasks/[id]` | `/api/tasks/:id` | PUT | Update task |
| `/api/tasks/[id]` | `/api/tasks/:id` | DELETE | Delete task |

### Subtasks

| Next.js Route | Express Route | Method | Description |
|---------------|---------------|--------|-------------|
| `/api/tasks/[id]/subtasks` | `/api/tasks/:taskId/subtasks` | GET | Get all subtasks |
| `/api/tasks/[id]/subtasks` | `/api/tasks/:taskId/subtasks` | POST | Create subtask |
| `/api/tasks/[id]/subtasks/[subtaskId]` | `/api/tasks/:taskId/subtasks/:subtaskId` | GET | Get single subtask |
| `/api/tasks/[id]/subtasks/[subtaskId]` | `/api/tasks/:taskId/subtasks/:subtaskId` | PUT | Update subtask |
| `/api/tasks/[id]/subtasks/[subtaskId]` | `/api/tasks/:taskId/subtasks/:subtaskId` | DELETE | Delete subtask |

### Categories

| Next.js Route | Express Route | Method | Description |
|---------------|---------------|--------|-------------|
| `/api/tasks/categories` | `/api/categories` | GET | Get all categories |
| `/api/tasks/categories` | `/api/categories` | POST | Create new category |

### Users

| Next.js Route | Express Route | Method | Description |
|---------------|---------------|--------|-------------|
| `/api/users` | `/api/users/profile` | GET | Get user profile |
| `/api/users` | `/api/users/profile` | PUT | Update user profile |

## Request/Response Changes

### Task Object Structure

**Before (PostgreSQL/Drizzle)**:
```json
{
  "id": 1,
  "userId": 1,
  "content": "Task content",
  "completed": false,
  "category": "Work",
  "dueDate": "2024-01-15T10:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**After (MongoDB/Native Driver)**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "content": "Task content",
  "completed": false,
  "category": "Work",
  "dueDate": "2024-01-15T10:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### User Object Structure

**Before**:
```json
{
  "id": 1,
  "firebaseUid": "firebase_uid_here",
  "email": "user@example.com",
  "name": "User Name",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**After**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firebaseUid": "firebase_uid_here",
  "email": "user@example.com",
  "name": "User Name",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Client-Side Changes

### Update API Base URL

In your client application, update the base URL for API calls:

```javascript
// Before
const API_BASE = 'http://localhost:5000/api';

// After
const API_BASE = 'http://localhost:5000/api';
```

### Update ID References

Since MongoDB uses ObjectId strings instead of integers, update any ID handling:

```javascript
// Before (integer IDs)
const taskId = 1;

// After (string IDs)
const taskId = "507f1f77bcf86cd799439011";
```

### Error Handling

The error response format remains similar, but you may need to update error handling:

```javascript
// Error response format (unchanged)
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

## Environment Variables

### Client (.env.local)
```env
# Before
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# After
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Server (.env)
```env
MONGODB_URI=mongodb://localhost:27017/taskaify
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

## Testing the Migration

1. **Start the new server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Test health endpoint**:
   ```bash
   curl http://localhost:5000/health
   ```

3. **Test authentication**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:5000/api/users/profile
   ```

4. **Test task creation**:
   ```bash
   curl -X POST http://localhost:5000/api/tasks \
        -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"content": "Test task"}'
   ```

## Data Migration (Optional)

If you have existing data in PostgreSQL, you can create a migration script:

```javascript
// migration-script.js
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');

// Connect to both databases
const pgPool = new Pool({ /* PostgreSQL config */ });
const mongoClient = new MongoClient('mongodb://localhost:27017/taskaify');

// Migrate users
async function migrateUsers() {
  const users = await pgPool.query('SELECT * FROM users');
  const db = mongoClient.db();
  const usersCollection = db.collection('users');
  
  for (const user of users.rows) {
    await usersCollection.insertOne({
      firebaseUid: user.firebase_uid,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at
    });
  }
}

// Similar functions for tasks, subtasks, categories
```

## Rollback Plan

If you need to rollback:

1. Keep the Next.js API routes in the client
2. Update the client to use the old API endpoints
3. Restore PostgreSQL database if needed
4. Update environment variables back to original values

## Performance Considerations

- MongoDB ObjectId lookups are generally faster than integer IDs
- MongoDB's document model may provide better performance for nested data
- Consider adding database indexes for frequently queried fields
- Monitor query performance and add indexes as needed

## Vercel Deployment Benefits

- **Native MongoDB Driver**: Better compatibility with Vercel's serverless environment
- **No Mongoose**: Eliminates potential issues with Mongoose in serverless functions
- **Optimized for Serverless**: Connection pooling and proper resource management
- **Better Cold Start Performance**: Lighter weight without Mongoose overhead

## Security Notes

- All authentication remains the same (Firebase)
- CORS is configured to allow your client domain
- Rate limiting is enabled (100 requests per 15 minutes)
- Input validation is enforced on all endpoints
- Security headers are added via Helmet 