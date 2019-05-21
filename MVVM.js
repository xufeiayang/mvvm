class MVVM {
  constructor(options){
    this.$el = options.el;
    this.$data = options.data;
    if (this.$el) {
      // 数据劫持
      new Observer(this.$data);
      // 代理数据 通过实例直接可以取数据
      this.proxyData(this.$data);
      // 模板编译
      new Compile(this.$el, this);
    }
  }
  proxyData (data) {
    Object.keys(data).forEach(key=>{
      Object.defineProperty(this, key, {
        get () {
          return data[key];
        },
        set (value) {
          data[key] = value;
        }
      })
    })
  }
}
