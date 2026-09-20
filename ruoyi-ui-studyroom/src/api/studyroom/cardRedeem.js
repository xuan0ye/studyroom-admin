import request from '@/utils/request'

// 双人卡兑换码列表
export function listCardRedeem(query) {
  return request({
    url: '/studyroom/cardRedeem/list',
    method: 'get',
    params: query
  })
}

// 兑换码详情
export function getCardRedeem(id) {
  return request({
    url: '/studyroom/cardRedeem/' + id,
    method: 'get'
  })
}

// 手工生成/补发兑换码
export function generateCardRedeem(data) {
  return request({
    url: '/studyroom/cardRedeem/generate',
    method: 'post',
    data: data
  })
}

// 批量生成通用兑换码(任意卡券, 不绑定购买者)
export function batchGenerateCardRedeem(data) {
  return request({
    url: '/studyroom/cardRedeem/batchGenerate',
    method: 'post',
    data: data
  })
}

// 作废兑换码
export function invalidateCardRedeem(id, reason) {
  return request({
    url: '/studyroom/cardRedeem/invalidate/' + id,
    method: 'post',
    params: { reason: reason }
  })
}

// 删除兑换码
export function delCardRedeem(id) {
  return request({
    url: '/studyroom/cardRedeem/' + id,
    method: 'delete'
  })
}
