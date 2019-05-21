// 观察者，我们需要观察每一个双向绑定的值，当数据变化，执行cb
// 模板编译的时候就需要揉进去，每个需要双向绑定的元素都要调用
class Watcher {
  // 新值和老值比对，变化了就执行方法
  constructor(vm, expr, cb) {
    this.vm = vm;
    this.expr = expr;
    this.cb = cb;
    // 获取老值
    this.value = this.get();
  }
  getVal (vm, expr) {
    console.log(expr);
    // expr可能是一串a.b.c，写一个方法循环取值
    expr = expr.split('.'); // [a,b,c]
    return expr.reduce((prev, next, currentIndex)=>{
      return prev[next];
    }, vm.$data);
  }
  get () {
    Dep.target = this; // 直接把当前实例给target
    let value = this.getVal(this.vm, this.expr); // 这时候掉了get方法，已经用了Dep.target,下一步可以销毁了
    Dep.target = null;
    return value;
  }
  update () {
    let newValue = this.getVal(this.vm, this.expr);
    let oldValue = this.value;
    if (newValue != oldValue){
      this.cb(newValue);
    }
  }
}
