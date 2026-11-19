Page({
  data: {
    // 功能入口：新增功能只需在此追加一项
    features: [
      {
        id: 'countdown',
        name: '倒计时',
        desc: '记录每一个重要时刻',
        icon: '⏳',
        bg: 'linear-gradient(135deg, #FF6B35, #FFA559)',
        url: '/pages/countdown/countdown'
      },
      {
        id: 'poetry',
        name: '诗词',
        desc: '赏读经典，繁简随心',
        icon: '📜',
        bg: 'linear-gradient(135deg, #6A5ACD, #9D8DF1)',
        url: '/pages/poetry/poetry'
      },
      {
        id: 'hanzi',
        name: '汉字拼音',
        desc: '翻卡测验，轻松记拼音',
        icon: '🔤',
        bg: 'linear-gradient(135deg, #FF6B35, #FFA559)',
        url: '/pages/hanzi/hanzi'
      },
      {
        id: 'puzzle',
        name: '拼图',
        desc: '多图拼成一张，随手分享',
        icon: '🧩',
        bg: 'linear-gradient(135deg, #FF6B35, #FFA559)',
        url: '/pages/puzzle/puzzle'
      },
      {
        id: 'salary',
        name: '上班摸鱼器',
        desc: '看看今天已经赚了多少',
        icon: '💰',
        bg: 'linear-gradient(135deg, #1890FF, #69C0FF)',
        url: '/pages/salary/salary'
      }
    ],
    statusBarHeight: 20,
    navBarHeight: 44
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      navBarHeight: 44
    })
  },

  onOpenFeature(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.navigateTo({ url })
  }
})
