const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  name: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: String,
  date: {
    type: Date,
    default: Date.now(),
  },
  received: Boolean,
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
