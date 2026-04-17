# bazi-fashion mobile

基于现有 `server` 接口实现的 React Native（Expo）移动端。

## 功能（当前版本）

- 新建生辰信息（姓名、年月日时、性别、出生地）
- 查看历史档案并切换
- 查看八字摘要（四柱、喜用/忌用）
- 查看穿搭建议
- 查看手串建议
- 查看今日运势（`daily-fortune`）
- 查看命盘综合分析（`mingpan-analysis`）
- AI 命理对话（优先 `ai/chat/stream`，失败回退 `ai/chat`）
- 档案编辑/删除（`PATCH/DELETE /users/:userId/birth-info/:id`）
- AI 上下文裁剪（最近 8 条）与失败重试
- 移动端条形图可视化（运势 + 五行）
- 开发环境自动推断 API 地址（可被 `EXPO_PUBLIC_API_BASE_URL` 覆盖）
- 档案搜索与性别筛选
- AI 真流式显示（SSE 实时分片）
- 本地离线缓存（档案列表、最近一次分析详情、对话记录）

## 启动方式

1. 先启动后端（默认 `http://localhost:3001`）
2. 启动移动端：

```bash
cd mobile
npm install
EXPO_PUBLIC_API_BASE_URL=http://你的局域网IP:3001/api npm start
```

> 真机调试时，`127.0.0.1` 指向手机本机，不是你的电脑。  
> 推荐使用电脑局域网 IP（例如 `http://192.168.1.10:3001/api`）。

## 后续可扩展

- 增加多档案快捷搜索和编辑/删除
- 增加更精细的可视化图表（五行分布、运势趋势）
- 增加管理页（对接 `/api/admin/*`）
