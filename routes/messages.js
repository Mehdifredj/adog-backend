var express = require("express");
var router = express.Router();
const Message = require("../models/messages.js");
const Pusher = require("pusher");
const mongoose = require("mongoose");
const User = require("../models/users.js");
const db = mongoose.connection;

db.once("open", () => {
  const changeStream = Message.watch();
  changeStream.on("change", (change) => {
    console.log("a change occured", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      console.log("console log", messageDetails);
      pusher.trigger("messagechannel", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        id: messageDetails.id,
      });
    } else {
      console.log("error triggering pusher");
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

router.get("/listmessage/:token", (req, res) => {
  console.log('test')
  User.findOne({ token: req.params.token })
    .populate("conversation", "name age")
    .then((data) => {
      // Si j'ai pas de conversation engagée je renvoi au front l'info
      if (data.mymatch.length === 0) {
        res.json({ result: false, message: "pas de match " });

        // Sinon je renvoi les info au front
      } else {
        res.json({ result: true, conversations: data.conversation });
      }
    });
});

module.exports = router;
