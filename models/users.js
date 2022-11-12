const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  gender: String,
  breed: String,
  age: Number,
  vaccins: Boolean,
  aboutMe: String,
  aboutMyOwner: String,
  city: String,
  images: [String],
  isLikedBy: [String],
  token: String,
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }], // clé étrangère
});

const User = mongoose.model("User", userSchema);

module.exports = User;
