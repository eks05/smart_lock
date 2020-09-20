const Gpio = require("pigpio").Gpio;
const VibModel = require('../models/Vib');
const { exec } = require('child_process');


var vib;
function init(){
    vib = new Gpio(2, {
        mode: Gpio.INPUT,
        pullUpDown: Gpio.PUD_UP,
        edge: Gpio.FALLING_EDGE
    })
    
    vib.enableInterrupt(Gpio.FALLING_EDGE);
    vib.on('interrupt', capture)
}


let vibon = false;
function capture(level){
    if (level == 1 && vibon == false) {
        vibon = true
        console.log('진동 감지')

        let date = new Date()
        let filename = `${date.getDate()}_${ date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.jpg`
        exec(`wget http://127.0.0.1:8091/?action=snapshot -O stranger/${filename}`, (err, stdout, stderr)=>{
            if(err) console.error(err)
            else if(stderr) console.error(stderr);
            else {
                console.log(stdout);
            }
            let pic = new VibModel({
                hours: Date.now(),
                time: date,
                filename: filename
            })
            pic.save().then(()=>{
                console.log('잘저장됨')
            })
            vibon = false
        });
    }
}

module.exports = init;