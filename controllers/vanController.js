const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const Van = mongoose.model('Van');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

exports.homePage = async (req, res) => {
  const limit = 6;
  const vans = await Van.find().limit(limit);
  res.render('index', {title: 'home', vans});
};

exports.addVan = (req, res) => {
    res.render('editVan', { title: 'Post a Mobile Grooming Van for Sale' });
  };
  
  exports.createVan = async (req, res) => {
    req.body.author = req.user._id;
    const van = await (new Van(req.body)).save();
    req.flash('success', `Successfully Created ${van.name}. `);
    res.redirect(`/van/${van.slug}`);
  };
  
  exports.getVans = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * limit) - limit;
  
    // 1. Query the database for a list of all vans
    const vansPromise = Van
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ created: 'desc' });
  
    const countPromise = Van.count();
  
    const [vans, count] = await Promise.all([vansPromise, countPromise]);
    const pages = Math.ceil(count / limit);
    if (!vans.length && skip) {
      req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
      res.redirect(`/vans/page/${pages}`);
      return;
    }
  
    res.render('vans', { title: 'Mobile Dog Grooming Vans for Sale', vans, page, pages, count });
  };
  
  const confirmOwner = (van, user) => {
    if (!van.author.equals(user._id)) {
      throw Error('You must be the creator of this listing in order to edit it');
    }
  };
  
  
  exports.editVan = async (req, res) => {
    // 1. Find the van given the ID
    const van = await Van.findOne({ _id: req.params.id });
    // 2. confirm they are the owner of the listing
    confirmOwner(van, req.user);
    // 3. Render out the edit form so the user can update their listing
    res.render('editVan', { title: `Edit ${van.name}`, van });
  };
  
  exports.updateVan = async (req, res) => {
    // set the location data to be a point
    req.body.location.type = 'Point';
    // find and update the van
    const van = await Van.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true, // return the new listing instead of the old one
      runValidators: true
    }).exec();
    req.flash('success', `Successfully updated <strong>${van.name}</strong>. <a href="/van/${van.slug}">View Listing →</a>`);
    res.redirect(`/vans/${van._id}/edit`);
    // Redriect them the listing and tell them it worked
  };
  
  exports.getVanBySlug = async (req, res, next) => {
    const van = await Van.findOne({ slug: req.params.slug }).populate('author reviews');
    if (!van) return next();
    res.render('van', { van, title: van.name });
  };
  
  exports.getVansByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true, $ne: [] };
  
    const tagsPromise = Van.getTagsList();
    const vansPromise = Van.find({ tags: tagQuery });
    const [tags, vans] = await Promise.all([tagsPromise, vansPromise]);
  
  
    res.render('tag', { tags, title: 'Categories', tag, vans });
  };
  

  
  //exports.getTopStores = async (req, res) => {
  //  const stores = await Store.getTopStores();
  //  res.render('topStores', { stores, title:'Top Listings'});
 // }
  
  