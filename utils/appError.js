class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // operational errors are those errors which are created by devs
    // we can later test for these errors whether they are operational errors or not
    // and only send errors back to the client if they are actually operational
    // and not send other crazy errors that were not created by us
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
