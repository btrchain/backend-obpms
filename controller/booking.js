const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Book = require('../model/bookingModel')


exports.book = catchAsync(async (req, res, next) => {
  
    // console.log(req.user)
    // console.log(req.body)
  
    const booking = await Book.create({
     userName: req.user.name,
     parlourName:req.body.parlourName,
     productName:req.body.ProductName,
     date:req.body.date,
     price:req.body.price,
     takenTime:req.body.takenTime
    })

    res.status(200).json({
        data:{
          status: 'success',
         booking
       }
     })
 
})