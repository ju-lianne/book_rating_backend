const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const bookRoutes = require('./routes/books.routes');
const userRoutes = require('./routes/user.routes');

mongoose.connect('mongodb+srv://dbUser:FBQa6SLTYNbQmEzl@cluster0.ijofa9c.mongodb.net/',
  { useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connection to MongoDB successful !'))
  .catch(() => console.log('Connection to MongoDB failed !'));

const app = express();

// new way, old way was "body-parser"
// allow the use of request.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// No route specified because we want the middleware to be appplied to every routes of the server
app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;