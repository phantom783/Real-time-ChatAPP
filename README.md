# Chat Application

A modern, full-stack chat application with friend requests, direct messaging, chat rooms, and end-to-end encryption.

## 🎯 Quick Links

- [📦 Getting Started](#-getting-started)
- [📚 Features](#-features)
- [🚀 Deployment Guide](./DEPLOYMENT.md)
- [✅ Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [🔐 Encryption Guide](./ENCRYPTION_DEBUGGING.js)
- [👥 Friend Requests](./FRIEND_REQUEST_SYSTEM.md)

---

## 🎨 Features

### Core Features
- ✅ **User Authentication** - Secure sign-up and login with JWT
- ✅ **Direct Messaging** - Real-time messaging between users
- ✅ **Chat Rooms** - Group chat with multiple members
- ✅ **Friend Requests** - Send, accept, reject, and cancel friend requests
- ✅ **Online Status** - Real-time online/offline status
- ✅ **Dark/Light Theme** - Theme toggle support

### Security Features
- ✅ **End-to-End Encryption** - Messages encrypted with AES
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Password Hashing** - bcryptjs for secure password storage
- ✅ **CORS Protection** - Restricted cross-origin access

### Advanced Features
- ✅ **Auto-refresh** - Real-time message fetching
- ✅ **Typing Indicators** - See when users are typing
- ✅ **Message Status** - Read/unread status tracking
- ✅ **User Profiles** - View user information
- ✅ **Room Management** - Create, edit, delete chat rooms

---

## 🚀 Getting Started

### Prerequisites

- Node.js v14+ and npm v6+
- MongoDB (local or Atlas)
- Git

### Installation (5 minutes)

#### Windows
```bash
# Run setup script
setup.bat

# Then follow the prompts
```

#### macOS/Linux
```bash
# Make script executable
chmod +x setup.sh

# Run setup script
./setup.sh
```

#### Manual Setup
```bash
# Frontend setup
npm install

# Backend setup
cd backend
npm install
cd ..

# Create environment files
cp .env.example .env.local
cp backend/.env.example backend/.env

# Update configuration in both .env files
```

### Running Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:5000 (API)

---

## 📁 Project Structure

```
my-react-app/
├── src/                          # React Frontend
│   ├── components/               # React components
│   │   ├── Login.jsx            # Login page
│   │   ├── Sign-up.jsx          # Sign-up page
│   │   ├── FriendRequests.jsx   # Friend requests component
│   │   └── FriendRequests.css
│   ├── chat/                     # Chat interface
│   │   ├── chatpage.jsx
│   │   └── chatpage.css
│   ├── utils/                    # Utility functions
│   │   └── encryption.js        # E2E Encryption utilities
│   ├── App.jsx                   # Main app component
│   └── main.jsx                  # Entry point
│
├── backend/                      # Express Backend
│   ├── routes/                   # API routes
│   │   ├── userRoutes.js        # User & friend requests
│   │   ├── chatRoomRoutes.js    # Chat room endpoints
│   │   └── messageRoutes.js     # Message endpoints
│   ├── controllers/              # Business logic (optional)
│   ├── models/                   # MongoDB schemas
│   │   ├── User.js
│   │   ├── ChatRoom.js
│   │   └── Message.js
│   ├── middleware/               # Custom middleware
│   │   ├── auth.js              # JWT authentication
│   │   └── validation.js        # Input validation
│   ├── server.js                # Express server
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── public/                       # Static assets
├── docker-compose.yml            # Docker container orchestration
├── Dockerfile                    # Frontend Docker image
├── vite.config.js                # Vite configuration
├── package.json                  # Frontend dependencies
├── DEPLOYMENT.md                 # Full deployment guide
├── DEPLOYMENT_CHECKLIST.md       # Pre-deployment checklist
├── .env.example                  # Example environment variables
├── setup.sh                      # Linux/macOS setup script
├── setup.bat                     # Windows setup script
└── README.md                     # This file
```

---

## 🔧 Configuration

### Backend Environment Variables (backend/.env)

```env
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
MONGO_URI=mongodb://localhost:27017/signupDB
JWT_SECRET=your-secret-key-min-32-characters
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Frontend Environment Variables (.env.local)

```env
VITE_API_URL=http://localhost:5000
VITE_ENVIRONMENT=development
```

---

## 📦 Building for Production

### Frontend Build
```bash
npm run build
```
Output: `dist/` directory

### Backend Production
```bash
cd backend
NODE_ENV=production npm start
```

---

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017

---

## 📚 API Endpoints

### Authentication
- `POST /api/users/sign-up` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/:userId/logout` - User logout

### Friend Requests
- `POST /api/users/:userId/follow-request/:targetId` - Send friend request
- `POST /api/users/:userId/accept-follow/:requesterId` - Accept request
- `POST /api/users/:userId/reject-follow/:requesterId` - Reject request
- `GET /api/users/:userId/follow-requests` - Get received requests
- `GET /api/users/:userId/sent-follow-requests` - Get sent requests

### Chat Rooms
- `GET /api/chatrooms` - Get all chat rooms
- `POST /api/chatrooms` - Create new room
- `POST /api/chatrooms/:roomId/add-member/:userId` - Add member to room
- `DELETE /api/chatrooms/:roomId` - Delete chat room

### Messages
- `GET /api/messages/:roomId` - Get room messages
- `GET /api/messages/between/:userId1/:userId2` - Get DM messages
- `POST /api/messages/send` - Send message

---

## 🔒 Security Features

- JWT Token-based authentication
- Password hashing with bcryptjs
- End-to-end message encryption (AES)
- CORS protection
- Environment variable secrets
- MongoDB authentication
- Input validation

---

## 🧪 Testing

### Lint Check
```bash
npm run lint
```

### Manual Testing
Use the included test files:
- `test_login.js` - Test login functionality
- `test_signup.js` - Test sign-up
- `test_follow_endpoints.js` - Test friend requests
- `test_integration_e2e.js` - End-to-end testing

---

## 📖 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[FRIEND_REQUEST_SYSTEM.md](./FRIEND_REQUEST_SYSTEM.md)** - Friend requests documentation
- **[ENCRYPTION_DEBUGGING.js](./ENCRYPTION_DEBUGGING.js)** - Encryption guide
- **[FOLLOW_ENDPOINTS.md](./FOLLOW_ENDPOINTS.md)** - API endpoint guide

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh  # or mongo

# Update MONGO_URI in backend/.env
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### CORS Errors
- Check `CORS_ORIGIN` in backend/.env
- Ensure it matches your frontend URL
- Restart backend after changes

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 💾 Database

### MongoDB Setup

**Local Installation:**
- Download from https://www.mongodb.com/try/download/community
- Follow installation guide
- Start: `mongod`

**MongoDB Atlas (Cloud):**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update `MONGO_URI` in backend/.env

**Database seeding:**
```bash
# Automatic on first connection
# Create users through sign-up endpoint
```

---

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Option 2: Heroku
See [DEPLOYMENT.md](./DEPLOYMENT.md#heroku-deployment)

### Option 3: AWS/Google Cloud/Azure
See [DEPLOYMENT.md](./DEPLOYMENT.md#aws-deployment)

### Option 4: Manual Installation
See [DEPLOYMENT.md](./DEPLOYMENT.md#manual-installation)

---

## 📊 Performance

- Frontend bundle size: < 1MB (optimized)
- API response time: < 100ms
- Database queries optimized with indexes
- Compression enabled
- Caching headers configured

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Test thoroughly
4. Commit: `git commit -m 'Add feature'`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

---

## 📄 License

ISC License

---

## 🆘 Support & Questions

### Getting Help
1. Check [troubleshooting](#-troubleshooting) section
2. Review documentation files
3. Check GitHub issues
4. Create new issue with details

### Reporting Bugs
Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/Node version
- Relevant code/logs

---

## 🎯 Roadmap

Future features planned:
- [ ] Voice/Video calling
- [ ] Message reactions
- [ ] Message search
- [ ] User blocking
- [ ] Message pin/star
- [ ] Channel notifications
- [ ] Mobile app
- [ ] Message reactions/emojis

---

## 📊 Tech Stack

**Frontend:**
- React 19.2
- Vite 7.2
- Axios
- CryptoJS

**Backend:**
- Express.js
- MongoDB & Mongoose
- JWT Authentication
- bcryptjs

**DevOps:**
- Docker & Docker Compose
- nginx (optional)

---

## 📞 Contact

- GitHub: [repository-url]
- Email: support@chatapp.com

---

**Last Updated:** February 6, 2026  
**Version:** 1.0.0  
**Maintainer:** Development Team
