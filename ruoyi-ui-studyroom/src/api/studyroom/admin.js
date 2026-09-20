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

// 删除会员卡券(后台安全删除: 释放锁座/占座、作废预约记录、撤销门禁)
export function adminRevokeCard(data) {
  return request({
    url: '/studyroom/admin/card/revoke',
    method: 'post',
    data: data
  })
}
