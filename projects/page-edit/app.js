/**
 * DynamicPageEdit Module
 *
 * Description
 */
angular.module('DynamicPageEdit', ['ui.router', 'ngResource', 'ngDraggable'])

    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');

        // stateProvider.state('app', {
        //     url: '/',
        //     templateUrl: '',
        //     controller: ''
        // })

    }])

    .controller('MainController', ['$state', '$scope', function($state, $scope) {
        // $scope.
    }]);