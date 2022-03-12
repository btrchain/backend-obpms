const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../model/userModel')
const jwt = require('jsonwebtoken')


exports.signup =  catchAsync(async (req, res, next) => {     
    // console.log(req.body)
    if (!req.body) {
        return next(new AppError('please provide body',404,'failed')); 
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
    console.log(email,password);
    const userPass = await User.findOne({email: email,}).select('+password') 
    console.log(userPass)
    
     if(!userPass || !(await userPass.comparePassword(password,userPass))){
        return next(new AppError('user not found or password incorrect')) 
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



