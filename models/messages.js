const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  message: String,
  name: String,
  timestamp: String,
  received: Boolean,
  id: String,
});

const Message = mongoose.model("messagecontent", messageSchema);

module.exports = Message;
