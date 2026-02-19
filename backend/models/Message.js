const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  receiverUserIdOrRoomId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true 
  },
  messageContent: { 
    type: String,
    required: true 
  },
  messageType: { 
    type: String, 
    enum: ["text", "image", "file"], 
    default: "text" 
  },
  readStatus: { 
    type: Boolean, 
    default: false 
  },
  isEncrypted: { 
    type: Boolean, 
    default: true 
  },
  encryptionMethod: { 
    type: String, 
    enum: ["AES", "RSA", "none"], 
    default: "AES" 
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null
  },
  reactions: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      emoji: {
        type: String,
        required: true
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
