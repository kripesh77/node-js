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

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedObj = ['page', 'limit', 'fields', 'sort'];
    excludedObj.forEach((el) => delete queryObj[el]);

    const queryStr = JSON.stringify(queryObj).replace(
      /\b(gt|gte|lt|lte)\b/g,
      (match) => `$${match}`,
    );
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  project() {
    if (this.queryString.fields) {
      const fieldStr = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fieldStr);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const limit = this.queryString.limit * 1 || 8;
    const page = this.queryString.page * 1 || 1;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.pageInfo = { page, limit, skip };
    return this;
  }
}

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
