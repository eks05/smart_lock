const express = require('express');
const router = express.Router();
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
var PIGPIO = require('pigpio')


var googleTTS = require('google-tts-api');
const { exec } = require('child_process')

const db = require('../models/db')
const User = require('../models/User')
const List = require('../models/userlist')
const sv1 = new PIGPIO.Gpio(3, {
  mode: PIGPIO.Gpio.OUTPUT
});
const sv2 = new PIGPIO.Gpio(4, {
  mode: PIGPIO.Gpio.OUTPUT
});

const button = new PIGPIO.Gpio(17, {
  mode:PIGPIO.Gpio.INPUT,
  pullUpDown: PIGPIO.Gpio.PUD_DOWN,
  edge: PIGPIO.Gpio.EITHER_EDGE,
});
button.on('interrupt', (level) => {
  console.log('open by button')
  if (level == 1) {
    sv2.servoWrite(1600)
      setTimeout(()=>{
        sv1.servoWrite(1800);
      },1500)
    
    let bye = '오늘도 화이팅하시기 바랍니다'
    saytts(bye)

    setTimeout(() => {
      sv1.servoWrite(800)
        setTimeout(()=>{
          sv2.servoWrite(544);
        },1500)
     
      let cls = '문이 닫힙니다'
      saytts(cls)
    }, 5000)
  }
})


router
  .post('/foropen', (req, res) => {
    console.log(req.body)
    let thispassword 
    let originpassword
    if(req.body.svpassword == ''){
      thispassword = req.body.mobilesvpassword
      originpassword = req.body.mobileoriginpassword
    }else{
      thispassword = req.body.svpassword
      originpassword = req.body.originpassword
    }
    User.findOne({userid : req.body.id},(err, user)=>{
      if(err) return res.json(err)
      console.log(user.openpassword)
      if(originpassword == user.openpassword){
        console.log('good')
        User.find({openpassword : thispassword}, (err, user)=>{
          if (err) return res.json(err)
          if(user == '' && thispassword.length > 7 && thispassword.length <= 8){
            update()
          }else {
            res.send({message: '사용불가능'})
          }
        })
      }
      else{
        res.send({message : '기존 비밀번호가 틀렸습니다.'})
      }
    })
    function update(){
      User.findOne({ userid: req.cookies.Info.id }, (err, user) => {
        if (err) return res.json(err)
        if (user.userid == req.cookies.Info.id && user.useraddress == req.cookies.Info.address) {
          User.findOneAndUpdate({ userid: user.userid }, { openpassword: thispassword }, () => {
            res.send({message : '사용가능'})
          })
        }
      })
    }
  })

  //keypad stop & restart
  .post('/stopNrestart', (req, res) => {
    let stopNrestart = req.body.stopNrestart
    let userid = req.cookies.Info.id
    if (stopNrestart == '정지') {
      User.findOneAndUpdate({ userid: userid }, { workstop: '1' }, () => {
        console.log('stop')
      })
    }
    else if (stopNrestart == '재가동') {
      User.findOneAndUpdate({ userid: userid }, { workstop: '0' }, () => {
        console.log('restart')
      })
    }
    res.redirect('/U-ViLock')
  })

  .post('/checkcheck',(req, res)=>{
    User.findOne({userid : req.body.id},(err, user)=>{
      if(user.workstop == 0){
        res.send({message : '가동중'})
      }else if(user.workstop == 1){
        res.send({message : '정지'})
      }
    })
  })
  
  .post('/img',(req, res)=>{
    let userpassword = req.body.hidepassword
    User.findOne({userid : req.cookies.Info.id}, (err, list)=>{
      console.log(list)
      if(userpassword == list.openpassword){
        res.send({message : 'true'})
      }
      else{
        res.send({message : 'false'})
      }
    })
  })

  .post('/password', (req, res) => {
    let hidepassword = req.body.hidepassword

    let saying = false
    User.findOne({ userid: req.cookies.Info.id }, (err, user) => {
      let date = new Date()
      let svpw = user.openpassword
      console.log(svpw == hidepassword)
      if (svpw == hidepassword && saying == false) {
        if(date.getHours() >= 12){
          let pm = '오후'
          list(pm)
        }
        else{
          let am = '오전'
          list(am)
        }
        function list(value){
        let list = new List({
          username: '#' + user.username,
          date: date.getDate(),
          time: '#'+ value + date.getHours() + '시' + date.getMinutes() + '분'
        })
        list.save()
      }
        saying = true
        // pass the GPIO number
        let name = user.username
        sv2.servoWrite(1600)
          setTimeout(()=>{
            sv1.servoWrite(1800);
          },1500)
        let hi = name + '님 환영합니다'
        saytts(hi)


        setTimeout(() => {
          let bye = '문이 닫힙니다'
          saytts(bye)

          sv1.servoWrite(800)
            setTimeout(()=>{
              sv2.servoWrite(544);
            },1500)
          res.redirect('/U-ViLock')
        }, 6000)
      }
      else {
        res.redirect('/U-ViLock')
        saying = false;
      }
    })
  })

  function saytts(message){
    googleTTS(message, 'ko', 1)   // speed normal = 1 (default), slow = 0.24
          .then(function (url) {
            console.log(url)
            exec(
              `wget -O - -o /dev/null --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36" "${url}" | omxplayer --no-keys pipe:0`,
              () => {
                saying = false
              }
            )
          })
          .catch(function (err) {
            console.error(err.stack);
            saying = false
          });
  }
module.exports = router;