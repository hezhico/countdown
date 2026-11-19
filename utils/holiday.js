/**
 * 节日配置与日期计算
 */
const { lunarToSolar } = require('./lunar.js')

/**
 * 预置节日配置
 * type: 'solar' 公历固定日期 | 'lunar' 农历日期 | 'special' 特殊计算
 */
const HOLIDAYS = [
  { name: '元旦', type: 'solar', month: 1, day: 1, icon: '🎉', color: '#FF6B35' },
  { name: '情人节', type: 'solar', month: 2, day: 14, icon: '❤️', color: '#FF4D6A' },
  { name: '春节', type: 'lunar', month: 1, day: 1, icon: '🧨', color: '#E63946' },
  { name: '元宵节', type: 'lunar', month: 1, day: 15, icon: '🏮', color: '#FF8C42' },
  { name: '清明节', type: 'solar', month: 4, day: 4, icon: '🌿', color: '#52C41A' },
  { name: '劳动节', type: 'solar', month: 5, day: 1, icon: '💪', color: '#1890FF' },
  { name: '端午节', type: 'lunar', month: 5, day: 5, icon: '🐲', color: '#722ED1' },
  { name: '七夕节', type: 'lunar', month: 7, day: 7, icon: '⭐', color: '#EB2F96' },
  { name: '中秋节', type: 'lunar', month: 8, day: 15, icon: '🌙', color: '#FA8C16' },
  { name: '国庆节', type: 'solar', month: 10, day: 1, icon: '🇨🇳', color: '#CF1322' },
  { name: '重阳节', type: 'lunar', month: 9, day: 9, icon: '🏔️', color: '#13C2C2' },
  { name: '圣诞节', type: 'solar', month: 12, day: 25, icon: '🎄', color: '#389E0D' },
  { name: '开学日', type: 'solar', month: 9, day: 1, icon: '📚', color: '#1890FF' },
]

// 缓存当年节日数据
let _cacheYear = null
let _cacheHolidays = null

/**
 * 获取指定年份的所有预置节日（公历日期）
 * @param {number} year 年份
 * @returns {Array} 节日列表，每项包含 name, date, icon, color, isPreset
 */
function getHolidays(year) {
  if (_cacheYear === year && _cacheHolidays) {
    return _cacheHolidays
  }

  const result = HOLIDAYS.map(holiday => {
    let solarDate

    if (holiday.type === 'solar') {
      solarDate = { year, month: holiday.month, day: holiday.day }
    } else if (holiday.type === 'lunar') {
      solarDate = lunarToSolar(year, holiday.month, holiday.day, false)
      // 如果农历转公历失败或结果年份不匹配，尝试下一年
      if (!solarDate || solarDate.year !== year) {
        solarDate = lunarToSolar(year + 1, holiday.month, holiday.day, false)
      }
    }

    if (!solarDate) return null

    const dateStr = `${solarDate.year}-${String(solarDate.month).padStart(2, '0')}-${String(solarDate.day).padStart(2, '0')}`

    return {
      name: holiday.name,
      date: dateStr,
      icon: holiday.icon,
      color: holiday.color,
      isPreset: true
    }
  }).filter(item => item !== null)

  _cacheYear = year
  _cacheHolidays = result

  return result
}

/**
 * 清除缓存
 */
function clearCache() {
  _cacheYear = null
  _cacheHolidays = null
}

module.exports = {
  getHolidays,
  clearCache,
  HOLIDAYS
}
