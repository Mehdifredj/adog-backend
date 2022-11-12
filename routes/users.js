var express = require("express"); //framework Express pour faciliter la création du backend
var router = express.Router(); //fonction  utilisée pour créer un nouvel objet routeur pour gérer les requêtes

require("../models/connection"); //permet d’importer la connection string
const User = require("../models/users.js"); //permet d'importer le schéma user crée dans le dossier models
const Room = require("../models/room.js"); //permet d'importer le schéma rooms crée dans le dossier models

const bcrypt = require("bcrypt"); //import du module bcrypt chargé du hachage du mot de passe et de la vérification de ce dernier
const uid2 = require("uid2"); //import du module uid2 chargé de générer une chaîne de caractères de 32 caractères aléatoires et uniques en guise de token.

const cloudinary = require("cloudinary").v2; //import du module cloudinary qui permet d'envoyer des photos vers cloudinary
const uniqid = require("uniqid"); //impor du module uniqid qui permet de générer un id aléatoire
const fs = require("fs"); // import module fs qui permet de supprimer les fichiers temporaires (pour ne pas surgcharger le backend)

// -----------------------------------------------------------------------------------

// Route signup pour l'inscription d'un nouvel utilisateur
router.post("/signup", function (req, res) {
  // Condition pour vérifier si l'utilisateur entre bien son name, email et password.
  if (!req.body.name || !req.body.email || !req.body.password) {
    res.json({
      result: false,
      message: "Un des champs est manquant",
    });
    return; // si la condition est respectée alors on return pour sortir de la route
  }
  User.findOne({ email: req.body.email }).then((data) => {
    // On vérifie en BDD si l'email n'est pas déja existant
    // Si email non existant, alors on crée le compte de l'utilisateur (le password sera crypté avec la méthode hashSync du module bcrypt)
    if (!data) {
      const newUser = new User({
        //on prépare la sauvegarde du nouvel utilisateur
        name: req.body.name,
        password: bcrypt.hashSync(req.body.password, 10), // Hachage via la méthode hashSync
        // en backend Le "hash" sera enregistré à la place du mot de passe en clair.
        // 10 = nombre de salage : le salage permet de renforcer la scririté des infos destinées à être hachées en ajoutant une donnée supplémentaire
        email: req.body.email,
        token: uid2(32), //créeation d'un token unique par utilisateur
      });
      // Enregistrement du nouvel utilisateur dans la BDD () (.save)
      newUser.save().then((newDoc) => {
        res.json({
          // lorsque le user est enregistré, on renvoie un res.json au front avec le token et le name. Ensuite le front stockera ces infirmations dans le reducer
          result: true,
          name: newDoc.name,
          token: newDoc.token,
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

  User.findOne({ email: req.body.email }).then((data) => {
    // On recherche l'utilisateur en BDD via son adresse email

    if (data) {
      // // on fait une première condition qui vérifie si l'adresse email est exisitante.
      if (bcrypt.compareSync(req.body.password, data.password)) {
        // si la premièere condition est respectée, et si la methode compareSync (qui permet de comparer) confirme que le req.body.password et le password enregistré (crypté) en BDD sont les mêmes

        res.json({
          // Alors on renvoie un res.json au frontend qui indique que les deux conditions sont validées, avec l'email de l'utulisateur, son nom et son token
          result: true,
          name: data.name,
          token: data.token,
          email: data.email,
        });
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

// Route PUT pour update du profil
router.put("/update/:token", function (req, res) {
  // :token est un paramètre, il est unique et permet d'identifier chaque user
  console.log(req.body);
  User.updateOne(
    //on utilise la méthode updateOne, en premier paramètre on recherche par le token et tous les autres paramètres c'est ceux qu'on modifie
    { token: req.params.token },
    {
      gender: req.body.gender,
      breed: req.body.breed,
      age: req.body.age,
      vaccins: req.body.vaccins,
      aboutMe: req.body.aboutMe,
      aboutMyOwner: req.body.aboutMyOwner,
      city: req.body.city,
      $push: { images: req.body.images }, // pour image on utilise /push car image est un tableau
      isLikedBy: req.body.isLikedBy,
    }
  ).then((data) => {
    // permet de temporiser le traitement
    res.json({ result: false, data }); // retounre la reponse au format json
  });
});

// -----------------------------------------------------------------------------------

// route qui permet de récupérer les données du user connecté à l'apppli.
//on fait une recherche par le token avec la méthode findOne et on renvoie au fromat json tous les éléments au front de façon à ce que lorsque le user soit sur la profilscreen tous les champs soient pré-remplis
router.get("/getuser/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((data) => {
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
  });
});

// -----------------------------------------------------------------------------------

// route qui permet d'upload des images et de les envoyer sur le cloud voir cours cloundinary
router.post("/upload", async (req, res) => { 
  //
  const photoPath = `./tmp/${uniqid()}.jpg`; // création d'une variable à laquelle on attribue le chemin vers le dossier tmp qui stock les photos temporairement. Chaque photo possède un nom unique grâce au uniq id afin qu'elle ne soit pas écrasée 
  const resultMove = await req.files.imageFromFront.mv(photoPath); // variable qui permet de copier le fichier dans le dossier tmp et nous renvoi undefined si tout c'est bien passé.

  if (!resultMove) { // Si undefined 
    const resultCloudinary = await cloudinary.uploader.upload(photoPath); // upload sur cloudinary
    res.json({ result: true, url: resultCloudinary.secure_url });
  } else {
    res.json({ result: false, error: resultMove });
  }
  fs.unlinkSync(photoPath); // méthode fs permet de supprimer de manière synchrone le fichier du dossier tmp.
});

//----------------------------------------------------------------------------------
//route GET pour afficher les cards contenant les infos de tous les users
router.get("/allusers/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((data) => {
    // je recupère mon token pour pouvoir récupérer nos data dans lesquelles figure notre Id
    console.log('TESTBACK', data.isLikedBy);
    let userID = data._id;
    //let userMatch = data.map((data, i));

    // on définit une variable : userId à laquelle on attribue notre id.
    User.find({ _id : { $not: { $eq: userID } } }).then((data) => {

      // si mon userId que j'ai recupéré au dessus grâce à mon token est présent dans l'objet data il ne s'affiche pas.
      res.json(data);
    });
  });
});

// Route PUT pour update les match et créer la room. Quand les deux users se sont liké ca créer une room dans laquelle les messages seront échangés.
router.put("/updatelike/:token", function (req, res) {

  let userId = req.body.id;
 
  User.findOne({ token: req.params.token }).then((data) => {
   
    User.updateOne(
      { _id: userId }, // l'id de l'autre user
      {
        $push: { isLikedBy: data._id }, // push l'id du user connecté (moi) dans le tableau ???
      }
    ).then(() => {
      if (data.isLikedBy.includes(userId)) {

        // GENERATION DE ROOM
        const newRoom = new Room({
          userOne: userId,
          userTwo: data._id,
        });

        newRoom.save().then((newDoc) => {
         
          // newDoc est une nouvelle room
          User.updateOne(
            { _id: userId }, // on utilise l'id de l'utilisateur comme parametre de MAJ
            { $push: { rooms: newDoc._id } } // on le push dans la nouvelle room : newDoc
          ).then();

          User.updateOne(
            { _id: data._id }, // notre id est le parametre d'update
            { $push: { rooms: newDoc._id } } // on le push dans la nouvelle room : newDoc
          ).then();
        });
        res.json({ result: true });
      } else {
        res.json({ result: false, error: "Aucun like" });
      }
    });
  });
});

module.exports = router;