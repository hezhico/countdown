/**
 * 汉字拼音加载器
 * 聚合 utils/hanzi_data/common.js，归一化并提供分类、取字、随机、搜索、测验选项等方法。
 */
var data = require('./hanzi_data/common.js')

/* 内存缓存：扁平化全部字 */
var _allChars = null

function getAllChars() {
  if (_allChars) return _allChars
  var list = []
  ;(data.categories || []).forEach(function(cat) {
    ;(cat.chars || []).forEach(function(c) {
      list.push(c)
    })
  })
  _allChars = list
  return list
}

/* 分类列表：[{ key, name, count }] */
function getCategories() {
  return (data.categories || []).map(function(cat) {
    return { key: cat.key, name: cat.name, count: (cat.chars || []).length }
  })
}

/* 某年级字数组 */
function getChars(key) {
  var cat = (data.categories || []).filter(function(c) { return c.key === key })[0]
  return cat ? (cat.chars || []) : []
}

/* 跨年级随机取 n 个字 */
function getRandom(n) {
  var all = getAllChars()
  var pool = all.slice()
  var out = []
  var count = Math.min(n || 1, pool.length)
  for (var i = 0; i < count; i++) {
    var idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

/* 模糊检索：按汉字 / 拼音 / 释义 */
function search(kw) {
  kw = (kw || '').trim().toLowerCase()
  if (!kw) return getAllChars()
  return getAllChars().filter(function(c) {
    return (c.char && c.char.indexOf(kw) > -1) ||
      (c.pinyin && c.pinyin.toLowerCase().indexOf(kw) > -1) ||
      (c.meaning && c.meaning.indexOf(kw) > -1)
  })
}

/* 提取声母（粗略：取首字母音节首段） */
function getInitial(pinyin) {
  if (!pinyin) return ''
  var m = pinyin.match(/^([bpmfdtnlgkhjqxzcsrwy]|zh|ch|sh)/i)
  return m ? m[1].toLowerCase() : ''
}

/* 生成测验选项：1 正确 + 3 干扰，已打乱 */
function genOptions(char) {
  if (!char) return []
  var all = getAllChars().filter(function(c) { return c.char !== char.char })
  var correct = char.pinyin
  var distractors = []

  function pushDistractor(c) {
    if (c.pinyin !== correct && distractors.indexOf(c.pinyin) === -1) {
      distractors.push(c.pinyin)
    }
  }

  // 优先同声调
  all.forEach(function(c) { if (distractors.length < 3 && c.tone === char.tone) pushDistractor(c) })
  // 其次同声母
  if (distractors.length < 3) {
    var ini = getInitial(char.pinyin)
    all.forEach(function(c) { if (distractors.length < 3 && getInitial(c.pinyin) === ini) pushDistractor(c) })
  }
  // 退回随机
  while (distractors.length < 3 && all.length) {
    var idx = Math.floor(Math.random() * all.length)
    var cand = all[idx]
    all.splice(idx, 1)
    pushDistractor(cand)
  }

  var options = [{ text: correct, correct: true }]
  distractors.forEach(function(p) { options.push({ text: p, correct: false }) })

  // Fisher–Yates 打乱
  for (var i = options.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var t = options[i]; options[i] = options[j]; options[j] = t
  }
  return options
}

module.exports = {
  getAllChars: getAllChars,
  getCategories: getCategories,
  getChars: getChars,
  getRandom: getRandom,
  search: search,
  genOptions: genOptions
}
