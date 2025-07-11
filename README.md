# Taskaify

A productivity platform powered by AI for dynamic task generation, seamless organization, and progress tracking.

---

## 🚀 Features

- 🤖 **AI-Powered Task Generation:** Instantly generate actionable tasks for any goal using Google Gemini API.
- ✅ **Task & Subtask Management:** Create, edit, and organize tasks and subtasks with categories and due dates.
- 📊 **Progress Tracking:** Visualize your completion stats and stay motivated.
- 🔒 **Secure Authentication:** Sign up and sign in with Firebase Auth.
- 🏷️ **Custom Categories:** Organize tasks with user-defined categories.
- 🌐 **Modern UI:** Responsive, accessible design with Radix UI and Tailwind CSS.
- 🐳 **Easy Deployment:** Docker and Docker Compose support for local and cloud deployment.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, Radix UI, Tailwind CSS
- **Backend:** Next.js API routes, Node.js
- **Database:** PostgreSQL, Drizzle ORM
- **Authentication:** Firebase Auth
- **AI Integration:** Google Gemini API
- **DevOps:** Docker, Docker Compose

---

## 🏁 How to Run

### 1. Clone & Install
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
DATABASE_URL=postgres://postgres:postgres@db:5432/w3dev
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL=your_firebase_client_email
NEXT_PUBLIC_FIREBASE_PRIVATE_KEY=your_firebase_private_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Start Database (Docker)
```bash
docker-compose up -d
```

### 4. Run Migrations
```bash
npx drizzle-kit push:pg
```

### 5. Start the App
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to get started!

---

## 📦 Deployment

- Supports Docker and cloud platforms (e.g., Vercel, Render). Set all required environment variables in your deployment environment.

---

> Bootstrapped with [Next.js](https://nextjs.org) and [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
