# 观察
## CPU
固有消耗 1-4 不等，是运行空代码就需要用的。

calls		time		avg		function
1323		358.5		0.271		Creep.work
579		137.7		0.238		Creep.driveTo
485		100.3		0.207		Creep.move
4929		69.5		0.014		Room.find
283		60.8		0.215		Creep.harvest
123		27.2		0.221		Creep.upgradeController
109		24.4		0.224		RoomPosition.findClosestByPath
70		15.7		0.225		Creep.repair
1358		15.5		0.011		RoomPosition.findClosestByRange
55		12.2		0.221		Creep.transfer
261		10.5		0.040		RoomPosition.parkable:get
1378		8.4		0.006		RoomPosition.lookFor
134		7.6		0.057		Creep.repairRoad
30		6.6		0.219		Creep.reserveController
58		6.5		0.111		Creep.withdraw
3598		5.9		0.002		RoomPosition.inRangeTo
3192		4.9		0.002		RoomPosition.isEqualTo
242		3.9		0.016		RoomPosition.findInRange
1587		3.8		0.002		Room.lookForAt
56		3.8		0.068		Creep.park
2171		3.7		0.002		RoomPosition.getRangeTo
485		2.4		0.005		RoomPosition.getDirectionTo
1427		2.3		0.002		RoomPosition.isNearTo
240		2.3		0.010		Room._ensureScanInfo
240		2.1		0.009		Room._scanCreeps
Avg: 21.95	Total: 614.65	Ticks: 28


# 代码整改计划
## Fix Cache
现在的 cache 系统问题很多。应该把 cache 按照其性质分类，然后分别解决，但提供好用的接口。

1. callback、terrain 等等比较静态的信息，仅依赖于 structure list，称为 Static Cache。他们就功能而言甚至可以放进 memory 中，永久保存。
2. creep.cache, roomObject.cache, room.cache 等等，依附于某个实在物体。它们应当被无限期妥善保存，但是当其宿主消亡的时候应当被清理。用 hook 解决这一需求。
3. 动态缓存，比如缓存从 A 到 B、以 opts 为参数的寻路结果。这类缓存不同用途应当分开，比如寻路缓存应当有自己单独的 object。
   - 每一类缓存的数量应当有限制，并以 LRU/LFU 的规则来删除多余的缓存。

global.StaticCache：存储从名称到对象的映射。这里的对象能保持几百个 tick 以上的时间。TTL 由读取的时候指定。这里的对象不会被删除。
global.ObjectCache[Id<xxx>]：存储从属于 Id 的对象的缓存。对象可以是 creep, room object。
global.PathCache[coded string]：存储寻路缓存。
