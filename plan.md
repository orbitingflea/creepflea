# 功能更新
- [ ] 挖掘 E36S45 的 H
- [ ] 编写 terminal 能量传输功能，自动平衡 terminal 和 storage 中的能量
- [ ] 增强 RoomDanger 的能力，特判要塞即将展开的情况；修改 Outer Attacker 的生成规则，不要生成，用 tmp require。
- [ ] 修改寻路 callback，如果一个房间 in danger，则姿态为躲避的 creep 不要寻路经过那边。
- [ ] 增加寻路的路径缓存，避免每次寻路都重新计算。
- [ ] 攻打要塞
- [ ] 更加细致地区分 creeps，比如 hostile、dangerous 的概念，把接口函数名称设置得更长一些

# 架构更新
- [ ] 寻路缓存
- [ ] 设计 action 模块
- [ ] 重新设计寻路、移动模块
- [ ] Room Planner
- [ ] 房间危险信息查询

# 拓扑结构
- action -> service, movement
- creep -> action, service, movement
