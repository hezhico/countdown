---
name: recurring-lunar-support
overview: 为倒计时应用增加「每年重复」和「农历日期」两个核心功能
design:
  architecture:
    component: tdesign
  styleKeywords:
    - Warm
    - Segment Control
    - Toggle Switch
    - Badge Tags
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 44rpx
      weight: 700
    subheading:
      size: 30rpx
      weight: 600
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
      - "#13C2C2"
      - "#FA8C16"
      - "#52C41A"
todos:
  - id: lunar-util
    content: 扩展 lunar.js：导出农历月名列表、获取指定年月天数的函数
    status: completed
  - id: util-extend
    content: 扩展 util.js：新增 formatLunarDateCN、resolveRepeatDate 函数，修改 daysUntil 支持重复事件
    status: completed
    dependencies:
      - lunar-util
  - id: add-page-logic
    content: 改造 add.js：增加日期类型切换、农历选择器联动、每年重复开关、保存新字段
    status: completed
    dependencies:
      - util-extend
  - id: add-page-ui
    content: 改造 add.wxml/wxss：日期类型分段选择器、农历月日选择器、重复开关UI及样式
    status: completed
    dependencies:
      - add-page-logic
  - id: index-logic
    content: 修改 index.js formatItem：处理重复事件天数计算、农历日期展示
    status: completed
    dependencies:
      - util-extend
  - id: card-display
    content: 修改 countdown-card 组件：显示"每年"和"农历"标签及样式
    status: completed
    dependencies:
      - index-logic
---

## 产品概述

为倒计时小程序增加"每年重复"和"农历日期"两个核心功能，解决生日/纪念日等年度事件需反复设置的问题，并支持农历日期选择。

## 核心功能

- **每年重复**：添加倒计时时可开启"每年重复"开关，开启后系统自动计算到下一次该日期的天数，过期后不再显示为已过，而是自动跳转到下一年
- **农历日期**：添加倒计时时可切换"公历/农历"模式，农历模式下选择月份和日期，系统自动将农历转换为公历进行倒计时计算；农历事件每年自动重新转换（因农历对应公历日期每年不同）
- **卡片展示**：重复事件显示"每年"标签，农历事件显示"农历"标签，农历日期显示中文格式（如"腊月十五"）

## 技术栈

- 微信小程序原生开发（WXML/WXSS/JS），与现有项目一致
- 农历转换：复用现有 `utils/lunar.js`（已支持 1900-2100 年农历转公历）

## 实现方案

### 数据结构变更

自定义倒计时 item 扩展字段：

```js
{
  id, name, date, color, isPreset: false, icon: '📌',
  repeat: 'yearly' | 'none',    // 新增：是否每年重复
  isLunar: true | false,         // 新增：是否农历日期
  lunarMonth: 1-12,              // 新增：农历月（仅 isLunar 时有效）
  lunarDay: 1-30,               // 新增：农历日（仅 isLunar 时有效）
  isLeapMonth: false             // 新增：是否闰月（仅 isLunar 时有效）
}
```

### 核心逻辑

#### 1. 每年重复计算（修改 `daysUntil` 逻辑）

在 `index.js` 的 `formatItem` 中处理：

- 若 `repeat === 'yearly'` 且 `days < 0`：将年份+1重新计算天数
- 若是农历重复事件：用当年/次年农历转公历后计算天数
- 确保"今天"判断也正确

#### 2. 农历日期处理

- 添加页农历模式：用 `picker mode="multiSelector"` 实现月日选择
- 农历月名列表：正月、二月...腊月（12项）
- 农历日列表：初一到三十（根据选中月动态调整天数）
- 保存时存储 `lunarMonth`、`lunarDay`、`isLeapMonth`，同时用 `lunarToSolar` 计算出当年公历 `date` 存储
- 显示时使用农历中文格式

#### 3. 农历日期格式化

新增 `formatLunarDateCN(month, day)` 函数，输出如"正月初一"、"腊月十五"

### 涉及文件修改

```
project-root/
├── utils/
│   ├── util.js           # [MODIFY] 新增 formatLunarDateCN、修改 daysUntil 支持重复、新增 resolveDate 函数
│   └── lunar.js          # [MODIFY] 新增 lunarMonthNames 农历月名导出、getLunarMonthDays 获取某月天数
├── pages/
│   ├── add/
│   │   ├── add.js        # [MODIFY] 增加公历/农历切换、每年重复开关、农历选择器逻辑、保存时存储新字段
│   │   ├── add.wxml      # [MODIFY] 增加日期类型切换、农历月日选择器、重复开关UI
│   │   └── add.wxss      # [MODIFY] 新增切换按钮、开关、农历选择器样式
│   └── index/
│       └── index.js      # [MODIFY] formatItem 中处理重复和农历的日期计算与展示
├── components/
│   └── countdown-card/
│       ├── countdown-card.wxml  # [MODIFY] 显示"每年"和"农历"标签
│       └── countdown-card.wxss  # [MODIFY] 标签样式
```

## 实现要点

- **农历选择器联动**：选择月份后需动态更新日期列（大月30天/小月29天），用 `picker mode="multiSelector"` + `bindcolumnchange` 实现
- **闰月处理**：若某年某月有闰月，月份列表中显示"闰X月"选项，选中闰月时 `isLeapMonth=true`
- **重复事件的天数计算**：农历重复事件每年需重新用 `lunarToSolar` 转换，不能直接用存储的公历 `date`；公历重复事件只需将年份+1
- **向后兼容**：旧数据没有 `repeat`/`isLunar` 字段时默认为 `none`/`false`，不影响已有倒计时
- **预置节日**：`holiday.js` 已有农历支持，预置节日天然是每年重复的，无需修改其数据结构

## 设计方案

### 添加页面改造

在现有表单"目标日期"区域下方，新增两个设置项：

1. **日期类型切换**：公历/农历分段选择器（segment control），默认公历。切换到农历时，日期picker变为自定义的月日两列选择器
2. **每年重复开关**：开关组件，默认关闭。开启后预览区显示"每年"标识

### 卡片展示

- 农历事件：在日期行显示"农历 正月十五"格式，名称旁增加"农历"小标签（蓝绿色调）
- 每年重复事件：名称旁增加"每年"小标签（橙色调）
- 两个标签同时存在时并排显示

### 交互细节

- 农历月日选择器：第一列为月份（正月~腊月，若当年有闰月则含"闰X月"），第二列为日期（初一到三十/廿九）
- 切换日期类型时清空已选日期
- 开启每年重复后，预览卡片的天数自动更新为到下一次的天数