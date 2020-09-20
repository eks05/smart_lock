const Keypad = require('empire-matrix-keypad');
const PIGPIO = require('pigpio')
const GPIO = require('onoff').Gpio
const { exec } = require('child_process')
const googleTTS = require('google-tts-api');

const User = require('../models/User')
const List = require('../models/userlist')

const buzzer = new GPIO(27, 'out');

const sv1 = new PIGPIO.Gpio(3, {
	mode: PIGPIO.Gpio.OUTPUT
});
const sv2 = new PIGPIO.Gpio(4, {
	mode: PIGPIO.Gpio.OUTPUT
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
	buzzer.writeSync(1)
	setTimeout(() => {
		buzzer.writeSync(0)
	}, 50);
	if(key == "*") setKeypadEnable(true)
});
keypad.on('enteredPassword', function (password) {
	console.log('Password entered: ' + password);
	checkPasswordIsValid(password)
});

var enableKeypad = false;
var timeoutID;
let ten = 0
let sec
function setKeypadEnable(isEnable){
	if(timeoutID !== undefined){
		clearTimeout(timeoutID);
		timeoutID = undefined;
		clearInterval(sec)
		sec = undefined;
		ten = 0
	}
	

	enableKeypad = isEnable;
	if(isEnable){
		timeoutID = setTimeout(()=>{
			enableKeypad = false;
		}, 15 * 10);
		sec = setInterval(() => {
		ten++
		console.log(ten)
		if(ten >= 50){
			clearInterval(sec)
			sec = undefined;
			ten = 0	
		}
	}, 1000);
	}
}
var isgoing = false;
if(ten > 10){
	ten =0;
	clearInterval(sec)
	sec = undefined
}

function checkPasswordIsValid(password){
	if(password == undefined) return;
	if(isgoing == true) return;

	isgoing = true;
	User.findOne({ openpassword: password }, (err, user) => {
		if (err !== null || user == null || user.workstop == 1 || ten > 10) {
			ten = 0
			playSound('비밀번호가 잘못되었습니다')
			console.log('error By password')
			clearInterval(sec)
			setKeypadEnable(false)
		} else if (user.openpassword == password && user.workstop == 0 && ten <=10) {
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
			
				clearInterval(sec)
			}, 6000)
				setKeypadEnable(false)
		}
		isgoing = false;
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

module.exports = setKeypadEnable;