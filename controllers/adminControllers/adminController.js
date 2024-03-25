import User from "../../modals/userModal.js";
import Admin from "../../modals/adminModels/adminModel.js";
import AppError from "../../utils/appError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import sendEmail from "../../utils/email/sendEmail.js";
import { sendAdminCred } from "../../utils/email/emailTemlates.js";
import jwt from "jsonwebtoken";
import fs from "fs";

var folderName = "images/";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `public/`);
  },
  filename: function (req, file, cb) {
    cb(null, `${folderName}${file.originalname}`);
  },
});

const upload = multer({ storage });

export const uploadAdminPhoto = upload.single("profilePicture");

export const adminRegister = catchAsync(async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email }).populate(
      "user"
    );
    if (admin) {
      return next(new AppError("User already exist", 404));
    }

    if (req.file) {
      req.body.profilePicture = req.file.filename;
    }

    const hash = await bcrypt.genSalt(10); // Corrected line
    const dcryptPass = await bcrypt.hash(req.body.password, hash);
    req.body.password = dcryptPass;

    const newAdmin = new Admin(req.body);
    await newAdmin.save();

    let subject = "Admin Creation";
    let to = newAdmin.email;
    let html = sendAdminCred(
      newAdmin.name,
      newAdmin.email,
      req?.body?.password
    );
    await sendEmail({ to, subject, html });

    res.status(200).send({
      message: "Thanks for register",
      success: true,
      data: newAdmin,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
});

export const adminLogin = catchAsync(async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });
    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    if (!admin.status) {
      // return next(
      //   new AppError("Your status is inactive. Please contact with admin", 401)
      // );
      return res.status(401).send({
        message: "Your status is inactive. Please contact with admin",
        success: false,
      });
    }

    const checkPassword = await bcrypt.compare(
      req.body.password,
      admin.password
    );
    if (!checkPassword) {
      // return next(new AppError("wrong password", 401));
      return res.status(401).send({
        message: "wrong password",
        success: false,
      });
    } else {
      let token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res.status(200).json({
        message: "Login Successfully",
        success: true,
        data: token,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
});

export const getAllAdmin = catchAsync(async (req, res, next) => {
  try {
    const admins = await Admin.find().populate("role");

    res.status(200).send({
      success: true,
      data: admins,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const getAllUsers = catchAsync(async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).send({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const getSingleUser = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({
        message: "user not found",
        success: false,
      });
    }

    res.status(200).send({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Intenal server error",
      success: false,
      error: error.message,
    });
  }
});

export const adminAuth = catchAsync(async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ _id: req?.body?._id }).populate("role");
    if (!admin) {
      return next(new AppError("Admin not found with this ID"));
    } else {
      res.status(200).send({
        message: "data fetch Successfullly",
        success: true,
        data: admin,
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const updateAdminProfile = catchAsync(async (req, res, next) => {
  try {
    let { id } = req.params;
    let bodyData = req.body;
    let admin = await Admin.findById(id);

    if (!admin) {
      return next(new AppError("No admin found with this ID", 404));
    }

    let existingEmail = await Admin.findOne({ email: req?.body?.email });

    if (existingEmail && admin.email !== req?.body?.email) {
      return next(new AppError("Email already exist", 401));
    }

    let existingUsername = await Admin.findOne({
      username: new RegExp(`^${req?.body?.name}$`, "i"),
    });

    if (existingUsername && admin.name !== req?.body?.name) {
      return next(new AppError("Username already exist", 401));
    }

    if (req.file && admin.profilePicture !== req.file.filename) {
      if (
        admin.profilePicture &&
        fs.existsSync(`public/${admin.profilePicture}`)
      ) {
        fs.unlink(`public/${admin.profilePicture}`, (error) => {
          if (error) {
            throw error;
          }
        });
      }
      admin.profilePicture = req.file.filename;
    }

    let adminToUpdate = [
      "name",
      "password",
      "role",
      "profilePicture",
      "status",
      "email",
    ];

    for (let property of adminToUpdate) {
      if (bodyData[property]) {
        if (property === "password") {
          // Hash the password before updating
          const hashedPassword = await bcrypt.hash(bodyData[property], 10);
          admin[property] = hashedPassword;
        } else {
          admin[property] = bodyData[property];
        }
      }
      if (property === "profilePicture" && req?.file?.filename) {
        admin[property] = req?.file?.filename;
      }
    }

    const newdata = await admin.save();

    return res.status(200).send({
      message: "Admin Profile Updated",
      success: true,
      data: admin,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const getSingleAdmin = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const singleAdmin = await Admin.findById({ _id: id });

    if (!singleAdmin) {
      return res.status(404).send({
        message: "no admin found with this id",
        success: false,
      });
    }

    res.status(200).send({
      message: "data fetch succesfully",
      success: true,
      data: singleAdmin,
    });
  } catch (error) {
    return res.status(500).send({
      message: "internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const deleteAdminById = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const findAdmin = await Admin.findByIdAndDelete({ _id: id });

    if (!findAdmin) {
      return res.status(404).send({
        message: "no admin found with this id",
        success: false,
      });
    }

    res.status(200).send({
      message: "Admin deleted successfully",
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
