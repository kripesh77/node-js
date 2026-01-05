const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

exports.signJWT = async (id) => {
  const token = await signAsync({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

exports.verifyJWT = async (token) => {
  const data = await verifyAsync(token, process.env.JWT_SECRET);
  return data;
};
