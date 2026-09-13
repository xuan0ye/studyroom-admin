import request from '@/utils/request'

// 代占座/锁座
export function adminOccupy(data) {
  return request({
    url: '/studyroom/admin/occupy',
    method: 'post',
    data: data
  })
}

// 撤销权限
export function adminRevoke(data) {
  return request({
    url: '/studyroom/admin/revoke',
    method: 'post',
    data: data
  })
}

// 退款
export function adminRefund(data) {
  return request({
    url: '/studyroom/admin/refund',
    method: 'post',
    data: data
  })
}

// 特殊卡发放
export function adminGrantCard(data) {
  return request({
    url: '/studyroom/admin/card/grant',
    method: 'post',
    data: data
  })
}

// 特殊卡修改
export function adminUpdateCard(data) {
  return request({
    url: '/studyroom/admin/card',
    method: 'put',
    data: data
  })
}
