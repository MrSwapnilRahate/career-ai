# 🚀 CareerAI — AI-Powered Career Intelligence Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://mongodb.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Pro-4285F4?logo=google)](https://aistudio.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**CareerAI** is a full-stack SaaS platform that helps professionals accelerate their careers with AI-powered tools — from resume analysis and LinkedIn optimization to professional photo generation.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 **AI Resume Analysis** | 15+ ATS criteria evaluation with section-level scores powered by Gemini 2.5 Pro |
| 🎯 **Job Match Scoring** | Compare your resume against any job description with gap analysis |
| 🔗 **LinkedIn Optimizer** | AI-driven profile improvement tips and keyword optimization |
| 📄 **AI Resume Generator** | Generate ATS-optimized resumes from LinkedIn profile data |
| 📸 **Photo Studio** | Generate professional headshots and LinkedIn cover photos |
| 💰 **Subscription System** | Tiered plans (Free / Pro / Enterprise) with usage tracking |
| 📊 **Analysis History** | Track all past analyses and career improvement over time |

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js 18+ with Express 5
- **Database**: MongoDB Atlas (Mongoose ODM)
- **AI Engine**: Google Gemini 2.5 Pro / Flash
- **Queue**: BullMQ + Redis (Upstash)
- **Storage**: Cloudinary (resume file uploads)
- **Auth**: JWT (access + refresh tokens) with bcrypt
- **Payments**: Stripe (subscription billing)

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router v7
- **Design**: Custom CSS with glassmorphic dark theme
- **API Client**: Fetch-based with token auto-refresh

## 📁 Project Structure

```
career-ai/
├── server.js                  # Entry point — server bootstrap
├── src/
│   ├── app.js                 # Express app configuration
│   ├── config/
│   │   ├── environment.js     # Centralized env config
│   │   ├── database.js        # MongoDB connection
│   │   └── redis.js           # Redis/BullMQ connection
│   ├── controllers/           # Request handlers
│   ├── middleware/             # Auth, upload, subscription, errors
│   ├── models/                # Mongoose schemas
│   ├── repositories/          # Data access layer
│   ├── routes/                # API route definitions
│   ├── services/              # Business logic (AI, Stripe, etc.)
│   ├── queues/                # BullMQ queue + worker
│   ├── validation/            # Joi request schemas
│   ├── errors/                # Custom error classes
│   └── utils/                 # Logger, Cloudinary config
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/client.js      # API client with auth
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth context provider
│   │   └── pages/             # Page components
│   └── index.html
├── .env.example               # Environment template
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)
- Google Gemini API key (free)
- Cloudinary account (free)
- Redis — local or Upstash (free)

### 1. Clone & Install

```bash
git clone https://github.com/MrSwapnilRahate/career-ai.git
cd career-ai

# Install backend dependencies
npm install

# Install frontend dependencies
npm run client:install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your credentials in `.env` — see [Environment Variables](#-environment-variables) below.

### 3. Start Development

```bash
# Start both backend and frontend
npm run dev:all

# Or start separately:
npm run dev          # Backend on http://localhost:5001
npm run client:dev   # Frontend on http://localhost:5173
```

### 4. Build for Production

```bash
npm run client:build    # Build React app
npm start               # Start production server
```

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | JWT access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | JWT refresh token signing secret |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUD_API_KEY` | ✅ | Cloudinary API key |
| `CLOUD_API_SECRET` | ✅ | Cloudinary API secret |
| `REDIS_URL` | ⬡ | Redis URL (falls back to sync mode) |
| `STRIPE_SECRET_KEY` | ⬡ | Stripe secret key |
| `PORT` | ⬡ | Server port (default: 5001) |

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/auth/profile` | Get user profile |

### Resume Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload & analyze resume |
| POST | `/api/resume/job-match` | Resume vs job description match |
| GET | `/api/resume/status/:jobId` | Check analysis status |
| GET | `/api/resume/result/:id` | Get analysis result |
| GET | `/api/resume/history` | User's analysis history |

### LinkedIn
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/linkedin/analyze` | Analyze LinkedIn profile |
| POST | `/api/linkedin/generate-resume` | Generate resume from profile |

### Photo Studio
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/images/headshot` | Generate professional headshot |
| POST | `/api/images/cover-photo` | Generate LinkedIn cover photo |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/subscription/checkout` | Create Stripe checkout |
| POST | `/api/subscription/portal` | Customer billing portal |
| POST | `/api/subscription/webhook` | Stripe webhook handler |

## 🧪 Testing

```bash
# Health check
curl http://localhost:5001/health

# API info
curl http://localhost:5001/
```

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by [Swapnil Rahate](https://github.com/MrSwapnilRahate)**
