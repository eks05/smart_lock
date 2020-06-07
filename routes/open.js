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
    User.findOne({ userid: req.cookies.Info.id }, (err, user) => {
      if (err) return res.json(err)
      if (user.userid == req.cookies.Info.id) {
        User.findOneAndUpdate({userid: req.cookies.Info.id },{ openpassword: req.body.foropen }, ()=>{
          console.log(user)
          res.redirect('/U-ViLock')
        })
      }
    })
  })
  .post('/password', (req, res) => {
    let open = req.body.servo
    let hidepassword = req.body.hidepassword

    // User.findOne({ userid: req.cookies.Info.id }, (err, user) => {
    //   let svpw = user.openpassword
    //   if (svpw == hidepassword) {
    //     var PiServo = require('pi-servo')
    //     // pass the GPIO number
    //     var sv1 = new PiServo(18)
    //     sv1.open().then(function () {
    //       sv1.setDegree(0); // 0 - 180
    //     })
    //     .catch(err => {
    //       console.log(err)
    //     })

    //     setTimeout(() => {
    //       sv1.setDegree(180)
    //     }, 5000);
    //   }
    //   else {
    //     res.redirect('/Login')
    //   }
    //   setTimeout(() => {
    //     res.redirect('/U-ViLock')
    //   }, 6000);
    // })
  })


module.exports = router;