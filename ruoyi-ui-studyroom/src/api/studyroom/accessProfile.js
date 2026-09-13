import request from '@/utils/request'

// 查询门禁档案列表
export function listAccessProfile(query) {
  return request({
    url: '/studyroom/accessProfile/list',
    method: 'get',
    params: query
  })
}

// 查询门禁档案全部(不分页)
export function listAllAccessProfile() {
  return request({
    url: '/studyroom/accessProfile/all',
    method: 'get'
  })
}
