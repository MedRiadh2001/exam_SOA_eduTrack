const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: String,
  description: String
});

module.exports = mongoose.model('Course', CourseSchema);
