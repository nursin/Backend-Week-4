const passport = require('passport'); // importjng mifddleware
const LocalStrategy = require('passport-local').Strategy; // importing middleware strategy constructor
const User = require('./models/user'); // importing user schema in models folder has access to passport-local-mongoose plugin already from userShema
const JwtStrategy = require('passport-jwt').Strategy; // impoprting middleware to create strategies for JWT
const ExtractJwt = require('passport-jwt').ExtractJwt; // middleware to extract JWT from req object
const jwt = require('jsonwebtoken'); // importing the ability to create sign and verify jwts
const FacebookTokenStrategy = require('passport-facebook-token');

const config = require('./config.js'); // referencing our config.js file with secret key

// strategy for authenticating username and password
// takes the user information and return a callback function, which
// will check your server to see if it the strategies are implemented correctly
// if you dont have these 2 lines of code then your functionality
// to 'login' a user will not work
exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); // for sessions done on user to store
passport.deserializeUser(User.deserializeUser()); // done on user to use?

// takes a user json object as an argument and create the jwt token
// will expire in an hour
exports.getToken = user => {
  return jwt.sign(user, config.secretKey, { expiresIn: 3600 });
};

const opts = {}; // hold options for jwt strategy
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); // how the jwt should be extracted when the post request has been made
opts.secretOrKey = config.secretKey; // referencing the secretkey in 'config.js

// it is a passport strategy to extract information about the jwt
exports.jwtPassport = passport.use(
  new JwtStrategy( // instances as arg
    opts, // configuration options
    (jwt_payload, done) => {
      console.log('JWT payload:', jwt_payload);
      User.findOne({ _id: jwt_payload._id }, (err, user) => {
        if (err) {
          return done(err, false);
        } else if (user) {
          return done(null, user);
        } else {
          return done(null, false);
          // could setup to create new acct here if no acct found
        }
      });
    }
  )
);



// verifying the user
// this middleware will grab this ibformation and comper it with the information in the database
// session false == dont create session
// req.user is coming from this middleware
// when you verify a user think of req.user as  sessio, meaning the server will have access to the information of the 
// user whatever resource they are on
exports.verifyUser = passport.authenticate('jwt', { session: false })

// its just verifying that the user is an admin
exports.verifyAdmin = (req, res, next) => {
  if (req.user.admin) {
    return next();
  } else {
    err = new Error('You are not authorized to perform this operation!');
    err.status = 403;
    return next(err);
  }
};

// export module
exports.facebookTokenStrategy = passport.use(
  // first arg contains settings, client id and secret jkey
  new FacebookTokenStrategy(
    {
      clientID: config.facebook.clientId,
      clientSecret: config.facebook.clientSecret
    },
    // verify callback functions
    (accessToken, refreshToken, profile, done) => {
      // looking for a user in our database that matches id property of profile
      User.findOne({ facebookId: profile.id }, (err, user) => {
        // check if error occured
        if (err) {
          // return err and user false
          return done(err, false);
        }
        // check if no err and user exist in db
        if (!err && user) {
          // return null err and user found
          return done(null, user);
          // no err no user found, create new user
        } else {
          // create user from our mongoose User schema
          user = new User({ username: profile.displayName })
          // extract user info from facebook return object
          // assign it to our user schema properties
          user.facebookId = profile.id;
          user.firstname = profile.name.givenName;
          user.lastname = profile.name.familyName;
          // err handling and then returning the new user we created
          if (err) {
            return done(err, false)
          } else {
            return done(null, user)
          }
        };
      });
    }
  )
)