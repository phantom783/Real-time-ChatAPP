const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ""));
}

function toId(value) {
  if (!value) {
    return "";
  }

  return value._id?.toString?.() || value.toString();
}

async function getPopulatedRoom(roomId) {
  return ChatRoom.findById(roomId)
    .populate("createdBy", "username email")
    .populate("members", "username email onlineStatus createdAt");
}

function isRoomCreator(room, userId) {
  return toId(room.createdBy) === String(userId);
}

function isRoomMember(room, userId) {
  return room.members.some((member) => toId(member) === String(userId));
}

function getRoomMemberIds(room) {
  return (room?.members || []).map((member) => toId(member)).filter(Boolean);
}

function emitRoomMembershipChanged(io, room, action = "updated") {
  if (!io || !room?._id) {
    return;
  }

  const roomId = String(room._id);
  const memberIds = getRoomMemberIds(room);

  memberIds.forEach((memberId) => {
    io.to(`user:${memberId}`).emit("room:membership_changed", {
      action,
      roomId,
      room,
    });
  });
}

function emitRoomRemoved(io, roomId, userIds = [], action = "removed") {
  if (!io || !roomId) {
    return;
  }

  const uniqueUserIds = [...new Set(userIds.map((userId) => String(userId)).filter(Boolean))];
  uniqueUserIds.forEach((userId) => {
    io.to(`user:${userId}`).emit("room:removed", {
      action,
      roomId: String(roomId),
    });
  });
}

async function addMemberToRoom(roomId, userId, actorId) {
  if (!isValidObjectId(roomId)) {
    return { error: { status: 400, message: "Invalid roomId" } };
  }

  if (!isValidObjectId(userId)) {
    return { error: { status: 400, message: "Invalid userId" } };
  }

  if (actorId && !isValidObjectId(actorId)) {
    return { error: { status: 400, message: "Invalid actorId" } };
  }

  const room = await ChatRoom.findById(roomId);
  if (!room) {
    return { error: { status: 404, message: "Room not found" } };
  }

  const user = await User.findById(userId).select("_id");
  if (!user) {
    return { error: { status: 404, message: "User not found" } };
  }

  if (actorId && !isRoomCreator(room, actorId)) {
    return { error: { status: 403, message: "Only room creator can add members" } };
  }

  if (isRoomMember(room, userId)) {
    const existingRoom = await getPopulatedRoom(roomId);
    return { room: existingRoom, changed: false };
  }

  room.members.push(userId);
  await room.save();

  const populatedRoom = await getPopulatedRoom(roomId);
  return { room: populatedRoom, changed: true };
}

async function removeMemberFromRoom(roomId, memberId, actorId) {
  if (!isValidObjectId(roomId)) {
    return { error: { status: 400, message: "Invalid roomId" } };
  }

  if (!isValidObjectId(memberId)) {
    return { error: { status: 400, message: "Invalid memberId" } };
  }

  if (actorId && !isValidObjectId(actorId)) {
    return { error: { status: 400, message: "Invalid actorId" } };
  }

  const room = await ChatRoom.findById(roomId);
  if (!room) {
    return { error: { status: 404, message: "Room not found" } };
  }

  if (actorId && !isRoomCreator(room, actorId)) {
    return { error: { status: 403, message: "Only room creator can remove members" } };
  }

  if (isRoomCreator(room, memberId)) {
    return { error: { status: 400, message: "Room creator cannot be removed" } };
  }

  if (!isRoomMember(room, memberId)) {
    return { error: { status: 404, message: "Member not found in room" } };
  }

  room.members = room.members.filter((member) => toId(member) !== String(memberId));
  await room.save();

  const populatedRoom = await getPopulatedRoom(roomId);
  return { room: populatedRoom, changed: true };
}

// Create a new chat room
router.post("/create", async (req, res) => {
  try {
    const { roomName, createdBy } = req.body;

    if (!roomName || !createdBy) {
      return res.status(400).json({ message: "Room name and creator required" });
    }

    const creator = await User.findById(createdBy).select("_id");
    if (!creator) {
      return res.status(404).json({ message: "Creator user not found" });
    }

    const newRoom = new ChatRoom({
      roomName: String(roomName).trim(),
      createdBy,
      members: [createdBy],
    });

    await newRoom.save();
    const populatedRoom = await getPopulatedRoom(newRoom._id);
    emitRoomMembershipChanged(req.app.get("io"), populatedRoom, "created");

    res.json({ message: "Room created successfully", room: populatedRoom });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all chat rooms
router.get("/", async (req, res) => {
  try {
    const { memberId } = req.query;
    const query = {};

    if (memberId) {
      if (!isValidObjectId(memberId)) {
        return res.status(400).json({ message: "Invalid memberId" });
      }

      query.members = memberId;
    }

    const rooms = await ChatRoom.find(query)
      .populate("createdBy", "username email")
      .populate("members", "username email onlineStatus createdAt");
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add member to room
router.post("/:roomId/members", async (req, res) => {
  try {
    const { userId, actorId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const result = await addMemberToRoom(req.params.roomId, userId, actorId);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    if (result.changed && result.room) {
      emitRoomMembershipChanged(req.app.get("io"), result.room, "member_added");
    }

    return res.json({
      message: result.changed ? "Member added successfully" : "Member already in room",
      room: result.room,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Backward-compatible add member endpoint
router.post("/:roomId/addMember", async (req, res) => {
  try {
    const { userId, actorId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const result = await addMemberToRoom(req.params.roomId, userId, actorId);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    if (result.changed && result.room) {
      emitRoomMembershipChanged(req.app.get("io"), result.room, "member_added");
    }

    return res.json({
      message: result.changed ? "Member added successfully" : "Member already in room",
      room: result.room,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Remove member from room
router.delete("/:roomId/members/:memberId", async (req, res) => {
  try {
    const actorId = req.body?.actorId || req.query.actorId;
    const { roomId, memberId } = req.params;

    const result = await removeMemberFromRoom(roomId, memberId, actorId);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    if (result.changed && result.room) {
      emitRoomMembershipChanged(req.app.get("io"), result.room, "member_removed");
      emitRoomRemoved(req.app.get("io"), roomId, [memberId], "member_removed");
    }

    return res.json({ message: "Member removed successfully", room: result.room });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get single chat room
router.get("/:roomId", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.roomId)) {
      return res.status(400).json({ message: "Invalid roomId" });
    }

    const room = await ChatRoom.findById(req.params.roomId)
      .populate("createdBy", "username email")
      .populate("members", "username email onlineStatus createdAt");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a chat room
router.delete("/:roomId", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.roomId)) {
      return res.status(400).json({ message: "Invalid roomId" });
    }

    const room = await ChatRoom.findByIdAndDelete(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    emitRoomRemoved(req.app.get("io"), room._id, room.members || [], "deleted");

    res.json({ message: "Room deleted successfully", room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
