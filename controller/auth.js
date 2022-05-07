const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../model/userModel')
const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/email')
const crypto = require('crypto')
const shortid = require('shortid')
const Razorpay = require('razorpay')
const multer = require("multer");


const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/img/user");
    },
    filename: (req, file, cb) => {
      //user-684845df5fd-timestamp.extension
      const ext = file.mimetype.split("/")[1];
      cb(null, `service-${Date.now()}.${ext}`);
    },
  });
  
  const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new AppError("Not an Image ! please upload only image", 400), false);
    }
  };
  
  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
  });
  
  exports.uploadImage = upload.single("photo");

const emailVerification = async (user,token,req,res) =>{
//   // console.log(user)
     const otp = await user.emailVerificationGen()
     await user.save({validateBeforeSave:false})
    //  // console.log(user);
    
    //  res.cookie('jwt',token,{
    //      expires: new Date(Date.now() + 3*24*60*60*1000),
    //      httpOnly: true,
    //     //  secure: true //only production 

    //  })

    try {
        await sendEmail({
            email:user.email,
            subject:'Email Verification (valid for 10 min)',
            // message:`click here to verify your email ${req.protocol}://${req.get('host')}/api/users/verifyemail/${otp}`
            message:`<body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8" leftmargin="0" > <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style=" @import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif; " > <tr> <td> <table style="background-color: #f2f3f8; max-width: 670px; margin: 0 auto" width="100%" border="0" align="center" cellpadding="0" cellspacing="0" > <tr> <td style="height: 80px">&nbsp;</td> </tr> <tr> <td style="height: 20px">&nbsp;</td> </tr> <tr> <td> <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style=" max-width: 670px; background: #fff; border-radius: 3px; text-align: center; -webkit-box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06); -moz-box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06); box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06); " > <tr> <td style="height: 40px">&nbsp;</td> </tr> <tr> <td style="padding: 0 35px"> <h1 style=" color: #1e1e2d; font-weight: 500; margin: 0; font-size: 32px; font-family: 'Rubik', sans-serif; " > You have requested to reset your password </h1> <span style=" display: inline-block; vertical-align: middle; margin: 29px 0 26px; border-bottom: 1px solid #cecece; width: 100px; " ></span> <p style=" color: #455056; font-size: 15px; line-height: 24px; margin: 0; " > We cannot simply send you your old password. A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions. </p> <a href=${req.protocol}://${req.get('host')}/api/users/verifyemail/${otp} style=" background: #e52e71; text-decoration: none !important; font-weight: 500; margin-top: 35px; color: #fff; text-transform: uppercase; font-size: 14px; padding: 10px 24px; display: inline-block; border-radius: 50px; " >Reset Password</a > </td> </tr> <tr> <td style="height: 40px">&nbsp;</td> </tr> </table> </td> </tr> <tr> <td style="height: 20px">&nbsp;</td> </tr> <tr> <td style="text-align: center"> <p style=" font-size: 14px; color: rgba(69, 80, 86, 0.7411764705882353); line-height: 18px; margin: 0 0 0; " > &copy; <strong>OBPMS</strong> </p> </td> </tr> <tr> <td style="height: 80px">&nbsp;</td> </tr> </table> </td> </tr> </table></body>`
        })
        res.status(200).json({
            data:{
             status: 'success',
             message: 'Password changed successfully',
             user,
             token

        }
     }) 
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: error.message
        })     
    }

}

exports.signup =  catchAsync(async (req, res, next) => {     
    // console.log(req.body)
    if (!req.body) {
        return next(new AppError('Please provide body',404,'failed')); 
    }

    const user = await User.create(req.body) 

    const token =  jwt.sign({id:user._id},process.env.JWT_SECRET_KEY_USER,{
        expiresIn: process.env.JWT_EXP
    })
   
    emailVerification(user,token,req,res)
    
    // res.status(200).json({
    //     status: 'success', 
    // })
    
})



exports.verifyemail = catchAsync(async (req, res, next) => {
 // console.log(req.params.id);
  const id = await crypto.createHash('sha256').update(req.params.id).digest('hex')
  
  const verifyopt = await User.findOne({
      emailVerificationCode:id,
    emailVerificationCodeExpire:{$gt:Date.now()}})
 
  if (!verifyopt) {
      return next(new AppError('link expired or try again',500,'failed'))
  }  

 // console.log(verifyopt)

  verifyopt.active = true
  verifyopt.emailVerificationCode=undefined
  verifyopt.emailVerificationCodeExpire=undefined
  verifyopt.save({validateBeforeSave: false})
  
  res.status(200).json({
    status: 'success',
    message: `Email Verified successfully (Please login)`
  })

})




exports.login = catchAsync(async (req, res, next) => {
    const {email,password}  = req.body
     // console.log(email,password);
    const userPass = await User.findOne({email: email,}).select('+password') 
   
     // console.log(userPass) 
   
     if(!userPass || !(await userPass.comparePassword(password,userPass.password))){
        return next(new AppError('User not found or password is incorrect',401,'fail')) 
     }
        
    const token =  jwt.sign({id:userPass._id},process.env.JWT_SECRET_KEY_USER,{
        expiresIn: process.env.JWT_EXP
    })

    // res.cookie('jwt',token,{
    //     expires: new Date(Date.now() + 3*24*60*60*1000),
    //     httpOnly: true,
    //    //  secure: true //only production 

    // })
    
    res.status(200).json({
        status: 'success',
        data:{
            user:userPass, 
            token: token
        }
        
    })
    
})


exports.protect = catchAsync(async (req, res, next) => {
   let token;
   if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
     token = req.headers.authorization.split(' ')[1]
    }
    // // console.log(token)
    if(!token) return next(new AppError('You are logged out ! Please login again.',401,'failed'))
    const decode = await jwt.verify(token,process.env.JWT_SECRET_KEY_USER)
    // // console.log(decode)
    const currentUser = await User.findById(decode.id).select('+password')
    if(!currentUser) return next(new AppError('user not found',401,'failed'))
    // // console.log(await currentUser.changePasswordAfterToken(decode.iat))
    if(await currentUser.changePasswordAfterToken(decode.iat)) {
        return next(new AppError('user recently change password .Please login agin'))
    }    
    req.user=currentUser
   next()
})

exports.updateUser = catchAsync(async (req, res, next) => {
    let photourl = `${req.protocol}://${req.get("host")}/img/user/${req.file.filename}`;
    const userData = await User.findById(req.body.id);
    userData.photo = photourl;
    const user = await userData.save({validateBeforeSave: false})
    res.status(200).json({
        status: 'success',
        data:{
            user
        }
    })
})


exports.forgetPassword = catchAsync(async (req, res, next) => { 
    const user = await User.findOne({email:req.body.email})
    if (!user) {
       return next(new AppError('no user found',401,'failed')); 
    }
   const resetToken = await user.generateResetToken()
   await user.save({validateBeforeSave: false})
    const resetUrl = `${req.body.url}/${resetToken}`
    // const message = `forgot your password ? submit a patch request with your new password 
    // and passwordConfirm to: ${resetUrl}.\nif you didn't forget your password , please ignore this email.`
    const message = `<body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8" leftmargin="0" > <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style=" @import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif; " > <tr> <td> <table style="background-color: #f2f3f8; max-width: 670px; margin: 0 auto" width="100%" border="0" align="center" cellpadding="0" cellspacing="0" > <tr> <td style="height: 80px">&nbsp;</td> </tr> <tr> <td style="height: 20px">&nbsp;</td> </tr> <tr> <td> <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style=" max-width: 670px; background: #fff; border-radius: 3px; text-align: center; -webkit-box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06); -moz-box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06); box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06); " > <tr> <td style="height: 40px">&nbsp;</td> </tr> <tr> <td style="padding: 0 35px"> <h1 style=" color: #1e1e2d; font-weight: 500; margin: 0; font-size: 32px; font-family: 'Rubik', sans-serif; " > You have requested to reset your password </h1> <span style=" display: inline-block; vertical-align: middle; margin: 29px 0 26px; border-bottom: 1px solid #cecece; width: 100px; " ></span> <p style=" color: #455056; font-size: 15px; line-height: 24px; margin: 0; " > We cannot simply send you your old password. A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions. </p> <a href=${resetUrl} style=" background: #e52e71; text-decoration: none !important; font-weight: 500; margin-top: 35px; color: #fff; text-transform: uppercase; font-size: 14px; padding: 10px 24px; display: inline-block; border-radius: 50px; " >Reset Password</a > </td> </tr> <tr> <td style="height: 40px">&nbsp;</td> </tr> </table> </td> </tr> <tr> <td style="height: 20px">&nbsp;</td> </tr> <tr> <td style="text-align: center"> <p style=" font-size: 14px; color: rgba(69, 80, 86, 0.7411764705882353); line-height: 18px; margin: 0 0 0; " > &copy; <strong>OBPMS</strong> </p> </td> </tr> <tr> <td style="height: 80px">&nbsp;</td> </tr> </table> </td> </tr> </table></body>`
    try {
       await sendEmail({
           email:user.email,
           subject:'Password reset link for OBPMS client(valid for 10 min)',
           message
       })
       res.status(200).json({
        status: 'success',
        message: 'Password reset link sent to email'
    }) 
   } catch (error) {
    res.status(200).json({
        status: 'failed',
        message: error.message
    })     
   }


})

exports.resetPassword = catchAsync(async (req, res, next) => {
    const resetToken = crypto.createHash('sha256').update(req.params.id).digest('hex')
    const user = await User.findOne({
        passwordResetToken:resetToken,
        passwordResetTokenExpire:{$gt:Date.now()}})

   if (!user) {
       return next(new AppError('Link is invalid or expired',500,'failed'));
   }

   user.password = req.body.password
   user.passwordConfirm= req.body.passwordConfirm
   user.passwordResetToken=undefined
   user.passwordResetTokenExpire=undefined
   await user.save()
   

   const token =  jwt.sign({id:user._id},process.env.JWT_SECRET_KEY_USER,{
    expiresIn: process.env.JWT_EXP
    })

    res.status(200).json({
        status: 'success',
        data:{
            user:user, 
            token: token
        }
        
    })
    
})
  
const razorpay = new Razorpay({
	key_id: 'rzp_test_x9p9LcFO0lqDba',
	key_secret: 'uiSvVNxZp9n4PFPESj0DjZf4'
})

exports.razorpay= catchAsync(async(req,res,next)=>{
  
    // // console.log(req.body,req.user);

    const payment_capture = 1
	const amount = req.body.price
	const currency = 'INR'

    const options = {
		amount: amount * 100,
		currency,
		receipt: shortid.generate(),
		payment_capture
	}

    const response = await razorpay.orders.create(options)
    // // console.log(response)
    res.json({
        id: response.id,
        currency: response.currency,
        amount: response.amount
    })

})