const express = require('express');
const authenticate = require('../authenticate');
// import multer = proccesses multipart/form data enctype
// built on top of busboy another middleware library for processing incoming data
// multer adds 2 parts to req object file/files and body objects
// body contains text form any text fields
// file/files contain file or files
const multer = require('multer');
const cors = require('/cors');

// config for how multer will handle file uploads
// multer has default values for this too
const storage = multer.diskStorage({
  destination: (req, file, cb) => { // cb is callback funct
    cb(null, 'public/images'); // (error, save directory)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // (error, sets name in server same as name from client otherwise will give random string)
  }
});

const imageFileFilter = (req, file, cb) => { // filter to evaluate the file
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) { // regex to check if file is image file ext
    return cb(new Error('You can upload only image files!'), false); // returns this error if not image file ext
  }
  cb(null, true); // (error, accept file)
};

// call multer funstion
const upload = multer({ storage: storage, fileFilter: imageFileFilter });

const uploadRouter = express.Router(); // create uplaodRouter

// configure upload router to handle various request
uploadRouter.route('/')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /imageUpload');
  })
  // when client uploads a file to server multer will take over and handle any errors, after complete and returns with no errors that means file was succeffully uploaded to server
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, upload.single('imageFile'), (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(req.file); // confirms to client the file was uploaded succeffully
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /imageUpload');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end('DELETE operation not supported on /imageUpload');
  });

module.exports = uploadRouter; // export uploadrouter