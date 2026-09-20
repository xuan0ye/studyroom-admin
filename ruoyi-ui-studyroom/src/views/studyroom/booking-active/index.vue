<template>
  <div class="app-container">
    <el-alert type="success" :closable="false" show-icon style="margin-bottom: 12px;"
      title="这里看的是「现在还在用的」：谁锁着哪个座位、锁到哪天、卡里还剩多少天；下面是今日及未来的预约明细。" />

    <!-- 概览数字 -->
    <el-row :gutter="12" style="margin-bottom: 12px;">
      <el-col :span="6">
        <el-card shadow="never">
          <div style="color:#909399;font-size:13px;">全场在座（合计）</div>
          <div style="font-size:26px;font-weight:600;color:#E6A23C;">{{ lockedRows.length + onsiteOrderRows.length }}</div>
          <div style="color:#909399;font-size:12px;">卡券锁座 {{ lockedRows.length }} · 时租订单 {{ onsiteOrderRows.length }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div style="color:#909399;font-size:13px;">有可用时长的卡券</div>
          <div style="font-size:26px;font-weight:600;color:#409EFF;">{{ validCardRows.length }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div style="color:#909399;font-size:13px;">今日及未来预约</div>
          <div style="font-size:26px;font-weight:600;color:#67C23A;">{{ upcomingRows.length }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div style="color:#909399;font-size:13px;">数据时间</div>
          <div style="font-size:16px;padding-top:6px;">{{ loadTime }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 1. 全场在座 -->
    <el-card shadow="never" style="margin-bottom: 12px;">
      <div slot="header">
        <b>① 全场在座一览 —— 卡券锁座 + 时租/余额订单</b>
      </div>

      <div style="font-weight:600;color:#E6A23C;margin:4px 0 8px;">A. 卡券锁座（周卡/月卡预约后自动锁座）</div>
      <el-table v-loading="loading" :data="lockedRows" size="small" :show-header="true"
        empty-text="当前没有卡券锁座">
        <el-table-column label="用户" min-width="120">
          <template slot-scope="scope">{{ scope.row.nickname }}</template>
        </el-table-column>
        <el-table-column label="手机号" width="130">
          <template slot-scope="scope">{{ scope.row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="卡券" min-width="140">
          <template slot-scope="scope">{{ scope.row.cardTitle }}</template>
        </el-table-column>
        <el-table-column label="座位号" width="90">
          <template slot-scope="scope">
            <el-tag type="warning" size="mini">{{ scope.row.seatNum }} 号</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="锁定开始" width="120">
          <template slot-scope="scope">{{ fmtDay(scope.row.lockStartTime) }}</template>
        </el-table-column>
        <el-table-column label="锁定结束(座位占到)" width="170">
          <template slot-scope="scope">
            <b style="color:#E6A23C;">{{ fmtDay(scope.row.lockEndTime) }}</b>
            <span style="color:#909399;">（{{ scope.row.leftDaysText }}）</span>
          </template>
        </el-table-column>
        <el-table-column label="卡券到期" width="150">
          <template slot-scope="scope">{{ scope.row.expiryText }}</template>
        </el-table-column>
      </el-table>

      <div style="font-weight:600;color:#409EFF;margin:16px 0 8px;">
        B. 时租/余额订单（按小时下单，进行中与待开始）
        <span style="color:#909399;font-weight:400;font-size:12px;margin-left:8px;">
          （时租订单共 {{ orders.length }} 条，其中进行中/待开始 {{ onsiteOrderRows.length }} 条；历史明细见「余额/小时预约单」）
        </span>
      </div>
      <el-table v-loading="loading" :data="onsiteOrderRows" size="small"
        empty-text="当前没有进行中的时租订单（结束时间在未来的订单会出现在这里）">
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.stateType" size="mini">{{ scope.row.stateText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用户" min-width="120">
          <template slot-scope="scope">{{ scope.row.nickname }}</template>
        </el-table-column>
        <el-table-column label="手机号" width="130">
          <template slot-scope="scope">{{ scope.row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="座位号" width="90">
          <template slot-scope="scope">
            <el-tag size="mini">{{ scope.row.seatNum }} 号</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="门店" min-width="120" prop="roomName" />
        <el-table-column label="开始时间" width="150">
          <template slot-scope="scope">{{ fmtDay(scope.row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="150">
          <template slot-scope="scope">{{ fmtDay(scope.row.endTime) }}</template>
        </el-table-column>
        <el-table-column label="时长" width="80">
          <template slot-scope="scope">{{ scope.row.hours ? scope.row.hours + ' 小时' : '-' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="90">
          <template slot-scope="scope">{{ scope.row.total != null ? '¥' + scope.row.total : '-' }}</template>
        </el-table-column>
        <el-table-column label="支付" width="90">
          <template slot-scope="scope">{{ payLabel(scope.row.payStatus) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 2. 有可用时长的卡券 -->
    <el-card shadow="never" style="margin-bottom: 12px;">
      <div slot="header">
        <b>② 还有可用时长的卡券 —— 谁手里有没用完的卡</b>
        <span style="color:#909399;font-size:12px;margin-left:10px;">（已按"真正用过没有"判断：订了又取消、从没签到的算待使用）</span>
      </div>
      <el-table v-loading="loading" :data="validCardRows" size="small" max-height="420" empty-text="暂无未用完的卡券">
        <el-table-column label="用户" min-width="120">
          <template slot-scope="scope">{{ scope.row.nickname }}</template>
        </el-table-column>
        <el-table-column label="手机号" width="130">
          <template slot-scope="scope">{{ scope.row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="卡券" min-width="140">
          <template slot-scope="scope">{{ scope.row.cardTitle }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template slot-scope="scope">
            <el-tag :type="scope.row.stateType" size="mini">{{ scope.row.stateText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="剩余可用" width="110">
          <template slot-scope="scope">{{ scope.row.remainText }}</template>
        </el-table-column>
        <el-table-column label="到期时间" width="150">
          <template slot-scope="scope">{{ scope.row.expiryText }}</template>
        </el-table-column>
        <el-table-column label="获得时间" width="150">
          <template slot-scope="scope">{{ scope.row.createTime }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 3. 今日及未来预约明细 -->
    <el-card shadow="never">
      <div slot="header">
        <b>③ 今日及未来的预约明细</b>
      </div>
      <el-table v-loading="loading" :data="upcomingRows" size="small" empty-text="今天起没有新的预约（历史记录看「预约明细(含历史)」）">
        <el-table-column label="预约日期" width="120">
          <template slot-scope="scope">{{ fmtDay(scope.row.consumptionDate) }}</template>
        </el-table-column>
        <el-table-column label="用户" min-width="120">
          <template slot-scope="scope">{{ scope.row.nickname || ('用户' + scope.row.userId) }}</template>
        </el-table-column>
        <el-table-column label="手机号" width="130">
          <template slot-scope="scope">{{ scope.row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="座位号" width="90">
          <template slot-scope="scope">{{ scope.row.seatNum ? scope.row.seatNum + ' 号' : '-' }}</template>
        </el-table-column>
        <el-table-column label="卡券" min-width="140">
          <template slot-scope="scope">{{ scope.row.cardTitle || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="签到开灯" width="150">
          <template slot-scope="scope">{{ scope.row.checkInTime ? fmtDay(scope.row.checkInTime) : '-' }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { listCardUser } from '@/api/studyroom/cardUser'
import { listBooking } from '@/api/studyroom/booking'
import { listOrder } from '@/api/order/order'
import { listUser } from '@/api/member/user'
import { listCard } from '@/api/store/card'
import { listSeat } from '@/api/store/seat'

export default {
  name: 'StudyroomBookingActive',
  data() {
    return {
      loading: true,
      loadTime: '',
      cardUsers: [],
      usedCardIds: {},   // cardUserId -> true 表示"真正用过"(有未取消的预约记录)
      userMap: {},
      cardMap: {},
      cardTermMap: {},
      seatMap: {},
      bookings: [],
      orders: []
    }
  },
  computed: {
    // 锁座中: 锁定结束时间还在未来
    lockedRows() {
      const now = Date.now()
      return this.cardUsers.filter(r => r.lockSeatId && this.ts(r.lockEndTime) > now)
        .map(r => this.enrich(r, { lock: true }))
        .sort((a, b) => this.ts(a.lockEndTime) - this.ts(b.lockEndTime))
    },
    // 还有可用时长的卡券: 待使用(没用过) 或 用过的但还没到期/还有剩余天数
    validCardRows() {
      const now = Date.now()
      return this.cardUsers.filter(r => {
        const used = !!this.usedCardIds[r.id]
        // 未真正用过 => 一直有效(首次使用才开始计时)
        if (!used) return true
        if (!r.expiryTime) return (r.remainingDays || 0) > 0
        return this.ts(r.expiryTime) > now
      }).map(r => this.enrich(r, { lock: false }))
        .sort((a, b) => (b.remainDays || 0) - (a.remainDays || 0))
    },
    // 时租/余额订单: 结束时间还没到(在座中 + 待开始)
    onsiteOrderRows() {
      const now = Date.now()
      const um = this.userMap
      const sm = this.seatMap
      return this.orders.filter(o => this.ts(o.endTime) > now)
        .map(o => {
          const uu = um[String(o.userId)] || {}
          const started = this.ts(o.startTime) <= now
          return {
            orderId: o.orderId,
            nickname: uu.nickname || o.userName || ('用户' + o.userId),
            phone: uu.phone || o.userPhone,
            seatNum: o.seatNum || sm[String(o.seatId)] || '-',
            roomName: o.roomName || '-',
            startTime: o.startTime,
            endTime: o.endTime,
            hours: o.hours,
            total: o.total,
            payStatus: o.payStatus,
            stateText: started ? '在座中' : '待开始',
            stateType: started ? 'success' : 'info'
          }
        })
        .sort((a, b) => this.ts(a.startTime) - this.ts(b.startTime))
    },
    // 今日及未来预约
    upcomingRows() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return this.bookings.filter(b => this.ts(b.consumptionDate) >= today.getTime())
        .sort((a, b) => this.ts(a.consumptionDate) - this.ts(b.consumptionDate))
    }
  },
  created() {
    this.getData()
  },
  methods: {
    ts(v) {
      if (!v) return 0
      const s = String(v).replace(/-/g, '/')
      const t = new Date(s).getTime()
      return isNaN(t) ? 0 : t
    },
    fmtDay(v) {
      if (!v) return '-'
      return String(v).replace('T', ' ').slice(0, 16)
    },
    statusLabel(s) {
      if (s === 0) return '待使用'
      if (s === 1) return '已使用'
      if (s === 2) return '已失效'
      return '未知'
    },
    statusTag(s) {
      if (s === 0) return 'warning'
      if (s === 1) return 'success'
      return 'info'
    },
    // 订单支付/消费状态(对应后端 PayConstants)
    payLabel(s) {
      const map = { 0: '未付款', 1: '已付款', 2: '已取消', 3: '未消费', 4: '已消费' }
      return map[s] != null ? map[s] : (s == null ? '-' : String(s))
    },
    // 组装一行展示数据
    enrich(r, opt) {
      const u = this.userMap[String(r.userId)] || {}
      const remain = this.remainDays(r)
      const lockedNow = !!(r.lockSeatId && this.ts(r.lockEndTime) > Date.now())
      let stateText = '待使用', stateType = 'success'
      if (lockedNow) {
        stateText = '锁座中'
        stateType = 'warning'
      } else if (opt.lock) {
        stateText = '锁座中'
        stateType = 'warning'
      } else if (r.expiryTime && this.ts(r.expiryTime) < Date.now()) {
        stateText = '已到期'
        stateType = 'info'
      } else if (this.usedCardIds[r.id]) {
        stateText = '使用中'
        stateType = 'warning'
      }
      return {
        id: r.id,
        userId: r.userId,
        nickname: u.nickname || ('用户' + r.userId),
        phone: u.phone,
        cardTitle: (this.cardMap[String(r.cardId)] || '卡' + r.cardId),
        seatNum: this.seatMap[String(r.lockSeatId)] || '-',
        lockStartTime: r.lockStartTime,
        lockEndTime: r.lockEndTime,
        expiryTime: r.expiryTime,
        expiryText: r.expiryTime ? this.fmtDay(r.expiryTime) : '不过期(待使用)',
        remainDays: remain,
        remainText: remain + ' 天',
        leftDaysText: opt.lock ? ('剩 ' + remain + ' 天') : '',
        stateText: stateText,
        stateType: stateType,
        createTime: this.fmtDay(r.createTime)
      }
    },
    // 剩余可用天数: 未用过=卡面天数; 用过=按到期日算
    remainDays(r) {
      const card = this.cardMap[String(r.cardId)]
      const term = (this.cardTermMap && this.cardTermMap[String(r.cardId)]) || 0
      if (!r.expiryTime) return term || (r.remainingDays || 0)
      const ms = this.ts(r.expiryTime) - Date.now()
      return Math.max(0, Math.ceil(ms / 86400000))
    },
    async getData() {
      this.loading = true
      try {
        // 并行拉取, 前端关联(不改后端, 不重启服务)
        const [cu, bk, od, us, cd, st] = await Promise.all([
          listCardUser({ pageNum: 1, pageSize: 500 }),
          listBooking({ pageNum: 1, pageSize: 500 }),
          listOrder({ pageNum: 1, pageSize: 500 }),
          listUser({ pageNum: 1, pageSize: 500 }),
          listCard({ pageNum: 1, pageSize: 100 }),
          listSeat({ pageNum: 1, pageSize: 100 })
        ])
        this.cardUsers = (cu.rows || []).filter(r => r.userId && String(r.userId) !== '1524407108731777026')
        this.bookings = bk.rows || []
        this.orders = od.rows || []

        const um = {}
        ;(us.rows || []).forEach(u => { um[String(u.userId)] = u })
        this.userMap = um

        const cm = {}
        const tm = {}
        ;(cd.rows || []).forEach(c => { cm[String(c.id)] = c.cardTitle; tm[String(c.id)] = c.term })
        this.cardMap = cm
        this.cardTermMap = tm

        const sm = {}
        ;(st.rows || []).forEach(s => { sm[String(s.seatId)] = s.seatNum })
        this.seatMap = sm

        // 真正用过: 存在未取消(status != 2)的预约记录
        const used = {}
        this.bookings.forEach(b => {
          if (b.cardUserId && b.status !== 2) used[String(b.cardUserId)] = true
        })
        this.usedCardIds = used

        const d = new Date()
        this.loadTime = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') +
          ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
      } catch (e) {
        this.$modal && this.$modal.msgError('加载失败: ' + (e && (e.msg || e.message)))
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
