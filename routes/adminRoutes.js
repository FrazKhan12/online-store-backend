import express from "express";
import {
  getAllUsers,
  getAllAdmin,
  getSingleUser,
  adminAuth,
  adminRegister,
  adminLogin,
  uploadAdminPhoto,
  updateAdminProfile,
  getSingleAdmin,
  deleteAdminById,
} from "../controllers/adminControllers/adminController.js";
import {
  addProduct,
  deleteProduct,
  getAllProduct,
  getAllProductByCategories,
  getSingleProductById,
  updateProduct,
  uploadProductPhoto,
} from "../controllers/adminControllers/productController.js";
import {
  createCategory,
  getCategories,
  getSingleCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/adminControllers/categoryController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createRole,
  getAllRoles,
  getSingleRoleById,
  updateRole,
  deleteRole,
} from "../controllers/roleController.js";

const router = express.Router();

// auth route
router.post("/admin-register", uploadAdminPhoto, adminRegister);
router.post("/admin-login", adminLogin);
router.post("/get-admin-info-by-id", authMiddleware, adminAuth);
router.post(
  "/update-admin-profile/:id",
  authMiddleware,
  uploadAdminPhoto,
  updateAdminProfile
);
router.delete("/delete-admin/:id", authMiddleware, deleteAdminById);

router.get("/get-all-admins", getAllAdmin);
router.get("/get-single-admin/:id", getSingleAdmin);
router.get("/get-all-users", getAllUsers);
router.get("/get-single-user/:id", getSingleUser);

// product route
router.post("/add-product", uploadProductPhoto, addProduct);
router.get("/get-products", getAllProduct);
router.post("/get-products-by-categories", getAllProductByCategories);
router.get("/get-single-product/:id", getSingleProductById);
router.delete("/delete-product/:id", authMiddleware, deleteProduct);
router.post(
  "/update-product/:id",
  authMiddleware,
  uploadProductPhoto,
  updateProduct
);

// category route
router.post("/create-category", createCategory);
router.get("/get-categories", getCategories);
router.get("/get-single-category/:id", getSingleCategoryById);
router.delete("/delete-category/:id", authMiddleware, deleteCategory);
router.put("/update-category/:id", updateCategory);

// Role routes
router.post("/create-role", createRole);
router.put("/update-role/:id", updateRole);
router.delete("/delete-role/:id", deleteRole);
router.get("/get-all-roles", getAllRoles);
router.get("/get-role-by-id/:id", getSingleRoleById);

// Order Route

export default router;
