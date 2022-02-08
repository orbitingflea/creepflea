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
global.PathCache[coded string]：存储寻路缓存。TODO.

## 寻路系统

寻路目标由一组参数描述，通常是一个中心点 destination + opts。这组参数可以构造出一个 filter，判断某个点是否是目标点。注意目标点与可以经过的点是不同的，比如有时要求目标点 parkable，但是过去的时候还是行走在道路上。

如果寻路的 creep 现在位置不符合要求，则构造一组 heuristic 的参数，用于计算下一步的位置。通常，在距离目标点很远的时候，这个参数是满足 range 的要求（即接近或远离目标到指定的 range），传入 path finder。

每个 creep 携带两组信息：
1. dangerAttitude = 'avoid' | 'passive' | 'aggresive'，表示当 danger 产生的时候将会干什么。如果是 'avoid'，将会回避存在危险的房间，callback 返回 false；若已经在危险房间，则尽快撤离。如果是 'passive'，则完全无视 danger，直到被打死。如果是 'aggresive'，则会在 danger 产生的时候停止正在干的事情，切换到战斗状态。
2. keeperAttitude。首先，如果走路的起点终点均不在 keeper 势力范围内，则避开所有不论是否 active 的 lair region。其次，如果终点在 lair region 以内，则：
  - 如果 inactive，那么无视目标区域的 lair region。
  - 如果 active，且 keeperAttitude == 'passive'，则无视危险。
  - 如果 active，且 'avoid'，则认为目标位置是不可达的。需要设置比较大的 rangeMax，到达 (dest, range) - lairRegion 等待。
如果起点是危险区域，inactive，则忽略这个危险区域。如果起点是危险区域，active，则
  - 'avoid'：先远离目标区域，以此为第一阶段目标；达成以后再寻路到目标区域，避开 lairRegion。
  - 'passive'：无视

需要的接口：
- 查询一个房间是否是危险状态
- 查询一个房间内所有的 lairRegion，以及是不是 active
- 查询一个点属于的 lairRegion，以及是不是 active

这里有几套 interface？
1. 描述目的地逻辑的类型。比如（在xx附近、不在道路上、不在 active lair region 以内）。但是不同时间同一对象可能意义不同（例如 lair region 可能 inactive）；似乎不影响使用。
2. 寻路的参数。比如 keeperAttitude，dangerAttitude，banCreeps，avoid。它们与目的地无关，只和 creep 有关。

几个重要功能：
1. find a path from xxx to xxx, with opts xxx. 几乎与 PathFinder 相同，但是提供了更多功能：两个 attitude 等等，本质上是用这些参数确定 callback。输入为 heuristic 和 FindPathOpts。
2. calc heuristic
3. drive along path
4. fine tune near destination。在符合 heuristic 目标 range +- 1 (or 0) 的时候开始 fine tune。扫描 creep 周围符合条件的目标格子，直接寻路过去。这里在搜索目标格子的时候会考虑 creep，寻路也会考虑 creep。

重新搜索路径的时机：
1. 当 creep 耐心耗尽
2. 获得视野（所以还需要记录 path 哪些房间是有视野的）

问题：什么样的寻路相对静止，可以用缓存？
1. 起点终点都不在 lair region 以内
2.

# 性能问题
Creep 的工作代价其实很难避免，现在性能瓶颈基本上是 room plan 的时间。需要大量的分析，每个 tick 都做一次。代码整改的一环就是把它换成 room planner。

calls		time		avg		function
1110		276.1		0.249		Creep.work
302		87.4		0.289		Creep.driveTo
298		80.1		0.269		Creep._drive
281		58.5		0.208		Creep.move
281		52.2		0.186		Creep.harvest
2415		40.7		0.017		Room.find
172		38.6		0.224		Creep.upgradeController
80		19.8		0.248		RoomPosition.findClosestByPath
169		15.4		0.091		Creep.park
309		14.2		0.046		RoomPosition.parkable:get
1102		12.1		0.011		RoomPosition.findClosestByRange
45		10.3		0.228		Creep.transfer
1388		9.5		0.007		RoomPosition.lookFor
30		6.6		0.219		Creep.reserveController
28		6.3		0.224		Creep.withdraw
374		5.9		0.016		RoomPosition.matchDestination
2747		5.4		0.002		RoomPosition.inRangeTo
2088		3.9		0.002		Room.cache:get
120		3.9		0.032		Room.structures:get
1504		3.8		0.003		Room.lookForAt
71		3.5		0.049		Room._scanDanger
180		2.9		0.016		Room._scanCreeps
59		2.8		0.047		Creep.repairRoad
180		2.6		0.014		Room.functionalStructures:get
300		2.3		0.008		Room.links:get
Avg: 19.75	Total: 553.07	Ticks: 28

calls		time		avg		function
1260		321.4		0.255		Creep.work
444		114.1		0.257		Creep.driveTo
429		103.8		0.242		Creep._drive
371		77.2		0.208		Creep.move
338		61.2		0.181		Creep.harvest
2927		42.2		0.014		Room.find
103		23.2		0.225		Creep.upgradeController
66		17.0		0.257		RoomPosition.findClosestByPath
66		15.0		0.227		Creep.transfer
78		14.0		0.179		Creep.withdraw
1234		13.8		0.011		RoomPosition.findClosestByRange
222		8.9		0.040		RoomPosition.parkable:get
27		8.3		0.307		Creep.build
1059		7.8		0.007		RoomPosition.lookFor
106		7.2		0.068		Creep.park
3096		6.1		0.002		RoomPosition.inRangeTo
168		5.1		0.030		Room._scanDanger
476		5.1		0.011		RoomPosition.matchDestination
79		4.7		0.060		Creep.repairRoad
2392		4.5		0.002		Room.cache:get
290		4.1		0.014		RoomPosition.findInRange
123		3.6		0.029		Room.structures:get
1354		3.6		0.003		Room.lookForAt
15		3.3		0.219		Creep.heal
14		3.2		0.228		Creep.repair
1448		2.8		0.002		RoomPosition.isEqualTo
Avg: 21.06	Total: 589.75	Ticks: 28

- path len 1, path [{"x":12,"y":32,"roomName":"E37S45"}]
[下午5:24:24][shard3][DEBUG] findPath AE38S45_25_38#E38S45_26_42#1#0#avoid#avoid#0#1#} returned {"path":[{"x":26,"y":41,"roomName":"E38S45"}],"incomplete":false,"cost":3,"firstInvisibleRoom":null} from cache
[下午5:24:24][shard3]- path len 1, path [{"x":26,"y":41,"roomName":"E38S45"}]
[下午5:24:27][shard3][DEBUG] findPath AE37S45_9_33#E37S45_25_38#3#0#avoid#avoid#0#1#} returned {"path":[],"incomplete":false,"cost":13,"firstInvisibleRoom":null} from cache
[下午5:24:27][shard3]- path len 0, path []
[下午5:24:27][shard3][DEBUG] findPath AE37S45_12_32#E37S45_14_34#1#0#avoid#avoid#0#1#} returned {"path":[{"x":13,"y":33,"roomName":"E37S45"}],"incomplete":false,"cost":1,"firstInvisibleRoom":null} from cache
[下午5:24:27][shard3]- path len 1, path [{"x":13,"y":33,"roomName":"E37S45"}]
[下午5:24:31][shard3]Save cache with len 21
[下午5:24:31][shard3][DEBUG] findPath AE37S45_9_33#E37S45_25_38#3#0#avoid#avoid#0#1#} returned {"path":[],"incomplete":false,"cost":13,"firstInvisibleRoom":null} from cache
[下午5:24:31][shard3]- path len 0, path []
[下午5:24:31][shard3]Save cache with len 3
[下午5:24:31][shard3][DEBUG] findPath AE39S45_28_21#E39S45_25_21#1#0#avoid#avoid#0#1#} returned {"path":[{"x":26,"y":21,"roomName":"E39S45"}],"incomplete":false,"cost":2,"firstInvisibleRoom":null} from cache
[下午5:24:31][shard3]- path len 1, path [{"x":26,"y":21,"roomName":"E39S45"}]
[下午5:24:34][shard3][DEBUG] findPath AE37S45_9_33#E37S45_25_38#3#0#avoid#avoid#0#1#} returned {"path":[],"incomplete":false,"cost":13,"firstInvisibleRoom":null} from cache
[下午5:24:34][shard3]- path len 0, path []
[下午5:24:34][shard3][DEBUG] findPath AE37S45_7_33#E36S45_42_4#1#0#avoid#avoid#0#1#} returned {"path":[{"x":41,"y":4,"roomName":"E36S45"}],"incomplete":false,"cost":43,"firstInvisibleRoom":null} from cache
[下午5:24:34][shard3]- path len 1, path [{"x":41,"y":4,"roomName":"E36S45"}]
[下午5:24:34][shard3][INFO] road blocking at E38S45
[下午5:24:37][shard3][DEBUG] findPath AE37S45_9_33#E37S45_25_38#3#0#avoid#avoid#0#1#} returned {"path":[],"incomplete":false,"cost":13,"firstInvisibleRoom":null} from cache
[下午5:24:37][shard3]- path len 0, path []
[下午5:24:37][shard3][INFO] road blocking at E36S45
[下午5:24:37][shard3][INFO] road blocking at E37S45
[下午5:24:37][shard3]findPath use cpu: 0.12592059999951744


[DEBUG] findPath AE39S45_28_21#E39S45_25_21#1#0#avoid#avoid#0#1#} returned {"path":[{"x":26,"y":21,"roomName":"E39S45"}],"incomplete":false,"cost":2,"firstInvisibleRoom":null} from cache
[下午5:29:39][shard3]- path len 1, path [{"x":26,"y":21,"roomName":"E39S45"}]

calls		time		avg		function
1431		364.4		0.255		Creep.work
533		120.0		0.225		Creep.driveTo
384		101.7		0.265		Creep._drive
383		79.5		0.208		Creep.move
317		61.0		0.192		Creep.harvest
3083		44.3		0.014		Room.find
147		32.7		0.223		Creep.upgradeController
127		25.2		0.198		RoomPosition.findClosestByPath
1415		19.1		0.013		RoomPosition.findClosestByRange
421		17.4		0.041		RoomPosition.parkable:get
605		15.0		0.025		RoomPosition.matchDestination
60		13.0		0.216		Creep.reserveController
54		11.9		0.220		Creep.transfer
1673		11.6		0.007		RoomPosition.lookFor
161		10.6		0.066		Creep.park
30		6.8		0.225		Creep.attack
30		6.7		0.224		Creep.withdraw
3080		5.8		0.002		RoomPosition.inRangeTo
128		5.4		0.042		Room._scanDanger
1972		4.8		0.002		Room.lookForAt
2236		4.5		0.002		RoomPosition.getRangeTo
2422		4.4		0.002		Room.cache:get
288		3.7		0.013		RoomPosition.findInRange
16		3.5		0.219		Creep.heal
15		3.4		0.225		Creep.repair
116		3.1		0.027		Room._scanLair
Avg: 22.44	Total: 628.31	Ticks: 28
