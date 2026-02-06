const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // MUST match login payload
    req.user = {
      id: decoded._id,   // must exist in token
      role: decoded.role,   // must exist in token
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
