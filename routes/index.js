const express = require('express');
const router = express.Router();
const crypto = require('crypto')
const fs = require('fs')

const db = require('../models/db')
const User = require('../models/User')
const List = require('../models/userlist')
const Vib = require('../models/Vib')
const nodemailer = require('nodemailer');


const config = require('./config')



router
  //회원가입
  .post('/register', (req, res) => {
    //digest : 인코딩, base64 가장 짧음
    let hashed_password = crypto.createHmac(config.crypto_key1, config.crypto_key2).update(req.body.userpassword).digest('base64')
    let hashed_op = crypto.createHmac(config.crypto_key1, config.crypto_key2).update(req.body.openpassword).digest('base64')
    let { username, userid, userpassword, useraddress, openpassword, usertel, checkidentify, familyname } = req.body

    if (username == "" || userpassword == "" || openpassword.length < 8 || userid == "" || useraddress == "" || usertel == "" || openpassword == "" || userpassword.length < 8 || checkidentify == "재시도") {
      res.redirect('/register')
    }
    else {
      fs.readdir(__dirname, (err, file) =>{
        let profile = file[file.length - 1]
        console.log(profile)
        
        let Info = new User({
        username: username,
        userid: userid,
        userpassword: hashed_password,
        useraddress: useraddress,
        openpassword: hashed_op,
        profile : profile,
        usertel: usertel,
        workstop: '0',
        familyname : familyname
      })
      Info.save()
      res.redirect('/Login')
    })
    }
  })

  .post('/checkidNop', (req, res) => {
    let userid = req.body.id
    User.find({ userid: userid }, (err, info) => {
      if (err) return res.json(err)
      console.log(info)
      if (info == "" || info == []) {
        res.send({ use: '가능' })
      }
      else {
        res.send({ use: '불가능' })
      }
    })
  })

  .post('/sendidentify', (req, res) => {
    //인증번호
    let identify = String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) + //Eng
      String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) + //Eng
      String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) + //Eng
      String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) + //Eng
      Math.floor(Math.random() * 10 + 1) + //num
      String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) //Eng
      + Math.floor(Math.random() * 10 + 1) + //num
      String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) //Eng

    //send mail
    let user_address = req.body.address
    const main = async () => {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'vilock2020',
          pass: '*rladmsry12',
        },
      });

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: `"ViLock" <vilock2020@gmail.com>`,
        to: `${user_address}`,
        subject: 'ViLock Smart door lock',
        html:
          '<div style="border:1px solid #353866;background-color:white">' +
          '<div style="text-align: center; font-size: 35px;height: 70px;background-color: #353866;color: white;line-height: 70px;">VILOCK</div>' +
          '<div style="padding:10px; text-align:center; margin:auto; width:90%;">' +
          '<div style="font-size: 20px;font-weight: bold;height:40px;">인증번호 발송</div>' +
          `<div style="font-size: 16px;height:40px;">안녕하세요 ${req.body.name}님 ViLock 회원가입에 임해주셔서 감사합니다</div>` +
          '<div style="border: 1px solid black;background-color: #FADD81;display:flex; width:60%; margin:auto">' +
          '<div style="height:80px;line-height: 80px;width:30%;font-weight: bold;font-size: 20px;text-align: center;">인증번호 | </div>' +
          `<div style="width:70%;height:80px;font-size: 20px;line-height:80px;">${identify}</div>` +
          '</div>' +
          '<div style="font-size: 17px;margin-top: 30px;">감사합니다. 남은 회원가입 절차를 마무리하여 주시기 바랍니다</div>' +
          '</div>' +
          '</div>'
      });


      console.log('Message sent: %s', info.messageId);
    };

    main()
    .catch(err => {
      console.error(err)
    });
    res.send({ identify: identify })
  })

  //로그인
  .post('/checkIn', (req, res) => {
    let { userid, userpassword } = req.body
    if (userpassword == "" || userid == "") {
      res.redirect('/G-ViLock')
    }
    else {
      let date = new Date()
      let idx = false
      if(req.body.userpassword.split('')[0] == '1' && req.body.userpassword.split('')[1] == '1' && req.body.userpassword.split('')[2] == '1' && req.body.userpassword.split('')[3] == '1'){
        idx = true
      }
      let password = crypto.createHmac(config.crypto_key1, config.crypto_key2).update(req.body.userpassword).digest('base64')
      User.findOne({ userid: userid }, (err, user) => {
        if (user == null) {
          res.redirect('/G-ViLock')
        }
        else if (user.userid == req.body.userid && user.userpassword == password) {
          let Info = {
            id: user.userid,
            address: user.useraddress,
            name: user.username, 
            idx : idx,
            familyname : user.familyname
          }
          if (date.getHours() >= 12) {
            let pm = '오후'
            list(pm)
          } else {
            let am = '오전'
            list(am)
          }

          function list(value) {
            let list = new List({
              username: '*' + user.username,
              month: date.getMonth(),
              date: date.getDate(),
              time: '*' + value + date.getHours() + '시' + date.getMinutes() + '분'
            })
            list.save()
          }
          res.cookie('Info', Info)
          res.redirect('/U-ViLock')
        }
      })
    }
  })

  //비밀번호찾기
  .post('/findpassword', (req, res) => {
    let name = req.body.name
    let id = req.body.id
    let email = req.body.email
    //임시 비밀번호
    let password =
    '1' + '1' + '1' + '1'  +
    String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) + //Eng
    String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) + //Eng
    String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) + //Eng
    String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) + //Eng
    Math.floor(Math.random() * 10 + 1) + //num
    String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) //Eng
    + Math.floor(Math.random() * 10 + 1) + //num
    String.fromCharCode([Math.floor(Math.random() * 21 + 65)]) //Eng
    let hashed_password = crypto.createHmac(config.crypto_key1, config.crypto_key2).update(password).digest('base64')


    User.findOne({userid : id}, (err, user)=>{
      if(err) return JSON(err)
      if(user.useraddress == email){
        User.findOneAndUpdate({userid : id}, {userpassword : hashed_password}, ()=>{
          console.log(password)
        })
      }
    })

    //send mail
    const main = async () => {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'vilock2020',
          pass: '*rladmsry12',
        },
      });

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: `"ViLock" <vilock2020@gmail.com>`,
        to: `${email}`,
        subject: 'ViLock Smart door lock',
        html:
          '<div style="border:1px solid #353866;background-color:white">' +
          '<div style="text-align: center; font-size: 35px;height: 70px;background-color: #353866;color: white;line-height: 70px;">VILOCK</div>' +
          '<div style="padding:10px; text-align:center; margin:auto; width:90%;">' +
          '<div style="font-size: 20px;font-weight: bold;height:40px;">임시 비밀번호 발송</div>' +
          `<div style="font-size: 16px;height:40px;">안녕하세요 ${name}님 ViLock를 꾸준히 사용해주셔서 감사합니다</div>` +
          '<div style="border: 1px solid black;background-color: #FADD81;display:flex; width:60%; margin:auto">' +
          '<div style="height:80px;line-height: 80px;width:30%;font-weight: bold;font-size: 20px;text-align: center;">비밀번호 | </div>' +
          `<div style="width:70%;height:80px;font-size: 20px;line-height:80px;">${password}</div>` +
          '</div>' +
          `<div style="font-size: 17px;margin-top: 30px;">감사합니다. ViLock은 ${name}님의 무궁한 성공을 기원합니다 </div>` +
          '</div>' +
          '</div>'
      });


      console.log('Message sent: %s', info.messageId);
    };

    main().catch(err => console.error(err));
  })
  .post('/changepassword', (req, res)=>{
    console.log(req.body.NEW.split(''))
    if(req.body.NEW.split('')[0] == req.body.NEW.split('')[1] && req.body.NEW.split('')[1] == req.body.NEW.split('')[2] && req.body.NEW.split('')[2] == req.body.NEW.split('')[3] && req.body.NEW.split('')[3] == req.body.NEW.split('')[4]){
      res.redirect('/changepw?status=bad')
      // req.query
    } 
    else{
    let newuserpassword = crypto.createHmac(config.crypto_key1, config.crypto_key2).update(req.body.NEW).digest('base64')
    let userid = req.body.userid

    User.findOneAndUpdate({userid : userid}, {userpassword : newuserpassword}, ()=>{
      console.log(newuserpassword)
      res.redirect('/')
    })
  }
  })
  
  .post('/checkLtpw', (req, res)=>{
    let id = req.body.userid
    let usedpassword = req.body.usedpassword
    usedpassword = crypto.createHmac(config.crypto_key1, config.crypto_key2).update(usedpassword).digest('base64')
    User.findOne({userid : id}, (err, user)=>{
      console.log(usedpassword)
      console.log(user.userpassword)
      if(user.userpassword == usedpassword){
        res.send({message: 'good'})
      }
      else if(usedpassword == '' || usedpassword != user.userpassword){
        res.send({message:'bad'})
      }
    })
  })


module.exports = router;
