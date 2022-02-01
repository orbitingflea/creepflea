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

calls		time		avg		function
1349		346.8		0.257		Creep.work
465		89.2		0.192		Creep.driveTo
315		66.9		0.212		Creep.harvest
268		56.0		0.209		Creep.move
3637		46.7		0.013		Room.find
155		34.6		0.223		Creep.upgradeController
113		30.5		0.270		RoomPosition.findClosestByPath
517		20.4		0.039		RoomPosition.parkable:get
1340		15.5		0.012		RoomPosition.findClosestByRange
2087		12.3		0.006		RoomPosition.lookFor
53		11.8		0.223		Creep.repair
41		9.3		0.226		Creep.transfer
36		7.8		0.217		Creep.heal
30		6.5		0.218		Creep.reserveController
66		6.1		0.093		Creep.moveOffRoad
26		5.8		0.225		Creep.withdraw
30		5.6		0.187		Creep.rangedAttack
3231		5.6		0.002		RoomPosition.inRangeTo
119		5.1		0.043		Creep.park
2327		5.0		0.002		Room.lookForAt
2600		4.2		0.002		RoomPosition.isEqualTo
302		3.9		0.013		RoomPosition.findInRange
2018		3.8		0.002		Room.cache:get
120		3.7		0.031		Room.structures:get
240		3.4		0.014		Room._ensureScanInfo
46		3.3		0.072		Creep.repairRoad
Avg: 22.09	Total: 618.59	Ticks: 28


观察到内存会比较大地影响性能，因为每个 tick 内存都会被解析一次、存储一次，太浪费时间了。每 tick 需要解析长度为 5*10^4 的 json 字符串，需要零点几 CPU。如果在 global 里面，每秒不用付出线性时间来访问，更适合数据结构。

实际上，大部分数据都是允许失去的，可以考虑把它们放在缓存里面。


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
