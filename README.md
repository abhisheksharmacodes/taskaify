# Taskaify

An AI-powered task management platform for organizing, tracking, and automating your workflow with intelligent task prioritization and collaboration features.

---

## 🚀 Features

- 🤖 **AI-Powered Task Management:** Automatically categorizes and prioritizes tasks using AI.
- 📱 **Cross-Platform Sync:** Access your tasks from anywhere, on any device.
- 🛡️ **Secure & Private:** Your data is encrypted and stays private.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Authentication:** JWT, OAuth
- **AI Integration:** Gemini API
- **DevOps:** Docker

---

## 🏁 How to Run

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/taskaify.git
cd taskaify
```

### 2. Configure Environment

#### Backend (`.env` in server directory):
```env
MONGODB_URI=mongodb://localhost:27017/taskaify
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
PORT=5000
```

#### Frontend (`.env.local` in client directory):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_ENV=development
```

### 3. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Start Development Servers

#### Start Backend (from server directory):
```bash
npm run dev
```

#### Start Frontend (from client directory):
```bash
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)
- MongoDB: `mongodb://localhost:27017/taskaify`

### 5. (Optional) Run with Docker
```bash
docker-compose up --build
```

---

## 📦 Deployment

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- Docker (optional)

### Deployment Instructions
1. Set up a production MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables in production
3. Build the application:
   ```bash
   # Build frontend
   cd client
   npm run build
   
   # Build backend
   cd ../server
   npm run build
   ```
4. Start the production server:
   ```bash
   cd server
   npm start
   ```

For cloud deployment, you can use platforms like:
- Vercel (Frontend)
- Railway or Render (Backend)
- MongoDB Atlas (Database)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

> Built with [Next.js](https://nextjs.org), [Express](https://expressjs.com), and [MongoDB](https://www.mongodb.com/).
