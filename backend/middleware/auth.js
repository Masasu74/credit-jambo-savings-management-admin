import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      return res.status(401).json({ success: false, message: "Token expired" });
    }

    const user = await User.findById(decoded.id).select("-password").lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    let message = "Authorization failed";

    if (error.name === "TokenExpiredError") message = "Token expired";
    else if (error.name === "JsonWebTokenError") message = "Invalid token";

    return res.status(401).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
};

export default authMiddleware;
