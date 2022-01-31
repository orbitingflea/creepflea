Object.defineProperty(RoomObject.prototype, 'cache', {
    configurable: true,
    get: function() {
        let cacheName = `roomObjectCache${this.id}`;
        let cache = CacheMind.get(cacheName, Infinity);
        if (!cache) {
            cache = {};
            CacheMind.set(cacheName, cache);
        }
        return cache;
    },
    set: function(cache) {
        let cacheName = `roomObjectCache${this.id}`;
        CacheMind.set(cacheName, cache);
    }
});