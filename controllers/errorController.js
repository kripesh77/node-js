const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleDuplicateNameEntry = (err) => {
  // Tip: Don't try to remember the field names
  // try to grab the concept
  // these fields are referenced from the error and then written
  return new AppError(`${err.keyValue.name} already exists`, 400);
};

const handleValidationError = (err) => {
  const errorMessage = Object.values(err.errors)
    .map((el) => el.message)
    .join('. ');
  console.log(errorMessage);
  return new AppError(`Invalid input data. ${errorMessage}`, 400);
};

const sendErrorDev = (err, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational: send response to the client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other unknown error: don't leak error details to the client
  } else {
    // 1) log the error:
    console.error('ERROR 💥', err);

    // 2) Send the generic message:
    return res
      .status(500)
      .json({ status: 'error', message: 'Something went very wrong!' });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // In production, we want to leak as little information to the client as possible
  // while in development, we want as detailed error information as possible
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    /* 
    let error = { ...err };
    console.log(err.name); // CastError
    console.log(error.name); // undefined
    why this happens?
    - because when you spread an Error object, it only copies enumerable properties,
    - but Error's name property (and other properties like message, stack) are non-enumerable by default.
     */

    // Solution: is to explicitely copy these properties
    let error = {
      ...err,
      name: err.name,
      message: err.message,
      stack: err.stack,
    };

    // Let's be clear about why we're doing these things
    // mongoose automatically throws error when errors like:
    // - Invalid objectId, duplicate unique field, validation errors, etc, happens.
    // These errors won't get isOperational flag because they are not passed through AppError
    // But these are operational error and are expected to be operational
    // so we're explicitely passing then through AppError so that these errors become operational
    // That's it.
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateNameEntry(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    sendErrorProd(error, res);
  }
};
