const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/Lysis-Data');

const memorySchema = mongoose.Schema({
    memory:{
        type:Array,
        default:[],
    }
});
const trainSchema = mongoose.Schema({
    memory:{
        type:Array,
        default:[],
    }
});

module.exports.trainModel = mongoose.model('traindata',trainSchema)
module.exports.memoryModel = mongoose.model('memory',memorySchema)