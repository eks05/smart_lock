var express = require('express');
var router = express.Router();
const app = express()
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const db = require('../models/db')
const User = require('../models/User')

router
.get('/', (req, res)=> {
  res.render('main-page')
})

module.exports = router;
