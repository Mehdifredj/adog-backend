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
  Room.findById(req.params.idRoom)
  .populate({
    path: "messages",
    populate: {
      path: "name",
      select: "name",
    },
  })
  .then((dataRoom) => {
    console.log(dataRoom);
    res.json(dataRoom);
  });
});

//----------------------------------------------------------------------------------

router.get("/mesconversations/:token", (req, res) => {
  
  // FindOne avec le token de l'utilisateur qui est connecté. 
  // Le premier populate récupère les infos contenu dans la base de donnée room
  User.findOne({ token: req.params.token })
  .populate({
    path: "rooms",
    // Le deuxieme populate récupère les informations de chaque utilisateur présent dans une room (on a séléctionné uniqumement token, name, age)
    populate: [
      {
        path: "userOne",
        select: ["token", "name", "images"],
      },
      {
        path: "userTwo",
        select: ["token", "name", "images"],
      },
    ],
  })
  .then((data) => {
    res.json(data);
  });
});
//----------------------------------------------------------------------------------

router.post("/new/", (req, res) => {
  console.log(req.body);
  User.findOne({ token: req.body.token }).then((user) => {
    console.log("user ===>", user);
    const newMessage = new Message({
      content: req.body.content,
      name: user._id,
      received: false,
      roomId: req.body.idRoom,
    });
    
    newMessage.save().then((newdoc) => {
      console.log(newdoc);
      res.json(newdoc);
      
      Room.updateOne(
        { _id: req.body.idRoom },
        { $push: { messages: newdoc } }
        ).then((addMessageToRoom) => console.log(addMessageToRoom));
      });
    });
  });
  
  //----------------------------------------------------------------------------------
  
  router.post("/room", (req, res) => {
    // const {userOne,userTwo} = req.body;
    
    const newRoom = new Room({
      userOne: req.body.userOne,
      userTwo: req.body.userTwo,
    });
    
    newRoom.save().then((newDoc) => {
      res.json(newDoc);
      
      User.updateOne(
        { _id: req.body.userOne },
        { $push: { rooms: newDoc._id } }
        ).then((userOne) => console.log("userOne", userOne));
        
        User.updateOne(
          { _id: req.body.userTwo },
          { $push: { rooms: newDoc._id } }
          ).then((userTwo) => console.log("userTwo", userTwo));
        });
      });
      
      // Amin m'a dis qu'on pourrais s'en servir ensuite de cette route
      // router.get("/getRoom/:idRoom", (req, res) => {
        //   Room.findById(req.params.idRoom)
        //     .populate("userOne")
        //     .populate("userTwo")
        //     .then((dataRoom) => res.json(dataRoom));
        // });


 //----------------------------------------------------------------------------------

        //concerne pusher, ne pas toucher
        // db.once("open", () => {
        //   const changeStream = Message.watch();
        //   changeStream.on("change", (change) => {
        //     if (change.operationType === "insert") {
        //       const messageDetails = change.fullDocument;
        //       console.log("console log", messageDetails);
        //       pusher.trigger("messagechannel", "inserted", {
        //         name: messageDetails.name,
        //         content: messageDetails.content,
        //         date: messageDetails.date,
        //         id: messageDetails.id,
        //         roomId: messageDetails.roomId,
        //       });
        //     } else {
        //       console.log("error triggering pusher");
        //     }
        //   });
        // });
        
        // const pusher = new Pusher({
        //   appId: "1492722",
        //   key: "9f99e2de0211a1e7849d",
        //   secret: "95c7bc41f8b646c5cd48",
        //   cluster: "eu",
        //   useTLS: true,
        // });


module.exports = router;