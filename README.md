This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Running with Docker

This project supports running both the PostgreSQL database and the Next.js app using Docker Compose.

### 1. Start the Database

```
docker-compose up -d
```
This will start a PostgreSQL 15 instance on port 5432.

### 2. Configure Environment Variables

Create a `.env` file in the project root with the following content:

```
# Database connection string for local Docker Postgres
DATABASE_URL=postgres://postgres:postgres@db:5432/w3dev

# (Other environment variables for Firebase, Gemini API, etc)
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

- Make sure to replace the values with your actual credentials.
- The `DATABASE_URL` above is configured for Docker Compose networking (the service name `db` is used as the host).

### 3. Run the Next.js App

Install dependencies and start the app:

```
npm install
npm run dev
```

Or, to run in production mode:

```
npm run build
npm run start
```

### 4. Database Migrations

After starting the database, run Drizzle migrations:

```
npx drizzle-kit push:pg
```

This will apply the latest schema to your local Postgres instance.

---

## Deployment

For deployment (e.g., on Render.com), set the `DATABASE_URL` and all required environment variables in your deployment environment.
