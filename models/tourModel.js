const mongoose = require('mongoose');

mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log('database connected successfully'));

const tourSchema = new mongoose.Schema(
  {
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//virtual property of mongoose allows us to include extra fields in the documents that are not in the database.
//These fields are usually derived from one of the existing fields in the database just like below.
//virtual('durationWeeks'), means durationWeeks field will be added on the returning document
//.get means the durationWeeks field will be added only when get request is received on the server
//Also just by doing the following won't get the virtual field on our document
//For that we've to explicitely define it in our schema to include the virtual property
//`{ toJSON: { virtuals: true }, toObject: { virtuals: true} }`, this allows virtuals to be a part of the documents.
//Note: We cannot query by the virtual fields because it's not the part of the database.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

const TourModel = mongoose.model('Tour', tourSchema);
module.exports = TourModel;
