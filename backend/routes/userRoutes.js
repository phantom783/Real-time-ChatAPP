const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Sign up
router.post("/sign-up", async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    const finalUsername = (username || name || "").toString().trim();

    // Validate inputs
    if (!finalUsername || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (finalUsername.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username: finalUsername }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user directly without pre-save hook
    const newUser = new User({
      username: finalUsername,
      email,
      password: hashedPassword,
      onlineStatus: false
    });

    // Save without triggering pre-save hook issues
    await newUser.save();

    res.status(201).json({
      message: "Sign-up successful",
      userId: newUser._id,
      username: newUser.username,
      email: newUser.email
    });
  } catch (error) {
    console.error("[sign-up error]", error.message);
    res.status(500).json({ message: error.message || "Sign-up failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    user.onlineStatus = true;
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        onlineStatus: user.onlineStatus,
        e2ePublicKey: user.e2ePublicKey || ""
      }
    });
  } catch (error) {
    console.error("[login error]", error.message);
    res.status(500).json({ message: error.message || "Login failed" });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single user
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update online status
router.put("/:userId/status", async (req, res) => {
  try {
    const { onlineStatus } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { onlineStatus },
      { new: true }
    ).select("-password");
    res.json({ message: "Status updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put("/:userId/update", async (req, res) => {
  try {
    const { bio, avatarUrl, username, phoneNumber, e2ePublicKey } = req.body;
    const userId = req.params.userId;

    // Optional: Check if username is taken if it's being changed
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(username !== undefined && { username }),
          ...(phoneNumber !== undefined && { phoneNumber }),
          ...(e2ePublicKey !== undefined && { e2ePublicKey: String(e2ePublicKey || "") })
        }
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout
router.post("/:userId/logout", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { onlineStatus: false },
      { new: true }
    );
    res.json({ message: "Logout successful", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send follow request
router.post("/:userId/follow-request/:targetId", async (req, res) => {
  try {
    const { userId, targetId } = req.params;

    if (userId === targetId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already following
    if (targetUser.followers.includes(userId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Check if request already sent
    if (targetUser.followRequests.includes(userId)) {
      return res.status(400).json({ message: "Follow request already sent" });
    }

    // Add to follow requests
    targetUser.followRequests.push(userId);
    await targetUser.save();

    res.json({ message: "Follow request sent", followRequests: targetUser.followRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept follow request
router.post("/:userId/accept-follow/:requesterId", async (req, res) => {
  try {
    const { userId, requesterId } = req.params;

    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    if (!user || !requester) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from follow requests
    user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId);

    // Add to followers and requester to following
    if (!user.followers.includes(requesterId)) {
      user.followers.push(requesterId);
    }
    if (!requester.following.includes(userId)) {
      requester.following.push(userId);
    }

    await user.save();
    await requester.save();

    res.json({
      message: "Follow request accepted",
      followers: user.followers,
      followRequests: user.followRequests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject follow request
router.post("/:userId/reject-follow/:requesterId", async (req, res) => {
  try {
    const { userId, requesterId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from follow requests
    user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId);
    await user.save();

    res.json({
      message: "Follow request rejected",
      followRequests: user.followRequests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get follow requests for user
router.get("/:userId/follow-requests", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("followRequests", "username email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ followRequests: user.followRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get followers list
router.get("/:userId/followers", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("followers", "username email onlineStatus");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ followers: user.followers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get following list
router.get("/:userId/following", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("following", "username email onlineStatus");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ following: user.following });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unfollow user
router.post("/:userId/unfollow/:targetId", async (req, res) => {
  try {
    const { userId, targetId } = req.params;

    const user = await User.findById(userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from following and followers
    user.following = user.following.filter(id => id.toString() !== targetId);
    target.followers = target.followers.filter(id => id.toString() !== userId);

    await user.save();
    await target.save();

    res.json({
      message: "Unfollowed successfully",
      following: user.following
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user profile with followers and following counts
router.get("/:userId/profile", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate("followers", "username email onlineStatus")
      .populate("following", "username email onlineStatus")
      .populate("followRequests", "username email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user,
      stats: {
        followersCount: user.followers.length,
        followingCount: user.following.length,
        followRequestsCount: user.followRequests.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check follow status between two users
router.get("/:userId/follow-status/:targetId", async (req, res) => {
  try {
    const { userId, targetId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = user.following.some(id => id.toString() === targetId);
    const hasPendingRequest = user.followRequests ? user.followRequests.some(id => id.toString() === targetId) : false;

    res.json({
      isFollowing,
      hasPendingRequest,
      status: isFollowing ? "following" : hasPendingRequest ? "pending" : "not_following"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sent follow requests (pending requests sent by current user)
router.get("/:userId/sent-follow-requests", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find all users who have this user's ID in their followRequests array
    const usersWithPendingRequests = await User.find({
      followRequests: userId
    }).select("username email _id onlineStatus");

    res.json({ sentRequests: usersWithPendingRequests || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all follow status information (received requests, sent requests, following, followers)
router.get("/:userId/follow-info", async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId)
      .populate("followRequests", "username email _id onlineStatus")
      .populate("followers", "username email _id onlineStatus")
      .populate("following", "username email _id onlineStatus");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find sent requests (users who have current user in their followRequests)
    const sentRequests = await User.find({
      followRequests: userId
    }).select("username email _id onlineStatus");

    res.json({
      receivedRequests: user.followRequests || [],
      sentRequests: sentRequests || [],
      followers: user.followers || [],
      following: user.following || [],
      stats: {
        receivedCount: (user.followRequests || []).length,
        sentCount: sentRequests.length,
        followersCount: (user.followers || []).length,
        followingCount: (user.following || []).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
