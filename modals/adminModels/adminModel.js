import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
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
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roles",
    },
    status: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
    },

    otpCode: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.pre(/^find/, function (next) {
  this.populate({
    path: "role",
    select: "-__v",
  });
  next();
});

const adminModal = mongoose.model("Admins", adminSchema);

export default adminModal;
