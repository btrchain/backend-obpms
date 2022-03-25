const express = require('express')
const router = express.Router()
const auth = require('../controller/parlourAuth')
const product = require('../controller/product')



router.route('/signup').post(auth.signup)
router.route('/login').post(auth.login)
router.route('/password_update').patch(auth.protect ,auth.updatePass)
router.route('/user_update').patch(auth.protect ,auth.updateUser)
router.route('/forget_password').post(auth.forgetPassword)
router.route('/resetpassword/:id').post(auth.resetPassword)
router.route('/verifyemail/:id').get(auth.verifyemail)



////////product



router.route('/productadd').post(auth.protect,product.uploadImage ,product.addproduct)
router.route('/productget').get(auth.protect,product.getProduct)


module.exports = router