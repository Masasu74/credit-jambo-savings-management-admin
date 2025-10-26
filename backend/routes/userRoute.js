import express from "express";
import {
  registerUser,
  listUsers,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUser,
  updateProfile,
  deleteProfilePicture,
  deleteUser,
  listResponsibleOfficers,
  changeUserPassword
} from "../controllers/userController.js";

import authMiddleware from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";
import { cacheMiddleware } from "../middleware/cache.js";
import { uploadToCloudinary } from "../middleware/cloudinaryUpload.js";

const userRouter = express.Router();

// ✅ Public route for login
userRouter.post("/login", loginUser);

// ✅ Protected route for logout
userRouter.post("/logout", authMiddleware, logoutUser);

// ✅ Protected routes
userRouter.post(
  "/register",
  authMiddleware,
  authorize(["admin", "manager", "branch-manager"]),
  registerUser
);

userRouter.get(
  "/list",
  authMiddleware,
  authorize(["support", "admin", "manager", "branch-manager"]),
  cacheMiddleware(2 * 60 * 1000), // Cache for 2 minutes
  listUsers
);

// ✅ Responsible Officers – accessible to support and above
userRouter.get(
  "/responsible-officers",
  authMiddleware,
  authorize(["support","auditor","reporting","accountant","loan-officer","collections-officer","branch-manager","manager","admin"]),
  cacheMiddleware(2 * 60 * 1000),
  listResponsibleOfficers
);

userRouter.get("/me", authMiddleware, getCurrentUser);

userRouter.put("/profile", authMiddleware, uploadToCloudinary("profilePicture", 1, { folder: 'profiles' }), updateProfile);

userRouter.delete("/profile/picture", authMiddleware, deleteProfilePicture);

userRouter.put(
  "/:id",
  authMiddleware,
  authorize(["admin", "manager", "branch-manager"]),
  updateUser
);

userRouter.delete(
  "/:id",
  authMiddleware,
  authorize(["admin"]),
  deleteUser
);

// Password change route - only admin and manager can access
userRouter.put(
  "/:userId/password",
  authMiddleware,
  authorize(["admin", "manager"]),
  changeUserPassword
);

export default userRouter;
