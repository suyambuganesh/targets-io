(function () {
  'use strict';
  angular.module('core').directive('formattedDate', function ($filter) {
    return {
      link: function (scope, element, attrs, ctrl) {
        ctrl.$formatters.unshift(function (modelValue) {
          return $filter('date')(new Date(modelValue),'EEEE, dd-M-yyyy H:mm:ss');
        });

        ctrl.$parsers.unshift(function (viewValue) {
          return $filter('date')(new Date(viewValue),'EEEE, dd-M-yyyy H:mm:ss');
        });
      },
      restrict: 'A',
      require: 'ngModel'
    }
  });
  ;
}());
