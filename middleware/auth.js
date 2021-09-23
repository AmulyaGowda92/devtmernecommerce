const jwt = require("jsonwebtoken");

const userAuth = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    res.status(400).json({ msg: "Invalid Authentication" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(400).json({ msg: err.message });
    req.user = user;
    next();
  });
};

module.exports = userAuth;
