---
name: splash-animation
overview: 为倒计时小程序首页添加一个浮夸的打开动画，包含全屏遮罩、Logo/标题缩放弹跳、粒子/烟花效果、数字翻滚、卡片交错入场等多层动画
design:
  architecture:
    component: tdesign
  styleKeywords:
    - Vibrant
    - Particle Burst
    - Bounce Animation
    - Orange Gradient
    - Pulse Ring
    - Staggered Entrance
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 56rpx
      weight: 700
    subheading:
      size: 28rpx
      weight: 400
    body:
      size: 28rpx
      weight: 400
  colorSystem:
    primary:
      - "#FF6B35"
      - "#FF8C42"
      - "#FFA559"
    background:
      - "#FF6B35"
      - "#F8F6F3"
    text:
      - "#FFFFFF"
      - "#2D2D2D"
    functional:
      - "#FFD700"
      - "#FFE0B2"
      - "#FFF3E0"
todos:
  - id: splash-wxml
    content: 在index.wxml中添加Splash遮罩结构（全屏overlay、图标、逐字标题、副标题、8个粒子、2个光环、2道波纹）及页面元素动画class绑定
    status: completed
  - id: splash-wxss
    content: 在index.wxss中添加所有@keyframes动画定义和Splash/入场动画样式类（约12个keyframes+对应class）
    status: completed
  - id: splash-js
    content: 在index.js中添加动画控制逻辑（splashVisible/splashExiting/pageAnimating状态），onReady触发动画序列，定时器管理阶段切换
    status: completed
    dependencies:
      - splash-wxml
      - splash-wxss
---

## 产品概述

为微信小程序"倒计时"首页添加一个浮夸的全屏打开动画效果，在用户进入首页时呈现震撼的视觉体验。

## 核心功能

- **全屏Splash开场动画**：橙色渐变全屏遮罩，中央大号"倒计时"文字+沙漏图标弹跳入场，副标题淡入上移，周围粒子从中心向四周扩散，装饰性光环脉冲效果，底部波纹扩散
- **Splash消失动画**：遮罩缩放+淡出，制造"爆裂"消散感
- **页面元素逐个入场**：Header从顶部滑入，Tab从底部弹入，倒计时卡片交错从底部滑入（每张延迟100ms带弹性），FAB按钮旋转缩放入场
- **动画仅首次进入播放**：通过onShow而非onLoad控制，每次回到首页都播放，但可通过标记控制只播一次

## 技术栈

- 微信小程序原生开发（WXML + WXSS + JS）
- 动画实现：CSS `@keyframes` 为主（性能最优），`wx.createAnimation` 为辅
- 无需引入第三方库

## 实现方案

### 策略概述

采用两阶段动画方案：第一阶段全屏Splash遮罩动画（约2.5秒），第二阶段遮罩消散+页面元素交错入场（约1.5秒）。全部使用CSS `@keyframes` 实现动画，通过JS控制动画触发时机和状态切换。

### 关键技术决策

1. **CSS @keyframes 优于 wx.createAnimation**：CSS动画在WXSS中声明，由GPU加速渲染，不占用JS线程，性能更优；wx.createAnimation每次setData都会触发通信开销
2. **粒子效果用纯CSS实现**：8-10个小圆点view，各自设置不同的animation-delay和transform方向，用CSS animation驱动从中心扩散+淡出，无需Canvas
3. **卡片交错入场通过animation-delay实现**：在WXML中用`style="animation-delay: {{index * 100}}ms"`为每张卡片设置不同延迟
4. **Splash遮罩动画结束后销毁DOM**：通过`wx:if`控制，动画完成后setData移除遮罩节点，避免层叠影响交互和性能
5. **动画触发时机**：在`onReady`中启动Splash动画，确保页面渲染完成后再播放

### 动画时间线

```
0ms     - Splash遮罩出现，背景渐变淡入
100ms   - 沙漏图标缩放弹跳入场 (scale 0→1.3→1)
300ms   - "倒计时"文字逐字弹入
800ms   - 副标题淡入上移
500ms   - 粒子从中心扩散（8个，各自延迟50ms）
600ms   - 光环脉冲效果（2圈，间隔300ms）
1000ms  - 底部波纹扩散
2200ms  - Splash开始缩放+淡出
2800ms  - Splash完全消失，页面元素开始入场
2800ms  - Header从顶部滑入
3000ms  - Tab从底部弹入
3100ms  - 卡片1从底部滑入
3200ms  - 卡片2从底部滑入
...     - 每张卡片延迟100ms
3500ms  - FAB按钮旋转缩放入场
```

### 性能注意事项

- 粒子数量控制在8-10个，避免过多DOM节点
- 动画使用`transform`和`opacity`属性，触发GPU合成层，避免触发layout/paint
- Splash遮罩在动画结束后通过`wx:if`彻底移除，不占用渲染树
- 卡片入场动画使用CSS `animation-fill-mode: both`，动画结束后保持最终状态

## 架构设计

### 数据流

```
onReady → setData({splashVisible: true, splashAnimating: true})
       → CSS动画自动播放（Splash入场）
       → setTimeout 2200ms → setData({splashExiting: true})
       → CSS动画播放（Splash退出）
       → setTimeout 600ms → setData({splashVisible: false, pageAnimating: true})
       → CSS动画自动播放（页面元素入场）
       → setTimeout 1500ms → setData({pageAnimating: false})
```

### 目录结构

```
d:\app\点餐skill\countdown\
├── pages/
│   └── index/
│       ├── index.js    # [MODIFY] 添加动画控制状态(splashVisible/splashExiting/pageAnimating/cardAnimating)，onReady中触发动画序列，定时器控制阶段切换
│       ├── index.wxml  # [MODIFY] 添加Splash遮罩结构(全屏overlay+图标+文字+粒子+光环+波纹)，页面元素添加动画class绑定，卡片添加animation-delay
│       └── index.wxss  # [MODIFY] 添加所有@keyframes动画定义(splashBgIn/logoBounce/textBounce/subtitleIn/particleSpread/ringPulse/waveSpread/splashExit/headerSlideIn/tabSlideUp/cardSlideIn/fabSpinIn)，添加Splash和动画相关样式类
```

## 设计风格

采用活力橙色系+动态粒子+弹性动画的浮夸风格，视觉冲击力拉满。

## 页面规划

### Splash开场遮罩（全屏覆盖，约2.5秒）

- **背景层**：全屏橙色渐变(#FF6B35→#FF8C42→#FFA559)，带微妙的径向光晕效果，从透明淡入
- **中央主体**：沙漏emoji(⏳) 120rpx大小，从scale(0)弹性缩放到scale(1.3)再回弹到scale(1)，带轻微旋转
- **标题文字**："倒计时"三个字逐字弹入，每个字间隔150ms，从下方弹入+缩放，字体56rpx白色粗体
- **副标题**："记录每一个重要时刻"，从下方20rpx处淡入上移，字体28rpx半透明白色
- **粒子效果**：8个橙色/白色/金色小圆点(16-24rpx)，从中心向8个方向扩散，各自延迟50ms，扩散距离200-300rpx，同时淡出
- **光环脉冲**：2圈白色半透明圆环从中心向外扩散，半径从0到400rpx，间隔300ms触发
- **底部波纹**：2道弧形波纹从底部中央向两侧扩散，白色半透明

### Splash退出（约0.6秒）

- 整个Splash遮罩scale(1)→scale(1.5)同时opacity 1→0，制造"爆裂消散"效果

### 页面元素入场（约1.5秒）

- **Header区域**：从顶部-100rpx处滑入到原位，带轻微弹性过冲
- **Tab区域**：从底部30rpx处滑入到原位
- **倒计时卡片**：逐张从底部60rpx处滑入，每张间隔100ms，带0.3s的弹性缓动
- **FAB按钮**：从scale(0)旋转360度缩放到scale(1)，带弹性回弹

## Agent Extensions

### Skill

- **ui-ux-pro-max**
- Purpose: 参考其动画设计最佳实践和移动端微交互规范，确保动画效果专业流畅
- Expected outcome: 动画时序、缓动曲线、持续时间符合移动端UX标准，视觉冲击力与流畅度兼顾