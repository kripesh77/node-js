const mongoose = require('mongoose');
const slugify = require('slugify');

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
      required: [true, 'A tour must have a difficulty'],
    },
    ratingAverage: { type: Number, default: 4.5 },
    ratingQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price'] },
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
    slug: String,
    secretTour: { type: Boolean, default: false },
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

//Just like express, middlewares in mongoose is also a fundamental concept
// There are 4 types of middlewares in mongoose
// 1) Document Middleware
// 2) Query Middleware
// 3) Aggregate Middleware
// 4) Model Middleware
// Note: Just like virtual property, we define middleware in the schema

// 1) Document Middleware (middleware what can act on the currently processed document)
// `pre` middleware runs before an actual event. In this case the event is `save`
// DOCUMENT MIDDLEWARE: runs before .save() and .create(). not on insertMany or other.
// the anonymous function is gonna be called before the document is actually saved in DB
tourSchema.pre('save', function (/* next */) {
  // seems like we don't need next() anymore in document middleware
  // this keyword points to the processed documents, that's why it's called document middleware
  this.slug = slugify(this.name, { lower: true });
  // next();
});

// this is post document middleware
/* tourSchema.post('save', (doc, next) => {
  // `doc` is the returned document after .save() or .create()
  console.log(doc);
  next();
}); */

// 2) Query Middleware
tourSchema.pre(/^find/, function (/* next */) {
  this.find({ secretTour: { $ne: true } });
  // next(); seems like we don't need next anymore

  this.start = Date.now();
});

// post query middleware
tourSchema.post(/^find/, function (docs) {
  console.log(`Query took: ${Date.now() - this.start} miliseconds`);
  console.log(docs);
});

// 3) Aggregation middleware
tourSchema.pre('aggregate', function () {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this);
});

const TourModel = mongoose.model('Tour', tourSchema);
module.exports = TourModel;
