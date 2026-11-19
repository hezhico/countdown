const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 小程序配置
 */
const APPID = 'wx4a68d91d21eb39ee'
const APPSECRET = '36c206656f2fbb81a7ed7108184323b7'
const TEMPLATE_ID = 'EOHvCnzTGKVOAeNGjnWNhHfX8B3wv1mUHRw6O1Pprbo'

// 缓存 access_token
let accessTokenCache = { token: '', expireAt: 0 }

/**
 * 获取 access_token
 */
async function getAccessToken() {
  const now = Date.now()
  if (accessTokenCache.token && now < accessTokenCache.expireAt) {
    return accessTokenCache.token
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`
  const res = await new Promise((resolve, reject) => {
    const https = require('https')
    https.get(url, (resp) => {
      let data = ''
      resp.on('data', chunk => data += chunk)
      resp.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })

  if (res.access_token) {
    accessTokenCache = {
      token: res.access_token,
      expireAt: now + (res.expires_in - 300) * 1000 // 提前5分钟过期
    }
    return res.access_token
  }
  throw new Error('获取access_token失败: ' + JSON.stringify(res))
}

/**
 * 发送订阅消息（通过HTTP API）
 */
async function sendSubscribeMessage(openid, data) {
  const token = await getAccessToken()
  const postData = JSON.stringify({
    touser: openid,
    template_id: TEMPLATE_ID,
    page: 'pages/index/index',
    data
  })

  return new Promise((resolve, reject) => {
    const https = require('https')
    const options = {
      hostname: 'api.weixin.qq.com',
      path: `/cgi-bin/message/subscribe/send?access_token=${token}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }
    const req = https.request(options, (resp) => {
      let data = ''
      resp.on('data', chunk => data += chunk)
      resp.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || ''
  const { action, item, targetOpenid } = event

  switch (action) {
    case 'add':
      return addSubscription(openid, item)
    case 'remove':
      return removeSubscription(openid, item)
    case 'list':
      return listSubscriptions(openid)
    case 'send':
      return sendNotifications()
    default:
      return { code: 400, message: '未知操作' }
  }
}

async function addSubscription(openid, item) {
  if (!openid) return { code: 401, message: '未获取到用户身份' }
  const { name, date, color, repeat, isLunar, lunarMonth, lunarDay, isLeapMonth, id } = item

  const existing = await db.collection('subscriptions')
    .where({ _openid: openid, itemId: id })
    .count()

  if (existing.total > 0) {
    return { code: 200, message: '已订阅' }
  }

  const now = new Date()
  const res = await db.collection('subscriptions').add({
    data: {
      _openid: openid,
      itemId: id,
      name,
      date,
      color,
      repeat: repeat || 'none',
      isLunar: isLunar || false,
      lunarMonth: lunarMonth || 0,
      lunarDay: lunarDay || 0,
      isLeapMonth: isLeapMonth || false,
      subscribedAt: now,
      lastNotifiedAt: null,
      notifyDays: [7, 3, 1, 0]
    }
  })

  return { code: 200, message: '订阅成功', data: { _id: res._id } }
}

async function removeSubscription(openid, item) {
  if (!openid) return { code: 401, message: '未获取到用户身份' }
  const res = await db.collection('subscriptions')
    .where({ _openid: openid, itemId: item.id })
    .remove()
  return { code: 200, message: '已取消订阅', data: { removed: res.stats.removed } }
}

async function listSubscriptions(openid) {
  if (!openid) {
    const res = await db.collection('subscriptions').limit(100).get()
    return { code: 200, data: res.data }
  }
  const res = await db.collection('subscriptions')
    .where({ _openid: openid })
    .get()
  return { code: 200, data: res.data }
}

async function sendNotifications() {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  let allSubs = []
  let offset = 0
  const limit = 100
  let hasMore = true

  while (hasMore) {
    const res = await db.collection('subscriptions')
      .skip(offset)
      .limit(limit)
      .get()
    allSubs = allSubs.concat(res.data)
    hasMore = res.data.length === limit
    offset += limit
  }

  let sentCount = 0
  let failCount = 0

  for (const sub of allSubs) {
    try {
      const targetDate = new Date(sub.date + 'T00:00:00')
      const todayDate = new Date(todayStr + 'T00:00:00')
      const diffMs = targetDate.getTime() - todayDate.getTime()
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      const notifyDays = sub.notifyDays || [7, 3, 1, 0]
      if (!notifyDays.includes(days)) continue

      if (sub.lastNotifiedAt) {
        const lastDate = new Date(sub.lastNotifiedAt)
        if (lastDate.toDateString() === now.toDateString()) continue
      }

      const daysText = days === 0 ? '今天' : days > 0 ? `${days}天后` : `${Math.abs(days)}天前`
      const dateDisplay = sub.date.replace(/-/g, '/')

      await sendSubscribeMessage(sub._openid, {
        thing01: { value: daysText },
        time01: { value: dateDisplay.replace(/\//g, '-') },
        thing02: { value: sub.name },
        thing03: { value: '记得查看倒计时详情' }
      })

      await db.collection('subscriptions').doc(sub._id).update({
        data: { lastNotifiedAt: now }
      })

      sentCount++
    } catch (err) {
      console.error('发送通知失败:', sub._id, err)
      failCount++
    }
  }

  return { code: 200, message: `已发送 ${sentCount} 条，失败 ${failCount} 条`, data: { sentCount, failCount } }
}
