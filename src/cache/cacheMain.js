global.cacheData = {};

global.CacheMind = {
    get: function(key, maxLate) {
        let foo = cacheData[key];
        if (!foo) {
            return null;
        } else if (foo.updateTime + maxLate < Game.time) {
            return null;
        } else {
            return foo.value;
        }
    },
    set: function(key, value) {
        global.cacheData[key] = {
            value: value,
            updateTime: Game.time
        };
    }
};