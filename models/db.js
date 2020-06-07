const mongoose = require('mongoose')

module.exports = () => {
    function connect(){
        mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
            if(err) throw err
            console.log('connected to DB')
        })
    }
    connect()
}