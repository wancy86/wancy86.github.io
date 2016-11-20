[译]AngularJS中DOM操作

再翻译一篇干货短文，原文:[AngularJS jQuery](http://www.panda-os.com/blog/2015/01/angularjs-jquery-dom-ready/)

虽然Angularjs将我们从DOM的操作中解放出来了，但是很多时候我们还是会需要在controller/view加载之后执行一些DOM操作。问题是我们将DOM操作的代码放到controller中，然而controller是先于view加载的，这个时候我们要操作的元素还是不存在的。

这里有几种办法解决这个问题，我们按照AngularJS最佳实践方法的推荐度，从高到低列出来：

1. 监听$viewContentLoaded广播事件
    ```JS
	$scope.$on('$viewContentLoaded', function(event) {
	//Your code goes here.
	});
    ```

2. 使用0秒延迟的$timeout，这样view已经加载完了($timeout是在DOM呈现之后执行的)， 我们的代码在下一个$digset循环中执行
    ```JS
	$timeout(function() {
	//Your code goes here.
	});
    ```

3. 使用流行而古老的jQuery方式(在大多数的场景中都是工作的)
    ```JS
	jQuery(window).ready(function() {
	//Your code goes here.
	})
    ```

