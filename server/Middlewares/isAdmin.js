export const admin = (req, res, next) => {
  // Redirect to use the protect middleware instead
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      status: "fail",
      message: "Admin access only",
      data: [],
    });
  }
};