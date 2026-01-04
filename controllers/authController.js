// We will do most of the user related stuffs like:
// -creating new users, logging users in, or updating password in authentication controllers
// -All these stuffs related to the authentication will be in authentication controllers rather than user controllers

const UserModel = require('../models/userModel');
const catchAsyncError = require('../utils/catchAsyncError');

exports.signup = catchAsyncError(async (req, res, next) => {
  const newUser = await UserModel.create(req.body);
  return res.status(201).json({ status: 'success', data: { user: newUser } });
});
