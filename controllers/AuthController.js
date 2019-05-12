    
const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You Are now Logged Out');
    res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) {
        next();
        return;
    } 
    req.flash('error', 'Oops, You Must Be Logged in to do That');
    res.redirect('/login');
};

exports.forgot = async (req, res) => {
    //1. See if a user with that email exists
    const user = await User.findOne({ email: req.body.email });
    if(!user) {
        req.flash('error', 'No User Exists With That Email Address');
        return res.redirect('/login');
    }
    //2. set tokens and epiry on their account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 Hour From Now 
    await user.save();
    //3. Send them an email with the token 
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    await mail.send({
        user: user,
        subject: 'Password Reset',
        resetURL,
        filename: 'password-reset',
    });
    req.flash('success', `You have been emailed a password reset link.`);
    res.redirect('/login');
    //4. redirect to the login page
};

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if(!user) {
        req.flash('error', 'Password Reset is Invalid or has Expired');
        return res.redirect('/login');
    }
    //if there is a user, show the password reset form
    res.render('reset', { title: 'Reset Your Password' });
};

exports.confirmedPasswords = (req, res, next) => {
    if(req.body.password === req.body['password-confirm']){
        next();
        return;
    }
    req.flash('error', 'Passwords Do Not Match');
    res.redirect('back');
};

exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if(!user) {
        req.flash('error', 'Password Reset is Invalid or has Expired');
        return res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordExpires = undefined;
    user.resetPasswordToken = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', "Nice! Your Password Has Been Reset");
    res.redirect('/');
};