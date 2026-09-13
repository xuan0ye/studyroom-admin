<template>
  <div class="app-container">
    <!-- 首页「热门活动」: 小程序 pages/index/index.vue 展示, 列表为空则整块不显示 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入活动标题" clearable style="width: 200px"
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
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
          v-hasPermi="['store:promo:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['store:promo:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['store:promo:remove']">删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="promoList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="排序" align="center" prop="sort" width="70" />
      <el-table-column label="配图" align="center" prop="imageUrl" width="110">
        <template slot-scope="scope">
          <image-preview v-if="scope.row.imageUrl" :src="scope.row.imageUrl" :width="60" :height="60" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="活动标题" align="center" prop="title" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="副标题" align="center" prop="subtitle" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="价格" align="center" width="150">
        <template slot-scope="scope">
          <span v-if="scope.row.price !== null && scope.row.price !== undefined">¥{{ scope.row.price }}</span>
          <span v-if="scope.row.priceUnit">{{ scope.row.priceUnit }}</span>
          <div v-if="scope.row.originalPrice" style="color:#999;text-decoration:line-through;font-size:12px;">
            原价 ¥{{ scope.row.originalPrice }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="角标" align="center" prop="tag" width="90" />
      <el-table-column label="跳转路径" align="center" prop="linkUrl" min-width="200" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" width="90">
        <template slot-scope="scope">
          <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0" active-color="#13ce66"
            @change="handleStatusChange(scope.row)" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['store:promo:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['store:promo:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改首页热门活动对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="620px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="活动标题" prop="title">
          <el-input v-model="form.title" placeholder="如: 双人同行上岸卡" />
        </el-form-item>
        <el-form-item label="副标题" prop="subtitle">
          <el-input v-model="form.subtitle" placeholder="如: 两人同行 · 每人100天 沉浸自习" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="现价(元)" prop="price">
              <el-input-number v-model="form.price" :precision="2" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原价(元)" prop="originalPrice">
              <el-input-number v-model="form.originalPrice" :precision="2" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="价格单位" prop="priceUnit">
              <el-input v-model="form.priceUnit" placeholder="如: 元/人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角标" prop="tag">
              <el-input v-model="form.tag" placeholder="如: 2人团" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="配图" prop="imageUrl">
          <image-upload v-model="form.imageUrl" :limit="1" url="/store/swiper/upload" />
          <div style="color:#909399;font-size:12px;">也可直接填图片地址(如 https://api.dayousuoan.top/upload/...)</div>
        </el-form-item>
        <el-form-item label="跳转路径" prop="linkUrl">
          <el-input v-model="form.linkUrl" placeholder="如: /other_pages/recharge-card/recharge-card" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" :controls="false" style="width: 100%" />
              <div style="color:#909399;font-size:12px;">数字越小越靠前</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">上架</el-radio>
                <el-radio :label="0">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="仅后台可见" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPromo, getPromo, addPromo, updatePromo, delPromo } from '@/api/store/promo'

export default {
  name: 'StorePromo',
  data() {
    return {
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
      // 首页热门活动表格数据
      promoList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: null,
        status: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        title: [{ required: true, message: '活动标题不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询首页热门活动列表 */
    getList() {
      this.loading = true
      listPromo(this.queryParams).then(response => {
        this.promoList = response.rows || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        title: null,
        subtitle: null,
        price: null,
        originalPrice: null,
        priceUnit: '元/人',
        tag: null,
        imageUrl: null,
        linkUrl: '/other_pages/recharge-card/recharge-card',
        sort: 1,
        status: 1,
        remark: null
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加热门活动'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getPromo(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改热门活动'
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (!valid) {
          return
        }
        if (this.form.id != null) {
          updatePromo(this.form).then(() => {
            this.$modal.msgSuccess('修改成功')
            this.open = false
            this.getList()
          })
        } else {
          addPromo(this.form).then(() => {
            this.$modal.msgSuccess('新增成功')
            this.open = false
            this.getList()
          })
        }
      })
    },
    /** 上架/下架(列表里直接切换) */
    handleStatusChange(row) {
      updatePromo({ id: row.id, status: row.status, title: row.title }).then(() => {
        this.$modal.msgSuccess(row.status === 1 ? '已上架' : '已下架')
      }).catch(() => {
        row.status = row.status === 1 ? 0 : 1
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除该活动？删除后小程序首页不再显示。').then(function () {
        return delPromo(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => { })
    }
  }
}
</script>
