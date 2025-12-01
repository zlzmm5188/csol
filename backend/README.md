# CSOL Backend Service

A Node.js backend service with Express.js for the CSOL/Providence platform, providing RESTful APIs for user management, investment products, orders, and VIP levels.

## 🚀 Features

- **RESTful API Architecture** - Clean and extensible API design
- **JWT Authentication** - Secure token-based authentication
- **Prisma ORM** - Type-safe database access with MySQL support
- **CORS Support** - Configurable cross-origin resource sharing
- **Error Handling** - Centralized error handling with standardized responses

## 📋 Prerequisites

- Node.js 18.x or higher
- MySQL 8.x database server
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone and Navigate to Backend

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/csol_db"

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:8080
```

### 4. Initialize Database

Generate Prisma client and apply migrations:

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations (development)
npm run prisma:migrate
```

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3000`.

## 📖 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Response Format

All API responses follow this standard format:

```json
{
  "code": 1,        // 1 = success, 0 = error
  "msg": "Success",
  "data": {},       // Response data
  "timestamp": 1234567890
}
```

### Authentication

Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication APIs

### Register User

```http
POST /api/user/register
```

**Request Body:**
```json
{
  "phone": "13800138000",
  "password": "password123",
  "inviteCode": "ABC12345"  // optional
}
```

**Response:**
```json
{
  "code": 1,
  "msg": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "uid": "U1234567",
      "phone": "13800138000",
      "inviteCode": "XYZ98765"
    }
  }
}
```

### Login

```http
POST /api/user/login
```

**Request Body:**
```json
{
  "phone": "13800138000",
  "password": "password123"
}
```

---

## 👤 User APIs

### Get Current User Info

```http
GET /api/user/info
```
*Requires Authentication*

### Get User Balance

```http
GET /api/user/balance
```
*Requires Authentication*

**Response:**
```json
{
  "code": 1,
  "msg": "Success",
  "data": {
    "balance": 10000.00,
    "totalRecharge": 15000.00,
    "totalWithdraw": 5000.00
  }
}
```

### Update User Profile

```http
PUT /api/user/profile
```
*Requires Authentication*

**Request Body:**
```json
{
  "username": "John Doe",
  "email": "john@example.com",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Get All Users (Admin)

```http
GET /api/users?page=1&pageSize=20
```
*Requires Authentication*

### Get User by ID

```http
GET /api/users/:id
```
*Requires Authentication*

### Delete User (Admin)

```http
DELETE /api/users/:id
```
*Requires Authentication*

---

## 📦 Product APIs

### Get All Products

```http
GET /api/products?page=1&pageSize=20&category=ipo&status=open
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)
- `category` - Filter by category (ipo, bond, fund, convertible)
- `status` - Filter by status (open, close, finish)

### Get Product by ID

```http
GET /api/products/:id
```

### Create Product (Admin)

```http
POST /api/products
```
*Requires Authentication*

**Request Body:**
```json
{
  "title": "High Yield Bond Fund",
  "subtitle": "Safe and stable returns",
  "category": "bond",
  "baseAPR": 9.2,
  "cycleDays": 30,
  "minInvest": 1000,
  "totalAmount": 1000000
}
```

### Update Product (Admin)

```http
PUT /api/products/:id
```
*Requires Authentication*

### Delete Product (Admin)

```http
DELETE /api/products/:id
```
*Requires Authentication*

---

## 📋 Order APIs

### Get My Orders

```http
GET /api/orders/my?page=1&pageSize=20&status=active
```
*Requires Authentication*

**Query Parameters:**
- `page` - Page number
- `pageSize` - Items per page
- `status` - Filter by status (active, finished, cancelled)

### Get Order by ID

```http
GET /api/orders/:id
```
*Requires Authentication*

### Create Order (Invest)

```http
POST /api/orders
```
*Requires Authentication*

**Request Body:**
```json
{
  "productId": 1,
  "amount": 10000
}
```

### Get All Orders (Admin)

```http
GET /api/orders/all?page=1&pageSize=20&status=active&userId=1
```
*Requires Authentication*

---

## 🏆 VIP APIs

### Get VIP Configuration

```http
GET /api/vip/config
```

Returns all VIP levels and their benefits.

### Get VIP Levels

```http
GET /api/vip/levels
```

### Get VIP Level by Level Number

```http
GET /api/vip/levels/:level
```

### Get User VIP Progress

```http
GET /api/vip/progress
```
*Requires Authentication*

**Response:**
```json
{
  "code": 1,
  "msg": "Success",
  "data": {
    "currentLevel": 2,
    "currentVip": {
      "level": 2,
      "name": "VIP2",
      "interestAdd": 0.5
    },
    "nextVip": {
      "level": 3,
      "name": "VIP3",
      "investAmount": 50000
    },
    "totalInvested": 35000,
    "progressToNext": {
      "required": 50000,
      "current": 35000,
      "remaining": 15000
    }
  }
}
```

### Create VIP Level (Admin)

```http
POST /api/vip/levels
```
*Requires Authentication*

### Update VIP Level (Admin)

```http
PUT /api/vip/levels/:level
```
*Requires Authentication*

### Delete VIP Level (Admin)

```http
DELETE /api/vip/levels/:level
```
*Requires Authentication*

---

## 🔧 Development

### Running Linter

```bash
npm run lint
```

### Database Management

```bash
# Open Prisma Studio (GUI for database)
npm run prisma:studio

# Generate Prisma client after schema changes
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate
```

### Health Check

```http
GET /health
```

Returns server status and environment info.

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.js          # Application configuration
│   │   └── database.js       # Prisma client instance
│   ├── controllers/
│   │   ├── userController.js     # User business logic
│   │   ├── productController.js  # Product business logic
│   │   ├── orderController.js    # Order business logic
│   │   └── vipController.js      # VIP business logic
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── routes/
│   │   ├── userRoutes.js     # User API routes
│   │   ├── productRoutes.js  # Product API routes
│   │   ├── orderRoutes.js    # Order API routes
│   │   └── vipRoutes.js      # VIP API routes
│   ├── utils/
│   │   └── response.js       # Response helpers
│   └── server.js             # Application entry point
├── prisma/
│   └── schema.prisma         # Database schema
├── .env.example              # Environment template
├── .gitignore
├── eslint.config.js
├── package.json
└── README.md
```

---

## 🔐 Security Notes

1. **Change JWT_SECRET** in production - Use a strong, random secret
2. **Configure CORS properly** - Limit origins in production
3. **Use HTTPS** in production
4. **Implement rate limiting** for production deployment
5. **Add input validation** as needed for your use case

---

## 📜 License

MIT License
