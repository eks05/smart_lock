const Gpio = require('pigpio').Gpio;
const AWS = require("aws-sdk");
const { execSync, exec } = require('child_process');
const googleTTS = require('google-tts-api');
const fs = require("fs");
const User = require('../models/User')
const setKeypadEnable = require('./keypad')

const List = require('../models/userlist')
const VibModel = require('../models/Vib')

const sv1 = new Gpio(3, {
    mode: Gpio.OUTPUT
});
const sv2 = new Gpio(4, {
    mode: Gpio.OUTPUT
});


const accessKeyId = "AKIAVGQN7T5HIPTFWEM2";
const secretKey = "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";

const rekognition = new AWS.Rekognition({
    accessKeyId: accessKeyId,
    secretAccessKey: secretKey,
    region: "ap-northeast-2"
});

const trigger = new Gpio(1, {
    mode: Gpio.INPUT,
    alert: true
});


function rekog() {
    setTimeout(() => {

        let date = new Date()
        let filename = `${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.jpg`
        execSync(`wget http://127.0.0.1:8091/?action=snapshot -O stranger/${filename}`)
        let vib = new VibModel({
            hours: Date.now(),
            time: date,
            filename: filename
        })
        vib.save().then(() => {
            console.log('pir센서')
        })


        User.find((err, user) => {
            if (err) throw err
            for (let i = 0; i < user.length; i++) {
                console.log(user[i])
                let guestFace = fs.readFileSync(`./stranger/${filename}`);
                let profile = user[i].profile
                let source = fs.readFileSync(`./uploads/${profile}`)
                rekognition.compareFaces({
                    SourceImage: {
                        Bytes: source
                    },
                    TargetImage: {
                        Bytes: guestFace
                    }
                }, (err, data) => {
                    if (err || data.UnmatchedFaces.Confidence >= 95) {
                        console.error(err);
                        setKeypadEnable(true)
                    }
                    else if (data.FaceMatches.length > 0 && data.FaceMatches[0].Similarity >= 95) {
                        setKeypadEnable(false)

                        let date = new Date()
                        if (date.getHours > 12) {
                            let pm = '오후'
                            list(pm)
                        } else {
                            let am = '오전'
                            list(am)
                        }

                        function list(value) {
                            let list = new List({
                                username: '#' + user.username,
                                date: date.getDate(),
                                time: '#' + value + date.getHours() + '시' + date.getMinutes() + '분'
                            })
                            list.save()
                        }

                        let welcome = '환영합니다'
                        googleTTS(welcome, 'ko', 1)
                            .then(function (url) {
                                console.log(url)
                                playSound(url);
                            })
                            .catch(function (err) {
                                console.error(err.stack);
                            });

                        sv2.servoWrite(1600)
                        setTimeout(() => {
                            sv1.servoWrite(1800);
                        }, 1500)

                        setTimeout(() => {
                            let bye = '문이 닫힙니다'
                            googleTTS(bye, 'ko', 1)   // speed normal = 1 (default), slow = 0.24
                                .then(function (url) {
                                    playSound(url);
                                })
                                .catch(function (err) {
                                    console.error(err.stack);
                                });

                            sv1.servoWrite(800)
                            setTimeout(() => {
                                sv2.servoWrite(544);
                            }, 1500)
                        }, 6000)
                    }
                })
            }
        })
    }, 1000 * 4);
}

trigger.on('alert', (level, tick) => {
    if (level == 1) {
        rekog()
    }
})

console.log('running');

function playSound(url) {
    exec(`wget -O - -o /dev/null --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36" "${url}" | omxplayer --no-keys pipe:0 &`,
        () => {
            console.log('Open By CompareFace')
        }
    );
}