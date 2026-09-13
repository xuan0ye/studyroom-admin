import request from '@/utils/request'

// 灯控健康状态(读巡检日志与米家认证文件, 不访问设备)
export function miotHealth() {
  return request({
    url: '/studyroom/miot/health',
    method: 'get'
  })
}

// 立即自检(只读查询一台真实设备的状态)
export function miotSelfCheck() {
  return request({
    url: '/studyroom/miot/selfcheck',
    method: 'post'
  })
}

// 生成米家登录二维码(扫码即可修复灯控)
export function miotRelogin() {
  return request({
    url: '/studyroom/miot/relogin',
    method: 'post'
  })
}
