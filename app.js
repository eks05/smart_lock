const express = require('express')
const morgan = require('morgan')
const path = require('path')
const fs = require('fs')
const logger = require('morgan')
const db = require('./models/db')
const User = require('./models/User')

// const vib = require('./sensor/vib')
const hc_sr04 = require('./sensor/hc-sr')

const multer  = require('multer')
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'uploads/') // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
  },
  filename: function (req, file, callback) {
    callback(null, Date.now()+ '-' + file.originalname) // cb 콜백함수를 통해 전송된 파일 이름 설정
  }
})
var upload = multer({ storage: storage })
const app = express()

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');


app.use(cookieParser());

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')
app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, '/public')))

app.use("/public", express.static('public'));
app.use('/login', require('./routes/index'))
app.use('/uploads', express.static('uploads'))
app.use('/open', require('./routes/open'))


app.post('/profile', upload.single('profile'), (req, res)=>{
  console.log(req.file)
  setTimeout(() => {
    res.redirect('/U-ViLock')
  }, 5000);
})
const uploads = './uploads/'

app.get('/', (req, res)=>{
  res.redirect('/G-ViLock')
})
app.get('/G-ViLock', (req, res)=>{
  res.render('Guest-main-page')
})
app.get('/U-ViLock',(req, res)=>{
  fs.readdir(uploads, (err, files)=>{
    let index = files.length - 1
      let profile = files[index]
      console.log(profile)
      res.render('User-main-page',{
        id : req.cookies.Info.id,
        address : req.cookies.Info.address,
        profile : 'uploads/' + profile
    })
  })
})
app.get('/register', (req, res)=>{
  res.render('register-page')
})
app.get('/login', (req, res)=>{
  res.render('login-page')
})


app.listen(3001,()=>{
  console.log('running')
  db()
})