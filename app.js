App({
  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'prod-d1giavvri4d984634',
        traceUser: true
      })
    }
  },
  globalData: {
    currentYear: new Date().getFullYear()
  }
})
