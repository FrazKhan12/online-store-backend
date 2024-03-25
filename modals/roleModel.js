import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },

    // Products Managment
    viewProducts: { type: Boolean, default: false },
    editProducts: { type: Boolean, default: false },
    deleteProducts: { type: Boolean, default: false },

    // Categories Managment
    viewCategory: { type: Boolean, default: false },
    editCategory: { type: Boolean, default: false },
    deleteCategory: { type: Boolean, default: false },

    // Admin Users Managment
    addAdmin: { type: Boolean, default: false },
    editAdmin: { type: Boolean, default: false },
    deleteAdmin: { type: Boolean, default: false },

    // Users Managment
    viewUser: { type: Boolean, default: false },
    deleteUser: { type: Boolean, default: false },

    // Users Managment
    editRole: { type: Boolean, default: false },
    deleteRole: { type: Boolean, default: false },

    status: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const roleModel = new mongoose.model("Roles", roleSchema);

export default roleModel;
