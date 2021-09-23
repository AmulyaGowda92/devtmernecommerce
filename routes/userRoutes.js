const router = require("express").Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/logout", userController.logout);
router.get("/refreshtoken", userController.refreshToken);
router.get("/info", auth, userController.getUserInfo);
module.exports = router;
