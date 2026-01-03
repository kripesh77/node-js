const express = require('express');
const morgan = require('morgan');

const app = express();

// because the query wasn't parsing ?duration[gte]=5 as {duration: { gte: 5}} but as {duration[gte]=5}
app.set('query parser', 'extended');

const AppError = require('./utils/appError');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours', updateTour);
// app.delete('/api/v1/tours', deleteTour);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// We don't do this anymore to handle unhandled route
// app.all('*', (req, res, next) => {
//   res
//     .status(404)
//     .json({ status: 'fail', message: `can't find ${req.originalUrl}` });
// });

// we do this
app.use((req, res, next) => {
  // creating an error
  const err = new AppError(`can't find ${req.originalUrl}`, 404);
  next(err);
});

// global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  err.message = err.message || 'Internal Server Error !';

  res.status(err.statusCode).json({ status: err.status, message: err.message });
});

module.exports = app;
