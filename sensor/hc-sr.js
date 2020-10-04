const Gpio = require('pigpio').Gpio;
const request = require('request');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const googleTTS = require('google-tts-api');

// The number of microseconds it takes sound to travel 1cm at 20 degrees celcius

//소리의 속도 : 344 m/s
// 1 마이크로초에 29cm

const MICROSECDONDS_PER_CM = 1e6 / 34321;

//크롤링
const options = {
  encoding: "utf-8",
  method: "GET",
  uri: "https://search.naver.com/search.naver?sm=top_hty&fbm=1&ie=utf8&query=%EB%82%A0%EC%94%A8"
}

var trigger, echo;

function init(){

  trigger = new Gpio(23, { mode: Gpio.OUTPUT });
  echo = new Gpio(24, { mode: Gpio.INPUT, alert: true });

  trigger.digitalWrite(0); // Make sure trigger is low
  echo.on('alert', playWeather);

  // Trigger a distance measurement once per second
  setInterval(() => {
    trigger.trigger(10, 1); // Set trigger high for 10 microseconds
  }, 1000);
}

let startTick;
let isWeatherPlaying = false;
function playWeather(level, tick){
  if (level == 1) {
    startTick = tick;
  } else {
    const endTick = tick;
    const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic  //도착시점 - 출발시점
    const distance = diff / 2 / MICROSECDONDS_PER_CM; //duration / 2 / 29
    console.log(Math.floor(distance) + 'cm')
    if (distance <= 40 && isWeatherPlaying == false) {
      isWeatherPlaying = true;
      //크롤링
      request(options, function (err, res, html) {
        if(err){
          console.error(err);
          isWeatherPlaying = false;
          return;
        }
        var $ = cheerio.load(html);
        let cel = $(".todaytemp")[0].children[0].data + '도씨'
        let cast = $(".cast_txt")[0].children[0].data
        googleTTS(cel + cast, 'ko', 1)   // speed normal = 1 (default), slow = 0.24
          .then(function (url) {
            console.log(url)
            exec(
              `wget -O - -o /dev/null --user-agent="Mozilla/5.0 (Macintosh; Intel 
              Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) 
              Chrome/83.0.4103.106 Safari/537.36" "${url}" | omxplayer --no-keys 
              pipe:0`, 
              ()=>{
                console.log("Tell today's weather");
                isWeatherPlaying = false;
              }
            );
          })
          .catch(function (err) {
            console.error(err.stack);
            isWeatherPlaying = false;
          });
      });
    }
  }
}

module.exports = init;