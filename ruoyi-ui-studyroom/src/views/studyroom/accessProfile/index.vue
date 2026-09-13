<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="门禁名" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入门禁名" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="会员" prop="userId">
        <el-select v-model="queryParams.userId" filterable clearable placeholder="搜索昵称/手机号选择会员" @change="handleQuery">
          <el-option v-for="u in userOptions" :key="u.userId" :label="(u.nickname || ('用户' + u.userId)) + (u.phone ? '（' + u.phone + '）' : '')" :value="u.userId" />
        </el-select>
      </el-form-item>
      <el-form-item label="同步状态" prop="syncStatus">
        <el-select v-model="queryParams.syncStatus" placeholder="请选择" clearable>
          <el-option label="未同步" :value="0" />
          <el-option label="已同步" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="撤销状态" prop="revokeStatus">
        <el-select v-model="queryParams.revokeStatus" placeholder="请选择" clearable>
          <el-option label="未撤销" :value="0" />
          <el-option label="已撤销" :value="1" />
          <el-option label="等待重试" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="accessProfileList">
      <el-table-column label="门禁名" align="center" prop="userName" min-width="120" :show-overflow-tooltip="true" />
      <el-table-column label="关联用户" align="center" min-width="110" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span>{{ scope.row.nickname || '用户#' + scope.row.userId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="手机号" align="center" prop="userPhone" min-width="110" :show-overflow-tooltip="true" />
      <el-table-column label="工号" align="center" prop="jobnumber" min-width="90" :show-overflow-tooltip="true" />
      <el-table-column label="座位号" align="center" min-width="80">
        <template slot-scope="scope">
          <span>{{ scope.row.seatNum != null ? scope.row.seatNum + '号' : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="区域" align="center" prop="areaName" min-width="80" :show-overflow-tooltip="true" />
      <el-table-column label="设备SN" align="center" prop="deviceSn" min-width="120" :show-overflow-tooltip="true" />
      <el-table-column label="有效期至" align="center" min-width="130">
        <template slot-scope="scope">
          <span>{{ scope.row.validity ? parseTime(scope.row.validity * 1000, '{y}-{m}-{d} {h}:{i}') : '长期' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="同步状态" align="center" min-width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.syncStatus === 1 ? 'success' : 'warning'" size="mini">
            {{ scope.row.syncStatus === 1 ? '已同步' : '未同步' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="撤销状态" align="center" min-width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.revokeStatus === 1 ? 'info' : (scope.row.revokeStatus === 2 ? 'danger' : 'success')" size="mini">
            {{ scope.row.revokeStatus === 1 ? '已撤销' : (scope.row.revokeStatus === 2 ? '待重试' : '有效') }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />
  </div>
</template>

<script>
import { listAccessProfile } from "@/api/studyroom/accessProfile";
import { listUser } from "@/api/member/user";

export default {
  name: "AccessProfile",
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      accessProfileList: [],
      userOptions: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: undefined,
        roomId: undefined,
        seatId: undefined,
        userName: undefined,
        syncStatus: undefined,
        revokeStatus: undefined
      }
    };
  },
  created() {
    this.getList();
    this.loadUsers();
  },
  methods: {
    /** 加载会员下拉选项 */
    loadUsers() {
      listUser({ pageNum: 1, pageSize: 500 }).then(res => {
        this.userOptions = res.rows || [];
      });
    },
    getList() {
      this.loading = true;
      listAccessProfile(this.queryParams).then(response => {
        this.accessProfileList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    }
  }
};
</script>
