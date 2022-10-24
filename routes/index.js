var express = require('express');
var router = express.Router();
const fetch = require('node-fetch')
require('../models/connection');
const uniqid = require('uniqid');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
