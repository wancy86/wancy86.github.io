angular.module('test.md1', [])

.service('testserv', [function() {
    this.log = function(data) {
        console.log('testserv log:', data);
    }
}]);

// shopping car module
angular.module('myapp', ['test.md1'])

.run(function() {
    console.log('1111:', 1111);
})

.factory('shopinglog', ['testserv', function(testserv) {
    return {
        log: function(data) {
            testserv.log(data);
        }
    }
}])

.controller('shoppingCartCtrl', ['$scope', '$filter', 'testserv', 'shopinglog', function($scope, $filter, testserv, shopinglog) {
    console.log('1111:', 2222);

    // 这个两个service的引入只是为了验证模块引用没有问题
    testserv.log('shoppingCartCtrl')
    shopinglog.log('shopinglog service')

    $scope.title = "京东商城";
    $scope.goods = [{
        name: "apple",
        price: 29,
        imgUrl: "http://img13.360buyimg.com/n0/jfs/t274/83/2090217694/98857/a305ee1b/5450e819Nb4f4ada9.jpg"
    }, {
        name: "orange",
        price: 72,
        imgUrl: "https://img11.360buyimg.com/n0/jfs/t2722/130/2964403780/301720/b495be0b/577a33dfNce88ebd9.jpg"
    }, {
        name: "banana",
        price: 23,
        imgUrl: "https://img11.360buyimg.com/n0/jfs/t3082/52/1016555296/267303/5e305da1/57c403e9N15c1c8bf.jpg"
    }];

    $scope.cart = [];

    $scope.addtoCart = function(index) {
        console.log('addtoCart:', index);
        var good = $scope.goods[index];
        console.log('good:', good);
        if (!$scope.cart) $scope.cart = [];
        console.log('$scope.cart1:', $scope.cart);
        var added = $filter('filter')($scope.cart, function(value, index, array) {
            console.log('value:', value.good.name, good.name);
            return value.good.name == good.name;
        })[0];
        console.log('added:', added);

        if (!added) {
            $scope.cart.push({
                good: $scope.goods[index],
                number: 1
            });
        } else {
            console.log('added.number:', added.number);
            added.number = parseInt(added.number) + 1;
            $scope.cart = $filter('filter')($scope.cart, function(value) {
                return value.good.name != good.name;
            });
            $scope.cart.push(added);
        }
        $scope.cart = $filter('orderBy')($scope.cart, 'good.name');
        console.log('scope.cart2:', $scope.cart);
    }

    $scope.delFromCart = function(index) {
        console.log('delFromCart:', index);
        var good = $scope.cart[index].good;
        $scope.cart = $filter('filter')($scope.cart, function(value) {
            return value.good.name != good.name;
        });
        console.log('scope.cart:', $scope.cart);
    }

    $scope.totalPrice = function() {
        var totalPrice = 0;
        for (var i = 0; i < $scope.cart.length; i++) {
            totalPrice += $scope.cart[i].good.price * $scope.cart[i].number
        };
        return totalPrice;
    };


}]);
