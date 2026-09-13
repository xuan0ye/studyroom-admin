import request from '@/utils/request'

// 首页统计概览
export function getStatsOverview() {
  return request({
    url: '/studyroom/stats/overview',
    method: 'get'
  })
}

// 座位预约状态统计
export function getSeatStatus() {
  return request({
    url: '/studyroom/stats/seatStatus',
    method: 'get'
  })
}
