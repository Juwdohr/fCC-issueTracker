/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/issues/:project')
    
    .get((req, res) => {
      const project = req.params.project;
      const query = req.query;
      if ( query._id ) { query._id = new ObjectId(query._id) };
      if ( query.open ) { query.open = String(query.open) === true }
      MongoClient.connect(CONNECTION_STRING, (err, db) => {
        const collection = db.collection(project);
        collection.find(query).toArray((err, docs) => res.json(docs));
      });
    })
    
    .post((req, res) => {
      const project = req.params.project;
      const issue = {
        title: req.body.issue_title, 
        text: req.body.issue_text,
        created_on: new Date(),
        updated_on: new Date(),
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        status: req.body.status || '',
        open: true
      }
      
      if(!issue.title || !issue.text || !issue.created_by) {
        res.send('missing input');
      } else {
        MongoClient.connect(CONNECTION_STRING, (err, db) => {
          if(err) console.error(err);
          const collection = db.collection(project);
          collection.insertOne(issue, (err, doc) => {
            issue._id = doc.insertedId;
            res.json(issue);
          });
        });
      }
    })
    
    .put((req, res) => {
      const project = req.params.project;
      
      const issue = req.body._id;
      delete req.body._id
    
      const updates = req.body;
      for(let item in updates) { if(!updates[item]) { delete updates[item] } }
      if (updates.open) { updates.open = String(updates.open) == "true" }
    
      if(Object.keys(updates).length === 0) {
        res.send('No updated field sent');
      } else {
        updates.updated_on = new Date();
        MongoClient.connect(CONNECTION_STRING, (err, db) => {
          const collection = db.collection(project);
          collection.findAndModify({ _id: new ObjectId(issue) }, [['_id', 1]], {$set: updates}, {new: true}, (err, doc) => {
            (!err) ? res.send('successfully updated') : res.send(`could not update ${issue} ${err}`);
          })
        })
      }
      
    })
    
    .delete((req, res) => {
      const project = req.params.project;
      const issue = req.body._id;
      console.log(issue);
      if( !issue ) {
        res.send('_id error');
      } else {
        MongoClient.connect(CONNECTION_STRING, (err, db) => {
          const collection = db.collection(project);
          collection.findAndRemove({ _id: new ObjectId(issue) }, (err, doc) => {
            (!err) ? res.send(`deleted ${issue}`) : res.send(`could not delete ${issue}: ${err}`)
          });
        });
      }
    });
    
};
