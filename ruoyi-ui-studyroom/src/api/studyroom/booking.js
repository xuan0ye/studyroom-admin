import request from '@/utils/request'

// 查询座位预约记录列表(卡预约: 日卡/周卡/月卡等)
export function listBooking(query) {
  return request({
    url: '/studyroom/booking/list',
    method: 'get',
    params: query
  })
}
