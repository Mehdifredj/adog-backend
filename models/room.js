const mongoose = require("mongoose");

const roomSchema = mongoose.Schema({
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],  // pourquoi ??? 
  dateMatch: {
    type: Date,
    default: Date.now(),
  }, // moment ou la room s'ouvre 
  userOne: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // clé étrangère pour récup les données de ces users.
  userTwo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // clé étrangère pour récup les données de ces users.
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
