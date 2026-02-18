# Chat Application - Deployment Guide

A full-stack chat application with friend requests, direct messaging, chat rooms, and end-to-end encryption.

## 📋 Features

- ✅ User authentication (Sign up, Login, Logout)
- ✅ Friend requests system (Send, Accept, Reject, Cancel)
- ✅ Direct messaging between users
- ✅ Chat rooms with multiple members
- ✅ End-to-end encryption for messages
- ✅ Online/Offline status tracking
- ✅ Real-time features with auto-refresh
- ✅ Dark/Light theme support

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v14+ and **npm** v6+
- **MongoDB** (local or cloud-hosted)
- **Git**

### Installation

#### 1. Clone the repository

```bash
git clone <your-repo-url>
cd my-react-app
```

#### 2. Setup Environment Variables

**Frontend:**
```bash
cp .env.example .env.local
```

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edit both `.env.local` and `backend/.env` with your configuration.

#### 3. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

#### 4. Start Development Servers

**Terminal 1 - Backend (from `my-react-app`):**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend (from `my-react-app`):**
```bash
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend: `http://localhost:5000` (API server)

---

## 🏗️ Project Structure

```
my-react-app/
├── src/                          # React Frontend
│   ├── components/               # React components
│   │   ├── Login.jsx
│   │   ├── Sign-up.jsx
│   │   └── FriendRequests.jsx
│   ├── chat/                     # Chat page and styles
│   │   ├── chatpage.jsx
│   │   └── chatpage.css
│   ├── utils/                    # Utility functions
│   │   ├── encryption.js         # E2E Encryption
│   │   └── ...
│   ├── App.jsx                   # Main app component
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
│
├── backend/                      # Express Backend
│   ├── routes/                   # API routes
│   │   ├── userRoutes.js         # User & friend requests
│   │   ├── chatRoomRoutes.js
│   │   └── messageRoutes.js
│   ├── controllers/              # Business logic
│   ├── models/                   # MongoDB schemas
│   │   ├── User.js
│   │   ├── ChatRoom.js
│   │   └── Message.js
│   ├── middleware/               # Custom middleware
│   │   ├── auth.js
│   │   └── validation.js
│   ├── server.js                 # Express server
│   ├── package.json
│   └── .env.example
│
├── public/                       # Static assets
├── dist/                         # Built frontend (generated)
├── package.json
├── vite.config.js                # Vite configuration
├── .env.example
├── .gitignore
├── index.html
└── README.md

```

---

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
MONGO_URI=mongodb://localhost:27017/signupDB
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Frontend Environment Variables

Create `.env.local`:

```env
VITE_API_URL=http://localhost:5000
VITE_ENVIRONMENT=development
```

---

## 🔐 Database Setup

### Using MongoDB Locally

**Install MongoDB Community Edition:**
- Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
- macOS: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-macos/
- Linux: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/

**Start MongoDB:**
```bash
mongod
```

### Using MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGO_URI` in `backend/.env`

---

## 📦 Building for Production

### Frontend Build

```bash
npm run build
```

This creates optimized files in `dist/` directory.

### Backend Production Setup

```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

---

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

**1. Create `docker-compose.yml` in project root:**

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGO_URI: mongodb://admin:password@mongodb:27017/signupDB
      JWT_SECRET: ${JWT_SECRET:-your-secret-key}
      CORS_ORIGIN: http://localhost:3000,http://localhost
    depends_on:
      - mongodb

  frontend:
    build: .
    ports:
      - "3000:3000"
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:5000
    depends_on:
      - backend

volumes:
  mongodb_data:
```

**2. Create `Dockerfile` (Frontend) in project root:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

**3. Create `backend/Dockerfile`:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**4. Run with Docker Compose:**

```bash
docker-compose up -d
```

Access the app at `http://localhost:3000`

---

## 🚀 Deployment to Cloud

### Heroku Deployment

**Backend:**
```bash
cd backend
heroku create your-app-name-api
heroku config:set MONGO_URI=your_mongo_uri
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

**Frontend:**
Update `VITE_API_URL` to your Heroku backend URL

```bash
npm run build
heroku create your-app-name
git push heroku main
```

### AWS Deployment

1. **EC2 Instance Setup:**
   - Launch Ubuntu 20.04+ instance
   - Install Node.js and MongoDB
   - Clone repository

2. **Install PM2 for process management:**
   ```bash
   npm install -g pm2
   ```

3. **Start services:**
   ```bash
   # Backend
   cd backend
   pm2 start server.js --name "chat-backend"
   
   # Frontend (from root)
   npm run build
   pm2 serve dist 3000 --spa
   ```

4. **Setup Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location /api {
           proxy_pass http://localhost:5000;
       }

       location / {
           proxy_pass http://localhost:3000;
       }
   }
   ```

---

## 🧪 Testing

### API Testing

```bash
cd backend
npm test
```

Or use Postman/Insomnia with provided test endpoints.

### Frontend Testing

```bash
npm run lint
```

---

## 📚 API Endpoints

### Authentication
- `POST /api/users/sign-up` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/:userId/logout` - User logout

### Friend Requests
- `POST /api/users/:userId/follow-request/:targetId` - Send request
- `POST /api/users/:userId/accept-follow/:requesterId` - Accept request
- `POST /api/users/:userId/reject-follow/:requesterId` - Reject request
- `GET /api/users/:userId/follow-requests` - Get received requests
- `GET /api/users/:userId/sent-follow-requests` - Get sent requests

### Chat Rooms
- `GET /api/chatrooms` - Get all rooms
- `POST /api/chatrooms` - Create room
- `POST /api/chatrooms/:roomId/add-member/:userId` - Add member
- `DELETE /api/chatrooms/:roomId` - Delete room

### Messages
- `GET /api/messages/:roomId` - Get room messages
- `GET /api/messages/between/:userId1/:userId2` - Get direct messages
- `POST /api/messages/send` - Send message

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Update `JWT_SECRET` with a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL certificate
- [ ] Update `CORS_ORIGIN` to your domain only
- [ ] Use environment variables for all secrets
- [ ] Setup MongoDB authentication
- [ ] Enable rate limiting on API
- [ ] Setup firewall rules
- [ ] Regular database backups
- [ ] Monitor logs and errors

---

## 🐛 Troubleshooting

### MongoDB connection fails
```bash
# Check if MongoDB is running
mongosh  # or mongo

# Verify connection string in .env
```

### CORS errors
- Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL
- Check browser console for exact error

### Port already in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Build fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📖 Documentation

- [Frontend Encryption](./ENCRYPTION_DEBUGGING.js)
- [Friend Request System](./FRIEND_REQUEST_SYSTEM.md)
- [Express Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)

---

## 📝 License

ISC License

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review existing GitHub issues
3. Create a new issue with detailed description

---

## 🚢 Deployment Checklist

- [ ] All environment variables configured
- [ ] Database is set up and connected
- [ ] Frontend builds successfully
- [ ] Backend starts without errors
- [ ] All API endpoints tested
- [ ] Security variables updated
- [ ] CORS properly configured
- [ ] SSL certificates installed (if HTTPS)
- [ ] Logging configured
- [ ] Backup strategy in place
- [ ] Monitoring setup
- [ ] Deployment documentation updated

---

**Last Updated:** February 2026
**Version:** 1.0.0
