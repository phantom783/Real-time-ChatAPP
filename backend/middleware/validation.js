// Input Validation Middleware

const validateSignUp = (req, res, next) => {
  const { username, name, email, password } = req.body;
  const user = username || name;

  // Check required fields
  if (!user || !email || !password) {
    return res.status(400).json({ message: "Username/name, email, and password are required" });
  }

  // Validate username/name length
  if (typeof user === "string" && user.trim().length < 3) {
    return res.status(400).json({ message: "Username must be at least 3 characters" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ message: "Password must contain at least one uppercase letter and one number" });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Check required fields
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  next();
};

const validateMessage = (req, res, next) => {
  const { senderUserId, receiverUserIdOrRoomId, messageContent, messageType } = req.body;

  // Check required fields
  if (!senderUserId || !receiverUserIdOrRoomId || !messageContent) {
    return res.status(400).json({ message: "Sender ID, receiver/room ID, and message content are required" });
  }

  // Validate message content
  if (typeof messageContent !== "string" || messageContent.trim().length === 0) {
    return res.status(400).json({ message: "Message content cannot be empty" });
  }

  if (messageContent.length > 5000) {
    return res.status(400).json({ message: "Message content cannot exceed 5000 characters" });
  }

  // Validate message type
  const validTypes = ["text", "image", "file"];
  if (messageType && !validTypes.includes(messageType)) {
    return res.status(400).json({ message: "Invalid message type. Must be: text, image, or file" });
  }

  next();
};

const validateChatRoom = (req, res, next) => {
  const { roomName, createdBy } = req.body;

  // Check required fields
  if (!roomName || !createdBy) {
    return res.status(400).json({ message: "Room name and creator ID are required" });
  }

  // Validate room name
  if (typeof roomName !== "string" || roomName.trim().length === 0) {
    return res.status(400).json({ message: "Room name cannot be empty" });
  }

  if (roomName.length > 100) {
    return res.status(400).json({ message: "Room name cannot exceed 100 characters" });
  }

  next();
};

module.exports = {
  validateSignUp,
  validateLogin,
  validateMessage,
  validateChatRoom
};
