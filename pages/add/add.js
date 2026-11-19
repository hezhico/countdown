const { addCustomCountdown, daysUntil } = require('../../utils/util.js')
const { getLunarMonthList, getLunarDayList, getLunarMonthDays, lunarToSolar, lunarMonthNames } = require('../../utils/lunar.js')

// 订阅消息模板ID（需在微信公众平台申请后替换）
const SUBSCRIBE_TEMPLATE_ID = 'EOHvCnzTGKVOAeNGjnWNhHfX8B3wv1mUHRw6O1Pprbo'

Page({
  data: {
    name: '',
    date: '',
    color: '#FF6B35',
    colors: [
      { value: '#FF6B35', label: '活力橙' },
      { value: '#FF4D6A', label: '浪漫粉' },
      { value: '#1890FF', label: '天空蓝' },
      { value: '#52C41A', label: '清新绿' },
      { value: '#722ED1', label: '优雅紫' },
      { value: '#FA8C16', label: '温暖黄' }
    ],
    canSave: false,
    previewDays: '',
    // 日期类型：solar=公历, lunar=农历
    dateType: 'solar',
    // 农历选择器
    lunarMonthList: [],
    lunarMonthIndex: 0,
    lunarDayList: [],
    lunarDayIndex: 0,
    // 当前选择的农历值
    lunarMonth: 1,
    lunarDay: 1,
    isLeapMonth: false,
    // 每年重复
    repeat: 'none',
    // 订阅提醒
    subscribed: false
  },

  onLoad() {
    this.initLunarPicker()
  },

  /** 初始化农历选择器数据 */
  initLunarPicker() {
    const year = new Date().getFullYear()
    const monthList = getLunarMonthList(year)
    const dayList = getLunarDayList(year, 1, false)
    this.setData({
      lunarMonthList: monthList,
      lunarDayList: dayList,
      lunarMonth: 1,
      lunarDay: 1,
      isLeapMonth: false
    })
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
    this.checkCanSave()
    this.updatePreview()
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value })
    this.checkCanSave()
    this.updatePreview()
  },

  /** 日期类型切换 */
  onDateTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ dateType: type, date: '' })
    this.checkCanSave()
    this.updatePreview()
  },

  /** 农历月份列变化 */
  onLunarMonthChange(e) {
    const idx = Number(e.detail.value)
    const monthItem = this.data.lunarMonthList[idx]
    if (!monthItem) return

    const year = new Date().getFullYear()
    const dayList = getLunarDayList(year, monthItem.month, monthItem.isLeap)
    let dayIdx = this.data.lunarDayIndex
    if (dayIdx >= dayList.length) {
      dayIdx = dayList.length - 1
    }

    this.setData({
      lunarMonthIndex: idx,
      lunarMonth: monthItem.month,
      isLeapMonth: monthItem.isLeap,
      lunarDayList: dayList,
      lunarDayIndex: dayIdx,
      lunarDay: dayIdx + 1
    })
    this.checkCanSave()
    this.updatePreview()
  },

  /** 农历日列变化 */
  onLunarDayChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      lunarDayIndex: idx,
      lunarDay: idx + 1
    })
    this.checkCanSave()
    this.updatePreview()
  },

  /** 每年重复开关 */
  onRepeatChange(e) {
    const repeat = e.detail.value ? 'yearly' : 'none'
    this.setData({ repeat })
    this.updatePreview()
  },

  /** 订阅提醒开关 */
  onSubscribeChange(e) {
    const subscribed = e.detail.value
    if (subscribed) {
      // 请求订阅消息授权
      this.requestSubscribe()
    } else {
      this.setData({ subscribed: false })
    }
  },

  /** 请求订阅消息授权 */
  requestSubscribe() {
    wx.requestSubscribeMessage({
      tmplIds: [SUBSCRIBE_TEMPLATE_ID],
      success: (res) => {
        if (res[SUBSCRIBE_TEMPLATE_ID] === 'accept') {
          this.setData({ subscribed: true })
          wx.showToast({ title: '订阅成功', icon: 'success' })
        } else {
          this.setData({ subscribed: false })
          wx.showToast({ title: '需要授权才能接收提醒', icon: 'none' })
        }
      },
      fail: (err) => {
        this.setData({ subscribed: false })
        console.error('订阅消息授权失败:', err)
        wx.showToast({ title: '订阅授权失败', icon: 'none' })
      }
    })
  },

  onColorSelect(e) {
    const color = e.currentTarget.dataset.color
    this.setData({ color })
  },

  checkCanSave() {
    const { name, date, dateType, lunarMonth, lunarDay } = this.data
    const hasDate = dateType === 'solar' ? date.length > 0 : (lunarMonth > 0 && lunarDay > 0)
    this.setData({
      canSave: name.trim().length > 0 && hasDate
    })
  },

  /** 获取当前有效日期（公历 YYYY-MM-DD） */
  getEffectiveDate() {
    const { dateType, date, lunarMonth, lunarDay, isLeapMonth, repeat } = this.data
    if (dateType === 'solar') {
      if (repeat === 'yearly') {
        const parts = date.split('-')
        const now = new Date()
        let tryDate = `${now.getFullYear()}-${parts[1]}-${parts[2]}`
        if (daysUntil(tryDate) < 0) {
          tryDate = `${now.getFullYear() + 1}-${parts[1]}-${parts[2]}`
        }
        return tryDate
      }
      return date
    }

    // 农历
    const year = new Date().getFullYear()
    const solar = lunarToSolar(year, lunarMonth, lunarDay, isLeapMonth)
    if (!solar) return ''
    let dateStr = `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`
    if (repeat === 'yearly' && daysUntil(dateStr) < 0) {
      const solarNext = lunarToSolar(year + 1, lunarMonth, lunarDay, isLeapMonth)
      if (solarNext) {
        dateStr = `${solarNext.year}-${String(solarNext.month).padStart(2, '0')}-${String(solarNext.day).padStart(2, '0')}`
      }
    }
    return dateStr
  },

  updatePreview() {
    const { dateType, date, lunarMonth, lunarDay, repeat } = this.data
    if (dateType === 'solar' && !date) {
      this.setData({ previewDays: '--' })
      return
    }
    if (dateType === 'lunar' && (!lunarMonth || !lunarDay)) {
      this.setData({ previewDays: '--' })
      return
    }

    const effectiveDate = this.getEffectiveDate()
    if (!effectiveDate) {
      this.setData({ previewDays: '--' })
      return
    }

    const days = daysUntil(effectiveDate)
    if (days === 0) {
      this.setData({ previewDays: '今天' })
    } else if (days > 0) {
      this.setData({ previewDays: days.toString() })
    } else {
      this.setData({ previewDays: Math.abs(days).toString() })
    }
  },

  onSave() {
    const { name, color, dateType, repeat, lunarMonth, lunarDay, isLeapMonth, subscribed } = this.data
    if (!name.trim()) {
      wx.showToast({ title: '请输入事件名称', icon: 'none' })
      return
    }

    const effectiveDate = this.getEffectiveDate()
    if (!effectiveDate) {
      wx.showToast({ title: '日期转换失败，请重新选择', icon: 'none' })
      return
    }

    const item = {
      name: name.trim(),
      date: effectiveDate,
      color: color,
      repeat: repeat,
      isLunar: dateType === 'lunar',
      lunarMonth: dateType === 'lunar' ? lunarMonth : 0,
      lunarDay: dateType === 'lunar' ? lunarDay : 0,
      isLeapMonth: dateType === 'lunar' ? isLeapMonth : false,
      subscribed: subscribed
    }

    const result = addCustomCountdown(item)

    // 如果开启了订阅，写入云数据库
    if (subscribed && wx.cloud) {
      const savedItem = result[result.length - 1]
      this.addCloudSubscription(savedItem)
    }

    wx.showToast({
      title: '添加成功',
      icon: 'success',
      duration: 1500
    })

    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  /** 将订阅信息写入云数据库 */
  addCloudSubscription(item) {
    const db = wx.cloud.database()
    db.collection('subscriptions').add({
      data: {
        itemId: item.id,
        name: item.name,
        date: item.date,
        color: item.color,
        repeat: item.repeat || 'none',
        isLunar: item.isLunar || false,
        lunarMonth: item.lunarMonth || 0,
        lunarDay: item.lunarDay || 0,
        isLeapMonth: item.isLeapMonth || false,
        subscribedAt: new Date(),
        lastNotifiedAt: null,
        notifyDays: [7, 3, 1, 0]
      }
    }).then(() => {
      console.log('订阅信息已写入云数据库')
    }).catch(err => {
      console.error('订阅信息写入失败:', err)
    })
  }
})
