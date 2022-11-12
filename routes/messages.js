var express = require("express");
var router = express.Router();
const Message = require("../models/messages");
const Pusher = require("pusher");
const Room = require("../models/room");
const mongoose = require("mongoose");
const User = require("../models/users.js");
const db = mongoose.connection;

//----------------------------------------------------------------------------------

router.get("/sync/:idRoom", (req, res) => {
  Room.findById(req.params.idRoom) // on cherche la room en fonction de son Id
    .populate({
      // le .populate des messages pour les affichés dans la data ' Le populate permet de récupérer des données de clé étrangère '
      path: "messages",
      populate: {
        // et dans ces messages un autre populate pour recupérer le name.
        path: "name",
        select: "name",
      },
    })
    .then((dataRoom) => {
      
      res.json(dataRoom); // infos de la Room ( messages compris)
    });
});

//----------------------------------------------------------------------------------

router.get("/mesconversations/:token", (req, res) => {
  // FindOne avec le token de l'utilisateur qui est connecté.
  // Le premier populate récupère les infos contenu dans la base de donnée room
  User.findOne({ token: req.params.token })
    .populate({
      path: "rooms",
      // Le deuxieme populate récupère les informations de chaque utilisateur présent dans une room (on a séléctionné uniqumement token, name)
      populate: [
        {
          path: "userOne",
          select: ["token", "name"],
        },
        {
          path: "userTwo",
          select: ["token", "name"],
        },
      ],
    })
    .then((data) => {
      res.json(data);
    });
});
//----------------------------------------------------------------------------------

router.post("/new/", (req, res) => {
 
  User.findOne({ token: req.body.token }).then((user) => {
    console.log('TEEEEESTUSSEER',user)
    const newMessage = new Message({
      content: req.body.content,
      name: user._id,
      received: false,
      roomId: req.body.idRoom,
    });

    newMessage.save().then((newdoc) => {
     
      res.json(newdoc); // réponse de la sauvegarde du nouveau message.
      Room.updateOne(
        { _id: req.body.idRoom },
        { $push: { messages: newdoc } }
      ).then();
    });
  });
});

module.exports = router;
