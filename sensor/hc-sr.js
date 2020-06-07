const Gpio = require('pigpio').Gpio;

// The number of microseconds it takes sound to travel 1cm at 20 degrees celcius
const MICROSECDONDS_PER_CM = 1e6/34321;

const trigger = new Gpio(23, {mode: Gpio.OUTPUT});
const echo = new Gpio(24, {mode: Gpio.INPUT, alert: true});
var request = require('request');
var cheerio = require('cheerio');

var options = {

    encoding: "utf-8",

    method: "GET",

    uri: "https://search.naver.com/search.naver?sm=top_hty&fbm=1&ie=utf8&query=%EB%82%A0%EC%94%A8"

}

trigger.digitalWrite(0); // Make sure trigger is low

const watchHCSR04 = () => {
  let startTick;

  echo.on('alert', (level, tick) => {
    if (level == 1) {
      startTick = tick;
    } else {
      const endTick = tick;
      const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
      if(diff / 2 / MICROSECDONDS_PER_CM <=100){
          request(options, function(err,res,html){
          
              var $ = cheerio.load(html);
              let cel = $(".todaytemp")[0].children[0].data + '도씨'
              let cast = $(".cast_txt")[0].children[0].data
          
              let weather = cel + '    ' + cast
              var googleTTS = require('google-tts-api');
               
              googleTTS(weather, 'ko', 1)   // speed normal = 1 (default), slow = 0.24
              .then(function (url) {
                console.log(url);
              })
              .catch(function (err) {
                console.error(err.stack);
              });
            //   tts출력
            console.log('good')
          });
      }
    }
  });
};

watchHCSR04();

// Trigger a distance measurement once per second
setInterval(() => {
  trigger.trigger(10, 1); // Set trigger high for 10 microseconds
}, 1000);


