#[译]AngularJS $apply, $digest, 和$evalAsync的比较

原文:[The differences between AngularJS $apply, $digest, and $evalAsync](http://www.panda-os.com/blog/2015/01/angularjs-apply-digest-and-evalasync/)

你是不是也常在想AngularJS $apply, $digest, 和$evalAsync到底有什么差别？这个篇博客中我们将探讨一下这三个方法。

AngularJS之所以这么受欢迎，是因为它有很多的处理程序帮我们完成了绝大部分的求值运算。AngularJS让前端开发工作变的简单高效，通过指令我们可以创建html标签，还可以创建独立的模块，AngularJS确实是创建SAP的最好框架之一。

AngularJS的核心之一就是$digset循环，这是AngularJS检测和重新呈现model和view的变化的方法。在每一个$digset循环中，检测列表中的所有的检测对象都会被执行，重新计算绑定到视图的模型对象，然后又将重新渲染的视图呈现给用户。这个过程是影响AngularJS性能的主要部分。

但是很多时候，我们需要在AngularJS的上下文之外对模型进行操作，而这样的操作AngularJS是无法检测到的，也就是说它不能更新model并重新呈现视图。我们有三个方法能个完成这个工作$apply,$digset和$evalAsync，但是在我们不知其所以然的直接调用他们之前，我们需要了解一下为了解决问题我们到底需要影响多少个检测对象，影响多少层scope。

这里有多种方法可以让AngularJS执行计算，也就是让AngularJS开启一个新的$digset循环：
1. $apply()
2. $timeout()
3. $digest()
4. $evalAsync()

####$apply()
$apply()会触发整个应用中的所有scope上的$digset循环。意思就是，每次我们调用$apply()都会在整个应用的生命周期中开启一个新的$digset循环。整个生命周期涉及3个主要任务：

>Scope’s $apply() method transitions through the following stages:
>1. The expression is executed using the $eval() method.
>2. Any exceptions from the execution of the expression are forwarded to the $exceptionHandler service.
>3. The watch listeners are fired immediately after the expression was executed using the $digest() method.

调用$apply()会直接导致2个严重的问题：

1. 当我们的应用中有大量的绑定的时候，过多的调用$apply()会导致严重的性能问题
2. AngularJS只维护一个$digset循环，当一个$digset循环正在执行的时候，$apply()是无法立即执行的，因为它会开启一个新的$digset循环

所以在调用$apply()前，请三思而行，我们是否真的需要用$apply()。

####$timeout()
在AngularJS 1.2.x之前，$timeout()是解决AngularJS上下文之外修改model问题的最简单最快速的办法，$timeout()的特别之处是AngularJS从来不会中断和阻止它完成执行。默认情况下$timeout()就是个常规的javascript setTimeout方法，当时在执行的最后会调用$apply()。 你可以通过配置让$timeout()在最后不执行$apply()。


####$evalAsync()
$evalAsync()是AngularJS 1.2.x开始引入的，对我来说$evalAsync()就是$timeout的一个更聪明的兄弟。在$evalAsync()引入之前，AngularJS官方给出的在AngularJS上下文之外触发$digset的方法就是$timeout。越来越多的用户都遇到这样类似的问题，因此AngularJS在新的版本中引入了$evalAsync()。$evalAsync()的表达式会在当前$digset循环中执行而不是下一个循环中。
>$evalAsync() – Executes the expression on the current scope at a later point in time.
The $evalAsync makes no guarantees as to when the expression will be executed, only that:
** it will execute after the function that has scheduled the evaluation (preferably before the DOM rendering).
** at least one $digest cycle will be performed after expression execution.

####如果我们不想触发整个应用的$digset循环呢？
因为这个原因，我们有了$digset()方法。

####$digset()
$digset()就是前面说到的那个循环，它会为每一个scope执行监测对象的重新计算。不同于$apply()的在$rootScope和所有的后代scope上执行监测对象计算，$digset()从它所在的scope开始执行，然后是它所有的后代scope上执行。这一巨大差别的直接表现就是，$digset()能够大大减少需要重新计算的监测对象的数量。同时有一点你需要特别注意，就是当前所在的scope的上层的scope不会更新，在view上的表现就是绑定当前scope的值更新了，但是绑定上层scope值的地方却没有更新。

####总结
调用$scope.$apply()会在整个应用上开启新的$digset循环，所用活动的scope上的监测对象都被重新计算，简而言之，它会贯穿你的应用的所有的scope和绑定，看看有没有什么改动。使用$scope.$digest()而不是$scope.$apply()，将能为AngularJS减少负担，她能确切的知道从哪个scope开始、需要包含哪些子代scope。但是你时时刻刻需要记住一点，那就是它不会更新父scope，和父scope绑定相关的属性不会更新。

####翻译的收获
以前看到英文文章也有翻译的想法，但是觉得没什么意义，看得懂就可以了，翻译只是简单的语言文字转换，对知识的学习理解帮助不大。今天尝试翻译了这篇文章，收获还是挺大的，首先你得真正理解了才能用自己的话转述出来；其次，翻译的过程其实也可以算是自己总结的过程，加深了理解和牢固性；最后，学了英文还能装个逼。

