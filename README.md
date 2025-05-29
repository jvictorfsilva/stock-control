# Stock Control Application

This repository contains a **Stock Control Application** with two main parts:

1. **Backend**: RESTful API built with Node.js, Express, and MongoDB.
2. **Frontend**: Single Page Application built with React, Vite, and SCSS.

---

## Table of Contents

- [Setup Instructions](#setup-instructions)

  - [Backend](#backend)
  - [Frontend](#frontend)

- [Database Setup](#database-setup)
- [Sample Data](#sample-data)
- [Notes](#notes)
- [Credentials](#credentials)
- [Insomnia Endpoints](#insomnia-endpoints)

---

## Setup Instructions

### Backend

1. Navigate to the `backend` directory:

   ```bash
   cd backend
   ```

2. Copy the example environment file and edit:

   ```bash
   cp .env.example .env
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   The API will run at `http://localhost:4000`.

### Frontend

1. Navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

2. Copy the example environment file and edit:

   ```bash
   cp .env.example .env
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   The frontend will run at `http://localhost:3000` by default.

---

## Database Setup

- This project uses **MongoDB**. You can use a local MongoDB instance or a cloud provider (e.g., MongoDB Atlas).
- Update the `MONGODB_URI` and `DB_NAME` in `backend/.env` with your connection string and desired database name.
- The application will create required collections and indexes on startup.

---

## Sample Data

You can add sample data via HTTP requests:

1. **Create a Category**:

   ```bash
   curl -X POST http://localhost:4000/api/categories \
     -H "Content-Type: application/json" \
     -d '{"name":"Electronics"}'
   ```

2. **Create an Item** (replace `<category_id>` with the ID returned above):

   ```bash
   curl -X POST http://localhost:4000/api/items \
     -H "Content-Type: application/json" \
     -d '{
       "name":"Laptop",
       "quantity":10,
       "category_id":"<category_id>"
     }'
   ```

---

## Notes

- The backend API exposes endpoints under `/api` and `/auth` (e.g., `/api/categories`, `/api/items`, `/auth/login`, `/auth/register`).
- Authentication is implemented using JWT.
- The default authentication flow does **not** include a pre-seeded admin user. You'll need to register a user and elevate their role via the `/api/auth/change-role` endpoint.
- CORS is configured to allow requests from the frontend development server using `ALLOWED_DOMAIN` from environment variables.

---

## Credentials

### Backend (`backend/.env.example`)

```
PORT=4000
NODE_ENV=LOCAL
DB_NAME=STOCK_DB
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
ALLOWED_DOMAIN=https://yourdomain.com
```

### Frontend (`frontend/.env.example`)

```
VITE_API_URL=http://localhost:4000
```

---

## Insomnia Endpoints

A ready-to-import Insomnia collection is provided in the file `Insomnia_endpoints.yaml`. This file includes all configured backend endpoints (Auth, Categories, Items).

To import:

1. Open Insomnia.
2. Go to **File → Import → From File**.
3. Select `Insomnia_endpoints.yaml`.

---
