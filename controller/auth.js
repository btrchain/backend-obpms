const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../model/userModel')
const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/email')
const crypto = require('crypto')



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
            message:`click here to verify your email ${req.protocol}://${req.get('host')}/api/users/verifyemail/${otp}`
        })
        res.status(200).json({
            data:{
             status: 'success',
             message: 'Password reset link sent successfully',
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



// exports.updatePass = catchAsync(async (req, res, next) => {
//     const userPass =await User.findById(req.user.id).select('+password')
//     // console.log(userPass)
//     if(!(await userPass.comparePassword(req.body.password,userPass.password))){
//         return next(new AppError('wrong credentials',401,'failed'))
//     }
//     userPass.password = req.body.newPassword
//     userPass.passwordConfirm= req.body.newPasswrodConfirm
//     await userPass.save()
//      res.status(200).json({
//         status: 'success',
//         data:{
//             user:userPass
//         }   
//     })
// })

exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.user.id,{name:req.body.name})
    res.status(200).json({
        status: 'success',
        data:{
            user:user
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

