# SplitMates Backend API

Complete Node.js / Express / PostgreSQL / Prisma ORM backend designed specifically for the SplitMates shared expense application.

---

## 🛠️ Tech Stack & Dependencies

* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js
* **Database**: PostgreSQL
* **ORM**: Prisma ORM
* **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
* **Validation**: `zod`
* **Security**: `helmet`, `cors`, `express-rate-limit`

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/splitmates_db?schema=public
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
```

---

## 🚀 Setup & Execution Instructions

### 1. Install Backend Dependencies
```bash
cd d:\SplitMates\backend
npm install
```

### 2. Configure Database & Run Prisma Migrations
Ensure PostgreSQL is running locally, then execute:
```bash
npx prisma generate
npx prisma db push
```

### 3. Seed Initial Demo Data (Optional)
```bash
npm run prisma:seed
```

### 4. Start the Backend Server
```bash
npm run dev
# or: npm start
```

The backend server will run at:
* **Server Base URL**: `http://localhost:5000`
* **API Base URL**: `http://localhost:5000/api`

---

## 📡 API Routes Summary

* **Auth**:
  * `POST /api/auth/register`
  * `POST /api/auth/login`
  * `GET /api/auth/me`
* **Groups**:
  * `GET /api/groups`
  * `POST /api/groups`
  * `POST /api/groups/join`
  * `GET /api/groups/:id/members`
* **Expenses**:
  * `GET /api/expenses`
  * `POST /api/expenses`
  * `PUT /api/expenses/:id`
  * `DELETE /api/expenses/:id`
  * `GET /api/groups/:groupId/expenses`
* **Cycles**:
  * `GET /api/cycles`
  * `POST /api/groups/:groupId/cycles`
* **Settlements**:
  * `GET /api/settlements/history`
  * `GET /api/groups/:groupId/settlements/history`
  * `POST /api/groups/:groupId/settlements/initiate`
  * `POST /api/groups/:groupId/settlements/confirm`
  * `POST /api/groups/:groupId/settlements/complete`
