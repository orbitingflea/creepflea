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

## RoomFind service

用 _.groupBy 来把 structure 按照 type 分组，再建立原先的 alias for links, containers, so on, 完成类型转换。
