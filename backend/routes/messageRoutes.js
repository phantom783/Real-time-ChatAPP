const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

function normalizeReactions(reactions) {
  return reactions.map((reaction) => ({
    user: reaction.user?._id?.toString?.() || reaction.user?.toString?.() || "",
    emoji: reaction.emoji,
  }));
}

function getMessageRooms(message) {
  const senderId = message.senderUserId?._id?.toString?.() || message.senderUserId?.toString?.();
  const targetId = message.receiverUserIdOrRoomId?.toString?.();
  const rooms = new Set();

  if (senderId) {
    rooms.add(`user:${senderId}`);
  }

  if (targetId) {
    rooms.add(`user:${targetId}`);
    rooms.add(`room:${targetId}`);
    rooms.add(`conversation:${targetId}`);

    if (senderId) {
      rooms.add(`dm:${[senderId, targetId].sort().join(":")}`);
    }
  }

  return Array.from(rooms);
}

function emitToRooms(io, rooms, eventName, payload) {
  if (!io || !Array.isArray(rooms) || rooms.length === 0 || !eventName) {
    return;
  }

  let emitter = io;
  rooms.forEach((room) => {
    emitter = emitter.to(room);
  });

  emitter.emit(eventName, payload);
}

function emitReactionUpdate(io, message, action) {
  if (!io) {
    return;
  }

  const payload = {
    messageId: message._id.toString(),
    reactions: normalizeReactions(message.reactions || []),
    action,
  };

  emitToRooms(io, getMessageRooms(message), "message:reaction_updated", payload);
}

function emitNewMessage(io, message) {
  if (!io) {
    return;
  }

  emitToRooms(io, getMessageRooms(message), "message:new", {
    data: message,
  });
}

// Send a message
router.post("/send", async (req, res) => {
  try {
    const {
      senderUserId,
      receiverUserIdOrRoomId,
      messageContent,
      messageType,
      isEncrypted,
      encryptionMethod,
    } = req.body;

    if (!senderUserId || !receiverUserIdOrRoomId || !messageContent) {
      return res.status(400).json({ message: "All fields required" });
    }

    const newMessage = new Message({
      senderUserId,
      receiverUserIdOrRoomId,
      messageContent,
      messageType: messageType || "text",
      readStatus: false,
      isEncrypted: isEncrypted !== undefined ? isEncrypted : true,
      encryptionMethod: encryptionMethod || "AES",
      reactions: [],
    });

    await newMessage.save();
    await newMessage.populate("senderUserId", "username email");

    const io = req.app.get("io");
    emitNewMessage(io, newMessage);

    res.json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all messages between two users
router.get("/between/:userId1/:userId2", async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderUserId: req.params.userId1, receiverUserIdOrRoomId: req.params.userId2 },
        { senderUserId: req.params.userId2, receiverUserIdOrRoomId: req.params.userId1 },
      ],
    })
      .populate("senderUserId", "username email")
      .populate("reactions.user", "username")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages by room or receiver identifier
router.get("/:receiverId", async (req, res) => {
  try {
    const messages = await Message.find({ receiverUserIdOrRoomId: req.params.receiverId })
      .populate("senderUserId", "username email")
      .populate("reactions.user", "username")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add/change/remove reaction (toggle if same emoji)
router.put("/:messageId/reactions", async (req, res) => {
  try {
    const { userId, emoji } = req.body;

    if (!userId || !emoji) {
      return res.status(400).json({ message: "userId and emoji are required" });
    }

    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const existingIndex = message.reactions.findIndex(
      (reaction) => reaction.user.toString() === userId,
    );

    let action = "added";

    if (existingIndex >= 0) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
        action = "removed";
      } else {
        message.reactions[existingIndex].emoji = emoji;
        action = "changed";
      }
    } else {
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();
    await message.populate("senderUserId", "username email");
    await message.populate("reactions.user", "username");

    const io = req.app.get("io");
    emitReactionUpdate(io, message, action);

    res.json({ message: "Reaction updated", action, data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Explicitly remove reaction by user
router.delete("/:messageId/reactions", async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const originalLength = message.reactions.length;
    message.reactions = message.reactions.filter((reaction) => reaction.user.toString() !== userId);

    if (message.reactions.length === originalLength) {
      return res.status(404).json({ message: "Reaction not found for this user" });
    }

    await message.save();
    await message.populate("senderUserId", "username email");
    await message.populate("reactions.user", "username");

    const io = req.app.get("io");
    emitReactionUpdate(io, message, "removed");

    res.json({ message: "Reaction removed", data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read
router.put("/:messageId/read", async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { readStatus: true },
      { new: true },
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({ message: "Message marked as read", data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
