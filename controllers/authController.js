// We will do most of the user related stuffs like:
// -creating new users, logging users in, or updating password in authentication controllers
// -All these stuffs related to the authentication will be in authentication controllers rather than user controllers

const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const catchAsyncError = require('../utils/catchAsyncError');

exports.signup = catchAsyncError(async (req, res, next) => {
  // one can send role="admin" or similar in req.body, so we donot accept whole req.body directly
  const newUser = await UserModel.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return res
    .status(201)
    .json({ status: 'success', token, data: { user: newUser } });
});
