module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout(() => {
          console.log('User has logged out!')
        });
        res.redirect('/');
    });

// task routes ===============================================================

    // get today's tasks
    app.get('/tasks/today', isLoggedIn, (req, res) => {
      const mongoose = require('mongoose');
      const User = mongoose.model('User');
      const today = new Date().toISOString().split('T')[0];
      
      User.findById(req.user._id, (err, user) => {
        if (err) return res.status(500).json({ error: err });
        const todayTasks = user.tasks.filter(t => t.date === today);
        res.json(todayTasks);
      });
    });

    // add a task
    app.post('/tasks', isLoggedIn, (req, res) => {
      const mongoose = require('mongoose');
      const User = mongoose.model('User');
      const today = new Date().toISOString().split('T')[0];
      
      User.findById(req.user._id, (err, user) => {
        if (err) return res.status(500).json({ error: err });
        
        user.tasks.push({
          task: req.body.task,
          timeSlot: null,
          date: today
        });
        
        user.save((err) => {
          if (err) return res.status(500).json({ error: err });
          res.json({ success: true });
        });
      });
    });

    // update task timeslot
    app.put('/tasks/:id', isLoggedIn, (req, res) => {
      const mongoose = require('mongoose');
      const User = mongoose.model('User');
      
      User.findById(req.user._id, (err, user) => {
        if (err) return res.status(500).json({ error: err });
        
        const task = user.tasks.id(req.params.id);
        if (task) {
          task.timeSlot = req.body.timeSlot;
          user.save((err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ success: true });
          });
        } else {
          res.status(404).json({ error: 'Task not found' });
        }
      });
    });

    // delete task
    app.delete('/tasks/:id', isLoggedIn, (req, res) => {
      const mongoose = require('mongoose');
      const User = mongoose.model('User');
      
      User.findById(req.user._id, (err, user) => {
        if (err) return res.status(500).json({ error: err });
        
        user.tasks.id(req.params.id).remove();
        user.save((err) => {
          if (err) return res.status(500).json({ error: err });
          res.json({ success: true });
        });
      });
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}