import Role from "../modals/roleModel.js";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";

export const createRole = catchAsync(async (req, res, next) => {
  try {
    const role = await Role.findOne({ title: req?.body?.title });
    if (role) {
      return next(new AppError("Title already exist", 404));
    }

    const newRole = new Role(req.body);

    await newRole.save();

    res.status(200).send({
      message: "Role created successfully",
      success: true,
      data: newRole,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const getAllRoles = catchAsync(async (req, res, next) => {
  try {
    const allRoles = await Role.find();
    res.status(200).send({
      success: true,
      data: allRoles,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const getSingleRoleById = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findById({ _id: id });

    if (!role) {
      res.status(400).send({
        message: "No role found with this ID",
        success: false,
      });
    }

    res.status(200).send({
      message: "Role fetch successfully",
      success: false,
      data: role,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const updateRole = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const checkRoleId = await Role.findById({ _id: id });

    if (!checkRoleId) {
      return res.status(404).send({
        message: "no role found with this ID",
        success: false,
      });
    }

    const roleToUpdated = await Role.findByIdAndUpdate({ _id: id }, req.body);

    res.status(200).send({
      message: "Role Updated Successfully",
      success: true,
      data: roleToUpdated,
    });
  } catch (error) {
    return res.status(500).send({
      message: "internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const deleteRole = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const findRole = await Role.findById({ _id: id });

    if (!findRole) {
      return res.status(404).send({
        message: "no role found with this ID",
        success: false,
      });
    }

    const roleToDelete = await Role.findByIdAndDelete(id);

    res.status(200).send({
      message: "Role deleted Successfully",
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
