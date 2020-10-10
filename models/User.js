const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    userid: {
        type: String
    },
    userpassword: {
        type: String
    },
    useraddress: {
        type: String
    },
    usertel: {
        type:String
    },
    openpassword:{
        type:String
    },
    profile:{
        type: String
    },
    workstop:{
        type: String
    },
    familyname: {
        type : String
    }
})

module.exports = mongoose.model('User', userSchema)