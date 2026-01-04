const jwt = require('jsonwebtoken');

exports.signJWT = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

exports.verifyJWT = (token) => {
  const data = jwt.verify(token, process.env.JWT_SECRET);
  return data;
};
