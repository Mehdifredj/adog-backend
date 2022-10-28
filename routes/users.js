var express = require("express");
var router = express.Router();
const User = require("../models/users.js");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

const cloudinary = require('cloudinary').v2;
const uniqid = require('uniqid');
const fs = require('fs');

router.post('/upload', async (req, res) => {
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

// Route signup pour l'inscription
router.post("/signup", function (req, res) {
  // Condition pour vérifier si l'utilisateur entre bien son name, email et password.
  if (!req.body.name || !req.body.email || !req.body.password) {
    res.json({
      result: false,
      message: "name or password or email is needed",
    });
    return;
  }

  // On vérifie en BDD si l'email n'est pas déja existant
  User.findOne({ email: req.body.email }).then((data) => {
    // Si email non existant, alors on crée le compte de l'utilisateur (le password sera crypté avec la méthode hashSync du module bcrypt)
    if (!data) {
      const newUser = new User({
        name: req.body.name,
        password: bcrypt.hashSync(req.body.password, 10),
        email: req.body.email,
        activatedAccount: true,
        token: uid2(32),
        mymatch: req.body.mymatch,
      });
      // Enregistrement du nouvel utilisateur dans la base de donnée
      newUser.save().then((newDoc) => {
        res.json({
          result: true,
          name: newDoc.name,
          token: newDoc.token,
          name: newDoc.name,
        });
      });

      // Sinon si l'adresse e-mail est déja utilisée, alors on renvoie un result "false" et ce message d'erreur : "This email is already used"
    } else {
      res.json({
        result: false,
        message: "This email is already used",
      });
    }
  });
});
// Route signin pour la connection
router.post("/signin", function (req, res) {
  console.log("testtttt");
  // Condition pour vérifier si l'utilisateur entre bien son email et son password.
  if (!req.body.email || !req.body.password) {
    res.json({
      result: false,
      message: "email or passowrd is needed",
    });
    return;
  }

  // On recherche en BDD par l'adresse email
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
        // Sinon si le mot de passe est incorrect on renvoie "false" et le front-end pourra afficher un message d'erreur
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

// Route PUT pour update du profil
router.put("/update/:token", function (req, res) {
  // On met a jour un utilisateur
  console.log(req.params.token);
  User.updateOne(
    { token: req.params.token }, // Critère de recherche pour retrouver l'utilisateur en BDD via reducer
    {
      // Ensemble des éléments qui sont mis à jour
      gender: req.body.gender,
      breed: req.body.breed,
      age: req.body.age,
      vaccins: req.body.vaccins,
      aboutMe: req.body.aboutMe,
      aboutMyOwner: req.body.aboutMyOwner,
      city: req.body.city,
      images: req.body.images,
      isLikedBy: req.body.isLikedBy,
    }
  ).then((data) => {
    res.json({ result: true, userData: data });
  });
});

router.get("/getuser/:email", (req, res) => {
  User.findOne({ email: req.params.email }).then((data) => {
    //console.log(data)
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
        city: data.city,
      });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

module.exports = router;
