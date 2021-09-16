const mongoose = require('mongoose');
// 
const passportLocalMongoose = require('passport-local-mongoose'); // imports middleware
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstname: {
    type: String,
    default: ''
  },
  lastname: {
    type: String,
    default: ''
  },
  // adds user to our user schema, if adding more fields like other? have to add specific types
  // now authenticate user in authenticate.js
  facebookId: String,
  admin: {
    type: Boolean,
    default: false
  }
});

// handles hashing and salting the user info, also provides additional 
// authentication methods. such as the authenicate method we use later
userSchema.plugin(passportLocalMongoose); 

module.exports = mongoose.model('User', userSchema);