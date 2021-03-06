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

structure.cache.demandUnbounded: {
  [res in ResourceConstant | 'all']?: {
    threshold: number;
    type: 'give' | 'need';
    priority?: number;
  }
}

<!-- structure.cache.demandBalanced: {
  [res in ResourceConstant | 'all']?: {
    expected: number;
    priority?: number;
  }
} -->

args: {
  sources (get): {
    [res]?: {
      structure: Structure;
      amount: number;
      priority: number;
    }[]
  },
  sinks (get): {
    [res]?: {
      structure: Structure;
      amount: number;
      priority: number;
    }[];
  }
}

第二类 demand 暂不设计。只考虑第一类。所有除了 storage 的结构自行把 demand 挂在缓存上。但这个信息比较静态，可以很多 tick 执行一次（和 develope.ts 一起执行）。

Carrier 接受怎样的参数？希望接受的参数是可变的，

Action v2 怎样设计？希望每个 action 仅单一执行过程，而不考虑下一步。新增一个返回值：RUNNING_NO_MOVE。如果返回这个，则下一步还是可以继续调用同种函数；如果 COMPLETE_NO_MOVE，就换对面状态来调用。这样的设计方式要求任务序列是关于 store 的函数，而非在 tick 初计算好传入的。

那么：让 args 的各个属性含有 get 函数。

## 二元自动机设计模式

一个单元指令的执行结果：
1. 做了部分工作。同一时刻还是执行这一侧。OK.
2. 做不了任何工作。同一时刻切换到对侧开始执行。NOTHING_TO_DO.
3. BLOCKED。想要做行为 A，但是本 tick 做不了了。这时结束本 TICK，到下一 tick 再做。

如果两个 state 都做不了任何事情，则重复执行 WAIT 直到 BLOCKED / NOTHING_TO_DO。

## driveTo 性能问题

未知。

已经有一些可以优化的地方：降低非 SK 场景的冗余过程；修改 cache 中路径存储的样式，允许用一条更长路径 + 一个指针，减少路径复制。

## carrier2 性能问题

每个 tick 要扫描所有 structure 两次，不好。
