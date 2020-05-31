const express = require("express");
const bodyParser = require("body-parser");
const { check } = require("express-validator");
const HttpError = require("../models/http-error");
const usersController = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload")

const router = express.Router();

//Retrive Users
router.get("/", usersController.getUsers);

//Create Users

router.post(
  "/signup",
  fileUpload.single('image'),
  [
    check("name").notEmpty(),
    check("email").isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.createUser
);

router.post("/login",[
    check("email").normalizeEmail().isEmail(), // Normalize Email convert Test@test.com => test@test.com
    check("password").isLength({ min: 5 })
], usersController.login);

module.exports = router;
