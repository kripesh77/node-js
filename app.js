const express = require('express');
const morgan = require('morgan');

const app = express();

// because the query wasn't parsing ?duration[gte]=5 as {duration: { gte: 5}} but as {duration[gte]=5}
app.set('query parser', 'extended');

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

module.exports = app;
