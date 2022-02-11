# 观察
## CPU
固有消耗 1-4 不等，是运行空代码就需要用的。

观察到内存会比较大地影响性能，因为每个 tick 内存都会被解析一次、存储一次，太浪费时间了。每 tick 需要解析长度为 5*10^4 的 json 字符串，需要零点几 CPU。如果在 global 里面，每秒不用付出线性时间来访问，更适合数据结构。

实际上，大部分数据都是允许失去的，可以考虑把它们放在缓存里面。

# 代码整改计划
## Fix Cache

CreepCache 和 RoomObjectCache 这个划分很奇怪，应该把后者改为 StructureCache。

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
