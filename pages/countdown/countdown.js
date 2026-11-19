const { getHolidays } = require('../../utils/holiday.js')
const { daysUntil, formatDateCN, getWeekDay, loadCustomCountdowns, removeCustomCountdown, loadPinnedIds, togglePin, resolveRepeatDate, formatLunarDateCN } = require('../../utils/util.js')

// 订阅消息模板ID
const SUBSCRIBE_TEMPLATE_ID = 'EOHvCnzTGKVOAeNGjnWNhHfX8B3wv1mUHRw6O1Pprbo'

Page({
  data: {
    list: [],
    presetList: [],
    customList: [],
    activeTab: 0,
    loading: true,
    // 订阅状态映射 { itemId: true/false }
    subscribedMap: {}
  },

  _timers: [],

  onUnload() {
    this._timers.forEach(t => clearTimeout(t))
  },

  onShow() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData()
    wx.stopPullDownRefresh()
  },

  /** 从云数据库加载订阅状态 */
  loadSubscriptions() {
    if (!wx.cloud) return Promise.resolve({})

    const db = wx.cloud.database()
    return db.collection('subscriptions').get().then(res => {
      const map = {}
      res.data.forEach(item => {
        map[item.itemId] = true
      })
      return map
    }).catch(err => {
      console.error('加载订阅状态失败:', err)
      return {}
    })
  },

  loadData() {
    const year = new Date().getFullYear()
    const holidays = getHolidays(year)
    const customs = loadCustomCountdowns()
    const pinnedIds = loadPinnedIds()

    // 加载订阅状态
    this.loadSubscriptions().then(subscribedMap => {
      this.setData({ subscribedMap })

      const formatItem = (item) => {
        const effectiveDate = resolveRepeatDate(item)
        const days = daysUntil(effectiveDate)
        const key = item.isPreset ? item.name : item.id

        let dateStr = ''
        if (item.isLunar && item.lunarMonth && item.lunarDay) {
          dateStr = formatLunarDateCN(item.lunarMonth, item.lunarDay, item.isLeapMonth)
        } else {
          dateStr = formatDateCN(effectiveDate)
        }

        return {
          ...item,
          days,
          daysStr: Math.abs(days).toString(),
          isPast: days < 0,
          isToday: days === 0,
          dateStr,
          weekDay: getWeekDay(effectiveDate),
          effectiveDate,
          pinned: pinnedIds.indexOf(key) > -1,
          subscribed: !!subscribedMap[item.isPreset ? item.name : item.id]
        }
      }

      const presetList = holidays.map(formatItem)
      const customList = customs.map(formatItem)

      const sortFn = (a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        if (a.days >= 0 && b.days < 0) return -1
        if (a.days < 0 && b.days >= 0) return 1
        if (a.days >= 0 && b.days >= 0) return a.days - b.days
        return b.days - a.days
      }

      presetList.sort(sortFn)
      customList.sort(sortFn)

      const allList = [...presetList, ...customList].sort(sortFn)

      this.setData({
        presetList,
        customList,
        list: allList,
        loading: false
      })
    })
  },

  onTabChange(e) {
    const index = Number(e.currentTarget.dataset.index)
    this.setData({ activeTab: index })
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  },

  getCurrentList() {
    const { activeTab, presetList, customList, list } = this.data
    if (activeTab === 1) return presetList
    if (activeTab === 2) return customList
    return list
  },

  onDelete(e) {
    const { id } = e.detail
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个倒计时吗？',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          removeCustomCountdown(id)
          // 同时删除云数据库订阅
          this.removeCloudSubscription(id)
          this.loadData()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  onPin(e) {
    const { key } = e.detail
    const isPinned = togglePin(key)
    this.loadData()
    wx.showToast({
      title: isPinned ? '已置顶' : '已取消置顶',
      icon: 'success'
    })
  },

  /** 订阅/取消订阅倒计时 */
  onSubscribe(e) {
    const { id, subscribed } = e.detail
    if (!wx.cloud) {
      wx.showToast({ title: '云开发未初始化', icon: 'none' })
      return
    }

    if (!subscribed) {
      // 请求订阅授权
      wx.requestSubscribeMessage({
        tmplIds: [SUBSCRIBE_TEMPLATE_ID],
        success: (res) => {
          if (res[SUBSCRIBE_TEMPLATE_ID] === 'accept') {
            this.addCloudSubscription(id)
          } else {
            wx.showToast({ title: '需要授权才能接收提醒', icon: 'none' })
          }
        },
        fail: () => {
          wx.showToast({ title: '订阅授权失败', icon: 'none' })
        }
      })
    } else {
      // 取消订阅
      this.removeCloudSubscription(id)
    }
  },

  /** 添加云数据库订阅 */
  addCloudSubscription(itemId) {
    // 从当前列表找到对应项（预置节日用name匹配，自定义用id匹配）
    const allItems = [...this.data.presetList, ...this.data.customList]
    const item = allItems.find(i => (i.isPreset ? i.name : i.id) === itemId)
    if (!item) return

    const effectiveItemId = item.isPreset ? item.name : item.id
    const db = wx.cloud.database()
    db.collection('subscriptions').add({
      data: {
        itemId: effectiveItemId,
        name: item.name,
        date: item.effectiveDate || item.date,
        color: item.color,
        repeat: item.repeat || 'none',
        isLunar: item.isLunar || false,
        lunarMonth: item.lunarMonth || 0,
        lunarDay: item.lunarDay || 0,
        isLeapMonth: item.isLeapMonth || false,
        isPreset: item.isPreset || false,
        subscribedAt: new Date(),
        lastNotifiedAt: null,
        notifyDays: [7, 3, 1, 0]
      }
    }).then(() => {
      wx.showToast({ title: '订阅成功', icon: 'success' })
      this.loadData()
    }).catch(err => {
      console.error('订阅失败:', err)
      wx.showToast({ title: '订阅失败', icon: 'none' })
    })
  },

  /** 删除云数据库订阅 */
  removeCloudSubscription(itemId) {
    if (!wx.cloud) return

    const db = wx.cloud.database()
    // 先查询记录
    db.collection('subscriptions').where({
      itemId: itemId
    }).get().then(res => {
      if (res.data.length > 0) {
        const docId = res.data[0]._id
        return db.collection('subscriptions').doc(docId).remove()
      }
    }).then(() => {
      wx.showToast({ title: '已取消订阅', icon: 'success' })
      this.loadData()
    }).catch(err => {
      console.error('取消订阅失败:', err)
    })
  }
})
