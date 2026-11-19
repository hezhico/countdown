# 倒计时小程序

一个精美的微信小程序倒计时应用，支持节日倒计时、自定义事件，以及农历日期和每年重复功能。

## 功能特性

- 内置常见节日倒计时（春节、清明、劳动节、端午、中秋、国庆、元旦）
- 自定义倒计时事件（生日、纪念日等）
- 每年重复 — 生日/纪念日自动循环，无需每年重新设置
- 农历日期 — 支持选择农历日期，自动转换为公历计算倒计时
- 置顶功能 — 重要倒计时可置顶显示
- 下拉刷新 — 实时更新倒计时数据
- 开屏动画 — 流畅的启动动画效果

## 技术栈

- 微信小程序原生开发
- 自定义组件（countdown-card）
- 内置农历转换算法（utils/lunar.js）

## 项目结构

```
├── app.js              # 小程序入口
├── app.json            # 全局配置
├── app.wxss            # 全局样式
├── pages/
│   ├── index/          # 首页（倒计时列表）
│   └── add/            # 添加倒计时页
├── components/
│   └── countdown-card/ # 倒计时卡片组件
├── utils/
│   ├── util.js         # 通用工具函数
│   ├── lunar.js        # 农历转换算法
│   └── holiday.js      # 节日数据
└── project.config.json # 项目配置
```

## CloudBase 部署信息

- **环境 ID**: prod-d1giavvri4d984634
- **区域**: ap-shanghai
- **套餐**: 个人版
- **静态托管域名**: https://prod-d1giavvri4d984634-1307874859.tcloudbaseapp.com
- **项目文件路径**: /countdown
- **部署时间**: 2026-04-17

### CloudBase 控制台

- 概览: https://tcb.cloud.tencent.com/dev?envId=prod-d1giavvri4d984634#/overview
- 静态托管: https://tcb.cloud.tencent.com/dev?envId=prod-d1giavvri4d984634#/static-hosting
- 云函数: https://tcb.cloud.tencent.com/dev?envId=prod-d1giavvri4d984634#/scf
- 数据库: https://tcb.cloud.tencent.com/dev?envId=prod-d1giavvri4d984634#/db/doc

> **注意**: 本项目为微信小程序，需通过微信开发者工具进行预览、上传和发布。CloudBase 静态托管用于项目文件的云端备份与分发，小程序本身需在微信生态内运行。
