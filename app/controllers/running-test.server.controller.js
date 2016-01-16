'use strict';
/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var _ = require('lodash');
var RunningTest = mongoose.model('RunningTest');
var Event = mongoose.model('Event');
var Testrun = mongoose.model('Testrun');
var Dashboard = mongoose.model('Dashboard');
var Product = mongoose.model('Product');
var testRunsModule = require('./testruns.server.controller');


exports.runningTest = runningTest;
exports.updateRunningTest = updateRunningTest;
exports.synchronizeEvents = synchronizeRunningTestRuns;
exports.getRunningTests = getRunningTests;
exports.runningTestForDashboard = runningTestForDashboard;


  /* start polling every 15 seconds */
  //setInterval(synchronizeRunningTestRuns, 15 * 1000);
//}
function runningTestForDashboard(req, res){

  RunningTest.findOne({$and:[{productName: req.params.productName}, {dashboardName: req.params.dashboardName}]}).exec(function(err, runningTest){
    if(err){
      console.log(err);
    }else{

      if(runningTest) {
        res.jsonp(runningTest);
      }else {
        res.jsonp({});
      }

    }


  });

}

function getRunningTests(req, res){

  RunningTest.find().exec(function(err, runningTests){

    if(err){
      console.log(err);
    }else{
      res.jsonp(runningTests);
    }

  });
}

function runningTest(req, res){

  let productName = req.body.productName;
  let dashboardName = req.body.dashboardName;
  let testRunId = req.body.testRunId.toUpperCase();

  if(req.params.command === 'end'){

    RunningTest.findOne({$and:[
      {productName: productName},
      {dashboardName: dashboardName},
      {testRunId: testRunId}
    ]}).exec(function(err, runningTest){

      if(runningTest){
        /* mark test run as completed */
        runningTest.completed = true;
        /* set test run end time*/
        runningTest.end = new Date().getTime();
        /* Save test run*/
        saveTestRun(runningTest)
          .then(testRunsModule.benchmarkAndPersistTestRunById)
          .then(function(testRun){
            res.jsonp(testRun);
          });
      }else{

        return res.status(400).send({ message: 'No running test found for this test run ID!' });

      }
    })
  }else {

    /* first check if test run exists for dashboard */

    Testrun.findOne({
      $and: [
        {productName: productName},
        {dashboardName: dashboardName},
        {testRunId: testRunId}
      ]
    }).exec(function (err, testRun) {

      /* if completed test run is found return error */
      if (testRun && testRun.completed === true) {

        return res.status(400).send({message: 'testRunId already exists for dashboard!'});

      } else {

        /* if incomplete test run is found, assume the test run was ended due to hiccup in keepalive calls.  */

        if(testRun && testRun.completed === false) {

          Testrun.remove({
            $and: [
              {productName: productName},
              {dashboardName: dashboardName},
              {testRunId: testRunId}
            ]
          }).exec(function (err, testRun) {

            updateRunningTest(req.body)
                .then(function (message) {

                  res.jsonp(message);

                });
          });

        }else {

          updateRunningTest(req.body)
              .then(function (message) {

                res.jsonp(message);

              });
        }
      }



    });
  }

}

function updateRunningTest(runningTest) {

  return new Promise((resolve, reject) => {

    let newRunningTest;
    let dateNow = new Date().getTime();


    RunningTest.findOne({$and:[{productName: runningTest.productName}, {dashboardName: runningTest.dashboardName}, {testRunId: runningTest.testRunId.toUpperCase()}]}).exec(function(err, storedRunningTest){

      /* if entry exists just update the keep alive timestamp */
      if(storedRunningTest){

        storedRunningTest.keepAliveTimestamp = dateNow;
        storedRunningTest.end = dateNow + 15 * 1000;
        storedRunningTest.humanReadableDuration = testRunsModule.humanReadbleDuration(storedRunningTest.end.getTime() - storedRunningTest.start.getTime());

        storedRunningTest.save(function(err, runnigTestSaved){

          resolve('running test updated!');
        });

        /* if entry does not exist, create new one */

      }else{


        newRunningTest = new RunningTest(runningTest);

        /* set timestamps */
        /* if start request, give some additional time to start up */

        newRunningTest.keepAliveTimestamp = dateNow + 120 * 1000;
        newRunningTest.end = dateNow + 15 * 1000;
        newRunningTest.humanReadableDuration = testRunsModule.humanReadbleDuration(newRunningTest.end.getTime() - newRunningTest.start.getTime())
        newRunningTest.save(function(err, newRunningTest){

          resolve('running test created!');
        });
      }
    });
  });
}

function synchronizeRunningTestRuns () {


  var dateNow = new Date().getTime();


  /* Get  running tests */

  RunningTest.find().exec(function (err, runningTests) {

    console.log('checking running tests');

    _.each(runningTests, function (runningTest) {

            /* if keep alive is older than 16 seconds, save running test in test run collection and remove from running tests collection */
            if (dateNow - runningTest.keepAliveTimestamp.getTime() > 16 * 1000){

              /* mark test as not completed */
              runningTest.completed = false;

              saveTestRun(runningTest)
              .then(function(){
                runningTest.remove(function(err, removedRunningTest){
                  console.log('removed: ' + removedRunningTest);
                });
              });

            }

          });

  });
}


let saveTestRun = function (runningTest){

  return new Promise((resolve, reject) => {

    let testRun = new Testrun(runningTest);

    testRun.save(function (err, savedTestRun) {

      if (err) {
        reject(err);
      } else {

        runningTest.remove(function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(savedTestRun);
          }
        });
      }
    });

  });
}

let errorHandler = function (err){

  console.log('Error: ' + err);

}
