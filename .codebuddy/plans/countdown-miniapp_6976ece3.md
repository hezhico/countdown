---
name: countdown-miniapp
overview: 创建一个"倒计时"微信小程序，支持计算距离过年、中秋、上学等节日/事件还有多少天，也支持自定义日期倒计时
design:
  architecture:
    component: tdesign
  styleKeywords:
    - Minimalism
    - Warm Gradient
    - Card-based
    - Modern
    - Clean
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 36rpx
      weight: 600
    subheading:
      size: 30rpx
      weight: 500
    body:
      size: 28rpx
      weight: 400
  colorSystem:
    primary:
      - "#FF6B35"
      - "#FF8C42"
      - "#FFA559"
    background:
      - "#F8F6F3"
      - "#FFFFFF"
    text:
      - "#2D2D2D"
      - "#666666"
      - "#999999"
    functional:
      - "#FF4D4F"
      - "#52C41A"
      - "#1890FF"
todos:
  - id: init-project
    content: 初始化小程序项目结构和配置文件（app.js/json/wxss、project.config.json、sitemap.json）
    status: completed
  - id: utils-module
    content: 实现工具模块：lunar.js农历算法、holiday.js节日配置、util.js日期计算函数
    status: completed
    dependencies:
      - init-project
  - id: card-component
    content: 开发countdown-card倒计时卡片自定义组件
    status: completed
    dependencies:
      - utils-module
  - id: index-page
    content: 开发首页倒计时列表页面，使用 [skill:ui-ux-pro-max] 优化卡片列表视觉
    status: completed
    dependencies:
      - card-component
  - id: add-page
    content: 开发添加自定义倒计时页面，集成TDesign表单组件和本地存储
    status: completed
    dependencies:
      - init-project
  - id: polish-test
    content: 整体样式调优、交互完善和功能联调
    status: completed
    dependencies:
      - index-page
      - add-page
---

## 产品概述

一款计算距离目标日期剩余天数的微信小程序，帮助用户直观掌握重要时间节点的倒计时，如传统节日、纪念日、开学日等。

## 核心功能

- **预置倒计时**：内置常见节日与事件（春节、中秋、国庆、元旦、清明、端午、七夕、情人节、圣诞节、开学日等），自动计算日期并显示倒计时
- **自定义倒计时**：用户可输入事件名称和目标日期，创建个人专属倒计时
- **倒计时展示**：以卡片形式展示每个倒计时，大字突出显示剩余天数；已过日期显示"已过X天"
- **数据持久化**：自定义倒计时通过本地存储（wx.setStorageSync）持久保存
- **删除功能**：支持左滑删除自定义倒计时项，预置节日不可删除
- **分类展示**：预置节日与自定义倒计时分区展示，便于区分管理

## 技术栈

- 框架：微信小程序原生开发（WXML + WXSS + JS）
- 组件库：TDesign MiniProgram（提供按钮、输入框、日期选择器、弹窗等基础组件）
- 数据存储：wx.setStorageSync / wx.getStorageSync（本地持久化）
- 农历计算：内置 lunar.js 农历算法工具库

## 实现方案

### 核心策略

采用微信小程序原生开发，页面分为首页（倒计时列表）和添加页（自定义倒计时表单）。预置节日通过农历转换算法动态计算当年日期，自定义倒计时通过本地存储持久化。倒计时卡片封装为自定义组件，首页和添加页复用。

### 农历日期处理

春节、中秋、端午、七夕等农历节日需要农历转公历。内置 lunar.js 工具库实现农历算法，支持农历日期到公历日期的转换。每年首次加载时自动计算当年所有预置节日的公历日期并缓存。

### 数据流

```
页面加载 → 读取本地存储的自定义倒计时 → 计算预置节日日期 → 合并排序 → 渲染卡片列表
添加倒计时 → 表单校验 → 写入本地存储 → 返回首页刷新
删除倒计时 → 左滑操作 → 从本地存储移除 → 列表更新
```

### 性能考量

- 农历计算结果按年缓存，避免每次进入页面重复计算
- 列表数据使用 setData 整体更新，避免频繁局部更新
- 卡片组件使用纯数据传入，减少父子组件通信开销

## 架构设计

### 目录结构

```
countdown/
├── app.js                          # [NEW] 小程序入口，初始化全局数据
├── app.json                        # [NEW] 全局配置，页面路由、窗口样式、TDesign引入
├── app.wxss                        # [NEW] 全局样式，CSS变量、通用样式
├── project.config.json             # [NEW] 项目配置文件
├── sitemap.json                    # [NEW] 站点地图配置
├── utils/
│   ├── util.js                     # [NEW] 通用工具函数（日期计算、天数差值等）
│   ├── lunar.js                    # [NEW] 农历算法库（农历转公历核心逻辑）
│   └── holiday.js                  # [NEW] 节日配置与日期计算（预置节日定义、农历转换）
├── components/
│   └── countdown-card/
│       ├── countdown-card.js        # [NEW] 倒计时卡片组件逻辑
│       ├── countdown-card.json      # [NEW] 卡片组件配置
│       ├── countdown-card.wxml      # [NEW] 卡片组件模板
│       └── countdown-card.wxss      # [NEW] 卡片组件样式
├── pages/
│   ├── index/
│   │   ├── index.js                # [NEW] 首页逻辑（加载倒计时列表、删除操作）
│   │   ├── index.json              # [NEW] 首页配置
│   │   ├── index.wxml              # [NEW] 首页模板（倒计时卡片列表）
│   │   └── index.wxss              # [NEW] 首页样式
│   └── add/
│       ├── add.js                  # [NEW] 添加页逻辑（表单提交、本地存储写入）
│       ├── add.json                # [NEW] 添加页配置
│       ├── add.wxml                # [NEW] 添加页模板（事件名称、日期选择器）
│       └── add.wxss                # [NEW] 添加页样式
└── images/                         # [NEW] 图标资源目录
```

### 关键模块说明

- **lunar.js**：农历算法核心，实现 lunarToSolar(年, 月, 日, 闰月) 转换函数，覆盖1900-2100年农历数据表
- **holiday.js**：定义预置节日列表（名称、农历/公历标识、月日），提供 getHolidays(year) 函数返回当年所有节日公历日期
- **countdown-card 组件**：接收 item 数据（name, date, days, isPast, color），渲染卡片UI，支持左滑删除（自定义项）
- **index 页面**：onLoad 时合并预置节日+自定义倒计时，按日期排序渲染；监听 onShow 刷新数据
- **add 页面**：表单包含事件名称输入、日期选择器、颜色选择；保存时校验后写入 Storage 并返回首页

## 设计风格

采用现代简约风格，以温暖渐变色调营造期待感。整体视觉干净清爽，突出倒计时数字的视觉冲击力。

## 页面规划

### 首页 - 倒计时列表

- **顶部导航栏**：标题"倒计时"，右侧添加按钮（+图标）
- **预置节日区**：横向标签分类"节日"，纵向卡片列表，每张卡片展示事件名、日期、大字剩余天数
- **自定义倒计时区**：横向标签分类"我的"，纵向卡片列表，支持左滑删除
- **空状态**：自定义区无数据时显示引导添加提示

### 添加页 - 自定义倒计时

- **顶部导航栏**：返回按钮，标题"添加倒计时"
- **事件名称输入**：TDesign Input 组件，placeholder"输入事件名称"
- **日期选择**：TDesign DateTimePicker 组件，选择目标日期
- **颜色选择**：预设5-6种主题色圆点供选择，影响卡片左侧色条
- **保存按钮**：TDesign Button，底部固定，全宽主色调按钮

### 倒计时卡片组件

- **卡片布局**：圆角矩形，左侧4px色条标识分类，右侧大字天数
- **未到期**：天数显示为醒目主色，标注"天后"
- **已到期**：天数显示为灰色，标注"天前"，整体卡片降低饱和度
- **当天**：显示"就是今天！"，特殊高亮动效

## 交互设计

- 卡片点击可查看详情（未来扩展）
- 自定义卡片支持左滑出现删除按钮
- 添加成功后自动返回首页并滚动到新卡片位置
- 页面下拉刷新重新计算倒计时天数

## Agent Extensions

### Skill

- **ui-ux-pro-max**
- Purpose: 设计和优化小程序的UI/UX，确保倒计时卡片、添加表单等组件的视觉效果和交互体验达到最佳
- Expected outcome: 产出高质量的WXML+WXSS代码，实现美观的卡片布局、渐变效果和流畅交互