<template>
  <div class="app-container">
    <!-- 说明: 卡预约(日卡/周卡/月卡)不写订单表, 在「订单管理-预约管理」里看不到, 用本页查询 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="预约日期">
        <el-date-picker v-model="dateRange" style="width: 240px" value-format="YYYY-MM-DD" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" :clearable="true"
          @change="getList" />
      </el-form-item>
      <el-form-item label="用户昵称" prop="nickname">
        <el-input v-model="queryParams.nickname" placeholder="昵称关键字" clearable style="width: 150px"
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="座位号" prop="seatNum">
        <el-input v-model="queryParams.seatNum" placeholder="如 22" clearable style="width: 90px"
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 110px" @change="getList">
          <el-option label="待使用" :value="0" />
          <el-option label="已使用" :value="1" />
          <el-option label="已失效" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-tag type="info" v-if="total > 0">共 {{ total }} 条预约记录</el-tag>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="预约日期" align="center" width="110">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.consumptionDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="用户昵称" align="center" min-width="130" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span>{{ scope.row.nickname || ('用户' + scope.row.userId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="手机号" align="center" prop="phone" width="120">
        <template slot-scope="scope">
          <span>{{ scope.row.phone || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="座位号" align="center" width="90">
        <template slot-scope="scope">
          <span>{{ scope.row.seatNum ? scope.row.seatNum + ' 号' : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="自习室" align="center" prop="roomName" min-width="120" :show-overflow-tooltip="true" />
      <el-table-column label="使用卡券" align="center" prop="cardTitle" min-width="110" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span>{{ scope.row.cardTitle || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="90">
        <template slot-scope="scope">
          <el-tag :type="statusTag(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="签到开灯" align="center" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.checkInTime ? parseTime(scope.row.checkInTime) : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预约提交时间" align="center" width="150">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script>
import { listBooking } from '@/api/studyroom/booking'

export default {
  name: 'StudyroomBooking',
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      list: [],
      dateRange: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        beginDate: null,
        endDate: null,
        nickname: null,
        seatNum: null,
        status: null
      }
    }
  },
  created() {
    // 默认查今天: 想确认"某天客户约成功没", 改日期即可
    const today = this.parseTime(new Date(), '{y}-{m}-{d}')
    this.dateRange = [today, today]
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      const params = Object.assign({}, this.queryParams)
      if (this.dateRange && this.dateRange.length === 2) {
        params.beginDate = this.dateRange[0]
        params.endDate = this.dateRange[1]
      } else {
        params.beginDate = null
        params.endDate = null
      }
      listBooking(params).then(res => {
        this.list = res.rows || []
        this.total = res.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    statusLabel(status) {
      if (status === 1) return '已使用'
      if (status === 2) return '已失效'
      return '待使用'
    },
    statusTag(status) {
      if (status === 1) return 'success'
      if (status === 2) return 'info'
      return 'warning'
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.dateRange = []
      this.$refs['queryForm'].resetFields()
      this.queryParams.beginDate = null
      this.queryParams.endDate = null
      this.queryParams.pageNum = 1
      this.getList()
    }
  }
}
</script>
