Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },

  data: {
    touchStartX: 0,
    touchCurrentX: 0,
    showDelete: false,
    translateX: 0
  },

  methods: {
    onTouchStart(e) {
      if (this.data.item.isPreset) return
      this.setData({
        touchStartX: e.touches[0].clientX,
        touchCurrentX: e.touches[0].clientX,
        showDelete: false,
        translateX: 0
      })
    },

    onTouchMove(e) {
      if (this.data.item.isPreset) return
      const deltaX = e.touches[0].clientX - this.data.touchStartX
      if (deltaX < -30) {
        this.setData({ showDelete: true, translateX: -140 })
      } else if (deltaX > 30) {
        this.setData({ showDelete: false, translateX: 0 })
      }
    },

    onTouchEnd() {
      // 保持当前状态
    },

    onDelete() {
      this.triggerEvent('delete', { id: this.data.item.id })
    },

    onTap() {
      this.triggerEvent('tap', { item: this.data.item })
    },

    /** 点击订阅铃铛 */
    onSubscribeTap(e) {
      const item = this.data.item
      const itemId = item.isPreset ? item.name : item.id
      this.triggerEvent('subscribe', { id: itemId, subscribed: item.subscribed })
    },

    onLongPress() {
      const item = this.data.item
      const pinText = item.pinned ? '取消置顶' : '置顶'
      const subscribeText = item.subscribed ? '取消订阅提醒' : '订阅提醒'
      const actions = [pinText, subscribeText]
      if (!item.isPreset) {
        actions.push('删除')
      }
      wx.showActionSheet({
        itemList: actions,
        success: (res) => {
          if (actions[res.tapIndex] === pinText) {
            this.triggerEvent('pin', { key: item.isPreset ? item.name : item.id, pinned: !item.pinned })
          } else if (actions[res.tapIndex] === subscribeText) {
            const itemId = item.isPreset ? item.name : item.id
            this.triggerEvent('subscribe', { id: itemId, subscribed: item.subscribed })
          } else if (actions[res.tapIndex] === '删除') {
            this.triggerEvent('delete', { id: item.id })
          }
        }
      })
    }
  }
})
