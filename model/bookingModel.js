const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
    userName:String,
    parlourName:String,
    productName:String,
    time:{
        type:Date, 
        default:Date.now()
    },
    takenTime:{
        type:Number,
    },
    date:{
        type:Date,   
    },
    price:String,
    serviceCompleteTime: Number,
    parlour:{
        type:mongoose.Schema.ObjectId
    },
    user:{
        type:mongoose.Schema.ObjectId
    }
   
})



const Book = mongoose.model('Book',bookingSchema)
module.exports = Book;