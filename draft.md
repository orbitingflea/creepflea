# 观察
## CPU
固有消耗 1-4 不等，是运行空代码就需要用的。

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


## Creep Action

思考 overmind 架构中 task 的概念是否的确可以简化代码。
目前还不需要，只用把一些常用的函数挂到 prototype 上面去就可以了。比如说 withdraw_(), transfer_(), etc.

然后重新实现 creep & creep manager。现在整体用 require -> api 的形式。这种需求驱动的有几个问题：
- 任务重复进行。例如多个 carrier 给同一个有需求的送货。
有几个好处：
- 不需要 memory。

现在把工作代码都封装起来，需要的时候调用，减少 memory 依赖。当一个 creep 无事可做的时候，就可以比较容易执行别人的代码。

状态机规范化。

一个核心idea不知道如何实现：完成一个目标的代码应当是任务的属性，而非主人 creep 的属性。
像 fillMultipleExtensions 这样的功能应当被挂载到 creep 原型上面。

## Creep Manager

将 creepManager 写规范一点，翻译成 ts。

定义了全局对象 CreepManager。其具备两个属性：
1. config map，用来询问 work 的配置。
2. config list，其顺序表示了 spawn 的优先级。

把 Creep Config 中的变量分为易变的和不易变的，在不同时间计算；不易变的可以多个 tick 算一次。

args, require 是易变的，其他属性是不易变的

# 性能问题
Creep 的工作代价其实很难避免，现在性能瓶颈基本上是 room plan 的时间。需要大量的分析，每个 tick 都做一次。代码整改的一环就是把它换成 room planner。
