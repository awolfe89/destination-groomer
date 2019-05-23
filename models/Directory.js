const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const directorySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please Enter a Business Name'
  },
  description: {
    type: String,
    trim: true,
    required: 'Please Enter Your Business Description'
  },
  mondayHours: {
    type: String,
    trim: true,

  },
  tuesdayHours: {
    type: String,
    trim: true,

  },
  wednesdayHours: {
    type: String,
    trim: true,

  },
  thursdayHours: {
    type: String,
    trim: true,

  },
  fridayHours: {
    type: String,
    trim: true,

  },
  saturdayHours: {
    type: String,
    trim: true,

  },
  sundayHours: {
    type: String,
    trim: true,

  },
  phone: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
  facebook: {
    type: String,
    trim: true,
  },
    animals: {
    type: String,
    trim: true,
  },
  delete: Boolean,
  slug: String,
  created: {
    type: Date,
    default: Date.now
  },
  tags: [String],
  mags: [String],
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
  city: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
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
directorySchema.index({
  name: 'text',
  description: 'text'
});

directorySchema.index({ location: '2dsphere' });

directorySchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other listings that have a slug of job, job-1, job-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const directorysWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (directorysWithSlug.length) {
    this.slug = `${this.slug}-${directorysWithSlug.length + 1}`;
  }
  next();
  // TODO make more resiliant so slugs are unique
});

directorySchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};


module.exports = mongoose.model('Directory', directorySchema);