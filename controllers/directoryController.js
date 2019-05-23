const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const Job = mongoose.model('Job');
const Van = mongoose.model('Van');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const Directory = mongoose.model('Directory');


exports.addDirectory = (req, res) => {
    res.render('editDirectory', { title: 'Add Your Grooming Business to Our Directory' });
  };

  exports.createDirectory = async (req, res) => {
    req.body.author = req.user._id;
    const directory = await (new Directory(req.body)).save();
    req.flash('success', `Successfully Created ${directory.name}. `);
    res.redirect(`/groomer-directory/${directory.slug}`);
  };
  
  exports.getDirectorys = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * limit) - limit;
  
    // 1. Query the database for a list of all listings
    const directorysPromise = Directory
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ created: 'desc' });
  
    const countPromise = Directory.count();
  
    const [directorys, count] = await Promise.all([directorysPromise, countPromise]);
    const pages = Math.ceil(count / limit);
    if (!directorys.length && skip) {
      req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
      res.redirect(`/groomer-directory/page/${pages}`);
      return;
    }
  
    res.render('directorys', { title: 'Local Dog Groomers in Your Area', directorys, page, pages, count });
  };
  
  const confirmOwner = (directory, user) => {
    if (!directory.author.equals(user._id)) {
      throw Error('You Must Have Created This Listing in Order to Edit it');
    }
  };
  
  
  exports.editDirectory = async (req, res) => {
    // 1. Find the listing given the ID
    const directory = await Directory.findOne({ _id: req.params.id });
    // 2. confirm they are the owner of the listing
    confirmOwner(directory, req.user);
    // 3. Render out the edit form so the user can update their listing
    res.render('editDirectory', { title: `Edit ${directory.name}`, directory });
  };
  
  exports.updateDirectory = async (req, res) => {
    // set the location data to be a point
    req.body.location.type = 'Point';
    // find and update the listing
    const directory = await Directory.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true, // return the new listing instead of the old one
      runValidators: true
    }).exec();
    req.flash('success', `Successfully updated <strong>${directory.name}</strong>. <a href="/groomer-directory/${directory.slug}">View Your New Listing →</a>`);
    res.redirect(`/groomer-directotry/${directory._id}/edit`);
    // Redriect them to the listing and tell them it worked
  };
  
  exports.getDirectoryBySlug = async (req, res, next) => {
    const directory = await Directory.findOne({ slug: req.params.slug });
    if (!directory) return next();
    res.render('directory', { directory, title: directory.name });
  };
  
  exports.getdirectorysByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true, $ne: [] };
  
    const tagsPromise = Directory.getTagsList();
    const directorysPromise = Directory.find({ tags: tagQuery });
    const [tags, directorys] = await Promise.all([tagsPromise, directorysPromise]);
  
  
    res.render('directoryTag', { tags, title: 'Categories', tag, directorys });
  };
  
  
  exports.searchDirectorys = async (req, res) => {
    const directorys = await Directory
    // first find listings that match
    .find({
      $text: {
        $search: req.query.q
      }
    }, {
      score: { $meta: 'textScore' }
    })
    // the sort them
    .sort({
      score: { $meta: 'textScore' }
    })
    // limit to only 5 results
    .limit(5);
    res.json(directorys);
  };
  
  exports.mapDirectorys = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: 10000 // 10km
        }
      }
    };
  
    const directorys = await Directory.find(q).select('slug name description location photo').limit(10);
    res.json(directorys);
  };
  