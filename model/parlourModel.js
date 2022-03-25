const mongoose = require('mongoose')
const valid = require('validator')
const bcrypt = require('bcrypt')
const crypto = require('crypto')


const parlourSchema = new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true,
        required:[true,"Please provide email address"],
        lowercase:true,
        validate:[valid.isEmail,"Please provide a valid email address"]
    },
    password:{
        type:String,
        required:[true,"Please provide a your password"],
        minlength:8,
        select:false,
    },
    passwordConfirm:{
        type:String,
        required:[true,"Please provide a your password"],
        validate:{
                  validator:function(value){
                      return value === this.password
                  },
                  message:'Password is not same'
        }
    },
    roadName:String,
    localityName:String,
    cityName:String,
    statName:String,
    phone: Number,
    pinCode:Number,
    photo:String,
    passwordChangeAt:Date,
    passwordResetToken:String,
    passwordResetTokenExpire:Date,
    active:{ 
        type:Boolean,
        default:false,
    },
    emailVerificationCode:String,
    emailVerificationCodeExpire:Date,

},{
    toJSON:{
        virtuals:true
    } ,
    toObject:{
        virtuals:true
    }
 })




parlourSchema.virtual('services',{
    ref:"Product",
    foreignField:"parlour",
    localField:"_id"
})

//middleware 
// userSchema.pre('save',async function(next){
//     console.log('pre middleware',this.isModified('password') + 'fud '+ this.isNew  )
// })



parlourSchema.pre('save',async function(next){
    // console.log(this.isModified('password'),'fucking password') 
    if(!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password,12)
    this.passwordConfirm=undefined; 
    next();
})




parlourSchema.pre('save',async function(next){
    // console.log(this.isModified('password') || this.isNew ,'fucking password change')
    if(!this.isModified('password') || this.isNew) return next()
    this.passwordChangeAt=Date.now() - 1000
    next()
})




parlourSchema.methods.comparePassword = async function(plainpass,haspassword){
  return  await bcrypt.compare(plainpass,haspassword)
}


parlourSchema.methods.changePasswordAfterToken = async function(jwtTimeStamp){
    if (this.passwordChangeAt) {
        const changeTimeStamp = parseInt(this.passwordChangeAt.getTime()/1000,10)
        // console.log(jwtTimeStamp,changeTimeStamp)
        return   jwtTimeStamp < changeTimeStamp 
    }
}


parlourSchema.methods.generateResetToken = async function(){
   const resetToken = await crypto.randomBytes(40).toString('hex')
   this.passwordResetToken=await crypto.createHash('sha256').update(resetToken).digest('hex')
   this.passwordResetTokenExpire = Date.now() + 1000*60*10
   
   return  resetToken;
}

parlourSchema.methods.emailVerificationGen =  async function(){
    const code =  await crypto.randomBytes(40).toString('hex')
    this.emailVerificationCode = await crypto.createHash('sha256').update(code).digest('hex')
    this.emailVerificationCodeExpire=Date.now() + 1000*60*10
    
    return code
}


const Parlour = mongoose.model('Parlour',parlourSchema)

module.exports = Parlour