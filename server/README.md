# AirSafe Server

Node.js and Express backend for AirSafe.

## Responsibilities

- REST API development
- Live air quality data integration
- Exposure calculation engine
- Recommendation engine
- MongoDB Atlas integration
- Authentication and exposure history

## Technology

Node.js, Express.js, MongoDB Atlas, Mongoose, and OpenWeather Air Pollution API.

---

## Local Development Setup

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- MongoDB Atlas account (or compatible MongoDB instance)

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

| Variable              | Required | Description                                       | Example                                                                                    |
|-----------------------|----------|---------------------------------------------------|--------------------------------------------------------------------------------------------|
| `PORT`                | Yes      | Port the server listens on                        | `3000`                                                                                     |
| `NODE_ENV`            | Yes      | Runtime environment (`development`/`production`)   | `development`                                                                              |
| `CORS_ORIGIN`         | Yes      | Allowed frontend origin                           | `http://localhost:5173`                                                                    |
| `MONGODB_URI`         | Yes      | MongoDB Atlas connection string                   | `mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/airsafe?retryWrites=true&w=majority` |
| `OPENWEATHER_API_KEY` | Yes      | OpenWeather API key for live pollution data       | `your_openweather_api_key_here`                                                            |

> **Never commit `.env` to version control.** It is blocked by `.gitignore`.

---

## MongoDB Atlas Setup & Security

### 1. Create a Cluster & Database User
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create an **M0 (Free)** cluster in your target cloud region (e.g., AWS `ap-south-1` or `us-east-1`).
3. Under **Security > Database Access**, click **Add New Database User**:
   - Choose **Password** authentication.
   - Assign user privileges: **Read and write to any database** (or restrict to `airsafe`).
   - Use a strong, random password. Avoid special characters like `@` or `/` in passwords, or URL-encode them.

### 2. Network Access & IP Allowlisting
MongoDB Atlas denies all incoming connections by default until an IP address or range is explicitly allowlisted.

- **Local Development**:
  1. Go to **Security > Network Access**.
  2. Click **Add IP Address** and select **Add Current IP Address**.
  3. If your local ISP rotates your IP address, update this entry when connection timeouts occur.
- **Production & Cloud Hosting (AWS)**:
  - Add the specific Public IP / Elastic IP of your deployment instance or NAT Gateway.
  - Alternatively, configure AWS VPC Peering or PrivateLink if using dedicated Atlas tiers.
- **Security Warning on `0.0.0.0/0`**:
  - Do not use `0.0.0.0/0` ("Allow access from anywhere") as a default. Opening cluster access to all IPs increases exposure to credential-stuffing attacks. If temporarily required for a mobile/hackathon demo, ensure your database user credentials are exceptionally strong and revoke access after testing.

### 3. Retrieve the Connection String
1. Under **Deployment > Database**, click **Connect**.
2. Select **Drivers** (Node.js).
3. Copy the SRV connection string:
   ```text
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/airsafe?retryWrites=true&w=majority
   ```
4. Replace `<username>`, `<password>`, and cluster host in your `server/.env`.

---

## Running the Application

### Start development server

```bash
npm run dev
```

The server will:
1. Connect to MongoDB Atlas via Mongoose.
2. If connection succeeds, start listening on `PORT`.
3. If connection fails, log diagnostic information and exit immediately without accepting traffic.

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

### Run tests

```bash
npm test
```

Tests run using Jest and Supertest. All database operations are mocked using Jest spies, meaning the test suite runs completely offline in milliseconds and **does not require a running MongoDB instance or live Atlas connection**.

---

## npm Scripts

| Script        | Command                        | Purpose                                      |
|---------------|--------------------------------|----------------------------------------------|
| `npm start`   | `node src/server.js`           | Start server (production)                    |
| `npm run dev` | `nodemon src/server.js`        | Start server with auto-restart (development) |
| `npm test`    | `jest --runInBand --forceExit` | Run all unit & integration tests             |

---

## Project Structure

```
server/
├── .env.example           — Environment variable template (including MONGODB_URI and OPENWEATHER_API_KEY)
├── package.json           — Dependencies (Express, Mongoose, CORS, etc.)
├── package-lock.json      — Locked dependency tree
├── src/
│   ├── app.js             — Express application factory (independent of DB/network)
│   ├── server.js          — Entry point (connects DB before app.listen; handles shutdown)
│   ├── config/
│   │   ├── env.js         — Environment variable validation and frozen export
│   │   └── db.js          — MongoDB connection service (connectDB, disconnectDB)
│   ├── controllers/
│   │   ├── health.controller.js
│   │   └── air.controller.js  — Latitude/longitude validation and air quality handling
│   ├── services/
│   │   └── openweather.service.js — OpenWeather API client with 5s timeout & forecast window aggregation
│   ├── utils/
│   │   └── aqiCalculator.js   — Scientific US EPA piecewise linear AQI calculation engine
│   ├── middleware/
│   │   └── errorHandler.js — 404 and global error handlers
│   └── routes/
│       ├── health.routes.js
│       └── air.routes.js   — /api/air/current & /api/air/forecast endpoints
└── tests/
    ├── setup.js           — Jest setup file (safe test environment variables)
    ├── aqiCalculator.test.js — EPA AQI calculation engine unit tests
    ├── air.test.js        — /api/air endpoints integration tests (mocked fetch)
    ├── db.test.js         — Database connection and disconnection tests (mocked)
    ├── server.test.js     — Server startup flow, failure exit, and shutdown tests (mocked)
    └── health.test.js     — Health endpoint and route integration tests
```

---

## Implemented Endpoints

| Method | Endpoint            | Purpose                                            | Status        | Phase   |
|--------|---------------------|----------------------------------------------------|---------------|---------|
| GET    | `/api/health`       | Check server process status                        | ✅ Implemented | Phase 1 |
| GET    | `/api/air/current`  | Current air quality & calculated EPA AQI by coords | ✅ Implemented | Phase 3 |
| GET    | `/api/air/forecast` | 24-hr hourly & 7-day forecast with clean windows   | ✅ Implemented | Phase 3 |

*Note: All data models (ExposureRecord, AirQualityCache, User) and calculation endpoints (/api/exposure/*) remain deferred to subsequent phases as per the project architecture plan.*
