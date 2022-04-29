const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Parlour = require('../model/parlourModel')
const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/email')
const crypto = require('crypto')
const multer = require("multer");


const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/img/parlour");
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


const emailVerification = async (parlour,token,req,res) =>{
//   console.log(user)
     const otp = await parlour.emailVerificationGen()
     await parlour.save({validateBeforeSave:false})
    //  console.log(otp);
    try {
        await sendEmail({
            email:parlour.email,
            subject:'Please verify our email  (valid for 10 min)',
            message:`Click here to verify your email ${req.protocol}://${req.get('host')}/api/parlours/verifyemail/${otp}`
        })
        res.status(200).json({
            data:{
             status: 'success',
             message: 'link sent to email',
             parlour,
             token

        }
     }) 
    } catch (error) {
        res.status(200).json({
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

    const parlour = await Parlour.create(req.body) 

    const token =  jwt.sign({id:parlour._id},process.env.JWT_SECRET_KEY_PARLOUR,{
        expiresIn: process.env.JWT_EXP
    })
   
    emailVerification(parlour,token,req,res)
    
    // res.status(200).json({
    //     status: 'success', 
    // })
    
})



exports.verifyemail = catchAsync(async (req, res, next) => {
//   console.log(req.params.id);
  const id = await crypto.createHash('sha256').update(req.params.id).digest('hex')
  
  const verifyopt = await Parlour.findOne({
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
    message: 'email Verified successfully'
  })

})




exports.login = catchAsync(async (req, res, next) => {
    const {email,password}  = req.body
    // console.log(email,password);
    const userPass = await Parlour.findOne({email: email,}).select('+password') 
   
    //  console.log(userPass) 
   
     if(!userPass || !(await userPass.comparePassword(password,userPass.password))){
        return next(new AppError('user not found or password incorrect',401,'fail')) 
     }
        
    const token =  jwt.sign({id:userPass._id},process.env.JWT_SECRET_KEY_PARLOUR,{
        expiresIn: process.env.JWT_EXP
    })
    
    res.status(200).json({
        status: 'success',
        data:{
            parlour:userPass, 
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
    const decode = await jwt.verify(token,process.env.JWT_SECRET_KEY_PARLOUR)
    // console.log(decode)
    const parlourUser = await Parlour.findById(decode.id).select('+password')
    if(!parlourUser) return next(new AppError('User not found',401,'failed'))
    // console.log(await parlourUser.changePasswordAfterToken(decode.iat))
    if(await parlourUser.changePasswordAfterToken(decode.iat)) {
        return next(new AppError('User recently change password .Please login agin'))
    }    
    req.parlour=parlourUser
   next()
})



exports.updatePass = catchAsync(async (req, res, next) => {
    const userPass =await Parlour.findById(req.parlour.id).select('+password')
    // console.log(userPass)
    if(!(await userPass.comparePassword(req.body.password,userPass.password))){
        return next(new AppError('Wrong credentials',401,'failed'))
    }
    userPass.password = req.body.newPassword
    userPass.passwordConfirm= req.body.newPasswrodConfirm
    await userPass.save()
     res.status(200).json({
        status: 'success',
        data:{
            user:userPass
        }   
    })
})


exports.updateUser = catchAsync(async (req, res, next) => {
    
    // console.log(req.body.id);
    // console.log(req.file.filename);

    let photourl = `${req.protocol}://${req.get("host")}/img/parlour/${req.file.filename}`;     
    const parlour = await Parlour.findByIdAndUpdate(req.body.id,{photo:photourl})
    res.status(200).json({
        status: 'success',
        data:{
            parlour
        }
    })
})



// exports.updateUser = catchAsync(async (req, res, next) => {
    // const parlour = await Parlour.findByIdAndUpdate(req.parlour.id,{name:req.body.name})
//     res.status(200).json({
//         status: 'success',
//         data:{
//             user:parlour
//         }
//     })
// })


exports.forgetPassword = catchAsync(async (req, res, next) => { 
    const parlour = await Parlour.findOne({email:req.body.email})
    // console.log(parlour)
    if (!parlour) {
       return next(new AppError('no parlour found',401,'failed')); 
    }
   const resetToken = await parlour.generateResetToken()
   await parlour.save({validateBeforeSave: false})
    const resetUrl = `${req.body.url}/${resetToken}`
    // const message = `forgot your password ? submit a patch request with your new password 
    // and passwordConfirm to: ${resetUrl}.\nif you didn't forget your password , please ignore this email.`
    const message = `<p>Trouble signing in?</p>
    <p>Resetting your password is easy.</p>
    <p>Just press the link below and follow the instructions. We&rsquo;ll have you up and running in no time.<br />${resetUrl}</p>
    <p>If you did not make this request then please ignore this email.</p>`
    try {
       await sendEmail({
           email:parlour.email,
           subject:'Your password reset link (valid for 10 min)',
           message
       })
       res.status(200).json({
        status: 'success',
        message: 'Token sent to email'
    }) 
   } catch (error) {
    res.status(200).json({
        status: 'failed',
        message: error.message
    })     
   }


})

exports.resetPassword = catchAsync(async (req, res, next) => {
    // console.log(req.body);
    const resetToken = crypto.createHash('sha256').update(req.params.id).digest('hex')
    const parlour = await Parlour.findOne({
        passwordResetToken:resetToken,
        passwordResetTokenExpire:{$gt:Date.now()}})

   if (!parlour) {
       return next(new AppError('Token invalid or expired',500,'failed'));
   }

   parlour.password = req.body.password
   parlour.passwordConfirm= req.body.passwordConfirm
   parlour.passwordResetToken=undefined
   parlour.passwordResetTokenExpire=undefined
   await parlour.save()
   

   const token =  jwt.sign({id:parlour._id},process.env.JWT_SECRET_KEY_PARLOUR,{
    expiresIn: process.env.JWT_EXP
    })

    res.status(200).json({
        status: 'success',
        data:{
            user:parlour, 
            token: token
        }
        
    })
    
})



exports.searchParlours = catchAsync(async(req,res,next)=>{
   
    // console.log(req.body.search);
    let product=[]
    const allParlour = await Parlour.find({$text:{$search:req.body.search}}).populate('services')
    // const allParlour = await Parlour.findById(req.body.search).populate('services')
     
    // const parlours = await allParlour
    allParlour.forEach((service)=>{
        product.push(service.services)
    })
    res.status(200).json({
        status: 'success',
        data:{
            product
        } 
    })
    
})


