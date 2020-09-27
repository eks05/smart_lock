const PIGPIO = require('pigpio').Gpio;
const { execSync, exec } = require('child_process');
let Vib = require('../models/Vib')

const trigger = new PIGPIO(1, {
    mode: PIGPIO.INPUT,
    alert: true
});


trigger.on('alert', (level, tick) => {
    if (level == 1) {
        function take(){
            let date = new Date()
            execSync(`wget http://127.0.0.1:8091/?action=snapshot -O stranger/${filename}`)
            .then(()=>{
                let vib = new Vib({
                    hours: Date.now(),
                    time: date,
                    filename: filename
                })
                vib.save().then(()=>{
                    console.log('pir센서')
                })
            })    
        }
    }
})

console.log('running');

