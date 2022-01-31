# 观察
## CPU
固有消耗 1-4 不等，是运行空代码就需要用的。

# 代码整改计划
## Fix Cache
现在的 cache 系统问题很多。应该把 cache 按照其性质分类，然后分别解决，但提供好用的接口。

1. callback、terrain 等等比较静态的信息，仅依赖于 structure list，称为 Static Cache。他们就功能而言甚至可以放进 memory 中，永久保存。
2. creep.cache, roomObject.cache, room.cache 等等，依附于某个实在物体。它们应当被无限期妥善保存，但是当其宿主消亡的时候应当被清理。用 hook 解决这一需求。
3. 动态缓存，比如缓存从 A 到 B、以 opts 为参数的寻路结果。这类缓存不同用途应当分开，比如寻路缓存应当有自己单独的 object。
