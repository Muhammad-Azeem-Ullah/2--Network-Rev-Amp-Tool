var express = require('express');
const MongoClient = require('mongodb').MongoClient;
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');

const url = 'mongodb://localhost:27017';
const dbName = 'caramelNetworkDb';
const client = new MongoClient(url);
var db;

client.connect(function (err) {
  if (err == null) {
    console.log("Connected successfully to server");
    db = client.db(dbName);
  } else {
    console.log(err.message);
  }
});

/* GET home page. */
router.get('/', ensureAuthenticated, function (req, res, next) {
  res.render('index', {
    title: 'Main Page'
  });
});

router.get('/users', ensureAuthenticated, function (req, res, next) {
  res.render('users', {
    title: 'Users'
  });
});

router.get('/changePassword', ensureAuthenticated, function (req, res, next) {
  res.render('changePassword', {
    title: 'Login'
  });
});

router.post('/changePassword', ensureAuthenticated, function (req, res, next) {
  console.log(req.body);
  if (req.body.NewPassword.length < 8) {
    req.flash('error_msg', 'Password should be minimum 8 characters long');
    res.redirect('/changePassword');
  } else if (req.body.NewPassword != req.body.cNewPassword) {
    req.flash('error_msg', 'Passwords do not match');
    res.redirect('/changePassword');
  } else {

    bcrypt.hash(req.body.NewPassword, 10, function (err, hash) {
      if (!err) {

        db.collection('users').updateOne({
          "username": "admin"
        }, {
          $set: {
            "password": hash
          }
        }, function (err, r) {
          if (!err) {
            req.flash('success_msg', 'Password is changed');
            res.redirect('/login');
          } else {
            req.flash('error_msg', 'Could not change password');
            res.redirect('/changePassword');
          }
        });
      } else {
        req.flash('error', err.message);
        res.redirect('/changePassword');
      }
    });
  }

});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash('error_msg', 'You are not logged in');
    res.redirect('/login');
  }
}

router.get('/login', function (req, res, next) {
  res.render('login', {
    title: 'Login'
  });
});

passport.use(new LocalStrategy(
  function (username, password, done) {

    db.collection('users').findOne({
      username: username
    }, function (err, r) {
      if (!err) {
        if (r) {
          bcrypt.compare(password, r.password, function (err, isMatch) {
            if (err) throw err;
            if (isMatch) {
              return done(null, r);
            } else {
              return done(null, false, {
                message: 'Invalid password'
              });
            }
          });
        } else {
          return done(null, false, {
            message: 'Incorrect username or password'
          });
        }
      } else {
        throw err;
      }
    });
  }));

passport.serializeUser(function (user, done) {
  done(null, user.username);
});

passport.deserializeUser(function (username, done) {
  db.collection('users').findOne({
    username: username
  }, function (err, r) {
    if (!err) {
      done(err, r);
    }
  });
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }),
  function (req, res) {
    res.redirect('/');
  });

router.get('/logout', function (req, res) {
  req.logout();
  req.flash('success_msg', 'you are out');
  res.redirect('/login');
});

module.exports = router;