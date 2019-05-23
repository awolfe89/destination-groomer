const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please Enter a Salon Name'
  },
  yearsInBusiness: {
    type: String,
    trim: true,
    required: 'Please Enter Years in Business'
  },
  leaseTerm: {
    type: String,
    trim: true,
  },
  rent: {
    type: String,
    trim: true,
  },
  revenue: {
    type: String,
    trim: true,
  },
  supplies: {
    type: String,
    trim: true,
  },
  sold: Boolean,
  dogs: {
    type: String,
    trim: true,
  },
  price: {
    type: String,
    trim: true,
    required: 'Please Enter a Sell Price'
  },
  contact: {
    type: String,
    trim: true,
    required: 'Please Enter Some Contact Information'
  },
  city: {
    type: String,
    trim: true,
    required: 'Please Enter a City'
  },
  state: {
    type: String,
    trim: true,
    required: 'Please Enter a State Information'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
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
storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other stores that have a slug of wes, wes-1, wes-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
  // TODO make more resiliant so slugs are unique
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        //lookup stores & populate reviews
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' } },
        // filter for stores that have more than 2 reviews only
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
// find reviews where the stores _id property === reviews store property
storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // which field on the store?
  foreignField: 'store' // which field on the review?
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);