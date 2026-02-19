const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ""));
}

function toStringId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  if (typeof value.toString === "function") {
    const serialized = value.toString();
    return serialized === "[object Object]" ? "" : serialized;
  }

  return "";
}

function isRoomMember(room, userId) {
  return (room.members || []).some((member) => toStringId(member) === String(userId));
}

async function populateMessageReferences(message) {
  if (!message || typeof message.populate !== "function") {
    return message;
  }

  await message.populate("senderUserId", "username email");
  await message.populate("reactions.user", "username");
  await message.populate({
    path: "replyTo",
    select: "messageContent senderUserId createdAt receiverUserIdOrRoomId",
  });
  await message.populate("replyTo.senderUserId", "username email");

  return message;
}

async function ensureSendPermissions(senderUserId, receiverUserIdOrRoomId) {
  if (!isValidObjectId(senderUserId) || !isValidObjectId(receiverUserIdOrRoomId)) {
    return { error: { status: 400, message: "Invalid sender or receiver identifier" } };
  }

  const [sender, room] = await Promise.all([
    User.findById(senderUserId).select("_id following"),
    ChatRoom.findById(receiverUserIdOrRoomId).select("_id members"),
  ]);

  if (!sender) {
    return { error: { status: 404, message: "Sender user not found" } };
  }

  if (room) {
    if (!isRoomMember(room, senderUserId)) {
      return { error: { status: 403, message: "Only room members can send messages to this room" } };
    }

    return { context: { type: "room", roomId: room._id.toString() } };
  }

  const receiverUser = await User.findById(receiverUserIdOrRoomId).select("_id");
  if (!receiverUser) {
    return { error: { status: 404, message: "Recipient user not found" } };
  }

  const isFollowingReceiver = (sender.following || []).some(
    (followingUserId) => String(followingUserId) === String(receiverUserIdOrRoomId),
  );

  if (!isFollowingReceiver) {
    return { error: { status: 403, message: "Follow this user first to send direct messages" } };
  }

  return { context: { type: "dm", receiverUserId: receiverUser._id.toString() } };
}

async function ensureReplyMessageInConversation(replyToMessageId, context, senderUserId, receiverUserIdOrRoomId) {
  if (!replyToMessageId) {
    return { replyToMessageId: null };
  }

  if (!isValidObjectId(replyToMessageId)) {
    return { error: { status: 400, message: "Invalid replyToMessageId" } };
  }

  const replyMessage = await Message.findById(replyToMessageId).select(
    "_id senderUserId receiverUserIdOrRoomId",
  );

  if (!replyMessage) {
    return { error: { status: 404, message: "Reply target message not found" } };
  }

  if (context.type === "room") {
    const isSameRoom = String(replyMessage.receiverUserIdOrRoomId) === String(receiverUserIdOrRoomId);
    if (!isSameRoom) {
      return { error: { status: 400, message: "Reply message must belong to the same room" } };
    }

    return { replyToMessageId: replyMessage._id };
  }

  const senderId = String(senderUserId);
  const receiverId = String(receiverUserIdOrRoomId);
  const replySenderId = toStringId(replyMessage.senderUserId);
  const replyReceiverId = toStringId(replyMessage.receiverUserIdOrRoomId);
  const isSameDirectConversation =
    (replySenderId === senderId && replyReceiverId === receiverId) ||
    (replySenderId === receiverId && replyReceiverId === senderId);

  if (!isSameDirectConversation) {
    return { error: { status: 400, message: "Reply message must belong to the same conversation" } };
  }

  return { replyToMessageId: replyMessage._id };
}

async function resolveConversationContext(actorUserId, receiverUserIdOrRoomId) {
  if (!isValidObjectId(actorUserId) || !isValidObjectId(receiverUserIdOrRoomId)) {
    return { error: { status: 400, message: "Invalid actor or conversation identifier" } };
  }

  const [actorUser, room] = await Promise.all([
    User.findById(actorUserId).select("_id"),
    ChatRoom.findById(receiverUserIdOrRoomId).select("_id createdBy members"),
  ]);

  if (!actorUser) {
    return { error: { status: 404, message: "Actor user not found" } };
  }

  if (room) {
    const actorIsMember = isRoomMember(room, actorUserId);
    if (!actorIsMember) {
      return { error: { status: 403, message: "Only room members can manage room messages" } };
    }

    return {
      context: {
        type: "room",
        actorUserId: String(actorUser._id),
        roomId: String(room._id),
        roomCreatedBy: toStringId(room.createdBy),
        roomMemberIds: (room.members || []).map((member) => toStringId(member)).filter(Boolean),
      },
    };
  }

  const peerUser = await User.findById(receiverUserIdOrRoomId).select("_id");
  if (!peerUser) {
    return { error: { status: 404, message: "Conversation target not found" } };
  }

  return {
    context: {
      type: "dm",
      actorUserId: String(actorUser._id),
      peerUserId: String(peerUser._id),
    },
  };
}

function canActorDeleteMessage({ message, actorUserId, conversationContext }) {
  const actorId = String(actorUserId || "");
  const senderId = toStringId(message?.senderUserId);
  const receiverId = toStringId(message?.receiverUserIdOrRoomId);

  if (!actorId || !senderId || !conversationContext) {
    return false;
  }

  if (conversationContext.type === "room") {
    const roomCreatorId = String(conversationContext.roomCreatedBy || "");
    return senderId === actorId || roomCreatorId === actorId;
  }

  return senderId === actorId || receiverId === actorId;
}

function normalizeReactions(reactions) {
  return reactions.map((reaction) => ({
    user: reaction.user?._id?.toString?.() || reaction.user?.toString?.() || "",
    emoji: reaction.emoji,
  }));
}

function getMessageRooms(message) {
  const senderId = toStringId(message.senderUserId);
  const targetId = toStringId(message.receiverUserIdOrRoomId);
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

function getConversationRooms({
  type,
  actorUserId,
  peerUserId,
  roomId,
  roomMemberIds = [],
}) {
  const rooms = new Set();

  if (type === "dm") {
    const actorId = String(actorUserId || "");
    const targetId = String(peerUserId || "");

    if (actorId) {
      rooms.add(`user:${actorId}`);
    }

    if (targetId) {
      rooms.add(`user:${targetId}`);
    }

    if (actorId && targetId) {
      rooms.add(`dm:${[actorId, targetId].sort().join(":")}`);
    }

    return Array.from(rooms);
  }

  const normalizedRoomId = String(roomId || "");
  if (normalizedRoomId) {
    rooms.add(`room:${normalizedRoomId}`);
    rooms.add(`conversation:${normalizedRoomId}`);
  }

  (roomMemberIds || []).forEach((memberId) => {
    const normalizedMemberId = String(memberId || "");
    if (normalizedMemberId) {
      rooms.add(`user:${normalizedMemberId}`);
    }
  });

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

function emitMessageDeleted(io, message, actorUserId) {
  if (!io || !message?._id) {
    return;
  }

  emitToRooms(io, getMessageRooms(message), "message:deleted", {
    messageId: message._id.toString(),
    receiverUserIdOrRoomId: toStringId(message.receiverUserIdOrRoomId),
    actorUserId: String(actorUserId || ""),
  });
}

function emitConversationCleared(io, context, payload) {
  if (!io || !context) {
    return;
  }

  const rooms = getConversationRooms(context);
  emitToRooms(io, rooms, "conversation:cleared", payload);
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
      replyToMessageId,
      replyTo,
    } = req.body;

    if (!senderUserId || !receiverUserIdOrRoomId || !messageContent) {
      return res.status(400).json({ message: "All fields required" });
    }

    const permissionResult = await ensureSendPermissions(senderUserId, receiverUserIdOrRoomId);
    if (permissionResult.error) {
      return res.status(permissionResult.error.status).json({ message: permissionResult.error.message });
    }

    const requestedReplyMessageId = replyToMessageId || replyTo;
    const replyValidationResult = await ensureReplyMessageInConversation(
      requestedReplyMessageId,
      permissionResult.context,
      senderUserId,
      receiverUserIdOrRoomId,
    );
    if (replyValidationResult.error) {
      return res
        .status(replyValidationResult.error.status)
        .json({ message: replyValidationResult.error.message });
    }

    const normalizedIsEncrypted = Boolean(isEncrypted);
    const requestedEncryptionMethod = String(encryptionMethod || "").trim();
    const allowedEncryptionMethods = new Set(["AES", "RSA", "E2EE-AES-GCM", "none"]);
    const normalizedEncryptionMethod = normalizedIsEncrypted
      ? (allowedEncryptionMethods.has(requestedEncryptionMethod) ? requestedEncryptionMethod : "AES")
      : "none";

    const newMessage = new Message({
      senderUserId,
      receiverUserIdOrRoomId,
      messageContent,
      messageType: messageType || "text",
      readStatus: false,
      isEncrypted: normalizedIsEncrypted,
      encryptionMethod: normalizedEncryptionMethod,
      replyTo: replyValidationResult.replyToMessageId,
      reactions: [],
    });

    await newMessage.save();
    await populateMessageReferences(newMessage);

    const io = req.app.get("io");
    emitNewMessage(io, newMessage);

    res.json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear all messages in a conversation (direct chat or room)
router.delete("/conversation/clear", async (req, res) => {
  try {
    const actorUserId = req.body?.actorUserId || req.query.actorUserId;
    const receiverUserIdOrRoomId =
      req.body?.receiverUserIdOrRoomId || req.query.receiverUserIdOrRoomId;

    if (!actorUserId || !receiverUserIdOrRoomId) {
      return res.status(400).json({ message: "actorUserId and receiverUserIdOrRoomId are required" });
    }

    const contextResult = await resolveConversationContext(actorUserId, receiverUserIdOrRoomId);
    if (contextResult.error) {
      return res.status(contextResult.error.status).json({ message: contextResult.error.message });
    }

    const { context } = contextResult;
    let deleteQuery;

    if (context.type === "room") {
      const roomCreatorId = String(context.roomCreatedBy || "");
      if (roomCreatorId !== String(actorUserId)) {
        return res.status(403).json({ message: "Only room creator can clear room chat" });
      }

      deleteQuery = { receiverUserIdOrRoomId };
    } else {
      deleteQuery = {
        $or: [
          { senderUserId: actorUserId, receiverUserIdOrRoomId },
          { senderUserId: receiverUserIdOrRoomId, receiverUserIdOrRoomId: actorUserId },
        ],
      };
    }

    const deleteResult = await Message.deleteMany(deleteQuery);

    const io = req.app.get("io");
    emitConversationCleared(io, context, {
      receiverUserIdOrRoomId: String(receiverUserIdOrRoomId),
      actorUserId: String(actorUserId),
      deletedCount: deleteResult.deletedCount || 0,
      conversationType: context.type,
    });

    return res.json({
      message: "Conversation cleared successfully",
      deletedCount: deleteResult.deletedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Delete a particular message
router.delete("/:messageId", async (req, res) => {
  try {
    const actorUserId = req.body?.actorUserId || req.query.actorUserId;
    const { messageId } = req.params;

    if (!actorUserId) {
      return res.status(400).json({ message: "actorUserId is required" });
    }

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({ message: "Invalid messageId" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const contextResult = await resolveConversationContext(
      actorUserId,
      message.receiverUserIdOrRoomId,
    );
    if (contextResult.error) {
      return res.status(contextResult.error.status).json({ message: contextResult.error.message });
    }

    const isAllowed = canActorDeleteMessage({
      message,
      actorUserId,
      conversationContext: contextResult.context,
    });

    if (!isAllowed) {
      return res.status(403).json({ message: "You can only delete your own message in this chat" });
    }

    await Message.deleteOne({ _id: messageId });

    const io = req.app.get("io");
    emitMessageDeleted(io, message, actorUserId);

    return res.json({ message: "Message deleted successfully", messageId });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
      .populate({
        path: "replyTo",
        select: "messageContent senderUserId createdAt receiverUserIdOrRoomId",
      })
      .populate("replyTo.senderUserId", "username email")
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
      .populate({
        path: "replyTo",
        select: "messageContent senderUserId createdAt receiverUserIdOrRoomId",
      })
      .populate("replyTo.senderUserId", "username email")
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
    await populateMessageReferences(message);

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
    await populateMessageReferences(message);

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
