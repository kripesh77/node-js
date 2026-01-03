const TourModel = require('../models/tourModel');
const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/appError');
const catchAsyncError = require('../utils/catchAsyncError');

//middleware
exports.aliasTopTours = (req, res, next) => {
  // We could have done this
  //  req.query.limit = '5';
  //  req.query.sort = '-ratingAverage,price';
  //  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  // But express team updated req.query as only a getter
  // means we can't directly modify it.
  // Previously the above code would have worked but now we've to follow a different approach
  // Now, we've to modify the url itself
  const query = new URLSearchParams(req.query);
  query.set('limit', 5);
  query.set('fields', 'name,price,ratingsAverage,summary,difficulty');
  query.set('sort', '-ratingAverage,price');
  req.url = `${req.path}?${query.toString()}`;
  next();
};

//route controllers
exports.getAllTours = catchAsyncError(async (req, res, next) => {
  const features = new APIFeatures(TourModel.find(), req.query)
    .filter()
    .sort()
    .project()
    .paginate();

  //Execute Query
  const tours = await features.query; // This is done so that we can chain query methods on it.
  return res.status(200).json({
    status: 'success',
    results: tours.length,
    page: features.pageInfo.page,
    limit: features.pageInfo.limit,
    data: { tours },
  });
});

exports.getTour = catchAsyncError(async (req, res, next) => {
  const tour = await TourModel.findById(req.params.id);
  if (!tour) {
    // By default the catchAsyncError throws error if promise is rejected
    // and it will always be a non-operational error
    // For the error's like this one having no tours, we can explicitely throw the AppError as:
    return next(new AppError("This tour doesn't exists", 404));
  }
  return res.status(200).json({ status: 'success', data: { tour } });
});

// Better way of handling async errors
exports.createTour = catchAsyncError(async (req, res, next) => {
  const newTour = await TourModel.create(req.body);
  return res.status(200).json({
    status: 'success',
    data: { newTour },
  });
});

exports.updateTour = catchAsyncError(async (req, res, next) => {
  const updatedTour = await TourModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true, // this ensures validator's defined on model schema runs once again on update
    },
  );

  if (!tour) {
    return next(new AppError("This tour doesn't exists", 404));
  }

  return res
    .status(200)
    .json({ status: 'success', data: { tour: updatedTour } });
});

exports.deleteTour = catchAsyncError(async (req, res, next) => {
  const tour = await TourModel.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError("This tour doesn't exists", 404));
  }

  return res.status(204).json({ data: null });
});

exports.getTourStats = catchAsyncError(async (req, res, next) => {
  const stats = await TourModel.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
  ]);
  return res.status(200).json({ status: 'success', data: { stats } });
});

exports.getMonthlyPlan = catchAsyncError(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await TourModel.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numToursStarts: -1 },
    },
    // {
    //   $limit: 6
    // }
  ]);
  return res
    .status(200)
    .json({ status: 'success', result: plan.length, data: { plan } });
});
