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

// ── 释放座位 ──────────────────────────────────────────────────────
// 背景: 「代占座/锁座」会写 sr_seat_record(占座) + sr_seat_lock(锁座),
// 而原来的「撤销权限」只把锁座置为已取消、不删占座记录 —— 座位在座位图上仍然被占、别人也约不了。
// 这两个接口以"座位真的空出来"为目标: 列表看谁占着, 一键把占座/锁座/卡锁座/日卡消费/门禁一次清干净。

// 当前座位占用列表(未结束的占座记录 + 关联的锁座/卡锁座/日卡预约)
export function adminSeatOccupations(params) {
  return request({
    url: '/studyroom/admin/seat/occupations',
    method: 'get',
    params: params
  })
}

// 释放座位(占座记录ID / 锁座记录ID / 用户ID 三选一)
export function adminReleaseSeat(data) {
  return request({
    url: '/studyroom/admin/seat/release',
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

// 发放请假次数(长期卡: 每张卡默认 3 次, 用完可在原有额度上累加)
export function adminGrantLeave(data) {
  return request({
    url: '/studyroom/admin/card/leave/grant',
    method: 'post',
    data: data
  })
}

// ── 门禁设备人员管理 ──────────────────────────────────────────────
// 设备(门禁机)里存着一份人员名单, 与我们库里的档案不是一回事:
// 历史上有一批人是通过厂商页面/App 直接录进设备的, 系统看不见也管不到。
// 这几个接口把设备真实名单(含人脸缩略图)拉出来给管理员核对。

// 设备人员清单(读本地镜像, 不碰设备)
export function adminDeviceUsers(params) {
  return request({
    url: '/studyroom/admin/device/users',
    method: 'get',
    params: params
  })
}

// 全量同步门禁设备人员(这是唯一真正读设备的入口)
export function adminDeviceSync(params) {
  return request({
    url: '/studyroom/admin/device/sync',
    method: 'post',
    params: params
  })
}

// 人脸缩略图(服务端进程内缓存, 不进数据库)
export function adminDeviceFaces(params) {
  return request({
    url: '/studyroom/admin/device/faces',
    method: 'get',
    params: params
  })
}

// 单个人脸原图(base64, 用于放大核对)
export function adminDeviceFace(params) {
  return request({
    url: '/studyroom/admin/device/face',
    method: 'get',
    params: params
  })
}

// 删除设备人员(必须传 userId, 无批量接口)
export function adminDeviceDeleteUser(params) {
  return request({
    url: '/studyroom/admin/device/user',
    method: 'delete',
    params: params
  })
}
