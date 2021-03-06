'use strict';
/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    winston = require('winston'),
    errorHandler = require('./errors.server.controller'),
    Event = mongoose.model('Event'),
    Testrun = mongoose.model('Testrun'),
    Dashboard = mongoose.model('Dashboard'),
    Metric = mongoose.model('Metric'),
    Product = mongoose.model('Product'),
    _ = require('lodash'),
    graphite = require('./graphite.server.controller'),
    Utils = require('./utils.server.controller'),
    async = require('async');

exports.setRequirementResultsForTestRun = setRequirementResultsForTestRun;
exports.updateRequirementResults = updateRequirementResults;


function updateRequirementResults(testRun) {

  return new Promise((resolve, reject) => {

    setRequirementResultsForTestRun(testRun)
    .then(function (updatedTestRun) {
      /* Save updated test run */

      Testrun.findOneAndUpdate({
            $and: [
              {productName: updatedTestRun.productName},
              {dashboardName: updatedTestRun.dashboardName},
              {testRunId: updatedTestRun.testRunId}
            ]
          }, {meetsRequirement: updatedTestRun.meetsRequirement, metrics: updatedTestRun.metrics}
          , {upsert: true}, function (err, savedTestRun) {
            if (err) {
              reject(err);
            } else {
              resolve(savedTestRun);
            }

          });
    });
  });
}
function setRequirementResultsForTestRun(testRun) {

  return new Promise((resolve, reject) => {

    var requirementsSet = false;
    var updatedMetrics = [];
    _.each(testRun.metrics, function (metric, i) {
      /* if requirement is set for metric, check requirements*/
      if (metric.requirementValue) {
        requirementsSet = true;
        metric.targets = setTargetRequirementResults(metric.targets, metric.requirementOperator, metric.requirementValue);
        metric.meetsRequirement = setMetricRequirementResults(metric.targets);
      }
      updatedMetrics.push({
        _id: metric._id,
        tags: metric.tags,
        alias: metric.alias,
        type: metric.type,
        meetsRequirement: metric.meetsRequirement,
        requirementOperator: metric.requirementOperator,
        requirementValue: metric.requirementValue,
        benchmarkOperator: metric.benchmarkOperator,
        benchmarkValue: metric.benchmarkValue,
        targets: metric.targets
      });
    });
    testRun.metrics = updatedMetrics;
    if (requirementsSet)
      testRun.meetsRequirement = setTestrunRequirementResults(testRun.metrics);
    else
      testRun.meetsRequirement = null;

    winston.info('Set requirements for:' + testRun.productName + '-' + testRun.dashboardName + 'testrunId: ' + testRun.testRunId);
    resolve(testRun);
  });
}

function setTestrunRequirementResults(metrics) {
  var meetsRequirement = true;
  _.each(metrics, function (metric) {
    if (metric.meetsRequirement === false) {
      meetsRequirement = false;
      return;
    }
  });
  return meetsRequirement;
}
function setMetricRequirementResults(targets) {
  var meetsRequirement = true;
  _.each(targets, function (target) {
    if (target.meetsRequirement === false) {
      meetsRequirement = false;
      return;
    }
  });
  return meetsRequirement;
}
function evaluateRequirement(value, requirementOperator, requirementValue) {
  var requirementResult;
  if (requirementOperator === '<' && value >= requirementValue || requirementOperator === '>' && value <= requirementValue) {
    var requirementResult = false;
  } else {
    var requirementResult = true;
  }
  return requirementResult;
}

function setTargetRequirementResults(targets, requirementOperator, requirementValue) {
  var updatedTargets = [];
  _.each(targets, function (target) {
    var meetsRequirement = evaluateRequirement(target.value, requirementOperator, requirementValue);
    updatedTargets.push({
      meetsRequirement: meetsRequirement,
      target: target.target,
      value: target.value,
      _id: target._id
    });
  });
  return updatedTargets;
}
