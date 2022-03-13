const express = require('express')
const router = express.Router()
const auth = require('../controller/auth')


router.route('/signup').post(auth.signup)
router.route('/login').post(auth.login)
router.route('/passwordUpdate').patch(auth.protect ,auth.updatePass)



module.exports = router