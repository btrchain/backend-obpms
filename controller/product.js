const Product = require("../model/ParlourProduct");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const multer = require("multer");

// const upload = multer({dest:'public/image'})

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/");
  },
  filename: (req, file, cb) => {
    //user-684845df5fd-timestamp.extension
    const ext = file.mimetype.split("/")[1];
    cb(null, `service-${req.parlour.id}-${Date.now()}.${ext}`);
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

exports.addproduct = catchAsync(async (req, res, next) => {
  
  let photourl = `${req.protocol}://${req.get("host")}/img/${
    req.file.filename
  }`;
 
  const products = await Product.create({
    title: req.body.title,
    photo: photourl,
    desc: req.body.desc,
    price: req.body.price,
    parlour: req.parlour.id,
    duration: req.body.duration,
  });

  // console.log(products)
  res.status(200).json(products);
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const products = await Product.find({ parlour: req.parlour.id }).select(
    "-parlour"
  );
  // console.log(products)
  if (!products) {
    return next(
      new AppError("You are not provided services yet", 404, "faild")
    );
  }

  res.status(200).json({
    data: {
      status: "success",
      products,
    },
  });
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const allProducts = await Product.find({}).populate({
    path: "parlour",
    select: "name",
  });

  if (!allProducts) {
    return next(new AppError("No any product available yet", 404, "faild"));
  }

  res.status(200).json({
    data: {
      status: "success",
      allProducts,
    },
  });
});

exports.getProductbyId = catchAsync(async (req, res, next) => {
  // console.log(req.params.id)
  const allProducts = await Product.findById(req.params.id).populate({
    path: "parlour",
    select: "name localityName cityName pinCode email",
  });
  if (!allProducts) {
    return next(
      new AppError("Product not found please try again", 404, "failed")
    );
  }
  // console.log(allProducts)
  res.status(200).json({
    data: {
      status: "success",
      allProducts,
    },
  });
});


exports.productEdit = catchAsync(async (req, res, next) => {
  
  const productEdited = await Product.findByIdAndUpdate(req.params.id,{
    title: req.body.title,
    desc: req.body.desc,
    price: req.body.price,
    duration: req.body.duration,
  })
  
   res.status(200).json({
     data: {
       status: "success",
       productEdited
     },
   });
 
 });




exports.productDelete = catchAsync(async (req, res, next) => {
 const deleteProduct = await Product.findByIdAndDelete(req.params.id)
  res.status(200).json({
    data: {
      status: "success",
    },
  });

});

