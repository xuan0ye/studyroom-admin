import request from '@/utils/request'

// 查询抖音团购核销配置
export function getDouyinConfig() {
  return request({
    url: '/studyroom/douyin/config',
    method: 'get'
  })
}

// 保存抖音团购核销配置(clientSecret 留空=不修改)
export function saveDouyinConfig(data) {
  return request({
    url: '/studyroom/douyin/config',
    method: 'post',
    data: data
  })
}

// 查询抖音核销记录列表
export function listDouyinVerify(query) {
  return request({
    url: '/studyroom/douyin/verify/list',
    method: 'get',
    params: query
  })
}

// 撤销核销(核销后 1 小时内)
export function cancelDouyinVerify(data) {
  return request({
    url: '/studyroom/douyin/verify/cancel',
    method: 'post',
    data: data
  })
}

// 查询抖音商品-本地卡券映射列表
export function listDouyinProductMap() {
  return request({
    url: '/studyroom/douyin/productMap/list',
    method: 'get'
  })
}

// 新增/修改抖音商品-本地卡券映射(带 id=修改)
export function saveDouyinProductMap(data) {
  return request({
    url: '/studyroom/douyin/productMap/save',
    method: 'post',
    data: data
  })
}

// 删除抖音商品-本地卡券映射
export function delDouyinProductMap(id) {
  return request({
    url: '/studyroom/douyin/productMap/' + id,
    method: 'delete'
  })
}

// 查询本地卡券下拉列表
export function listDouyinCards() {
  return request({
    url: '/studyroom/douyin/cards',
    method: 'get'
  })
}
