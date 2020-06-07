const path = require("path");
const PIGPIO = require("pigpio");
// const PiCamera = require('pi-camera');
const execSync = require('child_process').execSync;

execSync(`raspistill --output ${Date.now()+'.jpg'} --width 1080 --height 720`);

const Gpio = PIGPIO.Gpio;
const vib = new Gpio(24, {
    mode: PIGPIO.Gpio.INPUT,
    pullUpDown: Gpio.PUD_UP,
    edge: Gpio.FALLING_EDGE
})
var intervalId;

vib.enableInterrupt(Gpio.FALLING_EDGE);
vib.on('interrupt', (level) => {
    if (level == 1) {
        if(intervalId !== undefined)
            return;

        intervalId = setInterval(() => {
            let idx = 0
                idx++

            if(idx == 5){
                clearInterval(intervalId)
                intervalId = undefined;
                console.log('finish')
            }
        }, 1000);
        idx = 0 
    }
})
