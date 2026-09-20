<template>
  <div class="app-container">
    <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px;"
      title="生成的兑换码给客户在小程序「我的 → 兑换码兑换」输入即可领卡；卡片有效期从客户「首次预约使用」起算（买来不用不会过期）。" />

    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="卡券">
        <el-select v-model="queryParams.cardId" placeholder="全部卡券" clearable style="width: 190px" @change="handleQuery">
          <el-option v-for="c in cardOptions" :key="c.id" :label="c.cardTitle" :value="String(c.id)" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px" @change="handleQuery">
          <el-option label="未使用" :value="0" />
          <el-option label="已使用" :value="1" />
          <el-option label="已作废" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="兑换码">
        <el-input v-model="queryParams.code" placeholder="精确查询" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="兑换人">
        <el-input v-model="queryParams.usedByNickname" placeholder="昵称关键字" clearable style="width: 150px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-magic-stick" size="mini" @click="openGenerate">批量生成兑换码</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-tag type="info" style="margin-top:4px;">共 {{ total }} 个兑换码</el-tag>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" size="small">
      <el-table-column label="兑换码" width="140" align="center">
        <template slot-scope="scope">
          <b style="font-family: monospace; font-size: 14px;">{{ scope.row.code }}</b>
          <el-button type="text" size="mini" @click="copyText(scope.row.code)">复制</el-button>
        </template>
      </el-table-column>
      <el-table-column label="卡券" min-width="150">
        <template slot-scope="scope">{{ scope.row.cardTitle || cardLabel(scope.row.cardId) }}</template>
      </el-table-column>
      <el-table-column label="兑换后有效" width="120" align="center">
        <template slot-scope="scope">{{ scope.row.term ? scope.row.term + ' 天' : '按卡面' }}</template>
      </el-table-column>
      <el-table-column label="兑换码有效期" width="150" align="center">
        <template slot-scope="scope">{{ scope.row.expireTime ? String(scope.row.expireTime).slice(0, 16) : '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="scope">
          <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="兑换人" min-width="120">
        <template slot-scope="scope">{{ scope.row.usedByNickname || scope.row.ownerNickname || '-' }}</template>
      </el-table-column>
      <el-table-column label="兑换时间" width="150" align="center">
        <template slot-scope="scope">{{ scope.row.usedTime ? String(scope.row.usedTime).slice(0, 16) : '-' }}</template>
      </el-table-column>
      <el-table-column label="备注" min-width="120" show-overflow-tooltip>
        <template slot-scope="scope">{{ scope.row.remark || '-' }}</template>
      </el-table-column>
      <el-table-column label="生成时间" width="150" align="center">
        <template slot-scope="scope">{{ scope.row.createTime ? String(scope.row.createTime).slice(0, 16) : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right" align="center">
        <template slot-scope="scope">
          <el-button v-if="scope.row.status === 0" type="text" size="mini" style="color:#E6A23C;"
            @click="handleInvalidate(scope.row)">作废</el-button>
          <el-button type="text" size="mini" style="color:#F56C6C;" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 批量生成 -->
    <el-dialog title="批量生成兑换码" :visible.sync="genOpen" width="540px" append-to-body>
      <el-form :model="genForm" ref="genForm" label-width="120px" size="small">
        <el-form-item label="卡券" required>
          <el-select v-model="genForm.cardId" filterable placeholder="选择要生成的卡券" style="width: 100%;">
            <el-option v-for="c in sellableCards" :key="c.id"
              :label="c.cardTitle + (c.price != null ? '（￥' + c.price + '）' : '') + (c.term ? ' · ' + c.term + '天' : '')"
              :value="String(c.id)" />
          </el-select>
        </el-form-item>
        <el-form-item label="生成数量">
          <el-input-number v-model="genForm.count" :min="1" :max="200" />
          <span style="color:#909399;font-size:12px;margin-left:8px;">一次最多 200 个</span>
        </el-form-item>
        <el-form-item label="兑换后有效天数">
          <el-input-number v-model="genForm.term" :min="1" :max="999" />
          <span style="color:#909399;font-size:12px;margin-left:8px;">留空按卡面天数</span>
        </el-form-item>
        <el-form-item label="兑换码有效期">
          <el-input-number v-model="genForm.expireDays" :min="1" :max="3650" />
          <span style="color:#909399;font-size:12px;margin-left:8px;">天，过期后不能再兑换</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="genForm.remark" placeholder="如: 抖音团购核销 / 活动赠卡 / 朋友圈活动" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button :loading="genLoading" type="primary" @click="submitGenerate">生成</el-button>
        <el-button @click="genOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 生成结果 -->
    <el-dialog title="已生成兑换码" :visible.sync="resultOpen" width="540px" append-to-body>
      <el-alert type="success" :closable="false" :title="'共生成 ' + resultCodes.length + ' 个，可复制发给客户'" style="margin-bottom: 10px;" />
      <el-input type="textarea" :rows="10" :value="resultCodes.join('\n')" readonly />
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="copyText(resultCodes.join('\n'))">复制全部</el-button>
        <el-button @click="resultOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listCardRedeem, batchGenerateCardRedeem, invalidateCardRedeem, delCardRedeem } from '@/api/studyroom/cardRedeem'
import { listCard } from '@/api/store/card'

export default {
  name: 'CardRedeemAdmin',
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      list: [],
      cardOptions: [],
      queryParams: { pageNum: 1, pageSize: 10, cardId: undefined, status: undefined, code: undefined, usedByNickname: undefined },
      genOpen: false,
      genLoading: false,
      genForm: { cardId: undefined, count: 1, term: undefined, expireDays: 365, remark: '' },
      resultOpen: false,
      resultCodes: []
    }
  },
  computed: {
    sellableCards() {
      return (this.cardOptions || []).filter(c => c.status === undefined || c.status === 1)
    }
  },
  created() {
    this.loadCards()
    this.getList()
  },
  methods: {
    cardLabel(cardId) {
      const c = (this.cardOptions || []).find(x => String(x.id) === String(cardId))
      return c ? c.cardTitle : ('卡' + cardId)
    },
    statusLabel(s) {
      if (s === 0) return '未使用'
      if (s === 1) return '已使用'
      if (s === 2) return '已作废'
      return '未知'
    },
    statusTag(s) {
      if (s === 0) return 'success'
      if (s === 1) return 'info'
      return 'danger'
    },
    copyText(text) {
      const t = String(text || '')
      if (!t) return
      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(t).then(() => this.$modal.msgSuccess('已复制'), () => this.$modal.msgWarning('复制失败，请手动选择复制'))
          return
        }
      } catch (e) {}
      const ta = document.createElement('textarea')
      ta.value = t
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        this.$modal.msgSuccess('已复制')
      } catch (e) {
        this.$modal.msgWarning('复制失败，请手动选择复制')
      }
      document.body.removeChild(ta)
    },
    loadCards() {
      listCard({ pageNum: 1, pageSize: 100 }).then(res => {
        this.cardOptions = res.rows || []
      })
    },
    getList() {
      this.loading = true
      listCardRedeem(this.queryParams).then(res => {
        this.list = res.rows || []
        this.total = res.total || 0
      }).finally(() => { this.loading = false })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.cardId = undefined
      this.queryParams.status = undefined
      this.handleQuery()
    },
    openGenerate() {
      if (!this.sellableCards.length) {
        this.$modal.msgWarning('没有可用的卡券，请先在「卡券管理」里添加并启用')
        return
      }
      this.genForm = { cardId: undefined, count: 1, term: undefined, expireDays: 365, remark: '' }
      this.genOpen = true
    },
    submitGenerate() {
      if (!this.genForm.cardId) {
        this.$modal.msgWarning('请选择卡券')
        return
      }
      const card = this.sellableCards.find(c => String(c.id) === String(this.genForm.cardId))
      const payload = {
        cardId: this.genForm.cardId,
        count: this.genForm.count,
        expireDays: this.genForm.expireDays,
        remark: this.genForm.remark
      }
      if (this.genForm.term) {
        payload.term = this.genForm.term
      } else if (card && card.term) {
        payload.term = card.term
      }
      this.genLoading = true
      batchGenerateCardRedeem(payload).then(res => {
        const rows = res.data || []
        this.resultCodes = rows.map(r => r.code)
        this.genOpen = false
        this.resultOpen = true
        this.getList()
      }).catch(err => {
        this.$modal.msgError('生成失败: ' + ((err && (err.msg || err.message)) || '未知错误'))
      }).finally(() => { this.genLoading = false })
    },
    handleInvalidate(row) {
      this.$prompt('请输入作废原因', '作废兑换码 ' + row.code, {
        confirmButtonText: '确认作废', cancelButtonText: '取消', inputPlaceholder: '如: 发错了 / 客户已退款'
      }).then(({ value }) => {
        return invalidateCardRedeem(row.id, value || '后台作废').then(() => {
          this.$modal.msgSuccess('已作废')
          this.getList()
        })
      }).catch(() => {})
    },
    handleDelete(row) {
      this.$modal.confirm('确认删除兑换码 ' + row.code + ' ？删除后无法恢复').then(() => {
        return delCardRedeem(row.id)
      }).then(() => {
        this.$modal.msgSuccess('已删除')
        this.getList()
      }).catch(() => {})
    }
  }
}
</script>
