const express = require('express');
const router = express.Router();
const app = express()
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
var MPlayer = require('mplayer');

var player = new MPlayer();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const db = require('../models/db')
const User = require('../models/User')


router
  .post('/foropen', (req, res) => {
    User.findOne({ userid: req.cookies.Info.id }, (req, res) => {
      if (err) return res.json(err)
      if (userid == req.cookies.Info.id) {
        User.update({ userid: req.cookies.Info.id }, { $set: { openpassword: req.body.foropen } })
      }
    })
  })
  .post('/password', (req, res) => {
    // let open = req.body.servo
    let hidepassword = req.body.hidepassword
    let password = req.body.password

    // User.findOne({ userid: req.cookies.Info.id }, (req, res) => {
      if (true) {
        var PiServo = require('pi-servo')
        // pass the GPIO number
        var sv1 = new PiServo(18)
        sv1.open().then(function () {
          sv1.setDegree(0); // 0 - 180
        })

        setTimeout(() => {
          sv1.setDegree(180)
        }, 5000);
      }
      else {
        res.redirect('/Login')
      }
      setTimeout(() => {
        res.redirect('/U-ViLock')
      }, 6000);
    // })
  })


module.exports = router;