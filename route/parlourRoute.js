const express = require('express')
const  book  = require('../controller/booking')
const router = express.Router()
const auth = require('../controller/parlourAuth')
const product = require('../controller/product')




router.route('/signup').post(auth.signup)
router.route('/login').post(auth.login)
router.route('/password_update').patch(auth.protect ,auth.updatePass)
router.route('/user_update').patch(auth.uploadImage,auth.updateUser)
router.route('/forget_password').post(auth.forgetPassword)
router.route('/resetpassword/:id').post(auth.resetPassword)
router.route('/verifyemail/:id').get(auth.verifyemail)



////////product


router.route('/allproducts/:id').get(product.getProductbyId)


router.route('/history').post(book.historyParlour)
router.route('/today').post(book.toDayAppointment)


router.route('/allproducts').get(product.getAllProducts)
router.route('/productadd').post(auth.protect,product.uploadImage ,product.addproduct)
router.route('/productedit/:id').patch(auth.protect,product.productEdit)
router.route('/productdelete/:id').delete(auth.protect,product.productDelete)
router.route('/productget').get(auth.protect,product.getProduct)
router.route('/getAllParlours').post(auth.searchParlours)



module.exports = router