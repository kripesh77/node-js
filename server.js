const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });
const app = require('./app');

const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log('database connected successfully'));

const server = app.listen(port, () => {
  console.log(`server started at ${3000}`);
});

// In this application, if we get unhandled rejection (such as unhandled promise rejections or something like that)
// Our application doesn't handle it, so we have to handle it somewhere
// So we handle unhandled rejections globally as:
// NOTE: Each time there is an unhandled rejection somewhere in our application, the process object will emit an object called `unhandledRejection`
// So idea is to just subscribe to that event like this:
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! 💥 SHUTTING DOWN...');
  // 0 means success
  // 1 means uncaught exception
  // what we did previously will immediately crash the server without completing the currently running processes
  // So we've to first wait for all processes to complete and then only crash our server like this:
  server.close(() => {
    process.exit(1); // crashing the server
  });
});
// One of the unhandled rejection that this handles is the database connection error in mongoose
// But it can handle any kind of unhandled rejection in our application
