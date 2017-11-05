#javascript编程练习题目

1. 输入两个数组，输出他们的交集，哪些元素只有第一数组包含，哪些只有第二个数组包含

2. 用递归实现汉诺塔移动步骤结果的输出
<br>
<img src="http://images.cnitblog.com/blog/313471/201408/271347013292075.png" alt="">
<br>
比如2层汉诺塔，需要打印（Console.WriteLine）出如下文本：

	A -> B

	A -> C

	B -> C

3. 统计输入字符串中每个字符出现的次数

4. 输入一个字符串，输出正中间的字符，偶数长度输出中间的两个字符，奇数长度则输出中间的3个字符

5. 输入一个字符串，判断这个字符串是否为回文，回文就是两端的字符以正中间的字符对称，如12321，aba都是回文

6. 什么闭包？实现一个闭包

7. 理解javascript中的this，写出典型的三种用法

8. 实现一个倒计时的页面

9. 输出一个数组，输出去掉里面重复元素后输出

10. 下面的代码输出什么，为什么？第2行代码为什么没有报错?

```js
    (function(){
    	var a = b =5;
    })();
    console.log(b);
```

11\. 下面的代码输出什么，为什么？

```js
    function test(){
	    console.log(a=11);
	    console.log(foo());
	    var a =1;

	    function foo(){
	    	return 2;
	    }
    }

    test();
```

12\. 下面的代码输出什么，为什么？

```js
	var fullname = 'John Doe';
	var obj = {
	    fullname: 'Colin Ihrig',
	    prop: {
	        fullname: 'Aurelio De Rosa',
	        getFullname: function() {
	            returnthis.fullname;
	        }
	    }
	};
	console.log(obj.prop.getFullname());
	var test = obj.prop.getFullname;
	console.log(test());
```

13\. 下面的代码输出什么，为什么？

```js
var myObject = {
    foo: "bar",
    func: function() {
        var self = this;
        console.log("outer func:  this.foo = " + this.foo);
        console.log("outer func:  self.foo = " + self.foo);
        (function() {
            console.log("inner func:  this.foo = " + this.foo);
            console.log("inner func:  self.foo = " + self.foo);
        }());
    }
};
myObject.func();
```

14\. 下面的代码输出什么，为什么？

```js
var person = { age: 10 };
for (var i = 0; i < 5; i++) {
    (function(i) {
        person.age = person.age + i;
        setTimeout(function() {
            console.log(person.age);
        }, 1000);
    })(i)
}
```

15\. 下面两个函数的返回值是一样的吗？为什么？

```js
function foo1() {
    return {
        bar: "hello"
    };
}

function foo2() {
    return {
        bar: "hello"
    };
}
```

16.