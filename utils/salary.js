/**
 * 上班摸鱼器计算工具
 */

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 衡量"今天赚了多少钱"的参考物，价格为内置参考价 */
const REFERENCE_ITEMS = [
  { name: '奶茶', unit: '杯', price: 20 },
  { name: '咖啡', unit: '杯', price: 25 },
  { name: '午饭', unit: '顿', price: 35 },
  { name: '电影票', unit: '张', price: 45 },
  { name: 'T恤', unit: '件', price: 100 },
  { name: '火锅', unit: '顿', price: 180 },
  { name: '运动鞋', unit: '双', price: 399 },
  { name: 'Nike 球鞋', unit: '双', price: 899 }
]

/**
 * 把 HH:MM 转换为当天的分钟数
 * @param {string} timeStr 时间字符串 HH:MM
 * @returns {number} 当天的分钟数
 */
function timeToMinutes(timeStr) {
  const parts = timeStr.split(':')
  return Number(parts[0]) * 60 + Number(parts[1])
}

/**
 * 由月薪换算时薪：月薪 ÷ 21.75 计薪天数 ÷ 8 小时
 * @param {number} monthlySalary 月薪（元）
 * @returns {number} 时薪（元 / 小时）
 */
function hourlyRateFromSalary(monthlySalary) {
  return monthlySalary / 21.75 / 8
}

/**
 * 格式化时长，精确到秒
 * @param {number} seconds 秒数
 * @returns {string} 如 "2小时54分18秒"
 */
function formatDuration(seconds) {
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  let text = ''
  if (h > 0) text += `${h}小时`
  if (m > 0) text += `${m}分`
  if (s > 0) text += `${s}秒`
  if (text == '') return '0秒'
  return text
}

/**
 * 获取星期中文名
 * @param {Date} date 日期
 * @returns {string} 如 "周一"
 */
function getWeekdayCN(date) {
  return WEEKDAY_CN[date.getDay()]
}

module.exports = {
  REFERENCE_ITEMS,
  timeToMinutes,
  hourlyRateFromSalary,
  formatDuration,
  getWeekdayCN
}
