const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const Job = mongoose.model('Job');
const Van = mongoose.model('Van');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');



exports.addJob = (req, res) => {
    res.render('editJob', { title: 'Post a Help Wanted Groomer Ad' });
  };

  exports.createJob = async (req, res) => {
    req.body.author = req.user._id;
    const job = await (new Job(req.body)).save();
    req.flash('success', `Successfully Created ${job.name}. `);
    res.redirect(`/grooming-jobs/${job.slug}`);
  };
  
  exports.getJobs = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * limit) - limit;
  
    // 1. Query the database for a list of all listings
    const jobsPromise = Job
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ created: 'desc' });
  
    const countPromise = Job.count();
  
    const [jobs, count] = await Promise.all([jobsPromise, countPromise]);
    const pages = Math.ceil(count / limit);
    if (!jobs.length && skip) {
      req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
      res.redirect(`/grooming-jobs/page/${pages}`);
      return;
    }
  
    res.render('jobs', { title: 'Grooming Jobs', jobs, page, pages, count });
  };
  
  const confirmOwner = (job, user) => {
    if (!job.author.equals(user._id)) {
      throw Error('You Must Have Created This Listing in Order to Edit it');
    }
  };
  
  
  exports.editJob = async (req, res) => {
    // 1. Find the listing given the ID
    const job = await Job.findOne({ _id: req.params.id });
    // 2. confirm they are the owner of the listing
    confirmOwner(job, req.user);
    // 3. Render out the edit form so the user can update their listing
    res.render('editJob', { title: `Edit ${job.name}`, job });
  };
  
  exports.updateJob = async (req, res) => {
    // set the location data to be a point
    req.body.location.type = 'Point';
    // find and update the listing
    const job = await Job.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true, // return the new listing instead of the old one
      runValidators: true
    }).exec();
    req.flash('success', `Successfully updated <strong>${job.name}</strong>. <a href="/grooming-jobs/${job.slug}">View Listing →</a>`);
    res.redirect(`/grooming-jobs/${job._id}/edit`);
    // Redriect them to the listing and tell them it worked
  };
  
  exports.getJobBySlug = async (req, res, next) => {
    const job = await Job.findOne({ slug: req.params.slug });
    if (!job) return next();
    res.render('job', { job, title: job.name });
  };
  
  exports.getJobsByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true, $ne: [] };
  
    const tagsPromise = Job.getTagsList();
    const jobsPromise = Job.find({ tags: tagQuery });
    const [tags, jobs] = await Promise.all([tagsPromise, jobsPromise]);
  
  
    res.render('jobTag', { tags, title: 'Categories', tag, jobs });
  };
  
  
  exports.searchJobs = async (req, res) => {
    const jobs = await Job
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
    res.json(jobs);
  };
  
  exports.mapJobs = async (req, res) => {
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
  
    const jobs = await Job.find(q).select('slug name description location photo').limit(10);
    res.json(jobs);
  };
  
/*
  **************              SAVE FUNCTIONALITY                     ********************************
*/
  exports.saves = async (req, res) => {
    const saves = req.user.saves.map(obj => obj.toString());
  
    const operator = saves.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User
      .findByIdAndUpdate(req.user._id,
        { [operator]: { saves: req.params.id } },
        { new: true }
      );
    res.json(user);
  };
  
  exports.getSaves = async (req, res) => {
    const saves = await Job.find({
      _id: { $in: req.user.saves }
    });
    res.render('stores', { title: 'Saved Ads', saves });
  };