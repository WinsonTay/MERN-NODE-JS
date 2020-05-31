const HttpError = require("../models/http-error");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken')
const { validationResult } = require("express-validator");
const { v4: uuid } = require("uuid");

DUMMY_USERS = [
  { id: "u1", name: "Winson", email: "winsontay@gmail.com", password: "12345" },
  {
    id: "u2",
    name: "Longkang",
    email: "Longkang@gmail.com",
    password: "12345",
  },
];

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Server Could not Respond, Please Try Again",
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const createUser = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(
      new HttpError("Invalid Inputs for Sign Up, Please Check your Data", 422)
    );
  }
  // Getting Data from Request body
  const { name, email, password, places } = req.body;
  // Check For Users Existence
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing Up Failed, Please Try Again Later",
      500
    );
    return next(error);
  }
  if (existingUser) {
    const error = new HttpError(
      "User exists already,please Login Instead",
      422
    );
    return next(error);
  }

  // Hashing Password
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could Not create user", 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password,
    image: req.file.path,
    password: hashedPassword,
    places,
  });
  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Could Not Sign Up User, Please try Again",
      500
    );
    return next(error);
  }
  let token;
  try {
      token = jwt.sign({
          userId:createdUser.id,
          email:createdUser.email,
          name:createdUser.name
      },process.env.JWT_KEY, {expiresIn:'1h'})
  } catch (err) {
      const error = new HttpError("Sign up User failed, Please Try again", 500)
      return next(error)
  }
  res.status(201).json({ userId:createdUser.id , email:createdUser.email, token:token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
//   MongoDB search User
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging In Failed, Please Try Again Later",
      500
    );
    return next(error);
  }
  if (!existingUser) {
    const error = new HttpError(
      "User email Doesnt exist or Incorrect Password",
      422
    );
    return next(error);
  }
// Check for Valid password
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "User email Doesnt exist or Incorrect Password",
      500
    );
    return next(error);
  }
  if (!isValidPassword) {
    const error = new HttpError(
      "User email Doesnt exist or Incorrect Password",
      422
    );
    return next(error);
  }
  let token;
  try {
      token = jwt.sign({
          userId:existingUser.id,
          email:existingUser.email,
          name:existingUser.name
      },process.env.JWT_KEY, {expiresIn:'1h'})
  } catch (err) {
      const error = new HttpError("Logging in Failed, Please Try again", 500)
      return next(error)
  }

  res.status(200).json({
    userId:existingUser.id,
    email:existingUser.email,
    token:token
  });
};

exports.getUsers = getUsers;
exports.createUser = createUser;
exports.login = login;
