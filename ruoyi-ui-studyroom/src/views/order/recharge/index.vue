<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="订单编号" prop="orderId">
        <el-input v-model="queryParams.orderId" placeholder="请输入订单编号" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="会员" prop="userId">
        <el-select v-model="queryParams.userId" filterable clearable placeholder="搜索昵称/手机号选择会员" @change="handleQuery">
          <el-option v-for="u in userOptions" :key="u.userId" :label="(u.nickname || ('用户' + u.userId)) + (u.phone ? '（' + u.phone + '）' : '')" :value="u.userId" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品描述" prop="description">
        <el-input v-model="queryParams.description" placeholder="请输入商品描述" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="支付金额" prop="amountTotal">
        <el-input v-model="queryParams.amountTotal" placeholder="请输入支付金额" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="充值额度" prop="rechargeTotal">
        <el-input v-model="queryParams.rechargeTotal" placeholder="请输入充值额度" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="付款状态" prop="payStatus">
        <el-select v-model="queryParams.payStatus" placeholder="请选择付款状态" clearable>
          <el-option v-for="dict in dict.type.pay_status" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['order:recharge:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['order:recharge:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['order:recharge:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['order:recharge:export']">导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="rechargeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="用户" align="center" min-width="110" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span>{{ scope.row.userNickname || '用户#' + scope.row.userId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="手机号" align="center" prop="userPhone" min-width="110" :show-overflow-tooltip="true" />
      <el-table-column label="充值时间" align="center" width="150">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="商品描述" align="center" prop="description" min-width="100" :show-overflow-tooltip="true" />
      <el-table-column label="支付金额" align="center" min-width="90" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span>{{ scope.row.amountTotal != null ? '¥' + scope.row.amountTotal : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="到账额度" align="center" min-width="90" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span>{{ scope.row.rechargeTotal != null ? scope.row.rechargeTotal + '点' : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="付款状态" align="center" prop="payStatus">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.pay_status" :value="scope.row.payStatus" />
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="120" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['order:recharge:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['order:recharge:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改充值订单对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="订单编号" prop="orderId">
          <el-input v-model="form.orderId" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="会员" prop="userId">
          <el-select v-model="form.userId" filterable clearable placeholder="搜索昵称/手机号选择会员" style="width: 100%;">
            <el-option v-for="u in userOptions" :key="u.userId" :label="(u.nickname || ('用户' + u.userId)) + (u.phone ? '（' + u.phone + '）' : '')" :value="u.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入商品描述" />
        </el-form-item>
        <el-form-item label="支付金额" prop="amountTotal">
          <el-input v-model="form.amountTotal" placeholder="请输入支付金额" />
        </el-form-item>
        <el-form-item label="充值额度" prop="rechargeTotal">
          <el-input v-model="form.rechargeTotal" placeholder="请输入充值额度" />
        </el-form-item>
        <el-form-item label="付款状态">
          <el-radio-group v-model="form.payStatus">
            <el-radio v-for="dict in dict.type.pay_status" :key="dict.value" :label="parseInt(dict.value)">
              {{dict.label}}</el-radio>
          </el-radio-group>
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
  import {
    listRecharge,
    getRecharge,
    delRecharge,
    addRecharge,
    updateRecharge
  } from "@/api/order/recharge";
  import { listUser } from "@/api/member/user";

  export default {
    name: "Recharge",
    dicts: ['pay_status'],
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
        // 充值订单表格数据
        rechargeList: [],
        // 弹出层标题
        title: "",
        // 是否显示弹出层
        open: false,
        // 会员下拉选项
        userOptions: [],
        // 查询参数
        queryParams: {
          pageNum: 1,
          pageSize: 10,
          orderId: undefined,
          userId: undefined,
          description: undefined,
          amountTotal: undefined,
          rechargeTotal: undefined,
          payStatus: undefined,
        },
        // 表单参数
        form: {},
        // 表单校验
        rules: {
          id: [{
            required: true,
            message: "主键不能为空",
            trigger: "blur"
          }],
          orderId: [{
            required: true,
            message: "订单编号不能为空",
            trigger: "blur"
          }],
          userId: [{
            required: true,
            message: "请选择会员",
            trigger: "change"
          }],
          description: [{
            required: true,
            message: "商品描述不能为空",
            trigger: "blur"
          }],
          amountTotal: [{
            required: true,
            message: "支付金额不能为空",
            trigger: "blur"
          }],
          rechargeTotal: [{
            required: true,
            message: "充值额度不能为空",
            trigger: "blur"
          }],
          payStatus: [{
            required: true,
            message: "付款状态不能为空",
            trigger: "blur"
          }],
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
      /** 查询充值订单列表 */
      getList() {
        this.loading = true;
        listRecharge(this.queryParams).then(response => {
          this.rechargeList = response.rows;
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
          orderId: undefined,
          userId: undefined,
          description: undefined,
          amountTotal: undefined,
          rechargeTotal: undefined,
          payStatus: 0,
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
        this.single = selection.length !== 1
        this.multiple = !selection.length
      },
      /** 新增按钮操作 */
      handleAdd() {
        this.reset();
        this.open = true;
        this.title = "添加充值订单";
      },
      /** 修改按钮操作 */
      handleUpdate(row) {
        this.loading = true;
        this.reset();
        const id = row.id || this.ids
        getRecharge(id).then(response => {
          this.loading = false;
          this.form = response.data;
          this.open = true;
          this.title = "修改充值订单";
        });
      },
      /** 提交按钮 */
      submitForm() {
        this.$refs["form"].validate(valid => {
          if (valid) {
            this.buttonLoading = true;
            if (this.form.id != null) {
              updateRecharge(this.form).then(response => {
                this.$modal.msgSuccess("修改成功");
                this.open = false;
                this.getList();
              }).finally(() => {
                this.buttonLoading = false;
              });
            } else {
              addRecharge(this.form).then(response => {
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
        this.$modal.confirm('是否确认删除充值订单编号为"' + ids + '"的数据项？').then(() => {
          this.loading = true;
          return delRecharge(ids);
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
        this.download('order/recharge/export', {
          ...this.queryParams
        }, `recharge_${new Date().getTime()}.xlsx`)
      }
    }
  };
</script>
