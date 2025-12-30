const TourModel = require('../models/tourModel');

//route controllers
exports.getAllTours = async (req, res) => {
  try {
    // 1) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'fields', 'sort', 'limit'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 2) Advanced Filtering
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

    const query = TourModel.find(queryStr); // If we await it right here, we won't be able to chain other methods like .sort(), .limit() and so on.

    const tours = await query; // This is done so that we can chain query methods on it.

    return res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours },
    });
  } catch (err) {
    return res.status(404).json({ status: 'error', err });
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
