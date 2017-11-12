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
                dis_order: 1,
                items: [{
                    img_url: 'http://placehold.it/1500X500',
                    clicked_url: '#'
                }, {
                    img_url: 'http://placehold.it/1500X500',
                    clicked_url: '#'
                }, {
                    img_url: 'http://placehold.it/1500X500',
                    clicked_url: '#'
                }]
            }, {
                type: 'title',
                height: 60,
                dis_order: 2,
                items: [{
                    img_url: 'http://placehold.it/2510x480',
                    clicked_url: '#'
                }]
            }, {
                type: 'grid',
                height: 200,
                dis_order: 4,
                items: [{
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#'
                }, {
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#'
                }]
            }, {
                type: 'title',
                height: 300,
                dis_order: 5,
                items: [{
                    img_url: 'http://placehold.it/1510x480',
                    clicked_url: '#'
                }]
            }, {
                type: 'grid',
                height: 200,
                dis_order: 4,
                items: [{
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#'
                }, {
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#'
                }, {
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#'
                }, {
                    img_url: 'http://placehold.it/510x360',
                    clicked_url: '#'
                }]
            }];

            // dragulaService.options($scope, 'second-bag', {
            //     removeOnSpill: true
            // });

            // $scope.$on('first-bag.drag', function(e, el) {
            //     // el.removeClass('ex-moved');
            //     console.log('xxxx', 1111);
            // });

            // $scope.$on('first-bag.drop', function(e, el) {
            //     // el.addClass('ex-moved');
            //     console.log('xxxx', 2222);
            // });

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
                    dis_order: $scope.UIList.length + 1,
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
                //排序后post json data
                var order = 1;
                $('.preview .component').each(function() {
                    $scope.UIList[$(this).attr('eindex')].dis_order = order++;
                    // console.log('xxxx',$('.preview .component').index($(this)));
                });

                var postdata = JSON.stringify($scope.UIList);
                //service post data


            }

            $scope.revertChanges = function() {

                // $scope.UIList={}
            }


        }
    ]);