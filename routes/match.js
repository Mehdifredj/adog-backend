var express = require("express");
var router = express.Router();
const Message = require("../models/messages.js");
const User = require("../models/users.js");

// Route /match  pour récuperer ces matchs
router.get("/:token", (req, res) => {
  console.log(req.params.token);
  // J'initialise match avec un tableau d'objet vide
  let match = [];

  // Je recherche les match de la personne via son token
  User.findOne({ token: req.params.token })
    .populate("mymatch", "name age")
    .then((data) => {
      // Si j'ai pas de match je renvoi au front pas de match
      if (data.mymatch.length === 0) {
        res.json({ result: false, message: "pas de match " });

        // Sinon je fais un .map sur data.
      } else {
        res.json({ result: true, mymatch: data.mymatch });
      }
    });
});

// Route /match/new

router.put("/new", (req, res) => {
  User.updateOne({ token: req.body.token }, { mymatch: req.body.idmatch }).then(
    () => {
      res.json({ result: true, message: "match added" });
    }
  );
});

module.exports = router;
