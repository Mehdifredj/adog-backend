var express = require("express");
var router = express.Router();
const Message = require("../models/dbMessages.js");
const Pusher = require("pusher");
const mongoose = require("mongoose");
const db = mongoose.connection;

db.once("open", () => {
  const changeStream = Message.watch();
  changeStream.on("change", (change) => {
    console.log("a change occured", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      console.log('console log',messageDetails)
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        id: messageDetails.id,
      });
    } else {
        console.log('error triggering pusher')
    }
  });
});

const pusher = new Pusher({
  appId: "1492722",
  key: "9f99e2de0211a1e7849d",
  secret: "95c7bc41f8b646c5cd48",
  cluster: "eu",
  useTLS: true,
});

router.get("/sync", (req, res) => {
  Message.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

router.post("/new", (req, res) => {
  const dbMessage = req.body;

  Message.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

module.exports = router;
