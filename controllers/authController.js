// We will do most of the user related stuffs like:
// -creating new users, logging users in, or updating password in authentication controllers
// -All these stuffs related to the authentication will be in authentication controllers rather than user controllers

const UserModel = require('../models/userModel');
const catchAsyncError = require('../utils/catchAsyncError');
const AppError = require('../utils/appError');
const { signJWT } = require('../utils/signAndVerifyJWT');

exports.signup = catchAsyncError(async (req, res, next) => {
  // one can send role="admin" or similar in req.body, so we donot accept whole req.body directly
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await UserModel.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  const token = signJWT(newUser._id);
  return res
    .status(201)
    .json({ status: 'success', token, data: { user: newUser } });
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and password exists in the body
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  /* separately
  // 2) check if user exists
  const user = await UserModel.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError(`User with that email doesn't exists`, 404));
  }

  // 3) check the password
  if (!(await user.comparePassword(password, user.password))) {
    return next(new AppError(`Invalid password`, 401));
  }
 */

  // 2) check if user exists or password is correct
  // preferred way
  const user = await UserModel.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`Email and password is not valid!`, 401));
  }

  // 3) send back token
  user.password = undefined;
  const token = signJWT(user._id);

  return res
    .status(200)
    .json({ status: 'success', token, data: { user: user } });
});
