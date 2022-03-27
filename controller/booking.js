const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Book = require("../model/bookingModel");
const sendEmail = require("../utils/email");

exports.book = catchAsync(async (req, res, next) => {
  // console.log(req.user)
  // console.log(req.body)

  const booking = await Book.create({
    userName: req.user.name,
    parlourName: req.body.parlourName,
    productName: req.body.ProductName,
    date: req.body.date,
    price: req.body.price,
    takenTime: req.body.takenTime,
  });

  try {
    await sendEmail({
      email: `${req.user.email},${req.body.email}`,
      subject: "your Booking",
      message: `${req.body.ProductName}, date: ${req.body.date}
       price:${req.body.price}, User: ${req.user.name}`,
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
 
});
