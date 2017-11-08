/**
 * DynamicPageEdit Module
 *
 * Description
 */
// ngDraggable
angular.module('DynamicPageEdit', ['ui.router', 'ngResource', angularDragula(angular)])

    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');

        // stateProvider.state('app', {
        //     url: '/',
        //     templateUrl: '',
        //     controller: ''
        // })

    }])

    .controller('MainController', ['$state', '$scope', 'dragulaService', function($state, $scope, dragulaService) {
        // $scope.

        // nothing happen
        dragulaService.options($scope, 'bag1', {
            copy: true
        });
        
    }]);