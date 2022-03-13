const mongoose = require('mongoose')
const valid = require('validator')
const bcrypt = require('bcrypt')


const userSchema = new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true,
        required:[true,"Please Provide email address"],
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
                  message:'Password not same'
        }
    },
    photo:String,
    passwordChangeAt:Date,

})




//middleware 
// userSchema.pre('save',async function(next){
//     console.log('pre middleware',this.isModified('password') + 'fud '+ this.isNew  )
// })

userSchema.pre('save',async function(next){
    // console.log(this.isModified('password'),'fucking password') 
    if(!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password,12)
    this.passwordConfirm=undefined; 
    next();
})




userSchema.pre('save',async function(next){
    // console.log(this.isModified('password') || this.isNew ,'fucking password change')
    if(!this.isModified('password') || this.isNew) return next()
    this.passwordChangeAt=Date.now() - 1000
    next()
})




userSchema.methods.comparePassword = async function(plainpass,haspassword){
  return  await bcrypt.compare(plainpass,haspassword)
}


userSchema.methods.changePasswordAfterToken = async function(jwtTimeStamp){
    if (this.passwordChangeAt) {
        const changeTimeStamp = parseInt(this.passwordChangeAt.getTime()/1000,10)
        // console.log(jwtTimeStamp,changeTimeStamp)
        return   jwtTimeStamp < changeTimeStamp 
    }
}

const User = mongoose.model('User',userSchema)

module.exports = User