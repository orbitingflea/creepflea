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

TO CHECK: creep store 被修改之后 creep 还能移动吗？应该可以，否则 creep 无法连续填充 extension。
TO CHECK: creep store 被修改之后，getFreeCap 等函数是否正常工作？

## Carrier

TODO: carrier 现在在搬运非能量的时候还是会出现停顿的情况。不知道如何解决。或许是切换状态之后第二阶段的寻找目标 move 不到位。
TODO 不同种资源，尤其是 energy vs all 的衔接做得不好。

## 二元自动机设计模式

一个单元指令的执行结果：
1. 做了部分工作。同一时刻还是执行这一侧。OK.
2. 做不了任何工作。同一时刻切换到对侧开始执行。NOTHING_TO_DO.
3. BLOCKED。想要做行为 A，但是本 tick 做不了了。这时结束本 TICK，到下一 tick 再做。

如果两个 state 都做不了任何事情，则重复执行 WAIT 直到 BLOCKED / NOTHING_TO_DO。

## driveTo 性能问题

未知。

已经有一些可以优化的地方：降低非 SK 场景的冗余过程；修改 cache 中路径存储的样式，允许用一条更长路径 + 一个指针，减少路径复制。

"]
[下午3:58:42][shard3]CarrierFromStorage_R4_36423889 state undefined, undefined
[下午3:58:42][shard3]list: ["61efd02c638cf50074e1e8e9","6204cf07a5876d3c8a2b75c0","622337c140d11b1c6ccf79e9","61f00b9da49c319f96ce6e2e","61f013e99b3fe1462b22f65a","61f01d32ff61bc11f96acae0","61f2d119c266af9db9e1efc8","61f2d23a632080d97f143d42","61f2d327d248263156396a31","61f2d48784dbee4afff0ce27","61f2d5d17312ef4d9db35cee","61f7546540d48b7e174635e4","61f76978f8dbd1d2bdb7343b","6205bed774b79b28988c55bb","6223317ad5809d8531fa99cb","62233215cf799dea8a3c1780","622332ac14f31332b08e36ea","6223336b4f52c41444d7d9e9","622402ce1f14593c4f1cf4a0","6224038cd5809d6128facf6c","61f1318949d096420bd2d951"]
[下午3:58:45][shard3]CarrierFromStorage_R4_36423889 state undefined, undefined
[下午3:58:45][shard3]list: ["61efd02c638cf50074e1e8e9
