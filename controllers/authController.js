// We will do most of the user related stuffs like:
// -creating new users, logging users in, or updating password in authentication controllers
// -All these stuffs related to the authentication will be in authentication controllers rather than user controllers

const UserModel = require('../models/userModel');
const catchAsyncError = require('../utils/catchAsyncError');
const AppError = require('../utils/appError');
const { signJWT, verifyJWT } = require('../utils/signAndVerifyJWT');

exports.signup = catchAsyncError(async (req, res, next) => {
  // one can send role="admin" or similar in req.body, so we donot accept whole req.body directly
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await UserModel.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  const token = await signJWT(newUser._id);
  return res
    .status(201)
    .json({ status: 'success', token, data: { user: newUser } });
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body || {};

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
  const token = await signJWT(user._id);

  return res
    .status(200)
    .json({ status: 'success', token, data: { user: user } });
});

exports.protect = catchAsyncError(async (req, res, next) => {
  // 1) Getting the token
  let token;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError("You're not logged in! Please log in.", 401));
  }

  // 2) Verifying the token
  const decoded = await verifyJWT(token);

  // 3) Checking the user actually exists
  const freshUser = await UserModel.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('User no longer exists', 404));
  }

  // 4) Check if user changed password after JWT was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password is recently changed! Please login again.', 401),
    );
  }

  // GRANT access to the protected route
  req.user = freshUser;
  next();
});

// Authorization
// Even if user is logged in, we can't let them perform all sort of actions
// E.g we can't let all user's delete our tours
// In Authorization, we check if certain user is allowed to access resource or not
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Your role doesn't have access to this resource", 403),
      );
    }
    next();
  };
};
