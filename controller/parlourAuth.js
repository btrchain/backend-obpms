const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Parlour = require("../model/parlourModel");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
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

const emailVerification = async (parlour, token, req, res) => {
  //   // console.log(user)
  const otp = await parlour.emailVerificationGen();
  await parlour.save({ validateBeforeSave: false });
  //  // console.log(otp);
  try {
    await sendEmail({
      email: parlour.email,
      subject: "Please verify our email  (valid for 10 min)",
      // message: `Click here to verify your email ${req.protocol}://${req.get("host")}/api/parlours/verifyemail/${otp}`,
      message: `<body style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;"> <style> @media screen { @font-face { font-family: 'Lato'; font-style: normal; font-weight: 400; src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff'); } @font-face { font-family: 'Lato'; font-style: normal; font-weight: 700; src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff'); } @font-face { font-family: 'Lato'; font-style: italic; font-weight: 400; src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff'); } @font-face { font-family: 'Lato'; font-style: italic; font-weight: 700; src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff'); } } /* CLIENT-SPECIFIC STYLES */ body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } table, img { -ms-interpolation-mode: bicubic; } /* RESET STYLES */ img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; } table { border-collapse: collapse !important; } body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; } /* iOS BLUE LINKS */ a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } /* MOBILE STYLES */ @media screen and (max-width:600px) { h1 { font-size: 32px !important; line-height: 32px !important; } } /* ANDROID CENTER FIX */ div[style*="margin: 16px 0;"] { margin: 0 !important; } </style> <!-- HIDDEN PREHEADER TEXT --> <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"> We're thrilled to have you here! Get ready to dive into your new account. </div> <table border="0" cellpadding="0" cellspacing="0" width="100%"> <!-- LOGO --> <tr> <td bgcolor="#e52e71" align="center"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;"> <tr> <td align="center" valign="top" style="padding: 40px 10px 40px 10px;"> </td> </tr> </table> </td> </tr> <tr> <td bgcolor="#e52e71" align="center" style="padding: 0px 10px 0px 10px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;"> <tr> <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;"> <h1 style="font-size: 48px; font-weight: 400; margin: 2;">Welcome to OBPMS Parlour Portal</h1> <img src=" https://img.icons8.com/clouds/100/000000/handshake.png" width="125" height="120" style="display: block; border: 0px;" /> </td> </tr> </table> </td> </tr> <tr> <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;"> <tr> <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;"> <p style="margin: 0;">We're excited to have you get started. First, you need to confirm your account. Just press the button below.</p> </td> </tr> <tr> <td bgcolor="#ffffff" align="left"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 60px 30px;"> <table border="0" cellspacing="0" cellpadding="0"> <tr> <td align="center" style="border-radius: 3px;" bgcolor="#e52e71"><a href="${req.protocol}://${req.get("host")}/api/parlours/verifyemail/${otp}" target="_blank" style="font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 2px; border: 1px solid #e52e71; display: inline-block;">Confirm Account</a></td> </tr> </table> </td> </tr> </table> </td> </tr> <!-- COPY --> <tr> <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 0px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;"> <p style="margin: 0;">If that doesn't work, copy and paste the following link in your browser:</p> </td> </tr> <!-- COPY --> <tr> <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;"> <p style="margin: 0;"><a href="${req.protocol}://${req.get("host")}/api/parlours/verifyemail/${otp}" target="_blank" style="color: #e52e71;">${req.protocol}://${req.get("host")}/api/parlours/verifyemail/${otp}</a></p> </td> </tr> <tr> <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;"> <p style="margin: 0;">If you have any questions, just reply to this email&mdash;we're always happy to help out.</p> </td> </tr> <tr> <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;"> <p style="margin: 0;">Cheers,<br>OBPMS Team</p> </td> </tr> </table> </td> </tr> </table></body>`,
    });
    res.status(200).json({
      data: {
        status: "success",
        message: "Link sent to email",
        parlour,
        token,
      },
    });
  } catch (error) {
    res.status(200).json({
      status: "failed",
      message: error.message,
    });
  }
};

exports.signup = catchAsync(async (req, res, next) => {
  // // console.log(req.body)
  if (!req.body) {
    return next(new AppError("Please provide body", 404, "failed"));
  }

  const parlour = await Parlour.create(req.body);

  const token = jwt.sign(
    { id: parlour._id },
    process.env.JWT_SECRET_KEY_PARLOUR,
    {
      expiresIn: process.env.JWT_EXP,
    }
  );

  emailVerification(parlour, token, req, res);

  // res.status(200).json({
  //     status: 'success',
  // })
});

exports.verifyemail = catchAsync(async (req, res, next) => {
  //   // console.log(req.params.id);
  const id = await crypto
    .createHash("sha256")
    .update(req.params.id)
    .digest("hex");

  const verifyopt = await Parlour.findOne({
    emailVerificationCode: id,
    emailVerificationCodeExpire: { $gt: Date.now() },
  });

  if (!verifyopt) {
    return next(new AppError("Link expired please try again", 500, "failed"));
  }

  //    // console.log(verifyopt)

  verifyopt.active = true;
  verifyopt.emailVerificationCode = undefined;
  verifyopt.emailVerificationCodeExpire = undefined;
  verifyopt.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Email Verified successfully",
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // // console.log(email,password);
  const userPass = await Parlour.findOne({ email: email }).select("+password");

  //  console.log(userPass)

  if (!userPass) {
    return next(
      new AppError("User not found", 404, "fail")
    );
  }
  if (!(await userPass.comparePassword(password, userPass.password))) {
    return next(
      new AppError("User password is incorrect", 401, "fail")
    );
  }
  if (!userPass.active) {
    return next(
      new AppError("Please verify your email.", 401, "fail")
    );
  }

  const token = jwt.sign(
    { id: userPass._id },
    process.env.JWT_SECRET_KEY_PARLOUR,
    {
      expiresIn: process.env.JWT_EXP,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      parlour: userPass,
      token: token,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // // console.log(token)
  if (!token)
    return next(new AppError("You are logout ! Please login", 401, "failed"));
  const decode = await jwt.verify(token, process.env.JWT_SECRET_KEY_PARLOUR);
  // // console.log(decode)
  const parlourUser = await Parlour.findById(decode.id).select("+password");
  if (!parlourUser) return next(new AppError("User not found", 401, "failed"));
  // // console.log(await parlourUser.changePasswordAfterToken(decode.iat))
  if (await parlourUser.changePasswordAfterToken(decode.iat)) {
    return next(
      new AppError("User recently changed the password .Please login again")
    );
  }
  req.parlour = parlourUser;
  next();
});

exports.updatePass = catchAsync(async (req, res, next) => {
  const userPass = await Parlour.findById(req.parlour.id).select("+password");
  // // console.log(userPass)
  if (!(await userPass.comparePassword(req.body.password, userPass.password))) {
    return next(new AppError("Wrong credentials", 401, "failed"));
  }
  userPass.password = req.body.newPassword;
  userPass.passwordConfirm = req.body.newPasswrodConfirm;
  await userPass.save();
  res.status(200).json({
    status: "success",
    data: {
      user: userPass,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  let photourl = `${req.protocol}://${req.get("host")}/img/parlour/${
    req.file.filename
  }`;
  let parlourdata = await Parlour.findById(req.body.id);
  parlourdata.photo = photourl;
  parlourdata.roadName = req.body.roadName;
  parlourdata.localityName = req.body.localityName;
  parlourdata.cityName = req.body.cityName;
  parlourdata.statName = req.body.statName;
  parlourdata.pinCode = req.body.pinCode;
  parlourdata.name = req.body.name;

  let parlour = await parlourdata.save({ validateBeforeSave: false });
  console.log(parlour);
  res.status(200).json({
    status: "success",
    data: {
      parlour,
    },
  });
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const parlour = await Parlour.findOne({ email: req.body.email });
  // // console.log(parlour)
  if (!parlour) {
    return next(new AppError("No parlour account found", 401, "failed"));
  }
  const resetToken = await parlour.generateResetToken();
  await parlour.save({ validateBeforeSave: false });
  const resetUrl = `${req.body.url}/${resetToken}`;
  const message = `<body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8" leftmargin="0" > <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style=" @import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif; " > <tr> <td> <table style="background-color: #f2f3f8; max-width: 670px; margin: 0 auto" width="100%" border="0" align="center" cellpadding="0" cellspacing="0" > <tr> <td style="height: 80px">&nbsp;</td> </tr> <tr> <td style="height: 20px">&nbsp;</td> </tr> <tr> <td> <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style=" max-width: 670px; background: #fff; border-radius: 3px; text-align: center; -webkit-box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06); -moz-box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06); box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06); " > <tr> <td style="height: 40px">&nbsp;</td> </tr> <tr> <td style="padding: 0 35px"> <h1 style=" color: #1e1e2d; font-weight: 500; margin: 0; font-size: 32px; font-family: 'Rubik', sans-serif; " > You have requested to reset your password </h1> <span style=" display: inline-block; vertical-align: middle; margin: 29px 0 26px; border-bottom: 1px solid #cecece; width: 100px; " ></span> <p style=" color: #455056; font-size: 15px; line-height: 24px; margin: 0; " > We cannot simply send you your old password. A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions. </p> <a href=${resetUrl} style=" background: #e52e71; text-decoration: none !important; font-weight: 500; margin-top: 35px; color: #fff; text-transform: uppercase; font-size: 14px; padding: 10px 24px; display: inline-block; border-radius: 50px; " >Reset Password</a > </td> </tr> <tr> <td style="height: 40px">&nbsp;</td> </tr> </table> </td> </tr> <tr> <td style="height: 20px">&nbsp;</td> </tr> <tr> <td style="text-align: center"> <p style=" font-size: 14px; color: rgba(69, 80, 86, 0.7411764705882353); line-height: 18px; margin: 0 0 0; " > &copy; <strong>OBPMS@Parlour</strong> </p> </td> </tr> <tr> <td style="height: 80px">&nbsp;</td> </tr> </table> </td> </tr> </table></body>`
  try {
    await sendEmail({
      email: parlour.email,
      subject: "Your password reset link (valid for 10 min)",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "Password reset link sent successfully.",
    });
  } catch (error) {
    res.status(401).json({
      status: "failed",
      message: error.message,
    });
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // // console.log(req.body);
  const resetToken = crypto
    .createHash("sha256")
    .update(req.params.id)
    .digest("hex");
  const parlour = await Parlour.findOne({
    passwordResetToken: resetToken,
    passwordResetTokenExpire: { $gt: Date.now() },
  });

  if (!parlour) {
    return next(new AppError("Token invalid or expired", 500, "failed"));
  }

  parlour.password = req.body.password;
  parlour.passwordConfirm = req.body.passwordConfirm;
  parlour.passwordResetToken = undefined;
  parlour.passwordResetTokenExpire = undefined;
  await parlour.save();

  const token = jwt.sign(
    { id: parlour._id },
    process.env.JWT_SECRET_KEY_PARLOUR,
    {
      expiresIn: process.env.JWT_EXP,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      user: parlour,
      token: token,
    },
  });
});

exports.searchParlours = catchAsync(async (req, res, next) => {
  // // console.log(req.body.search);
  // let products=[]
  const allParlour = await Parlour.find({
    $text: { $search: req.body.search },
  }).populate("services");
  // .populate({path:'services',
  //            select:'name'})
  // const allParlour = await Parlour.findById(req.body.search).populate('services')
  //    // console.log(allParlour);
  // if(allParlour.length === 0) {

  //     return next(new AppError('Product not Found',404,'failed'));
  // }

  allParlour.map((product) => {
    if (product.services.length === 0) {
      return next(new AppError("Product not Found", 404, "failed"));
    }
    // products.push(product.services)
    res.status(200).json({
      status: "success",
      data: {
        products: product.services,
      },
    });
  });

  // res.status(200).json({
  //     status: 'success',
  //     data:{
  //         allParlour
  //     }
  // })
});
