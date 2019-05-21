class Compile {
  constructor(el,vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    if (this.el) {
      // 获取到元素再编译
      // 把dom元素放进内存中编译 fragment
      let fragment = this.nodeToFragment(this.el);
      // 编译 提取想要的元素节点 v-model和文本节点{{}}
      this.compile(fragment);
      // 把编译好的fragment塞回到页面
      this.el.appendChild(fragment);
    }
  }
  // 判断是否是元素
  isElementNode (node) {
    // 取一个值的属性，如果属性不存在，不会报错，只会返回undefined var a = 1; a.nodeType // undefined
    return node.nodeType === 1;
  }
  // 是否是指令
  isDirective (name) {
    return name.includes('v-');
  }
  /*
   * @desc编译元素
   * @param
   * @return
   * @author xufeiyang
   * @time 2019/5/20
  */
  compileElement (node) {
    let attrs = node.attributes;
    // Array.from是浅拷贝
    Array.from(attrs).forEach((attr) => {
      // 判断属性名字是否是一个指令
      let attrName = attr.name;
      if(this.isDirective(attrName)){
        // 取到对应的值，需要替换成data里面的数据
        let expr = attr.value;
        // 取v-后面的一坨字符串
        let [, type] = attrName.split('-');
        // v-model v-text v-html 取this.vm里面的expr更新node
        CompileUtil[type](node,this.vm,expr);
      }
    })
  }

  /*
   * @desc 编译文本
   * @param
   * @return
   * @author xufeiyang
   * @time 2019/5/20
  */
  compileText (node) {
    // 带{{}}
    let expr = node.textContent; // 取文本中的内容
    let reg = /\{\{([^}]+)\}\}/g; // 可能是{{a}} {{b}} {{c}}
    if (reg.test(expr)) {
      CompileUtil['text'](node,this.vm,expr);
    }
  }
  /*
   * @desc
   * @param
   * @return
   * @author xufeiyang
   * @time 2019/5/20
  */
  compile (fragment) {
    // childNodes只能拿到一层
    let childNodes = fragment.childNodes;
    Array.from(childNodes).forEach((node)=>{
      // 是元素节点，需要编译
      if(this.isElementNode(node)) {
        this.compileElement(node)
        this.compile(node);
      }else {
        // 文本节点，需要编译文本
        this.compileText(node);
      }
    })
  }
  /*
   * @desc 把dom元素转换成fragment
   * @param
   * @return
   * @author xufeiyang
   * @time 2019/5/20
  */
  nodeToFragment (el) {
    // 文档碎片
    let fragment = document.createDocumentFragment();
    let firstChild;
    while(firstChild = el.firstChild) {
      fragment.appendChild(firstChild);
    }
    return fragment;
  }
}

var CompileUtil = {
  // 取 vm里面expr表达式的值 expr可能是a.b.c
  getVal(vm, expr) {
    // expr可能是一串a.b.c，写一个方法循环取值
    expr = expr.split('.'); // [a,b,c]
    return expr.reduce((prev, next, currentIndex)=>{
      return prev[next];
    }, vm.$data);
  },
  // 获取{{a}}{{b}}{{c}}挂载之后的值
  getTextVal (vm, expr) {
    // explace会替换三次 正则表达式第一次匹配第二次匹配第三次匹配的问题
    // '{{a}}{{b}}{{v}}'.replace(/\{\{([^}])\}\}/g, (a) => {
    //   console.log(a);
    // })
    // {{a}}
    // {{b}}
    // {{v}}
    return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      //每一个arguments的样子-> ["{{a}}", "a", 0, "{{a}}{{b}}{{v}}"]
      return this.getVal(vm, arguments[1]);
    })
  },
  // 文本处理
  text(node,vm,expr) {
    let updateFn = this.updater['textUpdater'];
    // 拿到的是{{a}}{{b}}替换后的一串比如当a=hello b=world拿到的值是 hello world
    let value = this.getTextVal(vm, expr);
    // 这里的expr是{{a}}{{b}}一串，所以需要一一观察
    // 这里加一个监控，数据变化需要更新视图
    // 第三个参数是callback
    expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      //每一个arguments的样子: ["{{a}}", "a", 0, "{{a}}{{b}}{{v}}"]
      new Watcher(vm, arguments[1], () => {
        updateFn && updateFn(node, this.getTextVal(vm, expr));
      })
    })
    updateFn && updateFn(node, value);
  },
  // 找到vm的expr设置value
  setval(vm, expr, value){
    // expr可能是一串a.b.c，写一个方法循环取值
    expr = expr.split('.'); // [a,b,c]
    return expr.reduce((prev, next, currentIndex)=>{
      if (currentIndex === expr.length-1){
        return prev[next] = value;
      }
      return prev[next];
    }, vm.$data);
  },
  // 输入框处理
  model(node,vm,expr){
    let updateFn = this.updater['modelUpdater'];
    // vm.expr可能是一串a.b.c，写一个方法循环取值
    // 这里加一个监控，数据变化需要更新视图
    // 第三个参数是callback
    new Watcher(vm, expr, () => {
      updateFn && updateFn(node, this.getVal(vm, expr));
    })
    node.addEventListener('input', (e)=>{
      let newValue = e.target.value;
      this.setval(vm, expr, newValue)
    })
    updateFn && updateFn(node, this.getVal(vm, expr));
  },
  updater: {
    // 更新文本
    textUpdater(node, value) {
      node.textContent = value;
    },
    // 输入框更新
    modelUpdater(node, value) {
      node.value = value;
    }
  }
}
