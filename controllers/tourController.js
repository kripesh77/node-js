const TourModel = require('../models/tourModel');
const APIFeatures = require('../utils/APIFeatures');

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
exports.getAllTours = async (req, res) => {
  try {
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
  } catch (err) {
    return res.status(404).json({ status: 'error', message: { err } });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await TourModel.findById(req.params.id);
    return res.status(200).json({ status: 'success', data: { tour } });
  } catch (err) {
    return res.status(404).json({ status: 'error', err });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await TourModel.create(req.body);
    return res.status(200).json({
      status: 'success',
      data: { newTour },
    });
  } catch (err) {
    return res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const updatedTour = await TourModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    return res
      .status(200)
      .json({ status: 'success', data: { tour: updatedTour } });
  } catch (err) {
    return res.status(404).json({ status: 'fail', message: err });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await TourModel.findByIdAndDelete(req.params.id);
    return res.status(204).json({ data: null });
  } catch (err) {
    return res.status(400).json({ status: 'fail', message: err });
  }
};

exports.getTourStats = async (req, res) => {
  try {
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
  } catch (err) {
    return res.status(404).json({ status: 'fail', message: { err } });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (err) {
    return res.status(404).json({ status: 'fail', message: { err } });
  }
};
