const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const jobSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please Enter a Listing Name'
  },
  description: {
    type: String,
    trim: true,
    required: 'Please Enter a Job Description'
  },
  ftpt: {
    type: String,
    trim: true,
    required: 'Please Specify Whether the Job is Full-Time or Part-Time'
  },
  salary: {
    type: String,
    trim: true,
  },
  requirements: {
    type: String,
    trim: true,
  },
  contact: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
  closed: Boolean,
  slug: String,
  created: {
    type: Date,
    default: Date.now
  },
  tags: [String],
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates'
    }],
    address: {
      type: String,
      required: 'You must supply an address'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Define our indexes
jobSchema.index({
  name: 'text',
  description: 'text'
});

jobSchema.index({ location: '2dsphere' });

jobSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other listings that have a slug of job, job-1, job-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const jobsWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (jobsWithSlug.length) {
    this.slug = `${this.slug}-${jobsWithSlug.length + 1}`;
  }
  next();
  // TODO make more resiliant so slugs are unique
});

jobSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};


module.exports = mongoose.model('Job', jobSchema);