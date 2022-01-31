/**
 * 本文件定义了全局对象 global.FunctionManager，用于管理从名称到对象的映射。
 * 这是因为 Memory 中本质上只能存储 JSON 和字符串，并不能存储函数等复杂对象。所以在内存中存储函数或对象的唯一名称，在 FunctionManager 中
 *   查询以得到对应的具体函数或者对象。
 * register 仅在代码加载的时候使用，返回这个注册函数的名字。
 */

global.FunctionManager = {
    init: function() {
        this.n = 0;
        this.functions = {};  // 用哈希表来存储
    },
    register: function(func, commentName = null) {
        if (this.n == null) {
            this.init();
        }
        this.n++;
        let name = commentName ? commentName + `_${this.n}` : `${this.n}`;
        this.functions[name] = func;
        return name;
    },
    get: function(name) {
        return this.functions[name];
    }
};