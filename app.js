const express = require('express')
const path = require('path')
const fs = require('fs')
const logger = require('morgan') // server 정보로전달
const multer = require('multer') // 파일선택
const cookieParser = require('cookie-parser'); // 쿠키

(require("./models/db"))()
const User = require('./models/User')
const List = require('./models/userlist')
const Vib = require('./models/Vib')

require("pigpio").configureSocketPort(8298);

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


//sensor
require('./sensor/vib')()
require('./sensor/hc-sr')();
require('./sensor/pir-sensor')
require('./sensor/keypad')

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

//미들웨어 next를 통해 넘어감
app.use(logger("dev"))
//body-parser가 express에 내장되어 미들웨어 사용가능 
app.use(cookieParser());
app.use(express.json()) 
app.use(express.urlencoded({ extended: false })) 

//이미지
// app.use()
app.use('/public',express.static(path.join(__dirname, '/public')));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')))
app.use('/stranger', express.static(path.join(__dirname, '/stranger')))


app.use('/login', require('./routes/index')) //로그인 회원가입
app.use('/open', require('./routes/open')) // 열고닫기, 도어락 비밀번호 설정 등
app.use('/chart', require('./routes/chart')) // 차트


//요청에 따른 경로로 이동
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
  List.find({ date: date.getDate(), month : date.getMonth()}, (err, history) => {
    if (err) throw err
    let username = history.map(el => el.username)
    let time = history.map(el => el.time)

    Vib.find({ hours: { $gte: Date.now() - 86400000 } }, (err, pic) => {
      if (err) throw err
      pic = pic.sort((a, b) => {
        return b.time < a.time ? -1 : 1;
      })
      User.findOne({ userid: req.cookies.Info.id }, (err, user) => {
        User.find({familyname : user.familyname}, (err, users)=>{
          res.render('User-main-page', {
            name: username,
            id: user.userid,
            address: user.useraddress,
            profile: user.profile,
            passingpic: pic,
            hour: time,
            idx : req.cookies.Info.idx, //임시 비밀번호 확인
            familyname : user.familyname,
            familymem : users.map(el => el.username)
          })
        if (err) {
          res.status(500).send('err')
        }
      })
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

//3000번 포트로 서브를 연다
app.listen(3000, () => {
  console.log('running')
})
