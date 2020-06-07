const path = require("path");
const PIGPIO = require("pigpio");
const db = require('./models/db')
const User = require('./models/User')
const fs = require('fs')

const execSync = require('child_process').execSync;
const Gpio = PIGPIO.Gpio;
const vib = new Gpio(24, {
    mode: PIGPIO.Gpio.INPUT,
    pullUpDown: Gpio.PUD_UP,
    edge: Gpio.FALLING_EDGE
})
console.log('1step')
vib.enableInterrupt(Gpio.FALLING_EDGE);
vib.on('interrupt', (level) => {
    if (level == 1) {
        let date = new Date()
        let hour = date.getHours()
        let min = date.getMinutes()
        let filename = `${hour}_${min}.jpg`
        execSync(`raspistill -o strainger/${filename} --width 1080 --height 720`);
        console.log('2step')
    }
})






