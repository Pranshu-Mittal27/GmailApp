// importing libraries required and modules from other files
const express = require('express');
const authRoutes = require('./authroutes');

const app = express();

// Binding imported routes with app object.
app.use('/', authRoutes);

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});