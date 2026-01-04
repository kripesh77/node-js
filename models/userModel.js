const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A name is required'],
    minlength: [3, 'A name should be atleast 3 character long'],
  },
  email: {
    type: String,
    required: [true, 'Email is a must'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: function (val) {
        return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
          val,
        );
      },
      message:
        'Password must be at least 8 characters long and include a letter, a number, and a special character',
    },
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (val) {
        return this.password === val;
      },
      message: 'Passwords do not match!',
    },
  },
});

const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;
