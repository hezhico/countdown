/**
 * 通用工具函数
 */

const { lunarToSolar, formatLunarDate } = require('./lunar.js')

/**
 * 计算两个日期之间的天数差
 * @param {string} dateStr 日期字符串 YYYY-MM-DD
 * @returns {number} 正数表示未来，负数表示已过，0表示今天
 */
function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * 格式化日期为中文格式
 * @param {string} dateStr YYYY-MM-DD
 * @returns {string} X月X日
 */
function formatDateCN(dateStr) {
  const parts = dateStr.split('-')
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  return `${month}月${day}日`
}

/**
 * 格式化日期为星期几
 * @param {string} dateStr YYYY-MM-DD
 * @returns {string} 星期X
 */
function getWeekDay(dateStr) {
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const date = new Date(dateStr + 'T00:00:00')
  return '星期' + weekDays[date.getDay()]
}

/**
 * 获取今天的日期字符串
 * @returns {string} YYYY-MM-DD
 */
function getTodayStr() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 生成本地存储Key
 */
const STORAGE_KEY = 'custom_countdowns'
const PINNED_KEY = 'pinned_ids'

/**
 * 读取自定义倒计时列表
 * @returns {Array}
 */
function loadCustomCountdowns() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

/**
 * 保存自定义倒计时列表
 * @param {Array} list
 */
function saveCustomCountdowns(list) {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('保存失败', e)
  }
}

/**
 * 添加自定义倒计时
 * @param {object} item { name, date, color }
 */
function addCustomCountdown(item) {
  const list = loadCustomCountdowns()
  item.id = Date.now().toString()
  item.isPreset = false
  item.icon = '📌'
  list.push(item)
  saveCustomCountdowns(list)
  return list
}

/**
 * 删除自定义倒计时
 * @param {string} id
 */
function removeCustomCountdown(id) {
  let list = loadCustomCountdowns()
  list = list.filter(item => item.id !== id)
  saveCustomCountdowns(list)
  return list
}

/**
 * 合并预置节日和自定义倒计时，并按日期排序
 * @param {Array} holidays 预置节日列表
 * @param {Array} customs 自定义倒计时列表
 * @returns {Array} 合并后的列表，每项增加 days 字段
 */
function mergeAndSort(holidays, customs) {
  const all = [...holidays, ...customs]
  return all.map(item => {
    const days = daysUntil(item.date)
    return {
      ...item,
      days,
      isPast: days < 0,
      isToday: days === 0
    }
  }).sort((a, b) => {
    // 未过期的排前面，按天数升序；已过期的排后面，按天数降序
    if (a.days >= 0 && b.days < 0) return -1
    if (a.days < 0 && b.days >= 0) return 1
    if (a.days >= 0 && b.days >= 0) return a.days - b.days
    return b.days - a.days
  })
}

/**
 * 读取置顶ID列表
 * @returns {Array<string>}
 */
function loadPinnedIds() {
  try {
    const data = wx.getStorageSync(PINNED_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

/**
 * 保存置顶ID列表
 * @param {Array<string>} ids
 */
function savePinnedIds(ids) {
  try {
    wx.setStorageSync(PINNED_KEY, JSON.stringify(ids))
  } catch (e) {
    console.error('保存置顶失败', e)
  }
}

/**
 * 切换置顶状态
 * @param {string} key 倒计时唯一标识（name 或 id）
 * @returns {boolean} 是否置顶
 */
function togglePin(key) {
  const ids = loadPinnedIds()
  const idx = ids.indexOf(key)
  if (idx > -1) {
    ids.splice(idx, 1)
    savePinnedIds(ids)
    return false
  } else {
    ids.push(key)
    savePinnedIds(ids)
    return true
  }
}

/**
 * 解析重复事件的下次日期
 * 对于 repeat='yearly' 的事件，如果日期已过，自动计算到下一年
 * 对于农历重复事件，每年重新转换农历到公历
 * @param {object} item 倒计时项
 * @returns {string} YYYY-MM-DD 格式的公历日期
 */
function resolveRepeatDate(item) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const currentYear = now.getFullYear()

  if (item.isLunar && item.lunarMonth && item.lunarDay) {
    // 农历事件：每年重新转换
    // 先尝试今年
    let solar = lunarToSolar(currentYear, item.lunarMonth, item.lunarDay, item.isLeapMonth || false)
    if (!solar) return item.date // 转换失败回退
    let dateStr = `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`
    let days = daysUntil(dateStr)

    if (item.repeat === 'yearly' && days < 0) {
      // 今年已过，尝试明年
      solar = lunarToSolar(currentYear + 1, item.lunarMonth, item.lunarDay, item.isLeapMonth || false)
      if (solar) {
        dateStr = `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`
      }
    }
    return dateStr
  }

  if (item.repeat === 'yearly') {
    // 公历每年重复
    const parts = item.date.split('-')
    const month = parts[1]
    const day = parts[2]
    let dateStr = `${currentYear}-${month}-${day}`
    let days = daysUntil(dateStr)
    if (days < 0) {
      dateStr = `${currentYear + 1}-${month}-${day}`
    }
    return dateStr
  }

  return item.date
}

/**
 * 格式化农历日期为中文
 * @param {number} month 农历月 1-12
 * @param {number} day 农历日 1-30
 * @param {boolean} isLeapMonth 是否闰月
 * @returns {string} 如 "正月初一"
 */
function formatLunarDateCN(month, day, isLeapMonth) {
  return formatLunarDate(month, day, isLeapMonth || false)
}

module.exports = {
  daysUntil,
  formatDateCN,
  getWeekDay,
  getTodayStr,
  loadCustomCountdowns,
  saveCustomCountdowns,
  addCustomCountdown,
  removeCustomCountdown,
  mergeAndSort,
  loadPinnedIds,
  savePinnedIds,
  togglePin,
  resolveRepeatDate,
  formatLunarDateCN,
  STORAGE_KEY,
  PINNED_KEY
}
