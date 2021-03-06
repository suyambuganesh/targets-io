'use strict';
/**
 * Module dependencies.
 */
var mongoose = require('mongoose'), Schema = mongoose.Schema, config = require('../../config/config');
var testRunTargetSchema = new Schema({
  'meetsRequirement': Boolean,
  'benchmarkResultFixedOK': Boolean,
  'benchmarkResultPreviousOK': Boolean,
  'target': String,
  'value': Number,
  'benchmarkPreviousValue': Number,
  'benchmarkFixedValue': Number
},
    {
      read: 'primary'
    });
mongoose.model('TestrunTarget', testRunTargetSchema);

var testRunMetricSchema = new Schema({
  'alias': String,
  'type': String,
  'tags': [{ text: String }],
  'requirementOperator': String,
  'requirementValue': String,
  'benchmarkOperator': String,
  'benchmarkValue': String,
  'meetsRequirement': {
    type: Boolean,
    default: null
  },
  'benchmarkResultFixedOK': {
    type: Boolean,
    default: null
  },
  'benchmarkResultPreviousOK': {
    type: Boolean,
    default: null
  },
  'annotation': String,

  'targets': [testRunTargetSchema]

},
    {
      read: 'primary'
    });
mongoose.model('TestrunMetric', testRunMetricSchema);
/**
 * Testrun Schema
 */
var TestrunSchema = new Schema({
  'productName': {
    type: String,
    uppercase: true
  },
  'productRelease': {
    type: String,
    uppercase: true
  },
  'dashboardName': {
    type: String,
    uppercase: true
  },
  'testRunId': {
    type: String,
    uppercase: true
  },
  'start': {
    type: Date,
    expires: config.graphiteRetentionPeriod
  },
  'end': Date,
  'baseline' : {
  type: String,
  default: null
  },
  'previousBuild': {
    type: String,
    default: null
  },
  'completed': {
    type: Boolean,
    default: true
  },
  'humanReadableDuration': String,
  'meetsRequirement': Boolean,
  'benchmarkResultFixedOK': Boolean,
  'benchmarkResultPreviousOK': Boolean,
  'buildResultsUrl': String,
  'annotations': String,
  'rampUpPeriod': {
      type: Number
  },
  'lastUpdated': Date,
  'hasSummary': {
    type: Boolean,
    default: false
  },
  'graphiteDataExists': {
    type: Boolean,
    default: true
  },

  'metrics': [testRunMetricSchema]
}, { toObject: { getters: true } ,
      read: 'primary'
    });

TestrunSchema.virtual('startEpoch').get(function () {
  return this.start.getTime();
});
TestrunSchema.virtual('endEpoch').get(function () {
  return this.end.getTime();
});
TestrunSchema.index({
  testRunId: 1,
  dashboardName: 1,
  productName: 1
}, { unique: true });


mongoose.model('Testrun', TestrunSchema);
