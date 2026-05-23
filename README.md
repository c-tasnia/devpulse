# DevPulse 🚀

Internal Tech Issue & Feature Tracker — a collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

**Live URL:** https://devpulse-virid.vercel.app

---

## Tech Stack

Node.js · TypeScript · Express.js · PostgreSQL · bcrypt · jsonwebtoken · Vercel · NeonDB

---

## Setup

```bash
git clone https://github.com/c-tasnia/devpulse.git
cd devpulse
npm install
```

Create a `.env` file:

```env
DATABASE_URL=your_neondb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

Run `schema.sql` in NeonDB SQL Editor, then:

```bash
npm run dev
```

---

## API Endpoints

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register user |
| POST | `/api/auth/login` | Public | Login & get token |
| POST | `/api/issues` | Authenticated | Create issue |
| GET | `/api/issues` | Public | List all issues |
| GET | `/api/issues/:id` | Public | Get single issue |
| PATCH | `/api/issues/:id` | Authenticated | Update issue |
| DELETE | `/api/issues/:id` | Maintainer only | Delete issue |

---

## Database Schema

**users:** id, name, email, password, role, created_at, updated_at

**issues:** id, title, description, type, status, reporter_id, created_at, updated_at