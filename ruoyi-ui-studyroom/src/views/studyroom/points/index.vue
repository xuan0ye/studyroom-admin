<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" @tab-click="onTabChange">
      <!-- ==================== 积分发放 ==================== -->
      <el-tab-pane label="积分发放" name="grant">
        <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px;"
          title="用于客服核实后人工补发/扣减积分。客户积分不足时可在小程序「积分」页查看明细。" />
        <el-form :model="grantForm" ref="grantForm" label-width="100px" size="small" style="max-width: 560px;">
          <el-form-item label="会员" required>
            <el-select v-model="grantForm.userId" filterable clearable placeholder="搜索昵称/手机号选择会员" style="width: 100%;">
              <el-option v-for="u in userOptions" :key="u.userId"
                :label="(u.nickname || ('用户' + u.userId)) + (u.phone ? '（' + u.phone + '）' : '')"
                :value="String(u.userId)" />
            </el-select>
          </el-form-item>
          <el-form-item label="积分数量" required>
            <el-input-number v-model="grantForm.points" :min="-100000" :max="100000" />
            <span style="color:#909399;font-size:12px;margin-left:8px;">正数为发放，负数为扣减</span>
          </el-form-item>
          <el-form-item label="原因备注">
            <el-input v-model="grantForm.remark" placeholder="如: 签到漏签补偿 / 活动奖励 / 客服补偿" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="grantLoading" @click="submitGrant">确认发放</el-button>
            <el-button @click="resetGrant">重置</el-button>
          </el-form-item>
        </el-form>
        <div style="color:#909399;font-size:12px;line-height:1.8;max-width:560px;">
          常见场景：<br />
          · 客户反馈漏签 → 在「补签申请」标签审核，通过后系统自动补积分；<br />
          · 活动现场送礼 / 客服安抚 → 直接在这里发放，备注写清原因，便于日后对账。
        </div>
      </el-tab-pane>

      <!-- ==================== 意见反馈 ==================== -->
      <el-tab-pane label="意见反馈" name="feedback">
        <el-form size="small" :inline="true" label-width="70px">
          <el-form-item label="状态">
            <el-select v-model="feedbackStatus" placeholder="全部" clearable style="width: 130px" @change="loadFeedback">
              <el-option label="待处理" :value="0" />
              <el-option label="已处理" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-refresh" size="mini" @click="loadFeedback">刷新</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" :data="feedbackList" size="small" empty-text="暂无反馈">
          <el-table-column label="提交时间" width="150" align="center">
            <template slot-scope="scope">{{ String(scope.row.createTime || '').slice(0, 16) }}</template>
          </el-table-column>
          <el-table-column label="用户" min-width="120">
            <template slot-scope="scope">{{ scope.row.userName || ('用户' + scope.row.userId) }}</template>
          </el-table-column>
          <el-table-column label="反馈内容" min-width="260" show-overflow-tooltip prop="content" />
          <el-table-column label="联系方式" width="140" align="center">
            <template slot-scope="scope">{{ scope.row.contact || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'" size="mini">
                {{ scope.row.status === 1 ? '已处理' : '待处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="回复" min-width="200" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.reply || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="110" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="openReply(scope.row)">
                {{ scope.row.status === 1 ? '修改回复' : '回复处理' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ==================== 补签申请 ==================== -->
      <el-tab-pane label="补签申请" name="recover">
        <el-form size="small" :inline="true" label-width="70px">
          <el-form-item label="状态">
            <el-select v-model="recoverStatus" placeholder="全部" clearable style="width: 130px" @change="loadRecover">
              <el-option label="待处理" :value="0" />
              <el-option label="已通过" :value="1" />
              <el-option label="已驳回" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-refresh" size="mini" @click="loadRecover">刷新</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" :data="recoverList" size="small" empty-text="暂无补签申请">
          <el-table-column label="提交时间" width="150" align="center">
            <template slot-scope="scope">{{ String(scope.row.createTime || '').slice(0, 16) }}</template>
          </el-table-column>
          <el-table-column label="用户" min-width="120">
            <template slot-scope="scope">{{ scope.row.userName || ('用户' + scope.row.userId) }}</template>
          </el-table-column>
          <el-table-column label="漏签日期" width="120" align="center">
            <template slot-scope="scope">{{ String(scope.row.missedDate || '').slice(0, 10) }}</template>
          </el-table-column>
          <el-table-column label="申请理由" min-width="220" show-overflow-tooltip prop="reason" />
          <el-table-column label="联系方式" width="130" align="center">
            <template slot-scope="scope">{{ scope.row.contact || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="recoverTag(scope.row.status)" size="mini">{{ recoverLabel(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="处理人/备注" min-width="160" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ (scope.row.handler || '-') + (scope.row.remark ? '：' + scope.row.remark : '') }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template slot-scope="scope">
              <template v-if="scope.row.status === 0">
                <el-button type="text" size="mini" style="color:#67C23A;" @click="handleRecoverRow(scope.row, true)">通过</el-button>
                <el-button type="text" size="mini" style="color:#F56C6C;" @click="handleRecoverRow(scope.row, false)">驳回</el-button>
              </template>
              <span v-else style="color:#c0c4cc;font-size:12px;">已处理</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 回复反馈 -->
    <el-dialog title="回复意见反馈" :visible.sync="replyOpen" width="520px" append-to-body>
      <el-form label-width="80px" size="small">
        <el-form-item label="反馈内容">
          <div style="color:#606266;line-height:1.6;">{{ replyRow.content }}</div>
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input v-model="replyText" type="textarea" :rows="4" placeholder="填写给客户的回复（会标记为已处理）" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button :loading="replyLoading" type="primary" @click="submitReply">提交回复</el-button>
        <el-button @click="replyOpen = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { grantPoints, listFeedback, handleFeedback, listRecover, handleRecover } from '@/api/studyroom/points'
import { listUser } from '@/api/member/user'

export default {
  name: 'PointsAdmin',
  data() {
    return {
      activeTab: 'grant',
      loading: false,
      // 积分发放
      grantLoading: false,
      userOptions: [],
      grantForm: { userId: undefined, points: 10, remark: '' },
      // 反馈
      feedbackStatus: undefined,
      feedbackList: [],
      replyOpen: false,
      replyLoading: false,
      replyRow: {},
      replyText: '',
      // 补签
      recoverStatus: undefined,
      recoverList: []
    }
  },
  created() {
    this.loadUsers()
    this.loadFeedback()
    this.loadRecover()
  },
  methods: {
    onTabChange() {
      if (this.activeTab === 'feedback') this.loadFeedback()
      if (this.activeTab === 'recover') this.loadRecover()
    },
    loadUsers() {
      listUser({ pageNum: 1, pageSize: 500 }).then(res => {
        this.userOptions = (res.rows || []).filter(u => u.userId)
      }).catch(() => {})
    },
    submitGrant() {
      if (!this.grantForm.userId) return this.$modal.msgWarning('请选择会员')
      if (!this.grantForm.points) return this.$modal.msgWarning('请填写积分数量')
      const user = this.userOptions.find(u => String(u.userId) === String(this.grantForm.userId)) || {}
      this.$confirm('确定为「' + (user.nickname || this.grantForm.userId) + '」'
        + (this.grantForm.points > 0 ? '发放 ' : '扣减 ') + Math.abs(this.grantForm.points) + ' 积分？', '确认', {
        type: 'warning'
      }).then(() => {
        this.grantLoading = true
        return grantPoints({
          userId: this.grantForm.userId,
          points: this.grantForm.points,
          remark: this.grantForm.remark || '后台手工调整'
        }).then(() => {
          this.$modal.msgSuccess('已' + (this.grantForm.points > 0 ? '发放' : '扣减') + ' ' + Math.abs(this.grantForm.points) + ' 积分')
          this.grantForm.remark = ''
        })
      }).catch(() => {}).finally(() => { this.grantLoading = false })
    },
    resetGrant() {
      this.grantForm = { userId: undefined, points: 10, remark: '' }
    },
    loadFeedback() {
      this.loading = true
      listFeedback({ status: this.feedbackStatus }).then(res => {
        this.feedbackList = res.data || []
      }).catch(() => {
        this.feedbackList = []
      }).finally(() => { this.loading = false })
    },
    openReply(row) {
      this.replyRow = row
      this.replyText = row.reply || ''
      this.replyOpen = true
    },
    submitReply() {
      if (!this.replyText.trim()) return this.$modal.msgWarning('请填写回复内容')
      this.replyLoading = true
      handleFeedback({ id: String(this.replyRow.id), reply: this.replyText.trim() }).then(() => {
        this.$modal.msgSuccess('已回复并标记为已处理')
        this.replyOpen = false
        this.loadFeedback()
      }).catch(err => {
        this.$modal.msgError('提交失败: ' + ((err && (err.msg || err.message)) || '未知错误'))
      }).finally(() => { this.replyLoading = false })
    },
    loadRecover() {
      this.loading = true
      listRecover({ status: this.recoverStatus }).then(res => {
        this.recoverList = res.data || []
      }).catch(() => {
        this.recoverList = []
      }).finally(() => { this.loading = false })
    },
    recoverLabel(s) {
      if (s === 0) return '待处理'
      if (s === 1) return '已通过'
      if (s === 2) return '已驳回'
      return '未知'
    },
    recoverTag(s) {
      if (s === 1) return 'success'
      if (s === 2) return 'info'
      return 'warning'
    },
    handleRecoverRow(row, pass) {
      const title = pass ? '通过补签申请' : '驳回补签申请'
      this.$prompt(pass ? '通过后将给该会员补发当天积分并恢复连续签到，可填写备注' : '请填写驳回原因（会展示处理记录）', title, {
        confirmButtonText: pass ? '确认通过' : '确认驳回',
        cancelButtonText: '取消',
        inputPlaceholder: pass ? '如: 已核实漏签，予以补发' : '如: 未提供有效凭证'
      }).then(({ value }) => {
        return handleRecover({ id: String(row.id), pass: pass, remark: value || '' }).then(() => {
          this.$modal.msgSuccess(pass ? '已通过并补发积分' : '已驳回')
          this.loadRecover()
        })
      }).catch(() => {})
    }
  }
}
</script>
