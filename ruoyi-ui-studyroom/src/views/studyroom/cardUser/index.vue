<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
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
                  <el-form-item label="卡片ID" prop="cardId">
                    <el-input
                        v-model="queryParams.cardId"
                        placeholder="请输入卡片ID"
                        clearable
                        @keyup.enter.native="handleQuery"
                    />
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
            v-hasPermi="['studyroom:cardUser:add']"
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
            v-hasPermi="['studyroom:cardUser:edit']"
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
            v-hasPermi="['studyroom:cardUser:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
            v-hasPermi="['studyroom:cardUser:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="cardUserList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="主键ID" align="center" prop="id" width="180" :show-overflow-tooltip="true" />
              <el-table-column label="用户" align="center" min-width="120">
                <template slot-scope="scope">{{ userLabel(scope.row.userId) }}</template>
              </el-table-column>
              <el-table-column label="卡券" align="center" min-width="150">
                <template slot-scope="scope">{{ cardLabel(scope.row.cardId) }}</template>
              </el-table-column>
              <el-table-column label="状态" align="center" width="110">
                <template slot-scope="scope">
                  <el-tag :type="stateOf(scope.row).type" size="mini">{{ stateOf(scope.row).text }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="剩余 / 到期" align="center" width="210">
                <template slot-scope="scope">{{ remainText(scope.row) }}</template>
              </el-table-column>
              <el-table-column label="锁座座位" align="center" width="130">
                <template slot-scope="scope">{{ seatText(scope.row) }}</template>
              </el-table-column>
      <el-table-column label="操作" fixed="right" width="170" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['studyroom:cardUser:edit']"
          >修改</el-button>
          <el-button
              size="mini"
              type="text"
              style="color:#F56C6C;"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['studyroom:cardUser:remove']"
          >删除卡券</el-button>
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

    <!-- 添加或修改优惠卡-会员关联对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
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
                    <el-form-item label="卡片ID" prop="cardId">
                      <el-input v-model="form.cardId" placeholder="请输入卡片ID" />
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
  import { listCardUser, getCardUser, delCardUser, addCardUser, updateCardUser } from "@/api/studyroom/cardUser";
  import { listUser } from "@/api/member/user";
  import { listCard } from "@/api/store/card";
  import { listSeat } from "@/api/store/seat";
  import { listBooking } from "@/api/studyroom/booking";
  import { adminRevokeCard } from "@/api/studyroom/admin";

  export default {
    name: "CardUser",
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
        // 优惠卡-会员关联表格数据
              cardUserList: [],
        // 弹出层标题
        title: "",
        // 是否显示弹出层
        open: false,
        // 会员下拉选项
        userOptions: [],
        // 关联展示用(昵称/卡券名/座位号/是否已用过)
        userMap: {},
        cardMap: {},
        cardTermMap: {},
        seatMap: {},
        usedCardIds: {},
        // 查询参数
        queryParams: {
          pageNum: 1,
          pageSize: 10,
                        userId: undefined,
                        cardId: undefined,
        },
        // 表单参数
        form: {},
        // 表单校验
        rules: {
                        id: [
                    { required: true, message: "主键ID不能为空", trigger: "blur" }
                  ],
                        userId: [
                    { required: true, message: "请选择会员", trigger: "change" }
                  ],
                        cardId: [
                    { required: true, message: "卡片ID不能为空", trigger: "blur" }
                  ],
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
      /** 查询优惠卡-会员关联列表 */
      getList() {
        this.loading = true;
        this.prepareRefs();
        listCardUser(this.queryParams).then(response => {
          this.cardUserList = response.rows;
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
                        userId: undefined,
                        cardId: undefined,
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
        this.title = "添加优惠卡-会员关联";
      },
      /** 修改按钮操作 */
      handleUpdate(row) {
        this.loading = true;
        this.reset();
        const id = row.id || this.ids
        getCardUser(id).then(response => {
          this.loading = false;
          this.form = response.data;
          this.open = true;
          this.title = "修改优惠卡-会员关联";
        });
      },
      /** 提交按钮 */
      submitForm() {
        this.$refs["form"].validate(valid => {
          if (valid) {
            this.buttonLoading = true;
            if (this.form.id != null) {
              updateCardUser(this.form).then(response => {
                this.$modal.msgSuccess("修改成功");
                this.open = false;
                this.getList();
              }).finally(() => {
                this.buttonLoading = false;
              });
            } else {
              addCardUser(this.form).then(response => {
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
      // ==================== 关联展示 + 安全删除 ====================
      /** 加载昵称/卡券名/座位号/哪些卡真正用过(前端关联, 不改后端字段) */
      async prepareRefs() {
        try {
          const [us, cd, st, bk] = await Promise.all([
            listUser({ pageNum: 1, pageSize: 500 }),
            listCard({ pageNum: 1, pageSize: 100 }),
            listSeat({ pageNum: 1, pageSize: 100 }),
            listBooking({ pageNum: 1, pageSize: 500 })
          ]);
          const um = {}, cm = {}, tm = {}, sm = {}, used = {};
          (us.rows || []).forEach(u => { um[String(u.userId)] = u });
          (cd.rows || []).forEach(c => { cm[String(c.id)] = c.cardTitle; tm[String(c.id)] = c.term });
          (st.rows || []).forEach(s => { sm[String(s.seatId)] = s.seatNum });
          (bk.rows || []).forEach(b => { if (b.cardUserId && b.status !== 2) used[String(b.cardUserId)] = true });
          this.userMap = um; this.cardMap = cm; this.cardTermMap = tm; this.seatMap = sm; this.usedCardIds = used;
        } catch (e) {}
      },
      ts(v) {
        if (!v) return 0;
        const t = new Date(String(v).replace(/-/g, '/')).getTime();
        return isNaN(t) ? 0 : t;
      },
      userLabel(userId) {
        const u = this.userMap[String(userId)] || {};
        return (u.nickname || ('用户' + userId)) + (u.phone ? '（' + u.phone + '）' : '');
      },
      cardLabel(cardId) {
        return this.cardMap[String(cardId)] || ('卡' + cardId);
      },
      stateOf(row) {
        const now = Date.now();
        if (row.lockSeatId && this.ts(row.lockEndTime) > now) return { text: '锁座中', type: 'warning' };
        if (row.expiryTime && this.ts(row.expiryTime) < now) return { text: '已过期', type: 'info' };
        if (this.usedCardIds[String(row.id)]) return { text: '使用中', type: 'warning' };
        return { text: '待使用', type: 'success' };
      },
      remainText(row) {
        const used = !!this.usedCardIds[String(row.id)];
        const now = Date.now();
        let remain;
        if (!used) {
          remain = this.cardTermMap[String(row.cardId)] || row.remainingDays || 0;
        } else if (row.expiryTime) {
          remain = Math.max(0, Math.ceil((this.ts(row.expiryTime) - now) / 86400000));
        } else {
          remain = row.remainingDays || 0;
        }
        const exp = row.expiryTime ? String(row.expiryTime).slice(0, 16) : '不过期(待使用)';
        return remain + ' 天 ／ ' + exp;
      },
      seatText(row) {
        if (!row.lockSeatId) return '-';
        const num = this.seatMap[String(row.lockSeatId)] || '?';
        const until = row.lockEndTime ? String(row.lockEndTime).slice(0, 16) : '';
        return num + ' 号' + (until ? ' 至 ' + until : '');
      },
      /** 删除按钮操作: 走后台安全删除(释放锁座与占座、作废预约记录、撤销门禁) */
      handleDelete(row) {
        const rows = (row && row.id) ? [row] : this.cardUserList.filter(r => this.ids.indexOf(r.id) >= 0);
        if (!rows.length) {
          this.$modal.msgWarning('请先勾选要删除的卡券');
          return;
        }
        const who = rows.length === 1
          ? ('「' + this.userLabel(rows[0].userId) + '」的「' + this.cardLabel(rows[0].cardId) + '」')
          : (rows.length + ' 张卡券');
        this.$prompt('请输入删除原因（会记入日志，方便日后对账）', '删除 ' + who, {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          inputPlaceholder: '如: 客户申请删除 / 发错了 / 测试数据',
          inputValidator: v => (v && v.trim() ? true : '请填写删除原因'),
          type: 'warning'
        }).then(({ value }) => {
          const reason = value.trim();
          this.loading = true;
          const jobs = rows.map(r => adminRevokeCard({ cardUserId: String(r.id), reason: reason }));
          return Promise.all(jobs).then(resList => {
            const msg = resList.map(r => (r && (r.data || r.msg)) || '已删除').join('；');
            this.$modal.msgSuccess(msg.length > 150 ? ('已删除 ' + rows.length + ' 张卡券') : msg);
            this.getList();
          }).catch(err => {
            this.$modal.msgError('删除失败: ' + ((err && (err.msg || err.message)) || '未知错误'));
          }).finally(() => { this.loading = false; });
        }).catch(() => {});
      },
      /** 删除按钮操作(旧版直删, 已改为安全删除, 保留方法名兼容) */
      legacyDelete(row) {
        const ids = row.id || this.ids;
        this.$modal.confirm('是否确认删除优惠卡-会员关联编号为"' + ids + '"的数据项？').then(() => {
          this.loading = true;
          return delCardUser(ids);
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
    this.download('studyroom/cardUser/export', {
      ...this.queryParams
    }, `cardUser_${new Date().getTime()}.xlsx`)
  }
  }
  };
</script>
