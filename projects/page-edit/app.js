/**
 * DynamicPageEdit Module
 *
 * Description
 */
// ngDraggable
angular.module('DynamicPageEdit', ['ionic', 'ui.router', 'ngResource', angularDragula(angular)])

    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');

        // stateProvider.state('app', {
        //     url: '/',
        //     templateUrl: '',
        //     controller: ''
        // })

    }])

    .controller('MainController', ['$scope', '$rootScope', 'dragulaService',
        function($scope, $rootScope, dragulaService) {
            console.log('xxxx', 123);

            $scope.UIList = [{
                type: 'slider',
                height: 120,
                order: 1,
                items: [{
                    img_url: 'http://placehold.it/1500X500',
                    clicked_url: '#',
                    order: 1
                }, {
                    img_url: 'http://placehold.it/1500X500',
                    clicked_url: '#',
                    order: 2
                }, {
                    img_url: 'http://placehold.it/1500X500',
                    clicked_url: '#',
                    order: 3
                }]
            }, {
                type: 'title',
                height: 60,
                order: 2,
                items: [{
                    img_url: 'http://placehold.it/2510x480',
                    clicked_url: '#',
                    order: 4
                }]
            }, {
                type: 'grid',
                height: 200,
                order: 4,
                items: [{
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#',
                    order: 5
                }, {
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#',
                    order: 6
                }]
            }, {
                type: 'title',
                height: 300,
                order: 5,
                items: [{
                    img_url: 'http://placehold.it/1510x480',
                    clicked_url: '#',
                    order: 7
                }]
            }, {
                type: 'grid',
                height: 200,
                order: 4,
                items: [{
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#',
                    order: 8
                }, {
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#',
                    order: 9
                }, {
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#',
                    order: 10
                }, {
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#',
                    order: 11
                }]
            }];

            // dragulaService.options($scope, 'second-bag', {
            //     removeOnSpill: true
            // });

            // $scope.$on('third-bag.drag', function(e, el) {
            //     // el.removeClass('ex-moved');
            //     console.log('xxxx', 1111);
            // });

            $scope.$on('second-bag.drop', function(e, el) {
                // re-order component
                $('.preview .component').each(function() {
                    $scope.UIList[$(this).attr('eindex')].order = $('.preview .component').index($(this));
                });
            });

            $scope.$on('third-bag.drop', function(e, el) {
                // re-order image
                $('.imginfo img').each(function() {
                    $scope.editElement.items[$(this).attr('eindex')].order = $('.imginfo img').index($(this));
                });
            });

            // $scope.$on('first-bag.over', function(e, el, container) {
            //     // container.addClass('ex-over');
            //     // console.log('xxxx', 1111);
            // });

            // $scope.$on('first-bag.out', function(e, el, container) {
            //     // container.removeClass('ex-over');
            //     // console.log('xxxx', 1111);
            // });

            dragulaService.options($scope, 'first-bag', {
                copy: true,
                removeOnSpill: true
            });

            // add new element
            $scope.addUIElement = function(uitype) {
                var items = [];
                var icount = 1;
                var size = '1500x500';
                if (uitype == 'slider') icount = 3;
                if (uitype == 'bgimg') size = '500x500';
                if (uitype == 'grid') {
                    icount = 4;
                    size = '500x360';
                }
                for (var i = icount; i > 0; i--) {
                    items.push({
                        img_url: 'http://placehold.it/' + size,
                        clicked_url: '#'
                    });
                }

                var uiobj = {
                    type: uitype,
                    height: 120,
                    order: $scope.UIList.length + 1,
                    items: items
                }
                $scope.UIList.push(uiobj);
            }

            $scope.delElement = function() {
                if ($scope.editElement) {
                    $scope.UIList.splice($scope.UIList.indexOf($scope.editElement), 1);
                    delete $scope.editElement;
                }
            }

            $scope.editUIDetail = function(index) {
                $scope.editElement = $scope.UIList[index];
            }

            $scope.editImgInfo = function(imgItem, index) {
                $scope.editImg = imgItem;
            }

            $scope.addImg = function() {
                $scope.editElement.items.push({
                    img_url: 'http://placehold.it/2510x480',
                    clicked_url: '#'
                })
            }

            $scope.delImg = function(index) {
                $scope.editElement.items.splice(index, 1);
            }

            $scope.uploadChanges = function() {
                var postdata = JSON.stringify($scope.UIList);
                //service post data
                console.log('xxxx', postdata);

            }

            $scope.revertChanges = function() {

                // $scope.UIList={}
            }


        }
    ]);