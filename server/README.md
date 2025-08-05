# Taskaify Backend Server

A Node.js, Express.js, and MongoDB backend for the Taskaify task management application.

## Features

- **Authentication**: Firebase Admin SDK integration for secure user authentication
- **Task Management**: Full CRUD operations for tasks with categories and due dates
- **Subtask Support**: Hierarchical task organization with subtasks
- **Category Management**: User-specific task categories
- **User Profiles**: User profile management
- **Security**: Rate limiting, CORS, Helmet security headers
- **Validation**: Input validation using express-validator
- **Error Handling**: Comprehensive error handling and logging
- **Vercel Compatible**: Uses native MongoDB driver for serverless deployment

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with native driver (Vercel compatible)
- **Authentication**: Firebase Admin SDK
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
- **Logging**: morgan
- **Compression**: compression

## API Endpoints

### Authentication
All endpoints require Firebase authentication via Bearer token in Authorization header.

### Tasks
- `GET /api/tasks` - Get all tasks for user (with optional filters)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Subtasks
- `GET /api/tasks/:taskId/subtasks` - Get all subtasks for a task
- `POST /api/tasks/:taskId/subtasks` - Create new subtask
- `GET /api/tasks/:taskId/subtasks/:subtaskId` - Get single subtask
- `PUT /api/tasks/:taskId/subtasks/:subtaskId` - Update subtask
- `DELETE /api/tasks/:taskId/subtasks/:subtaskId` - Delete subtask

### Categories
- `GET /api/categories` - Get all categories for user
- `POST /api/categories` - Create new category

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Health Check
- `GET /health` - Server health status

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Firebase project with Admin SDK credentials

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   - Copy `env.example` to `.env`
   - Update the following variables:
     ```
     MONGODB_URI=mongodb://localhost:27017/taskaify
     FIREBASE_PROJECT_ID=your-firebase-project-id
     FIREBASE_PRIVATE_KEY=your-firebase-private-key
     FIREBASE_CLIENT_EMAIL=your-firebase-client-email
     PORT=5000
     CORS_ORIGIN=http://localhost:3000
     ```

3. **Firebase Setup**:
   - Go to Firebase Console
   - Create a new project or use existing
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Download the JSON file and extract the required values

4. **MongoDB Setup**:
   - Install MongoDB locally or use MongoDB Atlas
   - Create a database named `taskaify`
   - Update the connection string in `.env`

### Running the Server

**Development mode**:
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## API Usage Examples

### Creating a Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Complete project documentation",
    "category": "Work",
    "dueDate": "2024-01-15T10:00:00.000Z"
  }'
```

### Getting Tasks with Filters
```bash
curl -X GET "http://localhost:5000/api/tasks?completed=false&category=Work" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Creating a Subtask
```bash
curl -X POST http://localhost:5000/api/tasks/TASK_ID/subtasks \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Write introduction section"
  }'
```

## Database Schema

### User
- `firebaseUid` (String, unique) - Firebase user ID
- `email` (String) - User email
- `name` (String) - User display name
- `createdAt`, `updatedAt` (Date) - Timestamps

### Task
- `userId` (ObjectId) - Owner user
- `content` (String) - Task description
- `completed` (Boolean) - Completion status
- `category` (String) - Task category
- `dueDate` (Date) - Due date
- `createdAt`, `updatedAt` (Date) - Timestamps

### Subtask
- `taskId` (ObjectId) - Parent task
- `content` (String) - Subtask description
- `completed` (Boolean) - Completion status
- `createdAt`, `updatedAt` (Date) - Timestamps

### Category
- `userId` (ObjectId) - Owner user
- `name` (String) - Category name
- `createdAt`, `updatedAt` (Date) - Timestamps

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Input Validation**: All inputs validated
- **Authentication**: Firebase token verification on all protected routes
- **Error Handling**: Comprehensive error responses

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `409` - Conflict (duplicate category)
- `500` - Internal Server Error

## Development

### Project Structure
```
server/
├── config/          # Database and Firebase configuration
├── middleware/      # Authentication middleware
├── routes/          # API route handlers
├── utils/           # Utility functions
├── server.js        # Main application file
├── package.json     # Dependencies and scripts
└── env.example      # Environment variables template
```

### Adding New Features

1. **Create Collection**: Add new MongoDB collection operations in `routes/`
2. **Add Validation**: Use express-validator for input validation
3. **Update Server**: Register new routes in `server.js`
4. **Test**: Use tools like Postman or curl to test endpoints

## Deployment

### Vercel Deployment
This backend is optimized for Vercel deployment:

1. **Environment Variables**: Set all required environment variables in Vercel dashboard
2. **MongoDB Atlas**: Use MongoDB Atlas for cloud database
3. **Firebase**: Configure Firebase Admin SDK credentials
4. **Build Command**: `npm install`
5. **Output Directory**: Not needed for API routes
6. **Install Command**: `npm install`

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong MongoDB connection string
- Configure proper CORS origins
- Set up proper Firebase credentials

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Test all endpoints
5. Update documentation

## License

MIT License 