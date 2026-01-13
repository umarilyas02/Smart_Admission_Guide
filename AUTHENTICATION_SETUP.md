# Authentication API Setup Guide

## Installation
The following packages have been installed:
- `mysql2` - MySQL database driver
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation
- `nodemailer` - Email service
- `dotenv` - Environment variables

## Database Setup

### Step 1: Create a MySQL Database

First, create a MySQL database:

```sql
CREATE DATABASE smart_admission_guide;
USE smart_admission_guide;
```

### Step 2: Run the Schema

Execute the SQL commands from `src/lib/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON users(email);
```

## Environment Variables

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your actual values:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_admission_guide
JWT_SECRET=your_super_secret_key_here
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Endpoints

### 1. Sign Up (Create Account)
**POST** `/api/auth/signup`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

Response (201):
```json
{
  "message": "User created successfully",
  "userId": 1
}
```

### 2. Login
**POST** `/api/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 3. Forgot Password
**POST** `/api/auth/forgot-password`

Request:
```json
{
  "email": "john@example.com"
}
```

Response (200):
```json
{
  "message": "If an account exists with this email, a reset link has been sent"
}
```

### 4. Reset Password
**POST** `/api/auth/reset-password`

Request:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

Response (200):
```json
{
  "message": "Password reset successfully"
}
```

## Hosting MySQL Online

### Option 1: AWS RDS (Recommended for Production)
1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Click "Create database"
3. Choose MySQL engine
4. Configure instance details, database name, username, password
5. Set publicly accessible to Yes (if needed)
6. Get endpoint URL and update `.env.local`:
```
DB_HOST=your-instance.xxxxxxxx.region.rds.amazonaws.com
```

### Option 2: PlanetScale (MySQL Compatible)
1. Go to [PlanetScale](https://planetscale.com/)
2. Create a free account
3. Create a database
4. Click "Connect" and select "Node.js"
5. Copy connection string to `.env.local`:
```
DB_HOST=your-host
DB_USER=your-user
DB_PASSWORD=your-password
```

### Option 3: DigitalOcean Managed Database
1. Create a DigitalOcean account
2. Create a managed MySQL database
3. Configure firewall rules to allow your server
4. Get connection details and update `.env.local`

### Option 4: Heroku with ClearDB (Budget-Friendly)
1. Add ClearDB MySQL add-on to Heroku
2. Get the database URL from Heroku config
3. Parse the URL and add to environment variables

### Option 5: Self-Hosted on VPS
1. Rent a VPS (DigitalOcean, Linode, AWS EC2)
2. Install MySQL on the server
3. Set up remote access
4. Use the server IP/hostname in `.env.local`

## Gmail Setup for Email Sending

If using Gmail:
1. Enable 2-Factor Authentication on your Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Create an "App Password" for Mail/Windows
4. Use this password in `.env.local` as `EMAIL_PASSWORD`

Alternatively, use a service like SendGrid or Mailgun for production.

## Testing the API

### Using cURL:

**Sign Up:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "email":"john@example.com",
    "password":"password123",
    "confirmPassword":"password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"john@example.com",
    "password":"password123"
  }'
```

## Next Steps

1. **Create Frontend Components**: Build signup, login, and password reset forms
2. **Middleware Authentication**: Add middleware to protect routes
3. **Profile Management**: Create user profile endpoints
4. **Email Verification**: Add email verification on signup
5. **Refresh Tokens**: Implement refresh token logic for better security
