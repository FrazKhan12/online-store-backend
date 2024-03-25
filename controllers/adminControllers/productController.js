import Product from "../../modals/productModel.js";
import Category from "../../modals/categoryModel.js";
import { catchAsync } from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { match } from "assert";

const folderName = "products/";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `public/`);
  },
  filename: function (req, file, cb) {
    cb(null, `${folderName}${uuidv4()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export const uploadProductPhoto = upload.single("productImage");

export const addProduct = catchAsync(async (req, res, next) => {
  try {
    // Check if all categories IDs exist
    const categories = req.body.categories;
    const categoryExists = await Category.find({ _id: { $in: categories } });

    if (!categoryExists) {
      return next(new AppError("Category IDs do not exist", 404));
    }

    const product = await Product.findOne({
      productTitle: req?.body?.productTitle,
    }).populate("categories");
    if (product) {
      return next(new AppError("Product Title already exist", 401));
    }
    if (req.file) {
      req.body.productImage = req.file.filename;
    }
    const newProduct = new Product(req.body);

    await newProduct.save();

    res.status(200).send({
      message: "Product created successfully",
      success: true,
      data: newProduct,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
});

// export const getAllProduct = catchAsync(async (req, res, next) => {
//   try {
//     let { categoryName } = req.body;
//     console.log("categoryName === ", categoryName);
//     const products = await Product.find().populate("categories");

//     res.status(200).send({
//       message: "products fetch successfully",
//       success: true,
//       data: products,
//     });
//   } catch (error) {
//     return res.status(500).send({
//       message: "Internal server error",
//       success: false,
//       error: error.message,
//     });
//   }
// });

export const getAllProduct = catchAsync(async (req, res, next) => {
  try {
    let categoryName = req.query.categoryName;

    let query = {};
    if (categoryName) {
      query.categoryName = { $regex: new RegExp("^" + categoryName, "i") };
      // query.categoryData = {
      //   categoryName: categoryName,
      // };
    }
    // const filterProducts = await Product.find(query).populate("categories");
    // const products = await Product.find().populate("categories");

    const result = await Product.aggregate([
      {
        $unwind: {
          path: "$categories",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categories",
          foreignField: "_id",
          as: "categoryData",
        },
      },

      {
        $unwind: {
          path: "$categoryData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            _id: "$_id",
            productImage: "$productImage",
            categoryData: "$categoryData",
            categoryName: "$categoryData.categoryName",
            productPrice: "$productPrice",
            productDescription: "$productDescription",
            productTitle: "$productTitle",
            stock: "$stock",
          },
        },
      },
      { $match: query },
    ]);

    const categoryResult = await Category.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "categories",
          as: "productData",
        },
      },
      {
        $unwind: {
          path: "$productData",
          preserveNullAndEmptyArrays: true,
        },
      },
      // {
      //   $unwind: {
      //     path: "$productData.categories",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $replaceRoot: {
          newRoot: {
            _id: "$_id",
            categoryName: "$categoryName",
            productPrice: "$productData.productPrice",
            productDescription: "$productData.productDescription",
            productTitle: "$productData.productTitle",
            stock: "$productData.stock",
          },
        },
      },
    ]);

    res.status(200).send({
      message: "Products fetched successfully",
      success: true,
      // data: products,
      // filterData: filterProducts,
      data: result,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const getAllProductByCategories = catchAsync(async (req, res, next) => {
  try {
    let { sortValue } = req.body;
    const products = await Product.find().populate("categories");

    const { category } = req?.query;

    const sortedProducts = await Product.aggregate([
      {
        $match: { "categories.categoryName": category },
      },
    ]);

    res.status(200).send({
      message: "products fetch successfully",
      success: true,
      data: products,
      sortedProducts,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const getSingleProductById = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate("categories");

    if (!product) {
      return res.status(404).send({
        message: "no product found with this ID",
        success: false,
      });
    }

    res.status(200).send({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).send({
      message: "internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const deleteProduct = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).send({
        message: "no product found with this ID",
        success: false,
      });
    }

    res.status(200).send({
      message: "Data deleted successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).send({
      message: "internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const updateProduct = catchAsync(async (req, res, next) => {
  try {
    let { id } = req.params;
    let bodyData = req.body;
    let product = await Product.findById(id);

    if (!product) {
      return next(new AppError("No product found with this ID", 404));
    }

    let existingEmail = await Product.findOne({ email: req?.body?.email });

    if (existingEmail && product.email !== req?.body?.email) {
      return next(new AppError("Email already exist", 401));
    }

    let existingUsername = await Product.findOne({
      username: new RegExp(`^${req?.body?.name}$`, "i"),
    });

    if (existingUsername && product.name !== req?.body?.name) {
      return next(new AppError("Username already exist", 401));
    }

    if (req.file && product.productImage !== req.file.filename) {
      if (
        product.productImage &&
        fs.existsSync(`public/${product.productImage}`)
      ) {
        fs.unlink(`public/${product.productImage}`, (error) => {
          if (error) {
            throw error;
          }
        });
      }
      product.productImage = req.file.filename;
    }

    let adminToUpdate = [
      "productTitle",
      "productDescription",
      "productImage",
      "productPrice",
      "categories",
      "stock",
    ];

    for (let property of adminToUpdate) {
      if (bodyData[property]) {
        product[property] = bodyData[property];
      }
      if (property === "productImage" && req?.file?.filename) {
        product[property] = req?.file?.filename;
      }
    }

    const newdata = await product.save();

    return res.status(200).send({
      message: "Product  Updated",
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});
