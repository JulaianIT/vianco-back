const express = require("express");
const loginController = require("../controllers/loginController");
const router = express.Router();

router.get("/index", loginController.login);
router.post("/index", loginController.auth);
router.get("/register", loginController.register);
router.post("/register", loginController.storeUser);
router.get("/logout", loginController.logout); // Cambiar '/login' por '/logout'

module.exports = router;
