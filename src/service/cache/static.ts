/**
 * 本文件定义了 global.staticCache 对象，用于缓存长期不变的静态数据
 */

global.staticCache = {
  data: {},
  get: function(key: string, ttl: number = Infinity): Object | null {
    if ((key in this.data) && this.data[key].updateTime >= Game.time - ttl) {
      return this.data[key].value;
    }
    return null;
  },
  set: function(key: string, value: Object): void {
    this.data[key] = {
      updateTime: Game.time,
      value: value
    };
  }
};
