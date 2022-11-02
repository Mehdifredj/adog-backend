var express = require("express");
var router = express.Router();
require('../models/connection');
const User = require("../models/users.js");
const Room = require("../models/room.js");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

const cloudinary = require("cloudinary").v2;
const uniqid = require("uniqid");
const fs = require("fs");

// -----------------------------------------------------------------------------------

// Route signup pour l'inscription
router.post("/signup", function (req, res) {
  // Condition pour vérifier si l'utilisateur entre bien son name, email et password.
  if (!req.body.name || !req.body.email || !req.body.password) {
    res.json({
      result: false,
      message: "Un des champs est manquant",
    });
    return;
  } // On vérifie en BDD si l'email n'est pas déja existant
  User.findOne({ email: req.body.email }).then((data) => {
    // Si email non existant, alors on crée le compte de l'utilisateur (le password sera crypté avec la méthode hashSync du module bcrypt)
    if (!data) {
      const newUser = new User({
        name: req.body.name,
        password: bcrypt.hashSync(req.body.password, 10),
        email: req.body.email,
        activatedAccount: true,
        token: uid2(32),
      });
      // Enregistrement du nouvel utilisateur dans la base de donnée
      newUser.save().then((newDoc) => {
        res.json({
          result: true,
          name: newDoc.name,
          token: newDoc.token,
          name: newDoc.name,
        });
        console.log("data signup", newDoc);
      });
      // Si l'adresse e-mail est déja utilisée, alors on renvoie un result "false" et un message d'erreur
    } else {
      res.json({
        result: false,
        message: "This email is already used",
      });
    }
  });
});

// -----------------------------------------------------------------------------------

// Route signin pour la connection
router.post("/signin", function (req, res) {
  // Condition pour vérifier si l'utilisateur entre bien son email et son password.
  if (!req.body.email || !req.body.password) {
    res.json({
      result: false,
      message: "Un des champs est manquant",
    });
    return;
  }
  // On recherche l'utilisateur en BDD via son adresse email
  User.findOne({ email: req.body.email }).then((data) => {
    // Si l'addresse e-mail est existante
    if (data) {
      // On utilise la méthode compareSync de bcrypt pour vérifier la correspondance des deux mots de passe
      if (bcrypt.compareSync(req.body.password, data.password)) {
        // Si mot de passe correct alors on renvoi "true", et le front-end pourra alors se connecter
        res.json({
          result: true,
          name: data.name,
          token: data.token,
          email: data.email,
        });
       // console.log("data signin", data);
        // si le mot de passe est incorrect on renvoie "false" et le front-end pourra afficher un message d'erreur
      } else {
        res.json({ result: false, message: "Mot de passe incorrect" });
      }
      // Si l'adresse e-mail est inexistante, alors on renvoi "false" et le front-end ne pourra pas se connecter
    } else {
      res.json({ result: false, message: "Aucun utilisteur trouvé" });
    }
  });
});

// -----------------------------------------------------------------------------------

// // Route PUT pour update du profil
router.put("/update/:token", function (req, res) {
  console.log(req.body);
  User.updateOne(
    { token: req.params.token },
    {
      gender: req.body.gender,
      breed: req.body.breed,
      age: req.body.age,
      vaccins: req.body.vaccins,
      aboutMe: req.body.aboutMe,
      aboutMyOwner: req.body.aboutMyOwner,
      city: req.body.city,
      $push : {images : req.body.images},
      isLikedBy: req.body.isLikedBy,
    }).then((data) => {
      console.log(data);
  });
});

// Critère de recherche pour retrouver l'utilisateur en BDD via reducer

// -----------------------------------------------------------------------------------

// route qui permet de récupérer les données de chaque user
router.get("/getuser/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((data) => {
   console.log('get', data)
    if (data) {
      res.json({
        result: true,
        name: data.name,
        breed: data.breed,
        age: data.age,
        gender: data.gender,
        vaccins: data.vaccins,
        aboutMe: data.aboutMe,
        aboutMyOwner: data.aboutMyOwner,
        images: data.images,
        city: data.city,
      });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

// -----------------------------------------------------------------------------------

// route qui permet d'upload des images et de les envoyer sur le cloud
router.post("/upload", async (req, res) => {
  const photoPath = `./tmp/${uniqid()}.jpg`;
  const resultMove = await req.files.imageFromFront.mv(photoPath);

  if (!resultMove) {
    const resultCloudinary = await cloudinary.uploader.upload(photoPath);
    //console.log(resultCloudinary);
    res.json({ result: true, url: resultCloudinary.secure_url });
  } else {
    res.json({ result: false, error: resultMove });
  }
  fs.unlinkSync(photoPath);
});


//----------------------------------------------------------------------------------
//route GET pour afficher les cards contenant les infos de tous les users
router.get("/allUsers/:token", (req, res) => {

  User.findOne({ token: req.params.token }).then((data) => { // je recupère mon token pour pouvoir récupérer nos data dans lesquelles figure notre Id
    console.log(data);
    let userID = data._id // on définit une variable : userId à laquelle on attribue notre id. 
    User.find({isLikedBy: {$not: {$eq: userID}}}).then((data) => { // si mon user Id que j'ai recupéré au dessus grâce à mon token est present dans le tableau isLikedBy des users alors la carte du user n'apparait pas dans les swipes. 
     // console.log("allUsers", data);
      res.json(data);
    });
  });
  });

// Route PUT pour update les match, les ajouter les matchs les uns aux austres entre 2 users
router.put("/updateLike/:token", function (req, res) {
  let userId = req.body.id;  
 
  User.findOne({ token: req.params.token }).then((data) => { 

    User.updateOne( 
      { _id: userId }, // l'id de l'autre user
      {
        $push: { isLikedBy: data._id }, //  l'id du user connecté (moi)
      }
    ).then(() => {
  if (data.isLikedBy.includes(userId)) {    
// GENERATION DE ROOM
const newRoom = new Room({
  userOne: userId,
  userTwo: data._id,
});

newRoom.save().then((newDoc) => {
  //res.json(newDoc);
  
  User.updateOne(
    { _id: userId },
    { $push: { rooms: newDoc._id } }
    ).then((userOne) => console.log("userOne", userOne));
    
    User.updateOne(
      { _id: data._id },
      { $push: { rooms: newDoc._id } }
      ).then((userTwo) => console.log("userTwo", userTwo));
    });
  
        res.json({ result: true });
      } else {
        res.json({ result: false, error : "Aucun like" });
      }
    })}
  );
})


module.exports = router;