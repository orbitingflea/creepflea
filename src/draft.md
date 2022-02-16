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

## Creep Manager
Tmp Require 不知道能不能正常运行。

## 自动机

怎么简化自动机的程序？

source -> target, move-only.

creep.getResource(sources) 返回什么？
0: OK
1: NOTHING_TO_DO (switch state)
2: WORKED (switch state)

主要利用 move 与 work 分离的想法。不论是什么其他函数，都与 move 可以同时进行。

## Carrier Action

设计的时候考虑几个典型场景：
1. 从 storage, terminal or specific link 中取出能量，填充所有需要能量的建筑。
2. 一个墓碑上有好几种稀有资源，在一次搬运中回收它们。
3.

## Creep Action 系统

遇到一些困难：当前时刻去预测未来情况，可能会有所区别。

多个目标：锁定了就不再更改，除非 invalid。

将 action 封装成一个类，记在 cache 里面。creep args 指定一组 source、一组 task，然后 creep 的行为（given moveOnly）分为两个阶段
- 决策阶段：决定自己应该干什么。
  - 1. work on target id.

现在 80% 的困难都来自于如何让 creep 在本 tick work 之后即开始前往下一个地点。这要求本 tick creep 不仅寻找第一个目标，也知道
  - 本 tick 之后定性的状态（目标是否完成，自身是否耗尽）
  - 下一个目标是谁

