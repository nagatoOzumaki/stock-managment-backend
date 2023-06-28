const express = require("express");
const router = express.Router();
const protect = require("../maiddleWare/authMiddleware");
const {contactUs} = require("../controllers/contactController");

router.post("/" , protect, contactUs);

module.exports = router;