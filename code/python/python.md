# Python

#### global   
```python
def test():
    global name = 'mark'

print(name)
```

#### return 多个结果  
```python
def test():
    name = 'mark'
    job = 'pythoner'
    return name,job
```

#### 装饰器 - @[返回装饰器的表达式]   
```python
from functools import wraps

def logit(logfile='out.log'):
    def logging_decorator(func):
        '''解决原方法上__name__,等被覆盖的问题'''
        @wraps(func)
        def wrapped_function(*args, **kwargs):
            log_string = func.__name__ + " was called"
            print(log_string)
            # 打开logfile, 并写入内容
            with open(logfile, 'a') as opened_file:
                # 现在将日志打到指定的logfile
                opened_file.write(log_string + '\n')
            return func(*args, **kwargs)
        return wrapped_function
    return logging_decorator

@logit()
def myfunc1():
    pass

myfunc1()
# Output: myfunc1 was called
# 现在一个叫做 out.log 的文件出现了, 里面的内容就是上面的字符串

@logit(logfile='func2.log')
def myfunc2():
    pass

myfunc2()
# Output: myfunc2 was called
# 现在一个叫做 func2.log 的文件出现了, 里面的内容就是上面的字符串
``` 

#### 默认参数     
在Python中当函数被定义时, 默认参数只会运算一次, 而不是每次被调用时都会重新运算。你应该永远不要定义可变类型的默认参数, 除非你知道你正在做什么。
```python
def add_to(num, target=[]):
    target.append(num)
    return target

add_to(1)
# Output: [1]

add_to(2)
# Output: [2]

add_to(3)
# Output: [3]
```

#### 默认参数 - 2  
正确的定义, 每次调用生成新的list
```python
def add_to(element, target=None):
    if target is None:
        target = []
    target.append(element)
    return target
```

#### 可变类型     
Python中可变(mutable)与不可变(immutable)的数据类型
```python
foo = ['hi']
print(foo)
# Output: ['hi']

bar = foo
bar += ['bye']
print(foo)
# Output: ['hi', 'bye']
```

#### __slots__魔法  
在Python中, 每个类都有实例属性。默认情况下Python用一个字典来保存一个对象的实例属性。对于有着已知属性的小类来说, 它可能是个瓶颈。这个字典浪费了很多内存。Python不能在对象创建时直接分配一个固定量的内存来保存所有的属性。因此如果你创建许多对象(我指的是成千上万个), 它会消耗掉很多内存(dict初始化时会默认容量的内存分配)。这个方法需要使用__slots__来告诉Python不要使用字典, 而且只给一个固定集合的属性分配空间。
```python
class MyClass(object):
  __slots__ = ['name', 'identifier']
  def __init__(self, name, identifier):
      self.name = name
      self.identifier = identifier
      self.set_up()
```

#### dict和list的内存分配    

|类型              |描述            
|:-------------------|:--------------
|list类似于 Vector|对象和指针数组是分开分配的, 数组是在堆上。指针数组的大小是动态分配的, 分配的内存肯定要多于实际的。既然是动态分配的, 那么realloc调整大小就会移动数据, 复制数据, 大量数据还是用链表比较好。
|dict类似于 Hash table|字典本身默认有元素容量, 不够的才去堆上分配。需要扩容或者收缩, 就会动态重新分配内存, 重新hash。dict的keys()等调用生成list 如果数量很大, 建议用迭代器

#### [虚拟环境(virtualenv)](https://eastlakeside.gitbooks.io/interpy-zh/content/virtual_environment/virtual_environment.html)   
Virtualenv 是一个工具，它能够帮我们创建一个独立(隔离)的Python环境。想象你有一个应用程序，依赖于版本为2的第三方模块，但另一个程序依赖的版本是3，请问你如何使用和开发这些应用程序？如果你把一切都安装到了/usr/lib/python2.7/site-packages（或者其它平台的标准位置），那很容易出现某个模块被升级而你却不知道的情况。在另一种情况下，想象你有一个已经开发完成的程序，但是你不想更新它所依赖的第三方模块版本；但你已经开始另一个程序，需要这些第三方模块的版本。

#### defaultdict  - [dict](https://docs.python.org/3/library/stdtypes.html#dict)  
如果访问的key不存在, 则会返回默认值,并加入dict. 当使用__getitem__()方法访问一个不存在的键时(dict[key]这种形式实际上是__getitem__()方法的简化形式)，会调用__missing__()方法获取默认值，并将该键添加到字典中去。从2.5版本开始，如果派生自dict的子类定义了__missing__()方法，当访问不存在的键时#dict[key]会调用__missing__()方法取得默认值。

#### 单词统计 - dict的默认值问题
```python
strings = ('puppy', 'kitten', 'puppy', 'puppy',
           'weasel', 'puppy', 'kitten', 'puppy')
counts = {}

for kw in strings:
    if kw not in counts:
        counts[kw] = 1
    else:
        counts[kw] += 1

```
使用setdefault设置默认值   
```python
strings = ('puppy', 'kitten', 'puppy', 'puppy',
           'weasel', 'puppy', 'kitten', 'puppy')
counts = {}

for kw in strings:
    counts[kw] = counts.setdefault(kw, 0) + 1
```
使用defaultdict实现单词统计 - defaultdict接受一个类型或者返回默认值的函数
```python
from collections import defaultdict

strings = ('puppy', 'kitten', 'puppy', 'puppy',
           'weasel', 'puppy', 'kitten', 'puppy')
counts = defaultdict(lambda: 0)  # 使用lambda来定义简单的函数

for s in strings:
    counts[s] += 1
```

#### counter
Counter 是实现的 dict 的一个子类，可以用来方便地计数。
```python
from collections import Counter

colours = (
    ('Yasoob', 'Yellow'),
    ('Ali', 'Blue'),
    ('Arham', 'Green'),
    ('Ali', 'Black'),
    ('Yasoob', 'Red'),
    ('Ahmed', 'Silver'),
)

favs = Counter(name for name, colour in colours)
print(favs)

## 输出:
## Counter({
##     'Yasoob': 2,
##     'Ali': 2,
##     'Arham': 1,
##     'Ahmed': 1
##  })
```
我们也可以在利用它统计一个文件，例如：
```python
with open('filename', 'rb') as f:
    line_count = Counter(f)
print(line_count)
```
高逼格的统计
```python
word_counts = Counter()
with open('/etc/passwd') as f:
    for line in f:
        word_counts.update(line.strip().split(':'))
```
counter常用
```python
# elements() 按照counter的计数，重复返回元素
c = Counter(a=4, b=2, c=0, d=-2)
list(c.elements())
# ['a', 'a', 'a', 'a', 'b', 'b']

# most_common(n) 按照counter的计数，按照降序，返回前n项组成的list; n忽略时返回全部
Counter('abracadabra').most_common(3)
# [('a', 5), ('r', 2), ('b', 2)]

# subtract([iterable-or-mapping]) counter按照相应的元素，计数相减
c = Counter(a=4, b=2, c=0, d=-2)
d = Counter(a=1, b=2, c=3, d=4)
c.subtract(d)
# Counter({'a': 3, 'b': 0, 'c': -3, 'd': -6})

# update([iterable-or-mapping]) 不同于字典的update方法，这里更新counter时，相同的key的value值相加而不是覆盖
# 实例化 Counter 时， 实际也是调用这个方法

# Counter 间的数学集合操作
c = Counter(a=3, b=1, c=5)
d = Counter(a=1, b=2, d=4)
c + d                       # counter相加, 相同的key的value相加
Counter({'c': 5, 'a': 4, 'd': 4, 'b': 3})
c - d                       # counter相减, 相同的key的value相减，只保留正值得value
Counter({'c': 5, 'a': 2})
c & d                       # 交集:  取两者都有的key,value取小的那一个
Counter({'a': 1, 'b': 1})
c | d                       # 并集:  汇聚所有的key, key相同的情况下，取大的value
Counter({'c': 5, 'd': 4, 'a': 3, 'b': 2})

# 常见做法:
sum(c.values())                 # 继承自字典的.values()方法返回values的列表，再求和
c.clear()                       # 继承自字典的.clear()方法，清空counter
list(c)                         # 返回key组成的list
set(c)                          # 返回key组成的set
dict(c)                         # 转化成字典
c.items()                       # 转化成(元素，计数值)组成的列表
Counter(dict(list_of_pairs))    # 从(元素，计数值)组成的列表转化成Counter
c.most_common()[:-n-1:-1]       # 最小n个计数的(元素，计数值)组成的列表
c += Counter()                  # 利用counter的相加来去除负值和0的值
```

#### namedtuple和enum.Enum
```python
from collections import namedtuple
from enum import Enum

class Species(Enum):
    cat = 1
    dog = 2
    horse = 3
    aardvark = 4
    butterfly = 5
    owl = 6
    platypus = 7
    dragon = 8
    unicorn = 9
    # 依次类推

    # 但我们并不想关心同一物种的年龄，所以我们可以使用一个别名
    kitten = 1  # (译者注：幼小的猫咪)
    puppy = 2   # (译者注：幼小的狗狗)

Animal = namedtuple('Animal', 'name age type')
perry = Animal(name="Perry", age=31, type=Species.cat)
drogon = Animal(name="Drogon", age=4, type=Species.dragon)
tom = Animal(name="Tom", age=75, type=Species.cat)
charlie = Animal(name="Charlie", age=2, type=Species.kitten)
```

#### [deque](https://docs.python.org/3/library/collections.html?highlight=deque#deque-objects)  
functions: append, appendleft, pop, popleft, extend, extendleft, reverse, rotate, insert, remove, index, count, copy, maxlen...
```python

>>> from collections import deque
>>> d = deque('ghi')                 # make a new deque with three items
>>> for elem in d:                   # iterate over the deque's elements
...     print(elem.upper())
G
H
I

>>> d.append('j')                    # add a new entry to the right side
>>> d.appendleft('f')                # add a new entry to the left side
>>> d                                # show the representation of the deque
deque(['f', 'g', 'h', 'i', 'j'])

>>> d.pop()                          # return and remove the rightmost item
'j'
>>> d.popleft()                      # return and remove the leftmost item
'f'
>>> list(d)                          # list the contents of the deque
['g', 'h', 'i']
>>> d[0]                             # peek at leftmost item
'g'
>>> d[-1]                            # peek at rightmost item
'i'

>>> list(reversed(d))                # list the contents of a deque in reverse
['i', 'h', 'g']
>>> 'h' in d                         # search the deque
True
>>> d.extend('jkl')                  # add multiple elements at once
>>> d
deque(['g', 'h', 'i', 'j', 'k', 'l'])
>>> d.rotate(1)                      # right rotation
>>> d
deque(['l', 'g', 'h', 'i', 'j', 'k'])
>>> d.rotate(-1)                     # left rotation
>>> d
deque(['g', 'h', 'i', 'j', 'k', 'l'])

>>> deque(reversed(d))               # make a new deque in reverse order
deque(['l', 'k', 'j', 'i', 'h', 'g'])
>>> d.clear()                        # empty the deque
>>> d.pop()                          # cannot pop from an empty deque
Traceback (most recent call last):
    File "<pyshell#6>", line 1, in -toplevel-
        d.pop()
IndexError: pop from an empty deque

>>> d.extendleft('abc')              # extendleft() reverses the input order
>>> d
deque(['c', 'b', 'a'])
```

#### enumerate  
枚举(enumerate)是Python内置函数。它允许我们遍历数据并自动计数，enumerate也接受一些可选参数，这使它更有用。
```python
for counter, value in enumerate(some_list):
    print(counter, value)

# 可选参数允许我们定制从哪个数字开始枚举
my_list = ['apple', 'banana', 'grapes', 'pear']
for c, value in enumerate(my_list, 1):
    print(c, value)

# 输出:
(1, 'apple')
(2, 'banana')
(3, 'grapes')
(4, 'pear')    

# 你还可以用来创建包含索引的元组列表， 例如：
my_list = ['apple', 'banana', 'grapes', 'pear']
counter_list = list(enumerate(my_list, 1))
print(counter_list)
# 输出: [(1, 'apple'), (2, 'banana'), (3, 'grapes'), (4, 'pear')]
```

# 自省

#### dir
它返回一个列表，列出了一个对象所拥有的属性和方法。
```python
my_list = [1, 2, 3]
dir(my_list)
# Output: ['__add__', '__class__', '__contains__', '__delattr__', '__delitem__',
# '__delslice__', '__doc__', '__eq__', '__format__', '__ge__', '__getattribute__',
# '__getitem__', '__getslice__', '__gt__', '__hash__', '__iadd__', '__imul__',
# '__init__', '__iter__', '__le__', '__len__', '__lt__', '__mul__', '__ne__',
# '__new__', '__reduce__', '__reduce_ex__', '__repr__', '__reversed__', '__rmul__',
# '__setattr__', '__setitem__', '__setslice__', '__sizeof__', '__str__',
# '__subclasshook__', 'append', 'count', 'extend', 'index', 'insert', 'pop',
# 'remove', 'reverse', 'sort']
```

#### type和id   
type函数返回一个对象的类型。举个例子：
```python
print(type(''))
# Output: <type 'str'>

print(type([]))
# Output: <type 'list'>

print(type({}))
# Output: <type 'dict'>

print(type(dict))
# Output: <type 'type'>

print(type(3))
# Output: <type 'int'>
```
id()函数返回任意不同种类对象的唯一ID，举个例子：
```python
name = "Yasoob"
print(id(name))
# Output: 139972439030304
```

#### [inspect模块](https://docs.python.org/3/library/inspect.html?highlight=inspect#module-inspect)  
inspect模块也提供了许多有用的函数，来获取活跃对象的信息。比方说，你可以查看一个对象的成员，只需运行：
```python
import inspect
print(inspect.getmembers(str))
# Output: [('__add__', <slot wrapper '__add__' of ... ...
```

# 各种推导式(comprehensions) 

#### 列表(list)推导式        
```python
multiples = [i for i in range(30) if i % 3 is 0]
print(multiples)
# Output: [0, 3, 6, 9, 12, 15, 18, 21, 24, 27]

squared = [x**2 for x in range(10)]
```

#### 字典(dict)推导式        
```python
mcase = {'a': 10, 'b': 34, 'A': 7, 'Z': 3}

mcase_frequency = {
    k.lower(): mcase.get(k.lower(), 0) + mcase.get(k.upper(), 0)
    for k in mcase.keys()
}

# mcase_frequency == {'a': 17, 'z': 3, 'b': 34}
```

#### 集合(set)推导式     
```python
squared = {x**2 for x in [1, 1, 2]}
print(squared)
# Output: {1, 4}
```

# 异常 

最基本的术语里我们知道了try/except从句。可能触发异常产生的代码会放到try语句块里，而处理异常的代码会在except语句块里实现。
这是一个简单的例子：
```python
try:
    file = open('test.txt', 'rb')
except EOFError as e:
    print("An EOF error occurred.")
    raise e
except IOError as e:
    print("An error occurred.")
    raise e
finally:
    # 包裹到finally从句中的代码不管异常是否触发都将会被执行。
    print("This would be printed whether or not an exception occurred!")    

# 最后一种方式会捕获所有异常：
try:
    file = open('test.txt', 'rb')
except Exception:
    # 打印一些异常日志，如果你想要的话
    raise    

# try/else
try:
    print('I am sure no exception is going to occur!')
except Exception:
    print('exception')
else:
    # 这里的代码只会在try语句里没有触发异常时运行,
    # 但是这里的异常将 *不会* 被捕获
    print('This would only run if no exception occurs. And an error here '
          'would NOT be caught.')
finally:
    print('This would be printed in every case.')

```    

# lambda表达式  

#### 原型
```
lambda 参数:操作(参数)
```
例子
```
add = lambda x, y: x + y

print(add(3, 5))
# Output: 8
```
列表排序
```
a = [(1, 2), (4, 1), (9, 10), (13, -3)]
a.sort(key=lambda x: x[1])

print(a)
# Output: [(13, -3), (4, 1), (1, 2), (9, 10)]
```
列表并行排序
```
data = zip(list1, list2)
data = sorted(data)
list1, list2 = map(lambda t: list(t), zip(*data))
```            

# [实用的一行式](https://wiki.python.org/moin/Powerful%20Python%20One-Liners)  

#### 简易Web Server  
```python
# Python 2
python -m SimpleHTTPServer

# Python 3
python -m http.server
```

#### 漂亮的打印  
```python
from pprint import pprint

my_dict = {'name': 'Yasoob', 'age': 'undefined', 'personality': 'awesome'}
pprint(my_dict)

# 快速漂亮的从文件打印出json数据
cat file.json | python -m json.tool
```

#### 脚本性能分析  
```python
python -m cProfile my_script.py
# 备注：cProfile是一个比profile更快的实现，因为它是用c写的
```

#### CSV转换为json  
```python
python -c "import csv,json;print json.dumps(list(csv.reader(open('csv_file.csv'))))"
# 确保更换csv_file.csv为你想要转换的csv文件
```

#### 列表辗平  
```python
a_list = [[1, 2], [3, 4], [5, 6]]
print(list(itertools.chain.from_iterable(a_list)))
# Output: [1, 2, 3, 4, 5, 6]

# or
print(list(itertools.chain(*a_list)))
# Output: [1, 2, 3, 4, 5, 6]
```

# Python 2

#### for/else
else在没有break, 且循环结束时执行
```python
for item in container:
    if search_something(item):
        # Found it!
        process(item)
        break
else:
    # Didn't find anything..
    not_found_in_container()
```
找出2到10之间的数字的因子, 和质数
```python
for n in range(2, 20):
    for x in range(2, n):
        if n % x == 0:
            print(n, 'equals', x, '*', n / x)
            break
    else:
        # loop fell through without finding a factor
        print(n, 'is a prime number')
```        

# 使用C扩展

开发者有三种方法可以在自己的Python代码中来调用C编写的函数-ctypes，SWIG，Python/C API。每种方式也都有各自的利弊。

我们要明确为什么要在Python中调用C？ 

常见原因如下：     

1. 你要提升代码的运行速度，而且你知道C要比Python快50倍以上  
1. C语言中有很多传统类库，而且有些正是你想要的，但你又不想用Python去重写它们  
1. 想对从内存到文件接口这样的底层资源进行访问  
1. 不需要理由，就是想这样做  


# 文件操作 open

```python
with open('photo.jpg', 'r+') as f:
    jpgdata = f.read()
```

open的第一个参数是文件名。第二个(mode 打开模式)决定了这个文件如何被打开:

1. 如果你想读取文件，传入r
1. 如果你想读取并写入文件，传入r+
1. 如果你想覆盖写入文件，传入w
1. 如果你想在文件末尾附加内容，传入a

```python
import io

with open('photo.jpg', 'rb') as inf:
    jpgdata = inf.read()

if jpgdata.startswith(b'\xff\xd8'):
    text = u'This is a JPEG file (%d bytes long)\n'
else:
    text = u'This is a random file (%d bytes long)\n'

with io.open('summary.txt', 'w', encoding='utf-8') as outf:
    outf.write(text % len(jpgdata))
```


# 协程

生成器是数据的生产者
协程则是数据的消费者

回顾下生成器
```python
def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a+b

for i in fib():
    print i
```
协程  
发送的值会被yield接收。我们为什么要运行next()方法呢？这样做正是为了启动一个协程。就像协程中包含的生成器并不是立刻执行，而是通过next()方法来响应send()方法。因此，你必须通过next()方法来执行yield表达式。
```python
# Python实现的grep就是个很好的例子：
def grep(pattern):
    print("Searching for", pattern)
    while True:
        line = (yield)
        if pattern in line:
            print(line)

search = grep('coroutine')
next(search)
#output: Searching for coroutine
search.send("I love you")
search.send("Don't you love me?")
search.send("I love coroutine instead!")
# output: I love coroutine instead!

# 关闭协程
search.close()
```