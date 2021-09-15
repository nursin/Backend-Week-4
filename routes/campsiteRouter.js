const express = require('express');
const Campsite = require('../models/campsite');
const authenticate = require('../authenticate'); // our authenticate module
const cors = require('/cors');

const campsiteRouter = express.Router();

// this is the endpoint
// www.nucampsite.com or www.nucampsite/.com
campsiteRouter.route('/')
  //creates or deals with preflight response
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  // cors.cors allows different origins because the get method doesnt change db it just recieves data and therefore safe for differeing origins
  .get(cors.cors, (req, res, next) => {
    Campsite.find() // mongoose method to find all the documents within the campsite collection
      // a mogoose method will always return a promise this is indicated by .then() and .catch()
      .populate('comments.author') // tell app when campsite docs are retrieved to populate author field of comments subdocument by matching the user with the document stored there
      .then(campsites => { // if user makes get request to url /
        // and mongoose is able to get a reply back from database then do everyhting inside .then method
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsites);
      })
      .catch(err => next(err)); // otherwise we serve the user our error handler function in app.js
  })
  // cors.corsWithOptions to handle origin checking
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.create(req.body) // using mongoose method and passing in req.body
      // req.body would not work if you dont have body-parser middleware
      .then(campsite => { // if we are able to succefully create a campsite we respond with 
        // all the stements 
        console.log('Campsite Created ', campsite);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
      })
      .catch(err => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /campsites');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.deleteMany()
      .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
      })
      .catch(err => next(err));
  });

campsiteRouter.route('/:campsiteId')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate('comments.author')
      .then(campsite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
      })
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findByIdAndUpdate(req.params.campsiteId, {
      $set: req.body
    }, { new: true })
      .then(campsite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
      })
      .catch(err => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findByIdAndDelete(req.params.campsiteId)
      .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
      })
      .catch(err => next(err));
  });

campsiteRouter.route('/:campsiteId/comments')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate('comments.author')
      .then(campsite => {
        if (campsite) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(campsite.comments);
        } else {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .then(campsite => {
        if (campsite) {
          req.body.author = req.user._id;
          campsite.comments.push(req.body);
          campsite.save()
            .then(campsite => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(campsite);
            })
            .catch(err => next(err));
        } else {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .then(campsite => {
        if (campsite) {
          for (let i = (campsite.comments.length - 1); i >= 0; i--) {
            campsite.comments.id(campsite.comments[i]._id).remove();
          }
          campsite.save()
            .then(campsite => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(campsite);
            })
            .catch(err => next(err));
        } else {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  });

campsiteRouter.route('/:campsiteId/comments/:commentId')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate('comments.author')
      .then(campsite => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(campsite.comments.id(req.params.commentId));
        } else if (!campsite) {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log('Requser', req.user)
    Campsite.findById(req.params.campsiteId)
      .then(campsite => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
          if (req.user._id.equals(campsite.comments.id(req.params.commentId).author)) {
            console.log(`${req.user._id} = ${campsite.comments.id(req.params.commentId).author}`);
            if (req.body.rating) {
              campsite.comments.id(req.params.commentId).rating = req.body.rating;
            }
            if (req.body.text) {
              campsite.comments.id(req.params.commentId).text = req.body.text;
            }
            campsite.save()
              .then(campsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
              })
              .catch(err => next(err));
          } else {
            err = new Error('You are not authorized to update this comment!');
            err.status = 403;
            return next(err);
          }
        } else if (!campsite) {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .then(campsite => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
          if (req.user._id.equals(campsite.comments.id(req.params.commentId).author)) {
            console.log(`${req.user._id} = ${campsite.comments.id(req.params.commentId).author}`);
            campsite.comments.id(req.params.commentId).remove();
            campsite.save()
              .then(campsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
              })
              .catch(err => next(err));
          } else {
            err = new Error('You are not authorized to delete this comment!');
            err.status = 403;
            return next(err);
          }
        } else if (!campsite) {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch(err => next(err));
  });

module.exports = campsiteRouter;