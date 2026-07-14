# OrySnap 📸✨  

OrySnap is a full-stack, Instagram-style social media web application. It features a responsive mobile-first React frontend and a real-time Node.js/Express backend powered by SQLite (via Prisma ORM) and Socket.io.

---

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, Vite, React Router DOM, Axios, Lucide Icons, Socket.io-client.
- **Backend**: Node.js, Express, Socket.io, Prisma ORM, JWT (jsonwebtoken), bcryptjs, Multer.
- **Database**: SQLite (Zero configuration, stored in a local file `backend/prisma/dev.db`).
- **Media Storage**: Dual-mode storage (automatic local filesystem upload with dynamic fallback or Cloudinary integration).

---

## 📂 Project Structure

```
orysnap/
├── backend/                  # Backend application folder
│   ├── prisma/
│   │   ├── schema.prisma    # Prisma PostgreSQL/SQLite schema file
│   │   └── dev.db           # SQLite database file (automatically created)
│   ├── src/
│   │   ├── config/          # Prisma database configuration
│   │   ├── controllers/     # MVC controller logic
│   │   ├── routes/          # Express REST API routes
│   │   ├── middlewares/     # Auth checks & file uploads
│   │   ├── utils/           # JWT and Seeding helpers
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Socket.io setup & Server entry point
│   ├── uploads/             # Local storage folder for uploaded images/videos
│   ├── .env                 # Backend environment variables
│   └── package.json         # Node.js backend dependencies
├── frontend/                 # Frontend application folder
│   ├── src/
│   │   ├── components/      # Reusable UI widgets (Sidebar, BottomNav, PostCard, StoryViewer, Chat)
│   │   ├── context/         # AuthContext and SocketContext
│   │   ├── pages/           # Pages (Feed, Explore, Profile, Auth, Direct Message)
│   │   ├── services/        # Central API axios client
│   │   ├── App.jsx          # Route management & layout panels coordinator
│   │   ├── index.css        # Tailwind directives and custom animation styles
│   │   └── main.jsx         # Client mount entry point
│   ├── index.html           # SPA skeleton index HTML
│   ├── vite.config.js       # Vite build configurations and Proxy setups
│   ├── tailwind.config.js   # Tailwind theme configurations (custom brand colors)
│   └── package.json         # Client side dependencies
├── verify_project.py        # ASCII project verification utility
└── README.md                # Setup & instruction guide
```

---

## 🚦 Installation & Setup Guide

Ensure you have **Node.js** (v16+) installed on your machine.

### Step 1: Configure Backend Environment Variables
A default `.env` file has been automatically created in the `backend/` directory pointing to the local SQLite file database:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET=orysnap_jwt_secret_token_123456
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
*Note: If Cloudinary fields are left blank, the server will upload files directly to `backend/uploads/` and serve them statically over Express. If you choose to hook up Cloudinary, insert your keys.*

### Step 2: Install Dependencies
Open two terminal windows:

**In terminal 1 (Backend):**
```bash
cd backend
npm install
```

**In terminal 2 (Frontend):**
```bash
cd frontend
npm install
```

### Step 3: Run Database Migrations & Seed
To sync the SQLite database schema and seed the database with initial records (users, posts, comments, stories, direct messages, etc.):

**In terminal 1 (Backend):**
```bash
npx prisma db push
node src/utils/seed.js
```

### Step 4: Start Development Servers
Start both servers:

**In terminal 1 (Backend):**
```bash
node src/server.js
```
*Starts API and Socket.io server on [http://localhost:5000](http://localhost:5000)*

**In terminal 2 (Frontend):**
```bash
npm run dev
```
*Starts React/Vite development server on [http://localhost:3000](http://localhost:3000)*

Open [http://localhost:3000](http://localhost:3000) in your browser. You can log in using one of the seeded accounts (password is `password123` for all):
- `alex_adventures`
- `sophie_codes`
- `nature_seeker`
- `foodie_marcus`
- `elena_art`
