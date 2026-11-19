const poetry = require('../../utils/poetry.js')

const THEMES = ['day', 'eye', 'night']
const FONTS = [34, 40, 46, 52]

Page({
  data: {
    categories: [],
    activeKey: 'tang',
    poems: [],
    keyword: '',
    filtered: [],
    showDetail: false,
    detail: null,
    detailIndex: -1,
    theme: 'day',
    fontSize: 40,
    simplify: true,
    showSettings: false
  },

  onLoad() {
    const stored = wx.getStorageSync('poetry_simplify')
    const simp = (stored === '' || stored == null) ? true : !!stored
    poetry.setSimplify(simp)
    this.setData({
      categories: poetry.getCategories(),
      simplify: simp
    })
    this.loadCategory('tang')
  },

  onToggleConv() {
    const ns = !this.data.simplify
    poetry.setSimplify(ns)
    wx.setStorageSync('poetry_simplify', ns)
    this.setData({ simplify: ns })
    this.loadCategory(this.data.activeKey)
    if (this.data.showDetail) this.openDetailByIndex(this.data.detailIndex)
  },

  loadCategory(key) {
    const poems = poetry.getPoems(key)
    this.setData({ activeKey: key, poems, keyword: '', filtered: poems })
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  },

  onCategoryTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.activeKey) return
    this.loadCategory(key)
  },

  onSearch(e) {
    const kw = (e.detail.value || '').trim()
    this.setData({ keyword: kw })
    this.applyFilter(kw)
  },

  applyFilter(kw) {
    const { poems } = this.data
    if (!kw) {
      this.setData({ filtered: poems })
      return
    }
    const filtered = poems.filter(p =>
      (p.title && p.title.indexOf(kw) > -1) ||
      (p.author && p.author.indexOf(kw) > -1)
    )
    this.setData({ filtered })
  },

  openDetailByIndex(index) {
    const detail = this.data.filtered[index]
    if (!detail) return
    this.setData({ showDetail: true, detail, detailIndex: index })
  },

  onOpenDetail(e) {
    this.openDetailByIndex(Number(e.currentTarget.dataset.index))
  },

  onCloseDetail() {
    this.setData({ showDetail: false })
  },

  onRandom() {
    const { filtered } = this.data
    if (!filtered.length) {
      wx.showToast({ title: '暂无数据', icon: 'none' })
      return
    }
    const index = Math.floor(Math.random() * filtered.length)
    this.openDetailByIndex(index)
  },

  _change(delta) {
    const { detailIndex, filtered } = this.data
    if (!filtered.length) return
    let ni = detailIndex + delta
    if (ni < 0) ni = filtered.length - 1
    if (ni >= filtered.length) ni = 0
    this.setData({ detailIndex: ni, detail: filtered[ni] })
  },

  onPrev() { this._change(-1) },
  onNext() { this._change(1) },

  onToggleSettings() {
    this.setData({ showSettings: !this.data.showSettings })
  },

  onToggleTheme() {
    const i = THEMES.indexOf(this.data.theme)
    this.setData({ theme: THEMES[(i + 1) % THEMES.length], showSettings: false })
  },

  onCycleFont() {
    const i = FONTS.indexOf(this.data.fontSize)
    this.setData({ fontSize: FONTS[(i + 1) % FONTS.length], showSettings: false })
  },

  onReaderTouchStart(e) {
    this._sx = e.touches[0].clientX
    this._sy = e.touches[0].clientY
  },

  onReaderTouchEnd(e) {
    if (this._sx == null) return
    const dx = e.changedTouches[0].clientX - this._sx
    const dy = e.changedTouches[0].clientY - this._sy
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) this._change(1)
      else this._change(-1)
    }
    this._sx = null
  },

  noop() {}
})
