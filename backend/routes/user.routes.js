import express from "express";
import { Login, Logout, signUp } from "../controllers/user.controller.js";
import { getCurrentUser } from "../controllers/use.controller.js";
import isAuth from "../middleware/isAuth.js";

const userRouter = express.Router();

userRouter.get("/current", isAuth, getCurrentUser);
userRouter.get("/logout", isAuth, Logout);

export default userRouter;
