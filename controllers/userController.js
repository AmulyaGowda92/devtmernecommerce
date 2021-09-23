const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userController = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const user = await User.findOne({ email });
      if (user)
        return res.status(400).json({ msg: "The email already exists" });

      if (password.length < 6)
        return res
          .status(400)
          .json({ msg: "Password must be atleast 6 characters" });

      //   ----- PASSWORD ENCRYPTION----
      const hashPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        name,
        email,
        password: hashPassword,
      });
      //   res.json({ password, hashPassword });
      //   res.json(newUser);

      await newUser.save();

      // --- GENERATE ACCESS TOKEN---
      const accesstoken = createAccesstoken({ id: newUser._id });
      const refreshtoken = createRefreshtoken({ id: newUser._id });
      res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        path: "/api/users/refreshtoken",
      });

      res.json(accesstoken);
      //   res.json(refreshtoken);
      //   res.status(200).json({ msg: "Registration successfull..." });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  // ---- LOGIN----
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const userFound = await User.findOne({ email });
      if (!userFound) {
        res.status(400).json({ msg: "User dosent exist" });
      }

      const isMatch = await bcrypt.compare(password, userFound.password);
      if (!isMatch) {
        res.status(400).json({ msg: "Password dosent Match" });
      }

      // --- if Login successfull create access token and refresh token---
      const accesstoken = createAccesstoken({ id: userFound._id });
      const refreshtoken = createRefreshtoken({ id: userFound._id });
      res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        path: "/api/users/refreshtoken",
      });

      res.json({ msg: "Login Successfull", accesstoken });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", { path: "/api/users/refreshtoken" });
      return res.json({ msg: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },

  refreshToken: (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token) {
        return res.status(400).json({ msg: "Please Login or Register" });
      }

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err)
          return res.status(400).json({ msg: "Please Login or Register" });

        const access_token = createAccesstoken({ id: user._id });

        res.json({ access_token });
      });
      // res.json({ rf_token });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  getUserInfo: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) {
        return res.status(400).json({ msg: "User does not exist" });
      }
      res.json(user);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};

// ---- FUNCTION FOR TOKEN AUTHENTICATION----
const createAccesstoken = (user) => {
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

const createRefreshtoken = (user) => {
  const refresh_token = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return refresh_token;
};

module.exports = userController;
