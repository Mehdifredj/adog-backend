var express = require('express');
var router = express.Router();
const fetch = require('node-fetch')
require('../models/connection');

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


module.exports = router;
