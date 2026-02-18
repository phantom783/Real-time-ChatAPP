const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const rawCorsOrigins = process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || "";
const corsOrigins = rawCorsOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  // Use wildcard string, not ["*"] array. In `cors`, ["*"] is treated as
  // a literal allowed origin value and does not match browser origins.
  origin: corsOrigins.length > 0 ? corsOrigins : "*",
  credentials: true,
};

app.use(
  cors(corsOptions),
);
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: corsOptions.credentials,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
  const normalizedUserId = userId ? String(userId) : "";

  const emitToUser = (targetUserId, eventName, payload = {}) => {
    if (!targetUserId || !eventName) {
      return;
    }

    io.to(`user:${String(targetUserId)}`).emit(eventName, payload);
  };

  if (normalizedUserId) {
    socket.join(`user:${normalizedUserId}`);
  }

  socket.on("conversation:join", ({ conversationId }) => {
    if (!conversationId) {
      return;
    }

    socket.join(conversationId);

    if (conversationId.startsWith("room:")) {
      const roomId = conversationId.slice(5);
      socket.join(`conversation:${roomId}`);
      socket.join(`room:${roomId}`);
    }
  });

  socket.on("conversation:leave", ({ conversationId }) => {
    if (!conversationId) {
      return;
    }

    socket.leave(conversationId);

    if (conversationId.startsWith("room:")) {
      const roomId = conversationId.slice(5);
      socket.leave(`conversation:${roomId}`);
      socket.leave(`room:${roomId}`);
    }
  });

  // WebRTC signaling for direct 1:1 calls (audio/video)
  socket.on("call:offer", (payload = {}) => {
    const toUserId = payload?.toUserId ? String(payload.toUserId) : "";
    if (!normalizedUserId || !toUserId || !payload?.offer) {
      return;
    }

    emitToUser(toUserId, "call:offer", {
      fromUserId: normalizedUserId,
      fromUserName: payload?.fromUserName || "",
      callType: payload?.callType === "video" ? "video" : "audio",
      callId: payload?.callId || null,
      offer: payload.offer,
    });
  });

  socket.on("call:answer", (payload = {}) => {
    const toUserId = payload?.toUserId ? String(payload.toUserId) : "";
    if (!normalizedUserId || !toUserId || !payload?.answer) {
      return;
    }

    emitToUser(toUserId, "call:answer", {
      fromUserId: normalizedUserId,
      callId: payload?.callId || null,
      answer: payload.answer,
    });
  });

  socket.on("call:ice-candidate", (payload = {}) => {
    const toUserId = payload?.toUserId ? String(payload.toUserId) : "";
    if (!normalizedUserId || !toUserId || !payload?.candidate) {
      return;
    }

    emitToUser(toUserId, "call:ice-candidate", {
      fromUserId: normalizedUserId,
      callId: payload?.callId || null,
      candidate: payload.candidate,
    });
  });

  socket.on("call:end", (payload = {}) => {
    const toUserId = payload?.toUserId ? String(payload.toUserId) : "";
    if (!normalizedUserId || !toUserId) {
      return;
    }

    emitToUser(toUserId, "call:end", {
      fromUserId: normalizedUserId,
      callId: payload?.callId || null,
      reason: payload?.reason || "ended",
    });
  });

  socket.on("disconnect", () => {
    // no-op; socket.io handles cleanup
  });
});

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/signupDB";
console.log("[MongoDB] Connecting to:", mongoUri);

mongoose
  .connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("[MongoDB] Connected"))
  .catch((error) => console.error("[MongoDB] Failed:", error.message));

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/chatrooms", require("./routes/chatRoomRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

app.get("/", (req, res) => {
  res.json({
    message: "Chat App Backend is running!",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.use((error, req, res, next) => {
  console.error("[ERROR]", error.message);
  res.status(error.status || 500).json({ message: error.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`[Server] Port ${PORT} is already in use.`);
    console.error("[Server] Stop the existing process or change PORT in backend/.env.");
    process.exit(1);
    return;
  }

  console.error("[Server] Failed to start:", error.message);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("Chat App Backend is RUNNING");
  console.log(`Listening on http://localhost:${PORT}`);
  console.log("=".repeat(60) + "\n");
});

process.on("SIGTERM", () => {
  console.log("Shutting down...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  server.close(() => process.exit(0));
});
