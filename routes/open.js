const express = require('express');
const router = express.Router();
const crypto = require('crypto')
const PIGPIO = require('pigpio').Gpio
const config = require('./config')


const googleTTS = require('google-tts-api');
const { exec } = require('child_process')

const db = require('../models/db')
const User = require('../models/User')
const List = require('../models/userlist')
const sv1 = new PIGPIO(3, {
  mode: PIGPIO.OUTPUT
});
const sv2 = new PIGPIO(4, {
  mode: PIGPIO.OUTPUT
});
let Gleds = new PIGPIO(14, {
  mode:PIGPIO.OUTPUT
})
let Rleds = new PIGPIO(15,{
  mode:PIGPIO.OUTPUT
})

const button = new PIGPIO(17, {
  mode:PIGPIO.INPUT,
  pullUpDown: PIGPIO.PUD_DOWN,
  edge: PIGPIO.EITHER_EDGE,
});

function green(){
	Gleds.digitalWrite(1)
	setTimeout(() => {
		Gleds.digitalWrite(0)
	}, 2000);
}

function red(){
	Rleds.digitalWrite(1)
	setTimeout(() => {
		Rleds.digitalWrite(0)
	}, 2000);
}

button.on('interrupt', (level) => {
  console.log('open by button')
  if (level == 1) {
    sv2.servoWrite(1600)
    green()
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
    let thispassword 
    let originpassword
    let pw 
    if(req.body.svpassword == ''){
      thispassword = crypto.createHmac(config.crypto_key1, config.crypto_key2).update(req.body.mobilesvpassword).digest('base64')
      originpassword = req.body.mobileoriginpassword
      pw = req.body.mobileoriginpassword
    }else{
      thispassword = crypto.createHmac(config.crypto_key1, config.crypto_key2).update(req.body.svpassword).digest('base64')
      originpassword = req.body.originpassword
      pw = req.body.svpassword
    }
        User.find({openpassword : thispassword}, (err, user)=>{
          if(err) throw err
          console.log(user)
          if(user == ''  && pw.length > 7 && pw.length <= 8){
            User.findOneAndUpdate({ openpassword: originpassword }, { openpassword: thispassword}, () => {
              console.log('사용가능')
              res.send({message : '사용가능'})
              res.redirect('/U-ViLock')
            })
          }else {
            res.send({message: '사용불가능'})
          }
        })
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
    let userpassword = crypto.createHmac(config.crypto_key1, config.crypto_key2).update(req.body.hidepassword).digest('base64')
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
    let hidepassword = crypto.createHmac(config.crypto_key1, config.crypto_key2).update(req.body.hidepassword).digest('base64')
    
    let saying = false
    User.findOne({ userid: req.cookies.Info.id }, (err, user) => {
      if(err) throw err
      let date = new Date()
      let svpw = user.openpassword
      
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
          time: '#'+ value + date.getHours() +
          '시' + date.getMinutes() + '분'
        })
        list.save()
      }
        saying = true
        // pass the GPIO number
        let name = user.username
        sv2.servoWrite(1600)
        green()
          setTimeout(()=>{
            sv1.servoWrite(1800);
          },1500)
        let hi = name + '님 환영합니다'
        saytts(hi)


        setTimeout(() => {
          let bye = '문이 닫힙니다'
          saytts(bye)

          sv1.servoWrite(800)
          green()
            setTimeout(()=>{
              sv2.servoWrite(544);
            },1500)
          res.redirect('/U-ViLock')
        }, 6000)
      }
      else {
        res.redirect('/U-ViLock')
        saying = false;
        red()
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