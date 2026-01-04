const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

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
      // this only works on CREATE and SAVE!!!
      // so for this reason, when we are updating the password
      // we've to use .save() as well and not findOneAndUpdate() or updateOne()
      // E.g:
      /* 
        Always update passwords via .save() in controller
          const user = await User.findById(id);
          user.password = newPassword;
          user.passwordConfirm = confirmPassword;
          await user.save();
       */
      validator: function (val) {
        return this.password === val;
      },
      message: 'Passwords do not match!',
    },
  },
});

// JUST DISCOVERED, next() in pre document middleware like below is deprecated from mongoose 9.x
userSchema.pre('save', async function () {
  // we want to hash the password only if new user is being created or user is actually updating the password
  // Not when other fields are being updated
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;
