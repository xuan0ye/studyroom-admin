<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
                  <el-form-item label="自习室" prop="roomId">
                    <el-select
                        v-model="queryParams.roomId"
                        filterable
                        clearable
                        placeholder="搜索名称选择自习室"
                        @change="handleQuery"
                    >
                      <el-option
                          v-for="r in roomOptions"
                          :key="r.roomId"
                          :label="r.roomName"
                          :value="r.roomId"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="座位ID" prop="seatId">
                    <el-input
                        v-model="queryParams.seatId"
                        placeholder="请输入座位ID"
                        clearable
                        @keyup.enter.native="handleQuery"
                    />
                  </el-form-item>
                  <el-form-item label="会员" prop="userId">
                    <el-select
                        v-model="queryParams.userId"
                        filterable
                        clearable
                        placeholder="搜索昵称/手机号选择会员"
                        @change="handleQuery"
                    >
                      <el-option
                          v-for="u in userOptions"
                          :key="u.userId"
                          :label="(u.nickname || ('用户' + u.userId)) + (u.phone ? '（' + u.phone + '）' : '')"
                          :value="u.userId"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="开始时间" prop="startTime">
                    <el-date-picker clearable
                                    v-model="queryParams.startTime"
                                    type="date"
                                    value-format="yyyy-MM-dd"
                                    placeholder="请选择开始时间">
                    </el-date-picker>
                  </el-form-item>
                  <el-form-item label="结束时间" prop="endTime">
                    <el-date-picker clearable
                                    v-model="queryParams.endTime"
                                    type="date"
                                    value-format="yyyy-MM-dd"
                                    placeholder="请选择结束时间">
                    </el-date-picker>
                  </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
            type="primary"
            plain
            icon="el-icon-plus"
            size="mini"
            @click="handleAdd"
            v-hasPermi="['studyroom:seatRecord:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="success"
            plain
            icon="el-icon-edit"
            size="mini"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['studyroom:seatRecord:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"
            plain
            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['studyroom:seatRecord:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
            v-hasPermi="['studyroom:seatRecord:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="seatRecordList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="用户" align="center" min-width="110" :show-overflow-tooltip="true">
                <template slot-scope="scope">
                  <span>{{ scope.row.userName || '用户#' + scope.row.userId }}</span>
                </template>
              </el-table-column>
              <el-table-column label="手机号" align="center" prop="userPhone" min-width="110" :show-overflow-tooltip="true" />
              <el-table-column label="自习室" align="center" prop="roomName" min-width="110" :show-overflow-tooltip="true" />
              <el-table-column label="座位号" align="center" min-width="80" :show-overflow-tooltip="true">
                <template slot-scope="scope">
                  <span>{{ scope.row.seatNum != null ? scope.row.seatNum + '号' : '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="区域" align="center" prop="areaName" min-width="80" :show-overflow-tooltip="true" />
              <el-table-column label="开始时间" align="center" width="150">
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="结束时间" align="center" width="150">
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="预约时长" align="center" min-width="90">
                <template slot-scope="scope">
                  <span>{{ scope.row.startTime && scope.row.endTime ? hoursBetween(scope.row.startTime, scope.row.endTime) + '小时' : '-' }}</span>
                </template>
              </el-table-column>
      <el-table-column label="操作" fixed="right" width="120" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['studyroom:seatRecord:edit']"
          >修改</el-button>
          <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['studyroom:seatRecord:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
    />

    <!-- 添加或修改座位-记录对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
                    <el-form-item label="自习室" prop="roomId">
                      <el-select v-model="form.roomId" filterable clearable placeholder="搜索名称选择自习室" style="width: 100%;">
                        <el-option
                            v-for="r in roomOptions"
                            :key="r.roomId"
                            :label="r.roomName"
                            :value="r.roomId"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="座位ID" prop="seatId">
                      <el-input v-model="form.seatId" placeholder="请输入座位ID" />
                    </el-form-item>
                    <el-form-item label="会员" prop="userId">
                      <el-select v-model="form.userId" filterable clearable placeholder="搜索昵称/手机号选择会员" style="width: 100%;">
                        <el-option
                            v-for="u in userOptions"
                            :key="u.userId"
                            :label="(u.nickname || ('用户' + u.userId)) + (u.phone ? '（' + u.phone + '）' : '')"
                            :value="u.userId"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="开始时间" prop="startTime">
                      <el-date-picker clearable
                                      v-model="form.startTime"
                                      type="datetime"
                                      value-format="yyyy-MM-dd HH:mm:ss"
                                      placeholder="请选择开始时间">
                      </el-date-picker>
                    </el-form-item>
                    <el-form-item label="结束时间" prop="endTime">
                      <el-date-picker clearable
                                      v-model="form.endTime"
                                      type="datetime"
                                      value-format="yyyy-MM-dd HH:mm:ss"
                                      placeholder="请选择结束时间">
                      </el-date-picker>
                    </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import { listSeatRecord, getSeatRecord, delSeatRecord, addSeatRecord, updateSeatRecord } from "@/api/studyroom/seatRecord";
  import { listRoom } from "@/api/store/room";
  import { listUser } from "@/api/member/user";

  export default {
    name: "SeatRecord",
    data() {
      return {
        // 按钮loading
        buttonLoading: false,
        // 遮罩层
        loading: true,
        // 选中数组
        ids: [],
        // 非单个禁用
        single: true,
        // 非多个禁用
        multiple: true,
        // 显示搜索条件
        showSearch: true,
        // 总条数
        total: 0,
        // 座位-记录表格数据
              seatRecordList: [],
        // 弹出层标题
        title: "",
        // 是否显示弹出层
        open: false,
        // 会员/自习室下拉选项
        userOptions: [],
        roomOptions: [],
        // 查询参数
        queryParams: {
          pageNum: 1,
          pageSize: 10,
                        roomId: undefined,
                        seatId: undefined,
                        userId: undefined,
                        startTime: undefined,
                        endTime: undefined,
        },
        // 表单参数
        form: {},
        // 表单校验
        rules: {
                        id: [
                    { required: true, message: "主键ID不能为空", trigger: "blur" }
                  ],
                        roomId: [
                    { required: true, message: "请选择自习室", trigger: "change" }
                  ],
                        seatId: [
                    { required: true, message: "座位ID不能为空", trigger: "blur" }
                  ],
                        userId: [
                    { required: true, message: "请选择会员", trigger: "change" }
                  ],
                        startTime: [
                    { required: true, message: "开始时间不能为空", trigger: "blur" }
                  ],
                        endTime: [
                    { required: true, message: "结束时间不能为空", trigger: "blur" }
                  ],
        }
      };
    },
    created() {
      this.getList();
      this.loadUsers();
      this.loadRooms();
    },
    methods: {
      /** 加载会员下拉选项 */
      loadUsers() {
        listUser({ pageNum: 1, pageSize: 500 }).then(res => {
          this.userOptions = res.rows || [];
        });
      },
      /** 加载自习室下拉选项 */
      loadRooms() {
        listRoom({ pageNum: 1, pageSize: 100 }).then(res => {
          this.roomOptions = res.rows || [];
        });
      },
      /** 计算两个时间的小时差 */
      hoursBetween(start, end) {
        if (!start || !end) return '-';
        const diff = new Date(end).getTime() - new Date(start).getTime();
        if (diff <= 0) return '-';
        return Math.round(diff / 3600000 * 10) / 10;
      },
      /** 查询座位-记录列表 */
      getList() {
        this.loading = true;
        listSeatRecord(this.queryParams).then(response => {
          this.seatRecordList = response.rows;
          this.total = response.total;
          this.loading = false;
        });
      },
      // 取消按钮
      cancel() {
        this.open = false;
        this.reset();
      },
      // 表单重置
      reset() {
        this.form = {
                        id: undefined,
                        roomId: undefined,
                        seatId: undefined,
                        userId: undefined,
                        startTime: undefined,
                        endTime: undefined,
                        createBy: undefined,
                        createTime: undefined,
                        updateBy: undefined,
                        updateTime: undefined
        };
        this.resetForm("form");
      },
      /** 搜索按钮操作 */
      handleQuery() {
        this.queryParams.pageNum = 1;
        this.getList();
      },
      /** 重置按钮操作 */
      resetQuery() {
        this.resetForm("queryForm");
        this.handleQuery();
      },
      // 多选框选中数据
      handleSelectionChange(selection) {
        this.ids = selection.map(item => item.id)
        this.single = selection.length!==1
        this.multiple = !selection.length
      },
      /** 新增按钮操作 */
      handleAdd() {
        this.reset();
        this.open = true;
        this.title = "添加座位-记录";
      },
      /** 修改按钮操作 */
      handleUpdate(row) {
        this.loading = true;
        this.reset();
        const id = row.id || this.ids
        getSeatRecord(id).then(response => {
          this.loading = false;
          this.form = response.data;
          this.open = true;
          this.title = "修改座位-记录";
        });
      },
      /** 提交按钮 */
      submitForm() {
        this.$refs["form"].validate(valid => {
          if (valid) {
            this.buttonLoading = true;
            if (this.form.id != null) {
              updateSeatRecord(this.form).then(response => {
                this.$modal.msgSuccess("修改成功");
                this.open = false;
                this.getList();
              }).finally(() => {
                this.buttonLoading = false;
              });
            } else {
              addSeatRecord(this.form).then(response => {
                this.$modal.msgSuccess("新增成功");
                this.open = false;
                this.getList();
              }).finally(() => {
                this.buttonLoading = false;
              });
            }
          }
        });
      },
      /** 删除按钮操作 */
      handleDelete(row) {
        const ids = row.id || this.ids;
        this.$modal.confirm('是否确认删除座位-记录编号为"' + ids + '"的数据项？').then(() => {
          this.loading = true;
          return delSeatRecord(ids);
        }).then(() => {
          this.loading = false;
          this.getList();
          this.$modal.msgSuccess("删除成功");
        }).finally(() => {
          this.loading = false;
        });
      },
  /** 导出按钮操作 */
  handleExport() {
    this.download('studyroom/seatRecord/export', {
      ...this.queryParams
    }, `seatRecord_${new Date().getTime()}.xlsx`)
  }
  }
  };
</script>
