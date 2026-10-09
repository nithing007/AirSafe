# AirSafe Server

Node.js and Express backend for AirSafe.

## Responsibilities

- REST API development
- Live air quality data integration
- Exposure calculation engine
- Recommendation engine
- MongoDB integration
- Authentication and exposure history

## Technology

Node.js, Express.js, MongoDB, Mongoose and the OpenWeather Air Pollution API.

---

## Local Development Setup

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set the following variables:

| Variable      | Required | Description                                     | Example                     |
|---------------|----------|-------------------------------------------------|-----------------------------|
| `PORT`        | Yes      | Port the server listens on                      | `3000`                      |
| `NODE_ENV`    | Yes      | Runtime environment (`development`/`production`) | `development`               |
| `CORS_ORIGIN` | Yes      | Allowed frontend origin                         | `http://localhost:5173`     |

> **Never commit `.env` to version control.** It is blocked by `.gitignore`.

### 3. Start the development server

```bash
npm run dev
```

The server will start on the configured `PORT` and restart automatically when files change.

Verify it is running:

```
GET http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-10-09T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 4. Run tests

```bash
npm test
```

Tests use Jest and Supertest. They do not require a running server or a `.env` file — the test environment injects its own variables.

---

## npm Scripts

| Script        | Command              | Purpose                                    |
|---------------|----------------------|--------------------------------------------|
| `npm start`   | `node src/server.js` | Start server (production)                  |
| `npm run dev` | `nodemon src/server.js` | Start server with auto-restart (development) |
| `npm test`    | `jest --runInBand --forceExit` | Run all tests                 |

---

## Project Structure

```
server/
├── .env.example           — Environment variable template
├── package.json           — Project manifest and scripts
├── src/
│   ├── app.js             — Express application factory (no listen)
│   ├── server.js          — Entry point (calls app.listen)
│   ├── config/
│   │   └── env.js         — Environment variable validation and export
│   ├── controllers/
│   │   └── health.controller.js
│   ├── middleware/
│   │   └── errorHandler.js — 404 and global error handlers
│   └── routes/
│       └── health.routes.js
└── tests/
    └── health.test.js     — Health endpoint integration tests
```

---

## Implemented Endpoints (Phase 1)

| Method | Endpoint      | Status        |
|--------|---------------|---------------|
| GET    | `/api/health` | ✅ Implemented |

All other endpoints listed in `docs/api-contract.md` are pending approval for future phases.
