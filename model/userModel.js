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
    photo:String

})




//middleware 
userSchema.pre('save',async function(next){
    this.password = await bcrypt.hash(this.password,12)
    this.passwordConfirm=undefined; 
    next();
})


userSchema.methods.comparePassword= async function(plainpass,haspassword){
  return  await bcrypt.compare(plainpass,this.password)
}


const User = mongoose.model('User',userSchema)

module.exports = User