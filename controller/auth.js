const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../model/userModel')
const jwt = require('jsonwebtoken')


exports.signup =  catchAsync(async (req, res, next) => {     
    // console.log(req.body)
    if (!req.body) {
        return next(new AppError('Please provide body',404,'failed')); 
    }

    const userCreate = await User.create(req.body) 

    const token =  jwt.sign({id:userCreate._id},process.env.JWT_SECRET_KEY,{
        expiresIn: process.env.JWT_EXP
    })

    res.status(200).json({
        status: 'success',
        data:{
            userCreate,
            token: token
        }
        
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
        
    const token =  jwt.sign({id:userPass._id},process.env.JWT_SECRET_KEY,{
        expiresIn: process.env.JWT_EXP
    })
    
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
    
    const decode = await jwt.verify(token,process.env.JWT_SECRET_KEY)
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



exports.updatePass = catchAsync(async (req, res, next) => {
    // console.log(req.user)
    // console.log(req.body)
    
    const userPass =await User.findById(req.user.id).select('+password')
    // console.log(userPass)
    if(!(await userPass.comparePassword(req.body.password,userPass.password))){
        return next(new AppError('wrong credentials',401,'failed'))
    }
  
    userPass.password = req.body.newPassword
    userPass.passwordConfirm= req.body.newPasswrodConfirm
    userPass.save()

     res.status(200).json({
        status: 'success',
        data:{
            user:userPass
        }
        
    })
})

exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.user.id,{name:req.body.name})
    res.status(200).json({
        status: 'success',
        data:{
            user:user
        }
        
    })
})

