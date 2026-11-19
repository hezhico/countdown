const TEMP_DIR = `${wx.env.USER_DATA_PATH}/puzzle-temp`
const MANIFEST_KEY = 'puzzle_temp_v2'

Page({
  data: {
    presets: [
      { key: '1x2', rows: 1, cols: 2, label: '1×2' },
      { key: '2x2', rows: 2, cols: 2, label: '2×2' },
      { key: '3x3', rows: 3, cols: 3, label: '3×3' }
    ],
    layoutKey: '2x2',
    rows: 2,
    cols: 2,
    need: 4,             // 当前版式格数 = rows * cols
    filled: 0,           // 已放入照片的格数
    pickLabel: '选择照片',
    cells: [],           // 每个格子：{ id, src, rot }，数组下标即格子位置
    boardW: 320,
    cellPx: 150,
    gap: 8,
    dragging: -1,        // 正在拖动的格子下标
    targetIdx: -1,       // 拖动落点目标格
    dragSrc: '',
    dragRot: 0,
    ghostX: 0,
    ghostY: 0,
    selected: -1,        // 选中的格子（底部旋转工具条的操作对象）
    resultPath: ''       // 合成结果临时路径
  },

  onLoad() {
    const saved = wx.getStorageSync(MANIFEST_KEY)
    if (!saved) {
      this.setData({ cells: this.buildCells([], this.data.need) })
      return
    }
    const need = saved.rows * saved.cols
    const cells = saved.cells.length == need ? saved.cells : this.buildCells(saved.cells, need)
    const filled = this.filledCount(cells)
    this.setData({
      rows: saved.rows,
      cols: saved.cols,
      layoutKey: saved.layoutKey,
      need,
      cells,
      filled,
      pickLabel: this.photoBtnLabel(filled, need)
    })
  },

  onReady() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    // 页面左右留白 24rpx + 拼图卡片左右内边距 24rpx
    this.padPx = (info.windowWidth * 24) / 750
    this.cardPad = (info.windowWidth * 24) / 750
    this.applyLayout(this.data.rows, this.data.cols)
  },

  buildCells(list, need) {
    const cells = []
    for (let i = 0; i < need; i++) {
      const item = list[i]
      cells.push({ id: i, src: item ? item.src : '', rot: item ? item.rot : 0 })
    }
    return cells
  },

  filledCount(cells) {
    let n = 0
    cells.forEach((c) => { if (c.src) n++ })
    return n
  },

  applyLayout(rows, cols) {
    const gap = 8
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const avail = info.windowWidth - 2 * this.padPx - 2 * this.cardPad
    const cellPx = Math.floor((avail - (cols - 1) * gap) / cols)
    this.cols = cols
    this.rows = rows
    this.gap = gap
    this.cellPx = cellPx
    this.boardW = cellPx * cols + gap * (cols - 1)
    this.setData({ boardW: this.boardW, cellPx, gap })
  },

  photoBtnLabel(filled, need) {
    if (filled == 0) return '选择照片'
    if (filled < need) return `继续选图 ${filled}/${need}`
    return '重新选图'
  },

  // ===== 本地临时文件 =====
  saveManifest() {
    wx.setStorageSync(MANIFEST_KEY, {
      rows: this.data.rows,
      cols: this.data.cols,
      layoutKey: this.data.layoutKey,
      cells: this.data.cells
    })
  },

  saveTempFiles(paths) {
    const fs = wx.getFileSystemManager()
    try {
      fs.accessSync(TEMP_DIR)
    } catch (err) {
      fs.mkdirSync(TEMP_DIR, true)
    }
    this._seq = this._seq || 0
    return Promise.all(paths.map((p) => new Promise((resolve, reject) => {
      const ext = p.slice(p.lastIndexOf('.'))
      const dest = `${TEMP_DIR}/${Date.now()}_${this._seq++}${ext}`
      fs.copyFile({
        srcPath: p,
        destPath: dest,
        success: () => resolve(dest),
        fail: reject
      })
    })))
  },

  deleteTempFiles(paths) {
    if (!paths.length) return
    const fs = wx.getFileSystemManager()
    let finished = 0
    let failed = 0
    paths.forEach((p) => {
      fs.unlink({
        filePath: p,
        fail: (err) => {
          failed++
          console.error('临时文件删除失败', p, err)
        },
        complete: () => {
          finished++
          if (finished == paths.length && failed) {
            wx.showToast({ title: `${failed} 张临时图片删除失败`, icon: 'none' })
          }
        }
      })
    })
  },

  // ===== 版式 =====
  applyGrid(rows, cols, key) {
    const need = rows * cols
    const kept = this.data.cells.slice(0, need)
    const removed = this.data.cells.slice(need).filter((c) => c.src).map((c) => c.src)
    const cells = this.buildCells(kept, need)
    const filled = this.filledCount(cells)
    this.applyLayout(rows, cols)
    this.setData({
      rows,
      cols,
      need,
      layoutKey: key,
      cells,
      filled,
      pickLabel: this.photoBtnLabel(filled, need),
      resultPath: '',
      selected: -1,
      dragging: -1,
      targetIdx: -1
    })
    if (removed.length) {
      this.deleteTempFiles(removed)
      wx.showToast({ title: '格数变少，已移除多出的照片', icon: 'none' })
    }
    this.saveManifest()
  },

  onPickLayout(e) {
    const rows = Number(e.currentTarget.dataset.rows)
    const cols = Number(e.currentTarget.dataset.cols)
    const key = e.currentTarget.dataset.key
    if (key == this.data.layoutKey) return
    this.applyGrid(rows, cols, key)
  },

  onPickCustom() {
    if (this.data.layoutKey == 'custom') return
    this.setData({ layoutKey: 'custom' })
    this.saveManifest()
  },

  onGridStep(e) {
    const field = e.currentTarget.dataset.field
    const step = Number(e.currentTarget.dataset.step)
    const next = this.data[field] + step
    if (next < 1 || next > 5) return
    const rows = field == 'rows' ? next : this.data.rows
    const cols = field == 'cols' ? next : this.data.cols
    this.applyGrid(rows, cols, 'custom')
  },

  // ===== 选图 =====
  choosePhotos() {
    const need = this.data.need
    const replacing = this.data.filled >= need
    wx.chooseMedia({
      // chooseMedia 单次最多 9 张：重新选图按整版格数取，补选按剩余空格数取
      count: Math.min(9, replacing ? need : need - this.data.filled),
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: async (res) => {
        const picked = res.tempFiles.map((f) => f.tempFilePath)
        let saved
        try {
          saved = await this.saveTempFiles(picked)
        } catch (err) {
          console.error('照片保存到本地失败', err)
          wx.showModal({ title: '照片保存失败', content: err.errMsg, showCancel: false })
          return
        }
        let cells = this.data.cells
        if (replacing) {
          this.deleteTempFiles(cells.filter((c) => c.src).map((c) => c.src))
          cells = this.buildCells([], need)
        }
        cells = cells.map((c) => ({ id: c.id, src: c.src, rot: c.rot }))
        let k = 0
        for (let i = 0; i < cells.length && k < saved.length; i++) {
          if (!cells[i].src) {
            cells[i].src = saved[k]
            cells[i].rot = 0
            k++
          }
        }
        const filled = this.filledCount(cells)
        this.setData({
          cells,
          filled,
          resultPath: '',
          selected: -1,
          pickLabel: this.photoBtnLabel(filled, need)
        })
        this.saveManifest()
      }
    })
  },

  // ===== 旋转 =====
  onRotate(e) {
    const selected = this.data.selected
    if (selected < 0) return
    const step = Number(e.currentTarget.dataset.step)
    const cells = this.data.cells.map((c) => ({ id: c.id, src: c.src, rot: c.rot }))
    cells[selected].rot = (cells[selected].rot + step + 360) % 360
    this.setData({ cells })
    this.saveManifest()
  },

  onClearSelect() {
    this.setData({ selected: -1 })
  },

  // ===== 拖动 / 点击选中 =====
  onTouchStart(e) {
    const idx = e.currentTarget.dataset.idx
    if (!this.data.cells[idx].src) {
      // 空格直接作为选图入口
      this._emptyIdx = idx
      return
    }
    this._emptyIdx = null
    const t = e.touches[0]
    this._pending = idx
    this._startX = t.clientX
    this._startY = t.clientY
    this._dragging = false
    wx.createSelectorQuery().in(this).select('#board').boundingClientRect((rect) => {
      this._boardRect = rect
    }).exec()
  },

  onTouchMove(e) {
    if (this._pending == null) return
    const t = e.touches[0]
    const dx = t.clientX - this._startX
    const dy = t.clientY - this._startY
    if (!this._dragging) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        this._dragging = true
        const cell = this.data.cells[this._pending]
        this.setData({
          dragging: this._pending,
          dragSrc: cell.src,
          dragRot: cell.rot,
          ghostX: t.clientX,
          ghostY: t.clientY
        })
      } else {
        return
      }
    }
    const target = this.computeTarget(t.clientX, t.clientY)
    this.setData({ ghostX: t.clientX, ghostY: t.clientY, targetIdx: target })
  },

  onTouchEnd() {
    if (this._emptyIdx != null) {
      this._emptyIdx = null
      this.choosePhotos()
      return
    }
    const pending = this._pending
    if (pending == null) return
    if (this._dragging) {
      const from = this.data.dragging
      const to = this.data.targetIdx
      if (to >= 0 && to != from) this.swapCells(from, to)
      this.setData({ dragging: -1, targetIdx: -1, dragSrc: '' })
    } else {
      this.setData({ selected: this.data.selected == pending ? -1 : pending })
    }
    this._pending = null
    this._dragging = false
  },

  swapCells(from, to) {
    const cells = this.data.cells.map((c) => ({ id: c.id, src: c.src, rot: c.rot }))
    const tmp = cells[from]
    cells[from] = { id: cells[from].id, src: cells[to].src, rot: cells[to].rot }
    cells[to] = { id: cells[to].id, src: tmp.src, rot: tmp.rot }
    this.setData({ cells })
    this.saveManifest()
  },

  computeTarget(x, y) {
    const r = this._boardRect
    if (!r) return -1
    const gap = this.gap
    const cell = this.cellPx
    const cols = this.cols
    const rows = this.rows
    const ox = r.left
    const oy = r.top
    const step = cell + gap
    let col = Math.floor((x - ox) / step)
    let row = Math.floor((y - oy) / step)
    if (col < 0) col = 0
    if (col > cols - 1) col = cols - 1
    if (row < 0) row = 0
    if (row > rows - 1) row = rows - 1
    return row * cols + col
  },

  // ===== 合成与导出 =====
  compose() {
    const need = this.data.need
    if (this.data.filled < need) {
      wx.showToast({ title: `还需选 ${need - this.data.filled} 张`, icon: 'none' })
      return
    }
    wx.showLoading({ title: '生成中' })
    // 先量取屏幕上棋盘的真实尺寸/比例，做到所见即所得
    wx.createSelectorQuery().in(this).select('#board').boundingClientRect((rect) => {
      if (!rect || !rect.width) {
        wx.hideLoading()
        wx.showToast({ title: '生成失败', icon: 'none' })
        return
      }
      wx.createSelectorQuery().in(this).select('#compose').fields({ node: true }).exec((res) => {
        if (!res[0] || !res[0].node) {
          wx.hideLoading()
          wx.showToast({ title: '生成失败', icon: 'none' })
          return
        }
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
        const gap = this.gap       // 屏幕 CSS px
        const cell = this.cellPx   // 屏幕 CSS px
        const cols = this.cols
        const cells = this.data.cells
        const count = cells.length
        const radiusCss = 12 * info.windowWidth / 750 // 与屏幕 .cell 的 12rpx 圆角一致

        // 按屏幕棋盘实际比例输出，长边固定 1080 —— 形状/间隙都和屏幕一致
        const scaleUp = 1080 / Math.max(rect.width, rect.height)
        const bw = Math.round(rect.width * scaleUp)
        const bh = Math.round(rect.height * scaleUp)
        const gapP = gap * scaleUp
        const cellP = cell * scaleUp
        const radius = radiusCss * scaleUp

        canvas.width = bw
        canvas.height = bh
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, bw, bh)

        let done = 0
        const checkDone = () => {
          done++
          if (done == count) this.finishCompose(canvas)
        }

        const drawCell = (i) => {
          const img = canvas.createImage()
          const r = Math.floor(i / cols)
          const c = i % cols
          const dx = c * (cellP + gapP)
          const dy = r * (cellP + gapP)
          const rot = cells[i].rot * Math.PI / 180
          img.onload = () => {
            ctx.save()
            this.roundRect(ctx, dx, dy, cellP, cellP, radius)
            ctx.clip()
            const iw = img.width
            const ih = img.height
            // cover：取与格子同比例（正方形）的源区域居中裁切，避免变形
            const s = Math.max(cellP / iw, cellP / ih)
            const sSize = cellP / s
            const sx = (iw - sSize) / 2
            const sy = (ih - sSize) / 2
            // 以格子中心为轴旋转，正方形旋转后仍完全覆盖格子
            ctx.translate(dx + cellP / 2, dy + cellP / 2)
            ctx.rotate(rot)
            ctx.drawImage(img, sx, sy, sSize, sSize, -cellP / 2, -cellP / 2, cellP, cellP)
            ctx.restore()
            checkDone()
          }
          img.onerror = checkDone
          img.src = cells[i].src
        }

        for (let i = 0; i < count; i++) {
          drawCell(i)
        }
      })
    }).exec()
  },

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  },

  finishCompose(canvas) {
    wx.canvasToTempFilePath({
      canvas,
      success: (r) => {
        this.setData({ resultPath: r.tempFilePath })
        wx.hideLoading()
        wx.showToast({ title: '已生成', icon: 'success' })
        this.askClearTempFiles()
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '生成失败', icon: 'none' })
      }
    })
  },

  askClearTempFiles() {
    wx.showModal({
      title: '本地临时图片',
      content: '拼图已生成，是否删除本地临时图片？删除后需重新选图。',
      confirmText: '删除',
      cancelText: '保留',
      success: (m) => {
        if (!m.confirm) return
        this.deleteTempFiles(this.data.cells.filter((c) => c.src).map((c) => c.src))
        const cells = this.buildCells([], this.data.need)
        this.setData({
          cells,
          filled: 0,
          selected: -1,
          pickLabel: this.photoBtnLabel(0, this.data.need)
        })
        wx.removeStorageSync(MANIFEST_KEY)
      }
    })
  },

  saveToAlbum() {
    const p = this.data.resultPath
    if (!p) {
      wx.showToast({ title: '请先生成', icon: 'none' })
      return
    }
    wx.saveImageToPhotosAlbum({
      filePath: p,
      success: () => wx.showToast({ title: '已保存到相册' }),
      fail: (err) => {
        if (/auth|deny|authorize/i.test(err.errMsg || '')) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册权限',
            confirmText: '去设置',
            success: (m) => { if (m.confirm) wx.openSetting() }
          })
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    })
  },

  onShare() {
    const p = this.data.resultPath
    if (!p) {
      wx.showToast({ title: '请先生成', icon: 'none' })
      return
    }
    wx.showShareImageMenu({
      path: p,
      fail: () => wx.showToast({ title: '已取消', icon: 'none' })
    })
  }
})
