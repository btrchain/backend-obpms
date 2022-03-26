const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    title:String,
    photo:String,
    desc:String,
    price:Number,
    time:{
        type:Date, 
         default:Date.now
    },
    parlour:{
        type:mongoose.Schema.ObjectId,
        ref:'Parlour'
    },
    duration:Number,
},{
   toJSON:{
       virtuals:true
   } ,
   toObject:{
       virtuals:true
   }
})




// productSchema.pre(/find/,async function(next){
//     this.populate({
//         path:'Product'
//     })
// })


// productSchema.pre(/find/,async function(next){
//     this.populate({
//         path:'parlour',
//         select:'-photo'
//     })
// })


const Product = mongoose.model('Product',productSchema)
module.exports = Product;