import request from '@/utils/request'

// ============ 积分与反馈(后台) ============

// 人工发放积分
export function grantPoints(data) {
  return request({
    url: '/studyroom/points/grant',
    method: 'post',
    data: data
  })
}

// 意见反馈列表
export function listFeedback(params) {
  return request({
    url: '/studyroom/points/feedback/list',
    method: 'get',
    params: params
  })
}

// 处理意见反馈(回复/标记已处理)
export function handleFeedback(data) {
  return request({
    url: '/studyroom/points/feedback/handle',
    method: 'post',
    data: data
  })
}

// 补签申请列表
export function listRecover(params) {
  return request({
    url: '/studyroom/points/recover/list',
    method: 'get',
    params: params
  })
}

// 审核补签申请(通过后补发积分)
export function handleRecover(data) {
  return request({
    url: '/studyroom/points/recover/handle',
    method: 'post',
    data: data
  })
}
