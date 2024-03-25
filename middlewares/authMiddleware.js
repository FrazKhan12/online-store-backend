import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const authMiddleware = catchAsync(async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err) {
        throw new Error();
      } else {
        req.body._id = decode.id;
        next();
      }
    });
  } catch (error) {
    return res.status(500).send({
      message: "Authorization failed",
      success: false,
      error: error.message,
    });
  }
});

export default authMiddleware;
