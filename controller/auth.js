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
//   console.log(user)
     const otp = await user.emailVerificationGen()
     await user.save({validateBeforeSave:false})
    //  console.log(user);
    
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
            message:`<p>Trouble signing in?</p>
            <p>Resetting your password is easy.</p>
            <p>Just press the link below and follow the instructions. We&rsquo;ll have you up and running in no time.<br />${req.protocol}://${req.get('host')}/api/users/verifyemail/${otp}</p>
            <p>If you did not make this request then please ignore this email.</p>`
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
//   console.log(req.params.id);
  const id = await crypto.createHash('sha256').update(req.params.id).digest('hex')
  
  const verifyopt = await User.findOne({
      emailVerificationCode:id,
    emailVerificationCodeExpire:{$gt:Date.now()}})
 
  if (!verifyopt) {
      return next(new AppError('link expired or try again',500,'failed'))
  }  

//    console.log(verifyopt)

  verifyopt.active = true
  verifyopt.emailVerificationCode=undefined
  verifyopt.emailVerificationCodeExpire=undefined
  verifyopt.save({validateBeforeSave: false})
  
  res.status(200).json({
    status: 'success',
    message: `email Verified successfully (Please login)`
  })

})




exports.login = catchAsync(async (req, res, next) => {
    const {email,password}  = req.body
    // console.log(email,password);
    const userPass = await User.findOne({email: email,}).select('+password') 
   
    //  console.log(userPass) 
   
     if(!userPass || !(await userPass.comparePassword(password,userPass.password))){
        return next(new AppError('user not found or password incorrect',401,'fail')) 
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
    // console.log(token)
    if(!token) return next(new AppError('You are logout ! Please login',401,'failed'))
    const decode = await jwt.verify(token,process.env.JWT_SECRET_KEY_USER)
    // console.log(decode)
    const currentUser = await User.findById(decode.id).select('+password')
    if(!currentUser) return next(new AppError('user not found',401,'failed'))
    // console.log(await currentUser.changePasswordAfterToken(decode.iat))
    if(await currentUser.changePasswordAfterToken(decode.iat)) {
        return next(new AppError('user recently change password .Please login agin'))
    }    
    req.user=currentUser
   next()
})





exports.updateUser = catchAsync(async (req, res, next) => {
    
    // console.log(req.body.id);
    // console.log(req.file.filename);

    let photourl = `${req.protocol}://${req.get("host")}/img/user/${req.file.filename}`;     
    const user = await User.findByIdAndUpdate(req.body.id,{photo:photourl})
   
    res.status(200).json({
        status: 'success',
        data:{
            user
        }
    })
})


exports.forgetPassword = catchAsync(async (req, res, next) => { 
    // console.log(req.body.url)
    const user = await User.findOne({email:req.body.email})
    if (!user) {
       return next(new AppError('no user found',401,'failed')); 
    }
   const resetToken = await user.generateResetToken()
   await user.save({validateBeforeSave: false})
    const resetUrl = `${req.body.url}/${resetToken}`
    const message = `forgot your password ? submit a patch request with your new password 
    and passwordConfirm to: ${resetUrl}.\nif you didn't forget your password , please ignore this email.`
    try {
       await sendEmail({
           email:user.email,
           subject:'your password reset token (valid for 10 min)',
           message
       })
       res.status(200).json({
        status: 'success',
        message: 'token sent to email'
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
       return next(new AppError('token invalid or expired',500,'failed'));
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
  
    // console.log(req.body,req.user);

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
    // console.log(response)
    res.json({
        id: response.id,
        currency: response.currency,
        amount: response.amount
    })

})