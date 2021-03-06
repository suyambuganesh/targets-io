'use strict';
angular.module('graphs').factory('Tags', [
  'Utils',
  'TestRuns',
  '$rootScope',
  '$timeout',
  function (Utils, TestRuns, $rootScope, $timeout) {
    var Tags = {
      setTags: setTags,
      getTagIndex: getTagIndex  //createHighstockSeries: createHighstockSeries
    };
    return Tags;
    function getTagIndex(tag, tags) {
      var index;
      _.each(tags, function (tagObj, i) {
        if (tagObj.text === tag)
          return index = i;
      });
      return index;
    }
    function setTags(metrics, productName, dashBoardName, testRunId, dashboardTags) {
      var tags = [];
      tags.push({
        text: 'All',
        route: {
          productName: productName,
          dashboardName: dashBoardName,
          tag: 'All'
        }
      });
      _.each(metrics, function (metric) {
        _.each(metric.tags, function (tag) {
          if (tagExists(tags, tag))
            tags.push({
              text: tag.text,
              route: {
                productName: productName,
                dashboardName: dashBoardName,
                tag: tag.text,
                testRunId: testRunId,
                metricFilter: null,
                zoomFrom: null,
                zoomUntil: null,
                zoomRange: null,
                selectedSeries: null

              }
            });
        });
      });
      /* add filter tags */
      _.each(dashboardTags, function (dashboardTag) {
        if (dashboardTag.text.indexOf(' AND ') > -1 || dashboardTag.text.indexOf(' OR ') > -1) {
          tags.push({
            text: dashboardTag.text,
            route: {
              productName: productName,
              dashboardName: dashBoardName,
              tag: dashboardTag.text,
              testRunId: testRunId
            }
          });
        }
      });
      tags.sort(Utils.dynamicSort('text'));
      //if available, add Gatling-details tab

      var bambooRegexp = new RegExp("bamboo"); /* hack to exclude bamboo url's for now, since this is not supported yet */


      if ($rootScope.currentState === 'viewGraphs' && TestRuns.selected.buildResultsUrl && !bambooRegexp.test(TestRuns.selected.buildResultsUrl)) {
        tags.unshift({
          text: 'Gatling',
          route: {
            productName: productName,
            dashboardName: dashBoardName,
            tag: 'Gatling'
          }
        });
      }

      return tags;
    }
    function tagExists(existingTags, newTag) {
      var isNew = true;
      _.each(existingTags, function (existingTag) {
        if (existingTag.text === newTag.text)
          isNew = false;
      });
      return isNew;
    }
  }
]);
