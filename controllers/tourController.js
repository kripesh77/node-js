const TourModel = require('../models/tourModel');

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
    // 1A) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'fields', 'sort', 'limit'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced Filtering
    // meaning we want to now filter with something like:
    // ?duration[gte]=5, which will be converted to:
    // {duration: {gte: 5}} in req.query;
    // why we're doing this?
    // because filter of mongodb looks something like: {duration: {$gte: 5}}
    // so we want to match that directly through the url.
    // Now, we just have to replace gte,gt,lte,lt to $gte,$gt,$lte,$lt if present any.
    // so let's do it by:
    // queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let queryStr = JSON.stringify(queryObj);
    queryStr = JSON.parse(
      queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`),
    );

    let query = TourModel.find(queryStr); // If we await it right here, we won't be able to chain other methods like .sort(), .limit() and so on.

    // 2) Sorting
    if (req.query.sort) {
      // In mongoose we can sort by multiple field by `.sort(field1 field2)`
      // but we've to request from the url like this: 3000?sort=-field1,field2 (-field for descending order)
      // so we've to convert comma (",") to a space (" ")
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      // If user doesn't specify a sort field on the url, we still sort based on some criteria
      // In this case `-createdAt`
      query = query.sort('-createdAt');
    }

    // 3) Field Limiting
    // for a client, it's always ideal to send as little data as possible to reduce bandwidth
    // how it works?
    // a. In the url: 3000?fields=name,price,duration,difficulty
    // b. so we should return only the fields specified on the url in that case
    // c. In this case as well, we should pass `name price duration difficulty`
    //    so we have to convert comma (",") into space(" ")
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields); //selecting and returning the required data
    } else {
      query = query.select('-__v');
    }

    // 4) Pagination
    // * 1 to convert string to number
    const limit = req.query.limit * 1 || 8;
    const page = req.query.page * 1 || 1;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = await TourModel.countDocuments();
      if (skip >= numTours) throw new Error('Page not found');
    }

    //Execute Query
    const tours = await query; // This is done so that we can chain query methods on it.

    return res.status(200).json({
      status: 'success',
      results: tours.length,
      page: page,
      limit: limit,
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
    return res.status(400).json({ status: 'fail', message: err });
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
