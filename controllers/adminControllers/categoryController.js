import Category from "../../modals/categoryModel.js";
import { catchAsync } from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";

export const createCategory = catchAsync(async (req, res, next) => {
  try {
    const category = await Category.findOne({
      categoryName: req?.body?.categoryName,
    });

    if (category) {
      return next(new AppError("Category Title already exist", 401));
    }

    const newCategory = new Category(req?.body);
    await newCategory.save();
    res.status(200).send({
      message: "Category created successfully",
      success: true,
      data: newCategory,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const getCategories = catchAsync(async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).send({
      message: "categories fetch successfully",
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Intenal server error",
      success: false,
      error: error.message,
    });
  }
});

export const getSingleCategoryById = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).send({
        message: "no category found with this id",
        success: false,
      });
    }

    res.status(200).send({
      message: "data fetch successfully",
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const updateCategory = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndUpdate({ _id: id }, req?.body);

    if (!category) {
      return res.status(404).send({
        message: "no category found with this id",
        success: false,
      });
    }

    res.status(200).send({
      message: "Category Update Successfully",
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(404).send({
      message: "internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const deleteCategory = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).send({
        message: "no category found with this id",
        success: false,
      });
    }

    res.status(200).send({
      message: "Category Delete Successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});
