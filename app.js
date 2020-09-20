const express = require('express')
const path = require('path')
const fs = require('fs')
const logger = require('morgan') // server to client 정보전달
const multer = require('multer') // 파일선택
const cookieParser = require('cookie-parser'); // 쿠키

(require("./models/db"))()
const User = require('./models/User')
const List = require('./models/userlist')
const Vib = require('./models/Vib')

require("pigpio").configureSocketPort(8292);

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'uploads/') // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
  },
  filename: function (req, file, callback) {
    let ext = file.originalname.split(".");
    ext = ext[ext.length - 1];
    callback(null, `${Date.now()}-.${ext}`) // cb 콜백함수를 통해 전송된 파일 이름 설정
  }
})
const upload = multer({ storage: storage })

const app = express()

app.use(cookieParser());

//sensor
require('./sensor/vib')()
require('./sensor/hc-sr')();
require('./sensor/pir-sensor')

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')
app.use(logger("dev"))
app.use(express.json()) // req body 가능하게함
app.use(express.urlencoded({ extended: false })) // req body 가능하게함

//이미지
app.use(express.static(path.join(__dirname, '/public')))
app.use("/public", express.static('public'));
app.use('/uploads', express.static('uploads'))
app.use('/stranger', express.static('stranger'))


app.use('/login', require('./routes/index')) //로그인 회원가입
app.use('/open', require('./routes/open')) // 열고닫기, 도어락 비밀번호 설정 등
app.use('/chart', require('./routes/chart')) // 차트

app.post('/profile', upload.single('profile'), (req, res) => {
  User.findOne({userid : req.cookies.Info.id}, (err, user)=>{
    let profile = user.profile
    fs.unlink(`uploads/${profile}`,()=>{
      console.log(profile)
    })
  })
  User.findOneAndUpdate({ userid: req.cookies.Info.id }, { profile: req.file.filename }, () => {
    res.redirect('/U-ViLock')
  })
})

app.get('/', (req, res) => {
  res.redirect('/G-ViLock')
})
app.get('/G-ViLock', (req, res) => {
  res.render('Guest-main-page')
})
app.get('/U-ViLock', (req, res) => {
  let date = new Date()
  // TODO List -> History
  List.find({ date: date.getDate()}, (err, history) => {
    let username = history.map(el => el.username)
    let time = history.map(el => el.time)

    Vib.find({ hours: { $gte: Date.now() - 86400000 } }, (err, pic) => {
      if (err) throw err
      pic = pic.sort((a, b) => {
        return b.time < a.time ? -1 : 1;
      })
      User.findOne({ userid: req.cookies.Info.id }, (err, user) => {
          res.render('User-main-page', {
            name: username,
            id: user.userid,
            address: user.useraddress,
            profile: user.profile,
            passingpic: pic,
            hour: time,
            idx : req.cookies.Info.idx //임시 비밀번호 확인
          })
        if (err) {
          res.status(500).send('err')
        }
      })
    })
  })
})

app.get('/register', (req, res) => {
  res.render('register-page')
})
app.get('/login', (req, res) => {
  res.render('login-page')
})
app.get('/ChangePw', (req, res)=>{
  res.render('C-password')
})

app.listen(3000, () => {
  console.log('running')
})
