import express from "express";
import {
  userRegister,
  userLogin,
  uploadPhoto,
  verify,
  getAllUsers,
  userAuth,
  updateUserProfile,
} from "../controllers/userController/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { checkout } from "../controllers/orderCOntroller.js";

const router = express.Router();

router.post("/user-register", uploadPhoto, userRegister);
router.post("/user-login", userLogin);
router.post("/get-user-info-by-id", authMiddleware, userAuth);
router.post("/update-user-data/:id", uploadPhoto, updateUserProfile);

router.get("/verify/:token", verify);
router.get("/get-all-users", getAllUsers);

// strip checkout

router.post("/checkout", checkout);

export default router;
