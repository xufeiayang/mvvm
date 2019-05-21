class Observer {
  constructor(data) {
    this.observe(data);
  }
  // 将属性全部改成get set形式
  observe(data){
    // 此处还有一个问题，data上新增的属性不会劫持
    if(data && typeof data === 'object'){
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key]);
        this.observe(data[key]) // 深度递归劫持
      })
    }
  }
  defineReactive (obj, key, value) {
    let that = this;
    let dep = new Dep(); // 每一个变化的数据都对应一个数组，对应一套发布订阅
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get(){
        Dep.target && dep.addSub(Dep.target);
        return value;
      },
      set(newValue){
        console.log(111);
        if(value != newValue) {
          that.observe(newValue); // 如果是对象，继续劫持
          value = newValue;
          dep.notify();// 通知所有人数据更新了
        }
      }
    })
  }
}

class Dep {
  constructor() {
    // 订阅的数组,视图中用了message几次就会pushjici
    this.subs = [];
  }
  addSub (watcher) {
    this.subs.push(watcher);
  }
  notify () {
    this.subs.forEach((watcher) =>{
      watcher.update();
    })
  }
}
