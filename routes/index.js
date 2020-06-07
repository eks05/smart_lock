const express = require('express');
const router = express.Router();
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
  .post('/register', (req, res) => {
    let password = crypto.createHmac('sha1', 'adsf').update(req.body.userpassword).digest('base64')
    let Info = new User({
      username: req.body.username,
      userid: req.body.userid,
      userpassword: password,
      useraddress: req.body.useraddress,
      usertel: req.body.usertel,
    })
    Info.save()
    
    console.log(password)
    res.redirect('/register')
  })

  .post('/checkIn', (req, res) => {
    let password = crypto.createHmac('sha1', 'adsf').update(req.body.userpassword).digest('base64')
    User.findOne({ userid: req.body.userid }, (err, user) => {
      console.log(user)
      if (err) return res.json(err)
      if (user.userid == req.body.userid || user.password == password) {
        let Info = {
          id: req.body.userid,
          address: user.useraddress
        }
        res.cookie('Info', Info)
        res.redirect('/U-ViLock')
      }
      else {
        console.log('bad')
      }
    })
  })
  




module.exports = router;
