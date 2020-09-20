const mongoose = require('mongoose')

const vibSchema = new mongoose.Schema({
    hours:{ type: Number},
    time:{type : Date},
    filename: {type : String},
})

module.exports = mongoose.model('Vib', vibSchema)