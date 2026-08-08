import express from "express";
import { Login, Logout, signUp } from "../controllers/user.controller.js";
import { askToAssistant, getCurrentUser } from "../controllers/use.controller.js";
import isAuth from "../middleware/isAuth.js";
import { updateAssistant } from "../controllers/use.controller.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update", isAuth,upload.single("assistantImage"), updateAssistant);
userRouter.post("/asktoassistant",isAuth,askToAssistant)
export default userRouter;
