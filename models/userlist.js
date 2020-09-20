const mongoose = require('mongoose')

const listSchema = new mongoose.Schema({
    username : {type : String},
    date : {type : String},
    time : {type : String},
})

module.exports = mongoose.model('List', listSchema)