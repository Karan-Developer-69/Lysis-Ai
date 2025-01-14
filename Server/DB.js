const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URI);

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
