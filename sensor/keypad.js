const Keypad = require('empire-matrix-keypad');
const PIGPIO = require('pigpio').Gpio
const { exec } = require('child_process')
const googleTTS = require('google-tts-api');

const User = require('../models/User')
const List = require('../models/userlist')
const rekog = require('./rekognition')

const buzzer = new PIGPIO(27, {
	mode:PIGPIO.OUTPUT
});

const sv1 = new PIGPIO(3, {
	mode: PIGPIO.OUTPUT
});
const sv2 = new PIGPIO(4, {
	mode: PIGPIO.OUTPUT
})
let Gleds = new PIGPIO(14, {
	mode:PIGPIO.OUTPUT
})
let Rleds = new PIGPIO(15,{
	mode:PIGPIO.OUTPUT
})

const config = {
	map: [
		[1, 2, 3, 'A'],
		[4, 5, 6, 'B'],
		[7, 8, 9, 'C'],
		["*", 0, "#", 'D']
	],
	rows: [26, 19, 13, 6],
	cols: [21, 20, 16, 12]
}
const keypad = new Keypad(config);
keypad.on('keyPress', function (key) {
	console.log('Key Pressed: ' + key);
	buzzer.digitalWrite(1)
	setTimeout(() => {
		buzzer.digitalWrite(0)
	}, 50);
	if(key == "*") console.log('*')
	if(key == "#") rekog(true)
})

keypad.on('enteredPassword', function (password) {
		console.log('Password entered: ' + password);
		checkPasswordIsValid(password)
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
function checkPasswordIsValid(password){
	
	if(password == undefined) return;

	User.findOne({ openpassword: password }, (err, user) => {
		if (err !== null || user == null || user.workstop == 1) {
			ten = 0
			playSound('비밀번호가 잘못되었습니다')
			console.log('error By password')
			red()
		} else if (user.openpassword == password && user.workstop == 0 ) {
			green()
			ten = 0
			let date = new Date()
			
			if(date.getHours() >= 12){
				let pm = '오후'
				list(pm)
			}else{
				let am = '오전'
				list(am)
			}
			function list(value){
				let list = new List({
				  username: '#' + user.username,
				  month: date.getMonth(),
				  date: date.getDate(),
				  time: '#'+ value + date.getHours() + '시' + date.getMinutes() + '분'
				})
				list.save()
			}

			let welcome = user.username + '환영합니다'
			console.log('Open By password')
			
			sv2.servoWrite(1600)
			playSound(welcome)
			setTimeout(()=>{
				sv1.servoWrite(1800);
      		},1500)
			
		
			setTimeout(() => {
				let bye = '문이 닫힙니다'
				playSound(bye)
				console.log('close By password')
				sv1.servoWrite(800)
        		setTimeout(()=>{
          		sv2.servoWrite(544);
        		},1500)
			
			}, 6000)
		}
	})
}

function playSound(message){
	return googleTTS(message, 'ko', 1)
	.then(function (url) {
		console.log(url)
		exec(`wget -O - -o /dev/null --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36" "${url}" | omxplayer --no-keys pipe:0 &`,
			() => {
			}
		);
	})
	.catch(function (err) {
		console.error(err.stack);
	});
}
