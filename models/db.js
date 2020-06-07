const mongoose = require('mongoose')

module.exports = () => {
    function connect(){
        mongoose.connect('localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
            if(err) throw err
            console.log('connected to DB')
        })
    }
    connect()
}