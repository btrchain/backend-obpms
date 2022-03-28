const express = require('express')
const router = express.Router()
const auth = require('../controller/auth')
const booking = require('../controller/booking')


router.route('/signup').post(auth.signup)
router.route('/login').post(auth.login)
router.route('/password_update').patch(auth.protect ,auth.updatePass)
router.route('/user_update').patch(auth.protect ,auth.updateUser)
router.route('/forget_password').post(auth.forgetPassword)
router.route('/resetpassword/:id').post(auth.resetPassword)
router.route('/verifyemail/:id').get(auth.verifyemail)
router.route('/booking').post(auth.protect,booking.book)
router.route('/history').post(auth.protect,booking.historyUser)


module.exports = router