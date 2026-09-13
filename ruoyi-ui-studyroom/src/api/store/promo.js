import request from '@/utils/request'

// 查询首页热门活动列表
export function listPromo(query) {
  return request({
    url: '/store/promo/list',
    method: 'get',
    params: query
  })
}

// 查询首页热门活动详细
export function getPromo(id) {
  return request({
    url: '/store/promo/' + id,
    method: 'get'
  })
}

// 新增首页热门活动
export function addPromo(data) {
  return request({
    url: '/store/promo',
    method: 'post',
    data: data
  })
}

// 修改首页热门活动
export function updatePromo(data) {
  return request({
    url: '/store/promo',
    method: 'put',
    data: data
  })
}

// 删除首页热门活动
export function delPromo(id) {
  return request({
    url: '/store/promo/' + id,
    method: 'delete'
  })
}
