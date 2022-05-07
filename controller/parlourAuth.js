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
      message: `Click here to verify your email ${req.protocol}://${req.get(
        "host"
      )}/api/parlours/verifyemail/${otp}`,
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

  //  // console.log(userPass)

  if (
    !userPass ||
    !(await userPass.comparePassword(password, userPass.password))
  ) {
    return next(
      new AppError("User not found or password is incorrect", 401, "fail")
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
    return next(new AppError("no parlour found", 401, "failed"));
  }
  const resetToken = await parlour.generateResetToken();
  await parlour.save({ validateBeforeSave: false });
  const resetUrl = `${req.body.url}/${resetToken}`;
  // const message = `forgot your password ? submit a patch request with your new password
  // and passwordConfirm to: ${resetUrl}.\nif you didn't forget your password , please ignore this email.`
  // const message = `<p>Trouble signing in?</p>
  //   <p>Resetting your password is easy.</p>
  //   <p>Just press the link below and follow the instructions. We&rsquo;ll have you up and running in no time.<br />${resetUrl}</p>
  //   <p>If you did not make this request then please ignore this email.</p>`;
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
    res.status(200).json({
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
