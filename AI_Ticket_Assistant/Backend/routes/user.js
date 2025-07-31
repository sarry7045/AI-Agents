import express from "express";
import {
  getUser,
  login,
  logout,
  signup,
  updateUser,
} from "../controllers/user.js";
import { authenticate } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.post("/update-user", authenticate, updateUser);
userRouter.get("/users", authenticate, getUser);

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.post("/logout", logout);

export default userRouter;
