var hanzi = require('../../utils/hanzi.js')

// 答对时的“彩虹屁”
var PRAISES = [
  '太厉害了！拼音小天才就是你！',
  '完美！这道题被你轻松拿下～',
  '哇哦，答得又快又准！',
  '棒棒哒！你离拼音大师又近一步！',
  '就是这么稳！继续保持！',
  '聪明绝顶，这题根本难不倒你！',
  '满分气质，稳如老狗（褒义）！',
  '这手感，天生学拼音的料！'
]

// 答错时的鼓励话
var ENCOURAGES = [
  '没关系，记错一次就牢牢记住啦～',
  '别灰心，下一道你一定行！',
  '差一点点，再接再厉哦！',
  '失误是好事，说明还能再进步！',
  '慢慢来，拼音就是要多练多读～',
  '没关系，大家都是错着错着就会了！',
  '稳住，这道题先混个脸熟就行！',
  '不慌，拼音小火车迟早进站！'
]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    mode: 'browse',

    // 浏览
    categories: [],
    activeKey: '',
    chars: [],
    keyword: '',
    filtered: [],
    showDetail: false,
    detail: null,

    // 卡片
    cardChars: [],
    cardIndex: 0,
    flipped: false,
    cardChar: '',
    cardPinyin: '',
    cardMeaning: '',
    cardTotal: 0,

    // 测验
    quizTotal: 10,
    quizCurrent: null,
    quizOptions: [],
    quizSelected: -1,
    quizAnswered: false,
    quizSelectedCorrect: false,
    quizScore: 0,
    quizDone: 0,
    quizMsg: '',
    quizMsgShow: false
  },

  onLoad() {
    var sysInfo = wx.getSystemInfoSync()
    var categories = hanzi.getCategories()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      navBarHeight: 44,
      categories: categories
    })
    if (categories.length) this.loadCategory(categories[0].key)
  },

  /* ============ 模式切换 ============ */
  onSwitchMode(e) {
    var mode = e.currentTarget.dataset.mode
    if (mode === this.data.mode) return
    var patch = { mode: mode }
    if (mode === 'card' && this.data.cardTotal === 0) {
      this.startCard()
    } else if (mode === 'quiz' && !this.data.quizCurrent) {
      this.startQuiz()
    }
    this.setData(patch)
  },

  /* ============ 浏览模式 ============ */
  loadCategory(key) {
    var chars = hanzi.getChars(key)
    this.setData({ activeKey: key, chars: chars, keyword: '', filtered: chars })
  },

  onCategoryTap(e) {
    var key = e.currentTarget.dataset.key
    if (key === this.data.activeKey) return
    this.loadCategory(key)
  },

  onSearch(e) {
    var kw = (e.detail.value || '').trim()
    this.setData({ keyword: kw })
    var filtered = kw ? hanzi.search(kw) : this.data.chars
    this.setData({ filtered: filtered })
  },

  openDetail(e) {
    var index = Number(e.currentTarget.dataset.index)
    var detail = this.data.filtered[index]
    if (!detail) return
    this.setData({ showDetail: true, detail: detail })
  },

  closeDetail() {
    this.setData({ showDetail: false })
  },

  /* ============ 卡片模式 ============ */
  startCard() {
    var chars = hanzi.getAllChars()
    this.setData({
      cardChars: chars,
      cardTotal: chars.length,
      cardIndex: 0,
      flipped: false
    })
    this.renderCard(0)
  },

  renderCard(index) {
    var c = this.data.cardChars[index]
    if (!c) return
    this.setData({
      cardChar: c.char,
      cardPinyin: c.pinyin,
      cardMeaning: c.meaning
    })
  },

  onCardTap() {
    this.setData({ flipped: !this.data.flipped })
  },

  onCardPrev() {
    var i = this.data.cardIndex - 1
    if (i < 0) i = this.data.cardTotal - 1
    this.setData({ cardIndex: i, flipped: false })
    this.renderCard(i)
  },

  onCardNext() {
    var i = this.data.cardIndex + 1
    if (i >= this.data.cardTotal) i = 0
    this.setData({ cardIndex: i, flipped: false })
    this.renderCard(i)
  },

  onCardRandom() {
    if (!this.data.cardTotal) return
    var i = Math.floor(Math.random() * this.data.cardTotal)
    this.setData({ cardIndex: i, flipped: false })
    this.renderCard(i)
  },

  /* ============ 测验模式 ============ */
  startQuiz() {
    this.setData({
      quizTotal: 10,
      quizScore: 0,
      quizDone: 0,
      quizCurrent: null,
      quizOptions: [],
      quizSelected: -1,
      quizAnswered: false,
      quizMsg: ''
    })
    this.nextQuiz()
  },

  nextQuiz() {
    if (this.quizMsgTimer) { clearTimeout(this.quizMsgTimer); this.quizMsgTimer = null }
    if (this.data.quizDone >= this.data.quizTotal) {
      wx.showModal({
        title: '闯关完成',
        content: '本次得分 ' + this.data.quizScore + ' / ' + this.data.quizTotal,
        showCancel: false,
        confirmText: '再来一局',
        success: () => this.startQuiz()
      })
      return
    }
    var current = hanzi.getRandom(1)[0]
    var options = hanzi.genOptions(current)
    this.setData({
      quizCurrent: current,
      quizOptions: options,
      quizSelected: -1,
      quizAnswered: false,
      quizSelectedCorrect: false,
      quizMsgShow: false
    })
  },

  onQuizOption(e) {
    if (this.data.quizAnswered) return
    var index = Number(e.currentTarget.dataset.index)
    var item = this.data.quizOptions[index]
    var correct = !!item.correct
    var score = this.data.quizScore + (correct ? 1 : 0)
    wx.vibrateShort && wx.vibrateShort({ type: correct ? 'light' : 'medium' })
    if (this.quizMsgTimer) clearTimeout(this.quizMsgTimer)
    this.setData({
      quizSelected: index,
      quizAnswered: true,
      quizSelectedCorrect: correct,
      quizScore: score,
      quizDone: this.data.quizDone + 1,
      quizMsg: correct ? pick(PRAISES) : pick(ENCOURAGES),
      quizMsgShow: true
    })
    var self = this
    this.quizMsgTimer = setTimeout(function () {
      self.setData({ quizMsgShow: false })
    }, 1800)
  },

  noop() {}
})
