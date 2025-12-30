const mongoose = require('mongoose');

mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log('database connected successfully'));

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true,
  },
  duration: { type: Number, required: [true, 'A tour must have duration'] },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a max group size'],
  },
  difficulty: {
    type: String,
    require: [true, 'A tour must have a difficulty'],
  },
  ratingAverage: { type: Number, default: 4.5 },
  ratingQuantity: { type: Number, default: 0 },
  price: { type: Number, require: [true, 'A tour must have a price'] },
  priceDiscount: Number,
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a summary'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image'],
  },
  images: [String],
  createdAt: { type: Date, default: Date.now(), select: false },
  startDates: [Date],
});

const TourModel = mongoose.model('Tour', tourSchema);
module.exports = TourModel;
