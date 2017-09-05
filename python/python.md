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
