const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Book = require("../model/bookingModel");
const sendEmail = require("../utils/email");




exports.book = catchAsync(async (req, res, next) => {
      // console.log(req.user)
      // console.log(req.body)
      let d = new Date(req.body.date).toISOString()
      let f = new Date(req.body.takenTime*60*1000).toISOString()
      
    const findbooking  =  await Book.find({
      productName:req.body.ProductName,
      serviceCompleteTime:{$lt:new Date(Date.parse(d)+Date.parse(f))} 
    }) 

   
   if (findbooking.length === 0 ) {
        const booking = await Book.create({
          userName: req.user.name,
          user:req.user._id,
          parlourName: req.body.parlourName,
          productName: req.body.ProductName,
          date: req.body.date,
          price: req.body.price,
          takenTime: req.body.takenTime,
          parlour:req.body.parlour,
          serviceCompleteTime: Date.now(Date.parse(req.body.date)+(req.body.tekenTime*60*1000))  
        });

        try {
          await sendEmail({
            email: `${req.user.email},${req.body.email}`,
            subject: "Your Booking",
            message: `<h1> Product: ${req.body.ProductName}, date: ${req.body.date}
              price:${req.body.price}, User: ${req.user.name}</h1> `,
          });
          res.status(200).json({
            data: {
              status: "success",
              booking,
            },
          });
        } catch (error) {
          res.status(500).json({
            status: "failed",
            message: error.message,
          });
        }
   }else{
    res.status(200).json({
      data: {
        status: "not free parlour try after sometime",
      },
    });
   }

});


exports.historyUser= catchAsync(async (req, res, next) => {
  
  // console.log(req.user);
  const orders = await Book.find({user:req.user._id})
  // console.log(orders);
  res.status(200).json({
    data: {
      status: "success",
      orders
    },
  });

})

exports.historyParlour = catchAsync(async (req, res, next) => {
  
  console.log(req.parlour.id);
  const orders = await Book.find({parlour:req.parlour._id})
  // console.log(orders);
  res.status(200).json({
    data: {
      status: "success",
      orders
    },
  });

})