const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
   
    parlour:{
        type:mongoose.Schema.ObjectId,
        ref:'Parlour'
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User'
    }
    


})



const Book = mongoose.model('Book',bookingSchema)
module.exports = Book;