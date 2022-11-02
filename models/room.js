const mongoose = require("mongoose");

const roomSchema = mongoose.Schema({
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
  dateMatch: {
    type: Date,
    default: Date.now(),
  },
  userOne: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userTwo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
