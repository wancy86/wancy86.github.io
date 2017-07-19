# vue


### vue实例的创建和扩展
```js
var vm = new Vue({
  // 选项
})
```
可以扩展 Vue 构造器，从而用预定义选项创建可复用的组件构造器：
```js
var MyComponent = Vue.extend({
  // 扩展选项
})
// 所有的 `MyComponent` 实例都将以预定义的扩展选项被创建
var myComponentInstance = new MyComponent()
```
所有的 Vue.js 组件其实都是被扩展的 Vue 实例。


### 属性和方法
每个 Vue 实例都会代理其 data 对象里所有的属性：
```js
var data = { a: 1 }
var vm = new Vue({
  data: data
})
vm.a === data.a // -> true
// 设置属性也会影响到原始数据
vm.a = 2
data.a // -> 2
// ... 反之亦然
data.a = 3
vm.a // -> 3
```
如果在实例创建之后添加新的属性到实例上，它不会触发视图更新。

### [实例属性和方法](https://cn.vuejs.org/v2/api/#实例属性)
1. 实例属性  
    vm.$data  
    vm.$props  
    vm.$el  
    vm.$options  
    vm.$parent  
    vm.$root  
    vm.$children  
    vm.$slots  
    vm.$scopedSlots  
    vm.$refs  
    vm.$isServer  
    vm.$attrs  
    vm.$listeners  
1. 实例方法 / 数据  
    vm.$watch  
    vm.$set  
    vm.$delete  
1. 实例方法/事件  
    vm.$on  
    vm.$once  
    vm.$off  
    vm.$emit  
1. 实例方法 / 生命周期  
    vm.$mount  
    vm.$forceUpdate  
    vm.$nextTick  
    vm.$destroy  


### 组件的注册
全局注册组件，自然全局可用
```js
Vue.component('my-component', {
  // 选项
})
```
但是更实用的是局部注册，在一个vue实例中使用components属性注册组件，这个组件将只在这个vue实例作用域内可用。
```js
var Child = {
  template: '<div>A custom component!</div>'
}
new Vue({
  // ...
  components: {
    // <my-component> 将只在父模板可用
    'my-component': Child
  }
})
```
`myComponent.vue`这样的开发方式输出的都是组件配置对象，import之后在父组件中注册使用。

### 关于data属性
data必须是一个函数。如果data是一个对象的话，在组件复用的情况下，多个组件将公用一个data对象，所有的数据将共享。

### 关于methods属性
所有的方法和事件处理程序配置在这里
```js
new Vue({
  el: '#example-3',
  methods: {
    say: function (message) {
      alert(message)
    }
  }
})
```

### props属性
组件实例的作用域是孤立的。这意味着不能 (也不应该) 在子组件的模板内直接引用父组件的数据。要让子组件使用父组件的数据，我们需要通过子组件的 props 选项。
子组件要显式地用 props 选项声明它期待获得的数据：
```js
Vue.component('child', {
  // 声明 props
  props: ['message'],
  // 就像 data 一样，prop 可以用在模板内
  // 同样也可以在 vm 实例中像“this.message”这样使用
  template: '<span>{{ message }}</span>'
})
```
然后我们可以这样向它传入一个普通字符串：
```html
<child message="hello!"></child>
```

### 事件和属性绑定
v-bind 指令绑定属性，简写形式：`:proname=""`  
可以用 v-on 指令监听 DOM 事件来触发一些 JavaScript 代码。简写形式：`@change=""`  
```html
<div id="example-1">
  <button v-on:click="counter += 1">增加 1</button>
  <p>这个按钮被点击了 {{ counter }} 次。</p>
</div>
```
```js
var example1 = new Vue({
  el: '#example-1',
  data: {
    counter: 0
  }
})
```
方法事件处理器
```html
<div id="example-2">
  <!-- `greet` 是在下面定义的方法名 -->
  <button v-on:click="greet">Greet</button>
</div>
```
```js
var example2 = new Vue({
  el: '#example-2',
  data: {
    name: 'Vue.js'
  },
  // 在 `methods` 对象中定义方法
  methods: {
    greet: function (event) {
      // `this` 在方法里指当前 Vue 实例
      alert('Hello ' + this.name + '!')
      // `event` 是原生 DOM 事件
      if (event) {
        alert(event.target.tagName)
      }
    }
  }
})
// 也可以用 JavaScript 直接调用方法
example2.greet() // -> 'Hello Vue.js!'
```

有时也需要在内联语句处理器中访问原生 DOM 事件。可以用特殊变量 `$event` 把它传入方法：
```html
<button v-on:click="warn('Form cannot be submitted yet.', $event)">
  Submit
</button>
```
```js
// ...
methods: {
  warn: function (message, event) {
    // 现在我们可以访问原生事件对象
    if (event) event.preventDefault()
    alert(message)
  }
}
```

### [绑定 - form绑定](https://cn.vuejs.org/v2/guide/forms.html)
1. v-model 指令在表单控件元素上创建双向数据绑定
1. v-bind 指令实现的是单向绑定

### 事件中访问data
```js
import AppLayout from '@/components/app-layout'

export default {
  name: 'home',
  data () {
    return {
      msg: 'Welcome to Your Vue.js home',
      name:'Mark test vue program...',      
    }
  },
  components: {AppLayout},
  methods: {
    changeName: function() {
        this.$data.name+='...'
      }
  }
}
```

### [Options API](https://cn.vuejs.org/v2/api/#选项-数据)
1. 选项 / 数据  
data  
props  
propsData  
computed  
methods  
watch  
1. 选项 / DOM  
el  
template  
render  
renderError  
1. 选项 / 生命周期钩子  
beforeCreate  
created  
beforeMount  
mounted  
beforeUpdate  
updated  
activated  
deactivated  
beforeDestroy  
destroyed  
1. 选项 / 资源  
directives  
filters  
components  
1. 选项 / 组合  
parent  
mixins  
extends  
provide / inject  
1. 选项 / 其它  
name  
delimiters  
functional  
model  
inheritAttrs  
comments  

### 计算属性 computed
计算属性是基于它们的依赖进行缓存的。计算属性只有在它的相关依赖发生改变时才会重新求值。这就意味着只要 message 还没有发生改变，多次访问 reversedMessage 计算属性会立即返回之前的计算结果，而不必再次执行函数。如果你不希望有缓存，请用 method 替代。
```html
<div id="example">
  <p>Original message: "{{ message }}"</p>
  <p>Computed reversed message: "{{ reversedMessage }}"</p>
</div>
```
```js
var vm = new Vue({
  el: '#example',
  data: {
    message: 'Hello'
  },
  computed: {
    // a computed getter
    reversedMessage: function () {
      // `this` points to the vm instance
      return this.message.split('').reverse().join('')
    }
  }
})
```
计算属性默认只有 getter ，不过在需要时你也可以提供一个 setter ：
```js
// ...
computed: {
  fullName: {
    // getter
    get: function () {
      return this.firstName + ' ' + this.lastName
    },
    // setter
    set: function (newValue) {
      var names = newValue.split(' ')
      this.firstName = names[0]
      this.lastName = names[names.length - 1]
    }
  }
}
// ...
```
现在再运行 vm.fullName = 'John Doe' 时， setter 会被调用， vm.firstName 和 vm.lastName 也相应地会被更新。

### watch
被监控的对象变化是主动执行。
```html
<div id="demo">{{ fullName }}</div>
```
```js
var vm = new Vue({
  el: '#demo',
  data: {
    firstName: 'Foo',
    lastName: 'Bar',
    fullName: 'Foo Bar'
  },
  watch: {
    firstName: function (val) {
      this.fullName = val + ' ' + this.lastName
    },
    lastName: function (val) {
      this.fullName = this.firstName + ' ' + val
    }
  }
})
```

虽然计算属性在大多数情况下更合适，但有时也需要一个自定义的 watcher 。这是为什么 Vue 提供一个更通用的方法通过 watch选项，来响应数据的变化。当你想要在数据变化响应时，执行异步操作或开销较大的操作，这是很有用的。
```html
<!-- Since there is already a rich ecosystem of ajax libraries    -->
<!-- and collections of general-purpose utility methods, Vue core -->
<!-- is able to remain small by not reinventing them. This also   -->
<!-- gives you the freedom to just use what you're familiar with. -->
<script src="https://unpkg.com/axios@0.12.0/dist/axios.min.js"></script>
<script src="https://unpkg.com/lodash@4.13.1/lodash.min.js"></script>
<script>
var watchExampleVM = new Vue({
  el: '#watch-example',
  data: {
    question: '',
    answer: 'I cannot give you an answer until you ask a question!'
  },
  watch: {
    // 如果 question 发生改变，这个函数就会运行
    question: function (newQuestion) {
      this.answer = 'Waiting for you to stop typing...'
      this.getAnswer()
    }
  },
  methods: {
    // _.debounce 是一个通过 lodash 限制操作频率的函数。
    // 在这个例子中，我们希望限制访问yesno.wtf/api的频率
    // ajax请求直到用户输入完毕才会发出
    // 学习更多关于 _.debounce function (and its cousin
    // _.throttle), 参考: https://lodash.com/docs#debounce
    getAnswer: _.debounce(
      function () {
        if (this.question.indexOf('?') === -1) {
          this.answer = 'Questions usually contain a question mark. ;-)'
          return
        }
        this.answer = 'Thinking...'
        var vm = this
        axios.get('https://yesno.wtf/api')
          .then(function (response) {
            vm.answer = _.capitalize(response.data.answer)
          })
          .catch(function (error) {
            vm.answer = 'Error! Could not reach the API. ' + error
          })
      },
      // 这是我们为用户停止输入等待的毫秒数
      500
    )
  }
})
</script>
```
```html
<div id="watch-example">
  <p>
    Ask a yes/no question:
    <input v-model="question">
  </p>
  <p>{{ answer }}</p>
</div>
```

### AJAX
vue不提供ajax的实现，而是提倡使用第三方的ajax库，使用你熟悉的就好了。
```html
<script src="https://unpkg.com/axios@0.12.0/dist/axios.min.js"></script>
<script src="https://unpkg.com/lodash@4.13.1/lodash.min.js"></script>
```

