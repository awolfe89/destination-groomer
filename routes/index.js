const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const directoryController = require('../controllers/directoryController');
const jobController = require('../controllers/jobController');
const vanController = require('../controllers/vanController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');


/*
  **************             Storefront Grooming Businesses For Sale            ********************************

*/

router.get('/', storeController.homePage);
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/add', authController.isLoggedIn, storeController.addStore);

router.post('/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);

router.post('/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));


/*
  **************              USER FUNCTIONS                  ********************************

*/
router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);

router.post('/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get('/logout', authController.logout);
router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);

/*
  **************              API ROUTES                      ********************************
*/

router.get('/create-listing', authController.isLoggedIn, storeController.createListing);
router.get('/top', catchErrors(storeController.getTopStores));
router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));
router.get('/map', storeController.mapPage);
router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getHearts));
router.post('/reviews/:id',
  authController.isLoggedIn,
  catchErrors(reviewController.addReview)
);
/*
  **************              VANS                       ********************************
*/

router.get('/', vanController.homePage);
router.get('/vans', catchErrors(vanController.getVans));
router.get('/add-grooming-van', authController.isLoggedIn, vanController.addVan);
router.get('/vans/:id/edit', catchErrors(vanController.editVan));
router.get('/van/:slug', catchErrors(vanController.getVanBySlug));

router.post('/add-grooming-van',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(vanController.createVan)
);

router.post('/add-grooming-van/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(vanController.updateVan)
);


router.post('/api/vans/:id/heart', catchErrors(storeController.heartVan));

/*
  **************              JOBS                      ********************************
*/


router.get('/grooming-jobs', 
  catchErrors(jobController.getJobs),
  catchErrors(jobController.getJobsByTag)  
);

router.get('/add-grooming-job', authController.isLoggedIn, jobController.addJob);
router.get('/grooming-jobs/:id/edit', catchErrors(jobController.editJob));
router.get('/grooming-jobs/:slug', catchErrors(jobController.getJobBySlug));

router.post('/add-grooming-job',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(jobController.createJob)
);

router.post('/add-grooming-job/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(jobController.updateJob)
);

router.get('/jobs-for-groomers', catchErrors(jobController.getJobsByTag));
router.get('/jobs-for-groomers/:tag', catchErrors(jobController.getJobsByTag));
//router.post('/api/grooming-jobs/:id/heart', catchErrors(jobController.heartJob));

/*
  **************              Groomer Directory                      ********************************
*/


router.get('/groomer-directory', 
  catchErrors(directoryController.getDirectorys),
  catchErrors(directoryController.getDirectorysByTag)  
);

router.get('/add-groomer-directory', authController.isLoggedIn, directoryController.addDirectory);
router.get('/groomer-directory/:id/edit', catchErrors(directoryController.editDirectory));
router.get('/groomer-directory/:slug', catchErrors(directoryController.getDirectoryBySlug));

router.post('/add-groomer-directory',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(directoryController.createDirectory)
);

router.post('/add-groomer-directory/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(directoryController.updateDirectory)
);

router.get('/saves', authController.isLoggedIn, catchErrors(jobController.getSaves));
router.post('/api/groomer-listings/:id/saved', catchErrors(jobController.saved));
module.exports = router;