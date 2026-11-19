/**
 * 诗词数据加载器
 * 统一聚合 utils 下的多个诗词数据源，将不同格式归一化为 { title, author, content: [] } 结构。
 *
 * JSON 原始文件已转为 .js 模块，存放在 utils/poetry_data/（纯英文路径），
 * 以绕开微信小程序 require 对中文路径的限制。
 */

/* 繁体 -> 简体 转换（基于 chinese-conv / 新同文堂, MIT License） */
var sifyLib = require('./trad2simp.js')
var sify = sifyLib.sify

/* 繁简转换开关：默认 true（显示简体） */
var SIMPLIFY = true

function setSimplify(v) { SIMPLIFY = !!v }
function getSimplify() { return SIMPLIFY }

/* 将一首诗词的标题/作者/正文统一转为简体 */
function simplifyPoem(p) {
  if (!p) return p
  var out = {}
  for (var k in p) {
    if (!Object.prototype.hasOwnProperty.call(p, k)) continue
    var v = p[k]
    if (k === 'content' && Array.isArray(v)) out[k] = v.map(function(line) { return sify(line) })
    else if (typeof v === 'string') out[k] = sify(v)
    else out[k] = v
  }
  return out
}

/* ---------- 格式归一化 ---------- */

function normTang(raw) {
  return (raw || []).map(function(p) {
    return { title: p.title || '佚题', author: p.author || '', content: p.paragraphs || [], tags: p.tags || [] }
  })
}

function normCi(raw) {
  return (raw || []).map(function(p) {
    return { title: (p.rhythmic ? p.rhythmic + '·' : '') + (p.title || '佚题'), author: p.author || '', content: p.paragraphs || [], rhythmic: p.rhythmic || '' }
  })
}

function normShijing(raw) {
  return (raw || []).map(function(p) { return { title: p.title || '', author: (p.chapter ? p.chapter + '·' : '') + (p.section || ''), content: p.content || [] } })
}

function normNalan(raw) {
  return (raw || []).map(function(p) { return { title: p.title || '', author: p.author || '', content: p.para || [] } })
}

function normChuci(raw) {
  return (raw || []).map(function(p) { return { title: p.title || '', author: p.author || '', content: p.content || [] } })
}

function normCaocao(raw) {
  return (raw || []).map(function(p) { return { title: p.title || '', author: '曹操', content: p.paragraphs || [] } })
}

function normShuimo(raw) {
  return (raw || []).map(function(p) { return { title: p.title || '', author: p.author || '', content: p.paragraphs || [], prologue: p.prologue || '' } })
}

function normYoumeng(raw) {
  return (raw || []).map(function(p, i) {
    return { title: '幽梦影 · 其' + (i + 1), author: '', content: [p.content].concat((p.comment || []).map(function(c) { return '〔评〕' + c })) }
  })
}

function normLunyu(raw) {
  return (raw || []).map(function(p) { return { title: p.chapter || '', author: '孔子及其弟子', content: p.paragraphs || [] } })
}

function normMengxue(raw) {
  if (!raw) return []
  if (Array.isArray(raw.paragraphs)) return [{ title: raw.title || '', author: raw.author || '', content: raw.paragraphs }]
  if (Array.isArray(raw.content)) return raw.content.map(function(ch) { return { title: (raw.title || '') + (ch.chapter ? '·' + ch.chapter : ''), author: raw.author || '', content: ch.paragraphs || [] } })
  return []
}

function normQianjiashi(raw) {
  if (!raw || !Array.isArray(raw.content)) return []
  var list = []
  raw.content.forEach(function(tb) { var tn = tb.type || ''; (tb.content || []).forEach(function(p) { list.push({ title: (p.chapter || '') + (tn ? '（' + tn + '）' : ''), author: p.author || '', content: p.paragraphs || [] }) }) })
  return list
}

/* ---------- 分类 ---------- */

var CATEGORIES = [
  { key: 'tang', name: '唐诗', desc: '唐诗三百首' },
  { key: 'ci', name: '宋词', desc: '宋词三百首' },
  { key: 'shijing', name: '诗经', desc: '中国最早诗歌总集' },
  { key: 'chuci', name: '楚辞', desc: '屈原等辞赋' },
  { key: 'nalan', name: '纳兰词', desc: '纳兰性德' },
  { key: 'caocao', name: '曹操诗', desc: '魏武帝诗集' },
  { key: 'shuimo', name: '水墨唐诗', desc: '唐诗鉴赏' },
  { key: 'youmeng', name: '幽梦影', desc: '张潮随笔' },
  { key: 'lunyu', name: '论语', desc: '孔子语录' },
  { key: 'mengxue', name: '蒙学', desc: '三字经·千字文等' }
]

/* ---------- 加载（require 纯英文路径） ---------- */

var BASE = './poetry_data/'

function loadRaw(key) {
  switch (key) {
    case 'tang':   return require(BASE + 'tang300')
    case 'ci':     return require(BASE + 'ci300')
    case 'shijing':return require(BASE + 'shijing')
    case 'chuci':  return require(BASE + 'chuci')
    case 'nalan':  return require(BASE + 'nalan')
    case 'caocao': return require(BASE + 'caocao')
    case 'shuimo': return require(BASE + 'shuimo')
    case 'youmeng': return require(BASE + 'youmeng')
    case 'lunyu':  return require(BASE + 'lunyu')
    case 'mengxue': {
      var list = []
      list.push(...normMengxue(require(BASE + 'sanzijing')))
      list.push(...normMengxue(require(BASE + 'qianziwen')))
      list.push(...normMengxue(require(BASE + 'baijiaxing')))
      list.push(...normMengxue(require(BASE + 'dizigui')))
      list.push(...normMengxue(require(BASE + 'zengguang')))
      list.push(...normQianjiashi(require(BASE + 'qianjiashi')))
      return list
    }
    default: return []
  }
}

function normByKey(key, raw) {
  switch (key) {
    case 'tang': return normTang(raw); case 'ci': return normCi(raw)
    case 'shijing': return normShijing(raw); case 'chuci': return normChuci(raw)
    case 'nalan': return normNalan(raw); case 'caocao': return normCaocao(raw)
    case 'shuimo': return normShuimo(raw); case 'youmeng': return normYoumeng(raw)
    case 'lunyu': return normLunyu(raw); case 'mengxue': return raw
    default: return []
  }
}

var _cache = {}

function getCategories() { return CATEGORIES.map(function(c) { return { key: c.key, name: c.name, desc: c.desc } }) }

function getPoems(key) {
  if (!_cache[key]) _cache[key] = normByKey(key, loadRaw(key))
  var raw = _cache[key]
  return SIMPLIFY ? raw.map(simplifyPoem) : raw
}

function getRandomPoem(key) { var l = getPoems(key); return l.length ? l[Math.floor(Math.random() * l.length)] : null }

module.exports = {
  getCategories: getCategories,
  getPoems: getPoems,
  getRandomPoem: getRandomPoem,
  setSimplify: setSimplify,
  getSimplify: getSimplify
}
