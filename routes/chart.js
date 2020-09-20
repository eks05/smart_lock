const express = require('express');
const router = express.Router();

const Vib = require('../models/Vib')

router
    .get('/gettries', (req, res) => {
        Vib.find({ hours: { $gte: Date.now() - 86400000 } }, (err, pic) => {
            let t13 = 0 //1시 ~ 3시
            let t46 = 0 //4시 ~ 6시
            let t79 = 0 //7시 ~ 9시
            let t1012 = 0 //10시 ~ 12시
            let t1315 = 0 //13시 ~ 15시
            let t1618 = 0 //16시 ~ 18시
            let t1921 = 0 //19시 ~ 21시
            let t2224 = 0 //22시 ~ 24시
            for (let i = 0; i < pic.length; i++) {
                let p = pic[i].time.getHours()
                if (p == 0 || p == 22 || p == 23) {
                    t2224 = t2224 + 1
                } else if (p == 1 || p == 2 || p == 3) {
                    t13 = t13 + 1
                } else if (p == 4 || p == 5 || p == 6) {
                    t46 = t46 + 1
                } else if (p == 7 || p == 8 || p == 9) {
                    t79 = t79 + 1
                } else if (p == 10 || p == 11 || p == 12) {
                    t1012 = t1012 + 1
                } else if (p == 13 || p == 14 || p == 15) {
                    t1315 = t1315 + 1
                } else if (p == 16 || p == 17 || p == 18) {
                    t1618 = t1618 + 1
                } else if (p == 19 || p == 20 || p == 21) {
                    t1921 = t1921 + 1
                }
            }
            let sendtoday = { t13, t46, t79, t1012, t1315, t1618, t1921, t2224 }
            Vib.find({ hours: { $gte: Date.now() - 604800000 } }, (err, pic) => {
                let w13 = 0 //1시 ~ 3시            
                let w46 = 0 //4시 ~ 6시
                let w79 = 0 //7시 ~ 9시
                let w1012 = 0 //10시 ~ 12시
                let w1315 = 0 //13시 ~ 15시
                let w1618 = 0 //16시 ~ 18시
                let w1921 = 0 //19시 ~ 21시
                let w2224 = 0 //22시 ~ 24시
                for (let i = 0; i < pic.length; i++) {
                    let p = pic[i].time.getHours()
                    if (p == 0 || p == 22 || p == 23) {
                        w2224 = w2224 + 1
                    } else if (p == 1 || p == 2 || p == 3) {
                        w13 = w13 + 1
                    } else if (p == 4 || p == 5 || p == 6) {
                        w46 = w46 + 1
                    } else if (p == 7 || p == 8 || p == 9) {
                        w79 = w79 + 1
                    } else if (p == 10 || p == 11 || p == 12) {
                        w1012 = w1012 + 1
                    } else if (p == 13 || p == 14 || p == 15) {
                        w1315 = w1315 + 1
                    } else if (p == 16 || p == 17 || p == 18) {
                        w1618 = w1618 + 1
                    } else if (p == 19 || p == 20 || p == 21) {
                        w1921 = w1921 + 1
                    }
                }
                w13 = Math.floor(w13 / 7)
                w46 = Math.floor(w46 / 7)
                w79 = Math.floor(w79 / 7)
                w1012 = Math.floor(w1012 / 7)
                w1315 = Math.floor(w1315 / 7)
                w1618 = Math.floor(w1618 / 7)
                w1921 = Math.floor(w1921 / 7)
                w2224 = Math.floor(w2224 / 7)
                let sendweek = { w13, w46, w79, w1012, w1315, w1618, w1921, w2224 }
                res.send({
                    sendtoday: sendtoday,
                    sendweek:sendweek
                })
            })
        })
        
    })

module.exports = router;
