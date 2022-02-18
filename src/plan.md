# 功能更新
- [ ] 挖掘 E36S45 的 H
- [ ] 编写 terminal 能量传输功能，自动平衡 terminal 和 storage 中的能量
- [ ] 增强 RoomDanger 的能力，特判要塞即将展开的情况；修改 Outer Attacker 的生成规则，不要生成，用 tmp require。
- [X] 修改寻路 callback，如果一个房间 in danger，则姿态为躲避的 creep 不要寻路经过那边。
- [X] 增加寻路的路径缓存，避免每次寻路都重新计算。
- [X] 攻打要塞
- [X] 更加细致地区分 creeps，比如 hostile、dangerous 的概念，把接口函数名称设置得更长一些
- [ ] Worker, Carrier 应当躲避危险房间与 lair region

# 架构更新
- [X] 寻路缓存
- [ ] 设计 action 模块
- [X] 重新设计寻路、移动模块
- [ ] Room Planner
- [X] 房间危险信息查询
- [ ] 在 room structure list 中加入 parkable matrix，加速 park 的搜索
- [ ] structure list 的反应应当更灵敏，用 event 或者定期看看的方式来更新；增加版本控制
- [ ] 寻路缓存的性能优化，避免重复创建 object。路径存储为字符串，并直接以下标来访问，不要 splice。
- [ ] 寻路缓存的版本控制与有效性查询，只有“很好的”路径才会被缓存，读取之后只有仍然很好的路径才会被使用（否则清除）。
- [X] 重写 creep manager。

# 拓扑结构
- action -> service, movement
- creep -> action, service, movement
