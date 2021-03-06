const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const vanSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a listing name!'
  },
  askingPrice: {
    type: String,
    trim: true,
    required: 'Please Enter an Asking Price'
  },
  yearsInBusiness: {
    type: String,
    trim: true,
    //required: 'Please Add Years in Business'
  },
  revenues: {
    type: String,
  },
  year: {
      type: Number,
  },
  make: {
      type: String,
  },
  contact: {
    type: String,
    trim: true,
    required: 'Please Add at Least One Contact Method'
  },
  model: {
      type: String,
  },
  mileage: {
      type: String,
  },
  sold: {
      type: Boolean,
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  vanTags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  city: {
    type: String,
    trim: true,
    required: 'Please Enter a City'
  },
  state: {
    type: String,
    trim: true,
    required: 'Please Enter a State'
  },
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply a city!'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    //required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Define our indexes
vanSchema.index({
  name: 'text',
  description: 'text'
});

vanSchema.index({ location: '2dsphere' });

vanSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other vans  that have a slug of van, van-1, van-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const vansWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (vansWithSlug.length) {
    this.slug = `${this.slug}-${vansWithSlug.length + 1}`;
  }
  next();
  // TODO make more resiliant so slugs are unique
});

vanSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

vanSchema.statics.getTopVans = function() {
    return this.aggregate([
        //lookup vans & populate reviews
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'van', as: 'reviews' } },
        // filter for vans that have more than 2 reviews only
        { $match: { 'reviews.1': { $exists: true } } },
        // add the average reviews field
        { $project: { 
            photo: '$$ROOT.photo',
            name: '$$ROOT.name',
            reviews: '$$ROOT.reviews',
            slug: '$$ROOT.slug',
            averageRating: { $avg: '$reviews.rating' }
        }},
        //sort it by our new field, highest reviews first
        { $sort: { averageRating: -1 }},
        //limit to 10
        { $limit: 10 }
    ]);
}
// find reviews where the vans _id property === reviews van property
vanSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // which field on the van?
  foreignField: 'van' // which field on the review?
});

function autopopulate(next) {
    this.populate('reviews');
    next();
}

vanSchema.pre('find', autopopulate);
vanSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Van', vanSchema);