import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    newPassword: {
      type: String,
    },
    address: {
      type: String,
      require: true,
    },
    phone: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
    },
    tokenExpiresIn: {
      type: Date,
    },

    otpCode: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN,
  });
};

userSchema.methods.generateVerificationToken = function () {
  const _token = crypto.randomBytes(20).toString("hex");
  this.token = crypto.createHash("sha256").update(_token).digest("hex");
  this.tokenExpiresIn = Date.now() + 720000;

  return _token;
};

const userModal = mongoose.model("Users", userSchema);

export default userModal;
