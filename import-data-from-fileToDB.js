const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const fs = require('fs/promises');
const mongoose = require('mongoose');
const TourModel = require('./models/tourModel');

console.log(process.env);

mongoose.connect(process.env.DATABASE).then(async () => {
  console.log('Database connected successfully');
  const content = await fs.readFile(
    './dev-data/data/tours-simple.json',
    'utf8',
  );
  const contentWithoutId = JSON.parse(content).map(({ id, ...item }) => item);
  const insertedData = await TourModel.insertMany(contentWithoutId);
  console.log(insertedData);
});

console.log(process.env.DATABASE);
