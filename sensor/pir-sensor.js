const PIGPIO = require('pigpio').Gpio;
const { execSync, exec } = require('child_process');
let Vib = require('../models/Vib')

const trigger = new PIGPIO(1, {
    mode: PIGPIO.INPUT,
    alert: true
});


trigger.on('alert', (level, tick) => {
    console.log('level:', level, 'tick:', tick)
    if (level == 1) {
        take()
    }
})
function take(){
    let date = new Date()
    let filename = `${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.jpg`
    execSync(`wget http://127.0.0.1:8091/?action=snapshot -O stranger/${filename}`)
        let vib = new Vib({
            hours: Date.now(),
            time: date,
            filename: filename
        })
        vib.save().then(()=>{
            console.log('pir센서')
        })
}
console.log('running');

