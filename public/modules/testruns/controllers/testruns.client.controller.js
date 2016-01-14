'use strict';
angular.module('testruns').controller('TestrunsController', [
  '$scope',
  '$stateParams',
  '$state',
  'TestRuns',
  'Dashboards',
  'Events',
  '$modal',
  '$q',
  'ConfirmModal',
  '$window',
  '$interval',
  function ($scope, $stateParams, $state, TestRuns, Dashboards, Events, $modal, $q, ConfirmModal, $window, $interval) {

    $scope.productName = $stateParams.productName;
    $scope.dashboardName = $stateParams.dashboardName;

    /* By default, show completed test runs only */
    $scope.completedTestRunsOnly = true;


    $scope.showNumberOfTestRuns = 10;
    $scope.page = 1;

    $scope.numberOfRowOptions = [
      {value: 10},
      {value: 20},
      {value: 30},
      {value: 40}
    ];

    $scope.$watch('showNumberOfTestRuns', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        testRunPolling();
      }
    });

    $scope.nextPage = function(page){

      $scope.page = page;
      testRunPolling();

    }
    /* refresh test runs every 15 seconds */


    var testRunPolling = function () {
      TestRuns.listTestRunsForDashboard($scope.productName, $scope.dashboardName, $scope.showNumberOfTestRuns, $scope.page).success(function (response) {

        $scope.runningTest = response.runningTest;

        $scope.numberOfRunningTests = response.numberOfRunningTests;

        $scope.totalNumberOftestRuns = response.totalNumberOftestRuns



        /* get testRun Id's that might be selected */
        var selectedTestRunIds = [];
        var testRunsSelected = false;

        _.each($scope.testRuns, function(testRun){

          if(testRun.selected === true){

            selectedTestRunIds.push(testRun.testRunId);
            testRunsSelected = true;
          }

        });

        $scope.testRuns = [];

        $scope.testRuns = response.testRuns;

        /* set selected testruns if necessary */
        if (testRunsSelected === true){

          _.each($scope.testRuns, function(testRun){

              _.each(selectedTestRunIds, function(selectedTestRunId){

                  if(testRun.testRunId === selectedTestRunId ){

                    testRun.selected = true;
                    return;
                  }
              });

          });
        }
        /* Set end value to 'Running' for running test(s)*/

        for (var i = 0; i < $scope.numberOfRunningTests; i++) {

          $scope.testRuns[i].end = 'Running ...';
        }

        $scope.loading = false;

        TestRuns.list = response.testRuns;
        TestRuns.runningTest = response.runningTest;
        TestRuns.numberOfRunningTests = response.numberOfRunningTests;


      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });

    };

    var polling = $interval(testRunPolling, 15000);

    setTimeout(function(){
      /* only get test runs from db when neccessary */
      if (TestRuns.list.length > 0) {

        $scope.testRuns = TestRuns.list;
        $scope.runningTest = (TestRuns.runningTest) ?  TestRuns.runningTest : false;
        $scope.numberOfRunningTests = (TestRuns.runningTest) ? TestRuns.runningTest : 0;


        } else {

        $scope.loading = true;

        testRunPolling();

      }
    }, 1);

    $scope.editTestRun = function (testRun){

      TestRuns.selected = testRun;
      $state.go('editTestRun',{productName: testRun.productName, dashboardName: testRun.dashboardName, testRunId: testRun.testRunId});

    }

    $scope.markAsComplete = function(testRun){

      testRun.completed = true;
      TestRuns.update(testRun).success(function(numUpdated){

         if(numUpdated > 0){
           let updatedTestRunIndex = $scope.testRuns.map(function(currentTestRun) { return currentTestRun._id.toString(); }).indexOf(testRun._id.toString());
           $scope.testRuns[updatedTestRunIndex] = testRun;
           $scope.completedTestRunsOnly = true;
         }
      });
    }

    $scope.$watch('allTestRunsSelected', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        _.each($scope.testRuns, function (testRun, i) {
          testRun.selected = newVal;
        });
      }
    });

    $scope.setTestRunsSelected = function(testRunSelected){

      if (testRunSelected === false){

        $scope.testRunSelected = false;

        _.each($scope.testRuns, function(testRun){
          if(testRun.selected === true) $scope.testRunSelected = true;
        })

      }else {
        $scope.testRunSelected = testRunSelected;
      }
    };

    $scope.setAllTestRunsSelected = function(testRunSelected){

      $scope.testRunSelected = testRunSelected;
    };

    var j = 0, counter = 0;
    var spinner;
    $scope.modes = [];
    $scope.determinateValue = 30;
    $scope.$watch('loading', function (current, old) {
      if (current !== old) {
        if (current === true) {
          // Iterate every 100ms, non-stop
          spinner = $interval(function () {
            // Increment the Determinate loader
            $scope.determinateValue += 1;
            if ($scope.determinateValue > 100) {
              $scope.determinateValue = 30;
            }
            // Incrementally start animation the five (5) Indeterminate,
            // themed progress circular bars
            if (j < 5 && !$scope.modes[j] && $scope.loading) {
              $scope.modes[j] = 'indeterminate';
            }
            if (counter++ % 4 == 0)
              j++;
            console.log('bla');
          }, 100, 0, true);
        }else{

          $interval.cancel(spinner);

        }
      }
    });
    $scope.$on('$destroy', function () {
      // Make sure that the interval is destroyed too
      $interval.cancel(spinner);
      $interval.cancel(polling);
    });
    
    var originatorEv;
    $scope.openMenu = function ($mdOpenMenu, ev) {
      originatorEv = ev;
      $mdOpenMenu(ev);
    };

    $scope.go = function (url) {
      $window.location.href = url;
    };

    $scope.$watch(function (scope) {
      return Dashboards.selected._id;
    }, function (newVal, oldVal) {
      if (newVal !== oldVal) {
        $scope.showBenchmarks = Dashboards.selected.useInBenchmark;
        $scope.dashboard = Dashboards.selected;

        TestRuns.list = [];
        TestRuns.runningTest = '';
        TestRuns.numberOfRunningTests = '';
      }
    });
    //$scope.$watch(function (scope) {
    //  return TestRuns.list;
    //}, function (newVal, oldVal) {
    //  if (newVal !== oldVal) {
    //    $scope.testRuns = [];
    //    $scope.testRuns = TestRuns.list;
    //  }
    //});
    /* List test runs for dashboard */
    //        $scope.listTestRunsForDashboard = function() {
    //
    //            $scope.loading = true;
    //
    //            TestRuns.listTestRunsForDashboard($scope.productName, $scope.dashboardName).success(function (testRuns) {
    //
    //                TestRuns.list = testRuns;
    //                $scope.testRuns = TestRuns.list;
    //                $scope.loading = false;
    //
    //            }, function (errorResponse) {
    //                $scope.error = errorResponse.data.message;
    //            });
    //
    //
    //        };
    $scope.testRunDetails = function (testRun) {
      TestRuns.selected = testRun;
      $state.go('viewGraphs', {
        'productName': $stateParams.productName,
        'dashboardName': $stateParams.dashboardName,
        'testRunId': testRun.testRunId,
        tag: Dashboards.getDefaultTag(Dashboards.selected.tags)
      });
    };

    $scope.liveGraphs = function(testRun){

      $state.go('viewLiveGraphs', {
        'productName': $stateParams.productName,
        'dashboardName': $stateParams.dashboardName,
        tag: Dashboards.getDefaultTag(Dashboards.selected.tags)
      });
    }

    $scope.testRunFixedBaselineBenchmark = function (index) {
      TestRuns.selected = $scope.testRuns[index];
      var benchmarkFixedResult = $scope.testRuns[index].benchmarkResultFixedOK ? 'passed' : 'failed';
      $state.go('benchmarkFixedBaselineTestRun', {
        'productName': $stateParams.productName,
        'dashboardName': $stateParams.dashboardName,
        'testRunId': $scope.testRuns[index].testRunId,
        'benchmarkResult': benchmarkFixedResult
      });
    };
    $scope.testRunPreviousBuildBenchmark = function (index) {
      TestRuns.selected = $scope.testRuns[index];
      var benchmarkPreviousResult = $scope.testRuns[index].benchmarkResultPreviousOK ? 'passed' : 'failed';
      $state.go('benchmarkPreviousBuildTestRun', {
        'productName': $stateParams.productName,
        'dashboardName': $stateParams.dashboardName,
        'testRunId': $scope.testRuns[index].testRunId,
        'benchmarkResult': benchmarkPreviousResult
      });
    };
    $scope.testRunRequirements = function (index) {
      TestRuns.selected = $scope.testRuns[index];
      var requirementsResult = $scope.testRuns[index].meetsRequirement ? 'passed' : 'failed';
      $state.go('requirementsTestRun', {
        'productName': $stateParams.productName,
        'dashboardName': $stateParams.dashboardName,
        'testRunId': $scope.testRuns[index].testRunId,
        'requirementsResult': requirementsResult
      });
    };
    $scope.setTestRunAsBaseline = function (baseline) {
      var arrayOfPromises = [];
      Dashboards.selected.baseline = baseline;
      Dashboards.update(Dashboards.selected).success(function (dashboard) {
        Dashboards.selected = dashboard;
        $scope.dashboard = dashboard;
        var baselineSet = false;
        _.each($scope.testRuns, function (testRun, index) {
          /* Only update test runs more recent than baseline */
          if (testRun.testRunId === baseline)
            baselineSet = true;
          if (testRun.testRunId !== baseline && baselineSet == false) {
            $scope.testRuns[index].benchmarkResultFixedOK = 'pending';
            testRun.baseline = baseline;
            arrayOfPromises.push(TestRuns.updateFixedBaseline(testRun).then(function (testRun) {
            }));  //.success(function (updatedTestRun) {
                  //                            $scope.testRuns[index] = updatedTestRun;
                  //                            $scope.testRuns[index].busy = false;
                  //
                  //
                  //                        }, function(errorResponse) {
                  //                            $scope.error = errorResponse.data.message;
                  //                        });
          }
        });
        $q.all(arrayOfPromises).then(function (results) {
          /* refresh test runs*/
          setTimeout(function () {
            TestRuns.listTestRunsForDashboard($scope.productName, $scope.dashboardName).success(function (testRuns) {
              TestRuns.list = testRuns;
            }, function (errorResponse) {
              $scope.error = errorResponse.data.message;
            });
          }, 100);
        });
      });
    };
    $scope.refreshTestrun = function (index) {
      $scope.testRuns[index].meetsRequirement = 'pending';
      $scope.testRuns[index].benchmarkResultPreviousOK = 'pending';
      $scope.testRuns[index].benchmarkResultFixedOK = 'pending';
      $scope.testRuns[index].busy = true;
      TestRuns.refreshTestrun($stateParams.productName, $stateParams.dashboardName, $scope.testRuns[index].testRunId).success(function (testRun) {
        $scope.testRuns[index] = testRun;
        $scope.testRuns[index].busy = false;  ///* refresh screen*/
                                              //setTimeout(function(){
                                              //    $state.go($state.current, {}, {reload: true});
                                              //},1);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.openDeleteSelectedTestRunsModal = function (size) {
      ConfirmModal.itemType = 'Delete ';
      ConfirmModal.selectedItemDescription = ' selected test runs';
      var modalInstance = $modal.open({
        templateUrl: 'ConfirmDelete.html',
        controller: 'ModalInstanceController',
        size: size  //,
      });
      modalInstance.result.then(function (selectedIndex) {

        var deleteTestRunsArrayOfPromises = [];
        var i;
        for (i = $scope.testRuns.length - 1; i > -1; i--) {

          if ($scope.testRuns[i].selected === true) {
            deleteTestRunsArrayOfPromises.push(TestRuns.delete($scope.productName, $scope.dashboardName, $scope.testRuns[i].testRunId));
            $scope.testRunSelected = false;
            $scope.testRuns[i].selected = false;
            $scope.testRuns.splice(i, 1);
            if(TestRuns.list[i]) TestRuns.list.splice(i, 1);
          }

        }


        $q.all(deleteTestRunsArrayOfPromises)
        .then(function () {

          /* refresh view */

          testRunPolling();


        });

      }, function () {
      });
    };
  }
]);
