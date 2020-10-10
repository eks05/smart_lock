const PIGPIO = require('pigpio').Gpio;
const AWS = require("aws-sdk");
const fs = require("fs");
const User = require('../models/User')
const accessKeyId = "AKIAVGQN7T5HIPTFWEM2";
const secretKey = "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";
const { execSync, exec } = require('child_process');

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


const rekognition = new AWS.Rekognition({
    accessKeyId: accessKeyId,
    secretAccessKey: secretKey,
    region: "ap-northeast-2"
});


function rekog() {
    setTimeout(() => {
        let date = new Date()
        let filename = `${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.jpg`
        execSync(`wget http://127.0.0.1:8091/?action=snapshot -O stranger/${filename}`)

        User.find((err, user) => {
            if (err) throw err
            console.log('user: ', user)
            for (let i = 0; i < user.length; i++) {
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
                        Rleds.digitalWrite(1)
                        setTimeout(()=>{
                            Rleds.digitalWrite(0)
                        }, 2000)
                        console.error(err);
                    }
                    else if (data.FaceMatches.length > 0 && data.FaceMatches[0].Similarity >= 95) {
                        Gleds.digitalWrite(1)
                        setTimeout(()=>{
                            Gleds.digitalWrite(0)
                        }, 2000)


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
                                month: date.getMonth(),
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

function playSound(url) {
    exec(`wget -O - -o /dev/null --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36" "${url}" | omxplayer --no-keys pipe:0 &`,
        () => {
            console.log('Open By CompareFace')
        }
    );
}

module.exports = rekog;