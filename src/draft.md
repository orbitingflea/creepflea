# 观察
## CPU
固有消耗 1-4 不等，是运行空代码就需要用的。

观察到内存会比较大地影响性能，因为每个 tick 内存都会被解析一次、存储一次，太浪费时间了。每 tick 需要解析长度为 5*10^4 的 json 字符串，需要零点几 CPU。如果在 global 里面，每秒不用付出线性时间来访问，更适合数据结构。

实际上，大部分数据都是允许失去的，可以考虑把它们放在缓存里面。

# 代码整改计划
## Fix Cache

CreepCache 和 RoomObjectCache 这个划分很奇怪，应该把后者改为 StructureCache。

## Creep 角色代码整改

很多前期设计的角色已经过时了，需要重写一下。用需求制来完成任务分配，用锁来完成多体协同。

## 需求系统

1. 每个 tick 计算出需求，挂在每个 structure 的 cache 上。
2. 角色运行逻辑

## Carrier

重写 carrier 系统和 carrier 角色。角色可以仿照 worker 的成功案例。

## driveTo 性能问题

未知。

已经有一些可以优化的地方：降低非 SK 场景的冗余过程；修改 cache 中路径存储的样式，允许用一条更长路径 + 一个指针，减少路径复制。

calls		time		avg		function
1268		360.6		0.284		Creep.work
440		100.9		0.229		Creep.driveTo
342		88.7		0.259		Creep._drive
340		70.5		0.207		Creep.move
309		52.5		0.170		Creep.harvest
207		47.6		0.230		Creep.runWorkerTasks
207		46.8		0.226		Creep._runWorkerTasks
153		33.6		0.220		Creep.upgradeController
75		17.5		0.233		Creep.transfer
711		17.3		0.024		Room.structuresOfType
412		15.9		0.039		RoomPosition.parkable:get
1353		15.2		0.011		RoomPosition.findClosestByRange
525		13.8		0.026		Room.functionalStructures:get
1950		13.1		0.007		Room.find
56		12.6		0.224		Creep.withdraw
1365		11.9		0.009		Room._ensureScanInfo
1764		10.6		0.006		RoomPosition.lookFor
488		8.9		0.018		RoomPosition.matchDestination
213		8.4		0.039		Room.roads:get
144		8.3		0.058		Creep.park
36		7.9		0.219		Creep.repair
4289		6.8		0.002		Room.cache:get
30		6.6		0.220		Creep.heal
30		6.6		0.219		Creep.reserveController
240		6.4		0.027		Room._scanDanger
Avg: 18.26	Total: 511.31	Ticks: 28

## 死亡处理

角色濒临死亡的时候有几种处理方式？
1. 搬运非贵重资源的：在时间恰好够的时候放弃手上任务，移动到storage，卸货，自杀
2. 搬运贵重资源的：在自己生命不够的时候不要接任务。
3. outer carrier 长途搬运者：在生命不够的时候进入紧急状态，在正常行为基础上，将会不执行等待操作。
4.
