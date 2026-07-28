import express from "express";
import { Login, Logout, signUp } from "../controllers/user.controller.js";
import { getCurrentUser } from "../controllers/use.controller.js";

const userRouter = express.Router();

userRouter.get("/logout", getCurrentUser);

export default userRouter;
