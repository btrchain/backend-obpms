const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Book = require("../model/bookingModel");
const sendEmail = require("../utils/email");




exports.book = catchAsync(async (req, res, next) => {
  
      let d = Date.parse(req.body.date)
      let f = req.body.takenTime*60*1000
    const findbooking  =  await Book.find({
      productName:req.body.ProductName,
      serviceCompleteTime:{$gt:d}
    })  
    // // console.log(d)
    // // // console.log(d+f)
    // // console.log(findbooking)
    // // console.log(typeof finddf.serviceCompleteTime)
    // // console.log(Date.parse(Date.parse(req.body.date)+(req.body.tekenTime*60*1000)));
   
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
          serviceCompleteTime: d+f
        });

        try {
          await sendEmail({
            email: `${req.user.email},${req.body.email}`,
            subject: "Your Booking",
            // message: `<h1> Product: ${req.body.ProductName}, date: ${req.body.date}
            //   price:${req.body.price}, User: ${req.user.name}</h1> `,
              message:`<table
              role="presentation"
              border="0"
              cellpadding="0"
              cellspacing="0"
              class="body"
            >
              <tr>
                <td>&nbsp;</td>
                <td class="container">
                  <div class="content">
                    <table role="presentation" class="main">
                      <tr>
                        <td class="wrapper">
                          <table
                            role="presentation"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                          >
                            <tr>
                              <td>
                                <p>Hi ${req.user.name},</p>
                                <p>
                                  Your appointment with <b> ${req.body.parlourName} </b> on ${req.body.date} has been successfully booked.
                                </p>
                                <p><b>Details of your appointment below:<b></p>
                                <ul>
                                  <li><b>Product Name:</b> ${req.body.ProductName}</li>
                                  <li><b>Date & time:</b> ${req.body.date}</li>
                                  <li><b>Price:</b> ${req.body.price}</li>
                                </ul>
                                <p>
                                  If you need to cancel, please fill contact us form available on website.Prefer 48 hours for rescheduling or
                                  cancellations. See you soon!<br />
                                  Thanks, 
                                  <br />
                                  <b> ${req.body.parlourName} </b>
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </table>`
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
        status: "This parlour is not accepting the order currently at this time.",
      },
    });
   }

});


exports.historyUser = catchAsync(async (req, res, next) => {
  
  // // console.log(req.body);
  const orders = await Book.find({user:req.body.id})
  // // console.log(orders);
  res.status(200).json({
    data: {
      status: "success",
      orders
    },
  });

})

exports.historyParlour = catchAsync(async (req, res, next) => {
  
  // // console.log(req.parlour.id);
  const orders = await Book.find({parlour:req.body.id})
  // // console.log(orders);
  res.status(200).json({
    data: {
      status: "success",
      orders
    },
  });

})


exports.toDayAppointment = catchAsync(async(req,res,next)=>{
  // // console.log(req.body);
  var date = new Date();

// creates ObjectId() from date:


  // // console.log(date.setDate(date.getDate()+1),date.setDate(date.getDate()-1));

  const todayOrder = await Book.find({
    parlour:req.body.id,
    time:{ $gt:date.setDate(date.getDate()-1) }
   })

  res.status(200).json({
    data: {
      status: "success",
      todayOrder
    },
  });
})