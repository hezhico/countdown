/**
 * 农历算法库 - 支持农历转公历
 * 覆盖范围: 1900-2100
 */

// 农历数据表 1900-2100
// 每个元素编码说明:
// 高4位: 闰月月份(0表示无闰月)
// 中12位: 每月大小(1=30天, 0=29天), 从1月到12月
// 最低4位: 1月到12月，1=大月(30天)，0=小月(29天)
// 完整20位: bit0-bit11 表示1-12月大小月, bit12-bit15 表示闰月月份, bit16表示闰月大小
const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
  0x0d520
]

/**
 * 获取农历年的总天数
 */
function lYearDays(y) {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (lunarInfo[y - 1900] & i) ? 1 : 0
  }
  return sum + leapDays(y)
}

/**
 * 获取闰月天数
 */
function leapDays(y) {
  if (leapMonth(y)) {
    return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29
  }
  return 0
}

/**
 * 获取闰月月份，0表示无闰月
 */
function leapMonth(y) {
  return lunarInfo[y - 1900] & 0xf
}

/**
 * 获取农历某月的天数
 */
function monthDays(y, m) {
  return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29
}

/**
 * 农历转公历
 * @param {number} year 农历年
 * @param {number} month 农历月（1-12）
 * @param {number} day 农历日
 * @param {boolean} isLeapMonth 是否闰月
 * @returns {object} { year, month, day } 公历日期
 */
function lunarToSolar(year, month, day, isLeapMonth) {
  // 边界检查
  if (year < 1900 || year > 2100) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 30) return null

  const leap = leapMonth(year)
  // 如果不是闰月但该月是闰月，或者传入了闰月标记但该月不是闰月
  if (isLeapMonth && leap !== month) return null
  if (!isLeapMonth && month === leap) {
    // 用户未指定闰月，但该月有闰月，默认取正常月
  }

  // 计算从1900年1月31日（农历1900年正月初一）到目标日期的总天数
  let offset = 0

  for (let y = 1900; y < year; y++) {
    offset += lYearDays(y)
  }

  // 加上当年各月天数
  let isAdd = false
  for (let m = 1; m < month; m++) {
    if (!isAdd && leap > 0 && m === leap) {
      // 遇到闰月，加上闰月天数
      offset += leapDays(year)
      isAdd = true
    }
    offset += monthDays(year, m)
  }

  // 如果目标月是闰月之前的月，且闰月存在，需要判断
  if (isLeapMonth && month === leap) {
    offset += monthDays(year, month)
    // 这是加上正常月的天数后，进入闰月
  } else if (leap > 0 && month > leap && !isAdd) {
    // 目标月在闰月之后，需要加上闰月天数
    offset += leapDays(year)
  }

  // 加上当月的天数（从1日开始）
  offset += day - 1

  // 1900年1月31日作为起点
  const baseDate = new Date(1900, 0, 31)
  const resultDate = new Date(baseDate.getTime() + offset * 86400000)

  return {
    year: resultDate.getFullYear(),
    month: resultDate.getMonth() + 1,
    day: resultDate.getDate()
  }
}

/**
 * 获取农历某年的闰月信息
 */
function getLeapMonth(year) {
  return leapMonth(year)
}

/**
 * 农历月名列表（不含闰月）
 */
const lunarMonthNames = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月'
]

/**
 * 农历日名列表（初一到三十）
 */
const lunarDayNames = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]

/**
 * 获取指定年份的农历月份选择器列表（含闰月标记）
 * @param {number} year 农历年
 * @returns {Array<{month: number, isLeap: boolean, name: string}>}
 */
function getLunarMonthList(year) {
  const list = []
  const leap = leapMonth(year)
  for (let m = 1; m <= 12; m++) {
    list.push({ month: m, isLeap: false, name: lunarMonthNames[m - 1] })
    if (m === leap) {
      list.push({ month: m, isLeap: true, name: '闰' + lunarMonthNames[m - 1] })
    }
  }
  return list
}

/**
 * 获取指定年份农历月的天数
 * @param {number} year 农历年
 * @param {number} month 农历月 1-12
 * @param {boolean} isLeapMonth 是否闰月
 * @returns {number} 29 或 30
 */
function getLunarMonthDays(year, month, isLeapMonth) {
  if (isLeapMonth) {
    return leapDays(year)
  }
  return monthDays(year, month)
}

/**
 * 获取指定年份农历月的日期选择器列表
 * @param {number} year 农历年
 * @param {number} month 农历月
 * @param {boolean} isLeapMonth 是否闰月
 * @returns {Array<string>} 日名列表
 */
function getLunarDayList(year, month, isLeapMonth) {
  const days = getLunarMonthDays(year, month, isLeapMonth)
  return lunarDayNames.slice(0, days)
}

/**
 * 格式化农历日期为中文
 * @param {number} month 农历月 1-12
 * @param {number} day 农历日 1-30
 * @param {boolean} isLeapMonth 是否闰月
 * @returns {string} 如 "正月初一"、"闰六月初十"
 */
function formatLunarDate(month, day, isLeapMonth) {
  const prefix = isLeapMonth ? '闰' : ''
  return prefix + lunarMonthNames[month - 1] + lunarDayNames[day - 1]
}

module.exports = {
  lunarToSolar,
  getLeapMonth,
  lYearDays,
  leapDays,
  monthDays,
  lunarMonthNames,
  lunarDayNames,
  getLunarMonthList,
  getLunarMonthDays,
  getLunarDayList,
  formatLunarDate
}
