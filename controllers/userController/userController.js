import User from "../../modals/userModal.js";
import AppError from "../../utils/appError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";
import crypto from "crypto";
import { sendActivationLinkToUser } from "../../utils/email/emailTemlates.js";
import sendEmail from "../../utils/email/sendEmail.js";
import Stripe from "stripe";
import Payment from "../../modals/paymentModel.js";
import Order from "../../modals/orderModel.js";
dotenv.config();

var folderName = "images/";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `public/`);
  },
  filename: function (req, file, cb) {
    cb(null, `${folderName}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export const uploadPhoto = upload.single("profilePicture");

export const userRegister = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return next(new AppError("User already exist", 404));
    }

    const checkUserName = await User.findOne({ userName: req.body.userName });

    if (checkUserName) {
      const addTo = Math.floor(Math.random() * 1000);
      req.body.userName += addTo;
    }

    if (req.file) {
      req.body.profilePicture = req.file.filename;
    }

    const hash = await bcrypt.genSalt(10); // Corrected line
    const dcryptPass = await bcrypt.hash(req.body.password, hash);
    req.body.password = dcryptPass;

    const newUser = new User(req.body);
    const _user = await newUser.save();

    if (_user.isVerified) {
      res.status(200).send({
        message: "Thanks for register",
        success: true,
        data: newUser,
      });
    } else {
      await verifyAccount(_user, res, req?.body?.origin);
      res.status(200).send({
        message: "Please check your inbox/spam mail to verify your account",
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
});

export const userLogin = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).send({
        message: "User not found",
        success: false,
      });
    }

    const checkPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!checkPassword) {
      return res.status(400).send({
        message: "Wrong Credentials",
        success: false,
      });
    } else {
      let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res.status(200).send({
        message: "Login Successfully",
        success: true,
        data: token,
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
});

export const userAuth = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req?.body?._id });
    if (!user) {
      return res.status(404).send({
        message: "No user found with this id",
        success: false,
      });
    } else {
      res.status(200).send({
        message: "user fetch",
        success: true,
        data: user,
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: "internal server error",
      success: false,
      error: error.message,
    });
  }
});

const verifyAccount = catchAsync(async (user, res, origin) => {
  const _token = user.generateVerificationToken();
  await user.save();
  let subject = "Account Verification";
  let to = user.email;
  let link = `${origin}/${_token}`;
  let html = sendActivationLinkToUser(user, link);
  try {
    await sendEmail({ to, subject, html });
  } catch (error) {
    user.token = null;
    user.tokenExpiresIn = null;
    await user.save();
    res.status(500).send({
      message: error.message,
      success: false,
    });
  }
});

export const verify = catchAsync(async (req, res, next) => {
  try {
    let _token = req.params.token;

    const compareToken = crypto
      .createHash("sha256")
      .update(_token)
      .digest("hex");

    const user = await User.findOne({
      token: compareToken,
      tokenExpiresIn: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(401).send({
        message: "Verification token has been invalid or has been expired!",
        success: false,
      });
    } else {
      user.isVerified = true;
      user.token = null;
      user.tokenExpiresIn = null;
      await user.save();
      res
        .status(200)
        .send({ success: true, message: "Your account has been verified!" });
    }
  } catch (error) {
    return res.status(500).send({
      message: "internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const getAllUsers = catchAsync(async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).send({
      success: false,
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

export const stripePayment = catchAsync(async (req, res, next) => {
  try {
    const { orderId, amount } = req?.body;

    const stripe = new Stripe(
      "sk_test_51Oua6q07U8GQEuIaTvKezjPXPgwf4FfMf6DdOfHODCX7dVTvhVMJ91Kl8TlCWrqzJLytbowGjSJ3hlrFpyiOf9ND009SKa8dPk"
    );
    const stripePaymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
    });

    const orderDetails = await Order.findOne({ _id: orderId }).populate();
    if (!orderId) {
      return res.status(404).send({
        message: "No order forund with this id",
        success: false,
      });
    }

    const payment = new Payment({
      orderId: orderDetails,
      amount: stripePaymentIntent.amount,
      status: stripePaymentIntent.status,
    });

    await payment.save();

    res.status(200).send({
      clientSecret: stripePaymentIntent.client_secret,
      message: "Payment successful",
      data: orderDetails,
    });
  } catch (error) {
    res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});

export const updateUserProfile = catchAsync(async (req, res, next) => {
  try {
    let { id } = req.params;
    let bodyData = req.body;
    let user = await User.findById(id);

    if (!user) {
      return next(new AppError("No user found with this ID", 404));
    }

    let existingEmail = await User.findOne({ email: req?.body?.email });

    if (existingEmail && user.email !== req?.body?.email) {
      return next(new AppError("Email already exist", 401));
    }

    let existingUsername = await User.findOne({
      username: new RegExp(`^${req?.body?.name}$`, "i"),
    });

    if (existingUsername && user.name !== req?.body?.name) {
      return next(new AppError("Username already exist", 401));
    }

    if (req.file && user.profilePicture !== req.file.filename) {
      if (
        user.profilePicture &&
        fs.existsSync(`public/${user.profilePicture}`)
      ) {
        fs.unlink(`public/${user.profilePicture}`, (error) => {
          if (error) {
            throw error;
          }
        });
      }
      user.profilePicture = req.file.filename;
    }

    let userToUpdate = [
      "firstName",
      "lastName",
      "userName",
      "email",
      "password",
      "address",
      "phone",
      "profilePicture",
    ];

    for (let property of userToUpdate) {
      if (bodyData[property]) {
        if (property === "password") {
          const hashedPassword = await bcrypt.hash(bodyData[property], 10);
          user[property] = hashedPassword;
        } else {
          user[property] = bodyData[property];
        }
      }
      if (property === "profilePicture" && req?.file?.filename) {
        user[property] = req?.file?.filename;
      }
    }

    const newdata = await user.save();

    return res.status(200).send({
      message: "User Profile Updated",
      success: true,
      data: newdata,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
});
