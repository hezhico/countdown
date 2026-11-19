const {
  timeToMinutes,
  formatDuration,
  getWeekdayCN,
  hourlyRateFromSalary,
  REFERENCE_ITEMS
} = require('../../utils/salary.js')

const CONFIG_KEY = 'salary_config'
const DEFAULT_WORK_START = '09:00'
const DEFAULT_WORK_END = '18:00'

Page({
  data: {
    hasConfig: false,
    dateText: '',
    weekdayText: '',
    timeText: '',
    statusText: '',
    statusDesc: '',
    earnedText: '',
    speedText: '',
    referenceText: '',
    progressPercent: 0,
    progressText: '',
    workTimeText: '',
    showSetting: false,
    form: {
      monthlySalary: '',
      workStart: DEFAULT_WORK_START,
      workEnd: DEFAULT_WORK_END
    }
  },

  onLoad() {
    this.config = this.loadConfig()
    this.formData = {
      monthlySalary: '',
      workStart: DEFAULT_WORK_START,
      workEnd: DEFAULT_WORK_END
    }
    this.refresh()
    if (!this.config) {
      this.onOpenSetting()
    }
  },

  /** 进入页面即开始计时，已配置过则直接开始 */
  onShow() {
    this.refresh()
    this.startTicker()
  },

  /** 离开页面自动停止计时 */
  onHide() {
    this.stopTicker()
  },

  onUnload() {
    this.stopTicker()
  },

  /** 旧版按时薪存的配置缺少月薪，视为未配置 */
  loadConfig() {
    const config = wx.getStorageSync(CONFIG_KEY)
    if (config && config.monthlySalary > 0 && config.workStart && config.workEnd) {
      return config
    }
    return null
  },

  /** 今天的上下班时刻 */
  workRange(now) {
    const startMinutes = timeToMinutes(this.config.workStart)
    const endMinutes = timeToMinutes(this.config.workEnd)
    const startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(startMinutes / 60), startMinutes % 60, 0, 0)
    const endAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(endMinutes / 60), endMinutes % 60, 0, 0)
    return { startAt, endAt }
  },

  startTicker() {
    if (this.ticker) return
    this.ticker = setInterval(() => {
      this.refresh()
    }, 1000)
  },

  stopTicker() {
    if (!this.ticker) return
    clearInterval(this.ticker)
    this.ticker = null
  },

  refresh() {
    const config = this.config
    if (!config) {
      this.setData({ hasConfig: false })
      return
    }

    const now = new Date()
    const { startAt, endAt } = this.workRange(now)
    const perSecond = hourlyRateFromSalary(config.monthlySalary) / 3600
    const fullSeconds = (timeToMinutes(config.workEnd) - timeToMinutes(config.workStart)) * 60

    // 工时按上下班时间自动累计：上班后实时增长，下班后停在满勤
    let workedSeconds = 0
    if (now >= endAt) {
      workedSeconds = fullSeconds
    } else if (now >= startAt) {
      workedSeconds = (now.getTime() - startAt.getTime()) / 1000
    }

    const earned = workedSeconds * perSecond
    const progressPercent = workedSeconds / fullSeconds * 100

    // 参考物每 4 秒轮换一次，按已赚金额换算成"能买几件"
    const item = REFERENCE_ITEMS[Math.floor(Date.now() / 4000) % REFERENCE_ITEMS.length]
    const count = Math.floor(earned / item.price)
    let referenceText = ''
    if (count == 0) {
      referenceText = `再过 ${formatDuration((item.price - earned) / perSecond)}，一${item.unit}${item.name}就赚回来了。`
    } else if (count == 1) {
      referenceText = `今天已经赚到一${item.unit}${item.name}了。`
    } else {
      referenceText = `今天已经赚了 ${count} ${item.unit}${item.name}。`
    }

    let statusText = ''
    let statusDesc = ''
    if (now < startAt) {
      statusText = '未上班'
      statusDesc = `距离上班还有 ${formatDuration((startAt - now) / 1000)}`
    } else if (now < endAt) {
      statusText = '上班中'
      statusDesc = `距离下班还有 ${formatDuration((endAt - now) / 1000)}`
    } else {
      statusText = '已下班'
      statusDesc = '今天的工作已经结束'
    }

    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const mi = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')

    this.setData({
      hasConfig: true,
      dateText: `${now.getFullYear()}-${m}-${d}`,
      weekdayText: getWeekdayCN(now),
      timeText: `${hh}:${mi}:${ss}`,
      statusText,
      statusDesc,
      earnedText: `¥${earned.toFixed(2)}`,
      speedText: `¥${perSecond.toFixed(4)} / 秒`,
      referenceText,
      progressPercent,
      progressText: `${progressPercent.toFixed(1)}%`,
      workTimeText: `已工作 ${(workedSeconds / 3600).toFixed(2)} / ${(fullSeconds / 3600).toFixed(2)} 小时`
    })
  },

  onOpenSetting() {
    const config = this.config
    this.formData = {
      monthlySalary: config ? String(config.monthlySalary) : '',
      workStart: config ? config.workStart : DEFAULT_WORK_START,
      workEnd: config ? config.workEnd : DEFAULT_WORK_END
    }
    this.setData({
      showSetting: true,
      form: {
        monthlySalary: this.formData.monthlySalary,
        workStart: this.formData.workStart,
        workEnd: this.formData.workEnd
      }
    })
  },

  onCloseSetting() {
    this.setData({ showSetting: false })
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key
    this.formData[key] = e.detail.value
  },

  onStartChange(e) {
    this.formData.workStart = e.detail.value
    this.setData({ 'form.workStart': e.detail.value })
  },

  onEndChange(e) {
    this.formData.workEnd = e.detail.value
    this.setData({ 'form.workEnd': e.detail.value })
  },

  onSaveSetting() {
    const monthlySalary = Number(this.formData.monthlySalary)
    const workStart = this.formData.workStart
    const workEnd = this.formData.workEnd

    if (!monthlySalary || monthlySalary <= 0) {
      wx.showToast({ title: '请填写有效月薪', icon: 'none' })
      return
    }
    if (!workStart || !workEnd) {
      wx.showToast({ title: '请选择上下班时间', icon: 'none' })
      return
    }
    if (timeToMinutes(workEnd) <= timeToMinutes(workStart)) {
      wx.showToast({ title: '下班时间要晚于上班时间', icon: 'none' })
      return
    }

    this.config = { monthlySalary, workStart, workEnd }
    wx.setStorageSync(CONFIG_KEY, this.config)
    this.setData({ showSetting: false })
    // 设置完成即开始计时
    this.startTicker()
    this.refresh()
  }
})
