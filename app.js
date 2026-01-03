const express = require('express');
const morgan = require('morgan');

const app = express();

// because the query wasn't parsing ?duration[gte]=5 as {duration: { gte: 5}} but as {duration[gte]=5}
app.set('query parser', 'extended');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
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
  next(new AppError(`can't find ${req.originalUrl}`, 404));
});

// global error handler
app.use(globalErrorHandler);

module.exports = app;
