<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- ==================== 页签1: 核销配置 ==================== -->
      <el-tab-pane label="核销配置" name="config">
        <el-form ref="configForm" :model="configForm" :rules="configRules" label-width="130px" size="small"
          style="max-width: 680px;">
          <el-form-item label="抖音 client_key" prop="clientKey">
            <el-input v-model="configForm.clientKey" placeholder="抖音开放平台应用的 client_key" clearable />
          </el-form-item>
          <el-form-item label="AppSecret" prop="clientSecret">
            <el-input v-model="configForm.clientSecret" type="password" show-password :placeholder="secretPlaceholder"
              clearable />
          </el-form-item>
          <el-form-item label="门店 poi_id" prop="poiId">
            <el-input v-model="configForm.poiId" placeholder="测试店铺绑定后填测试 poi，正式 poi 认领后替换" clearable />
          </el-form-item>
          <el-form-item label="是否启用">
            <el-switch v-model="configForm.enabled" active-value="1" inactive-value="0" active-text="启用"
              inactive-text="停用" />
          </el-form-item>
          <el-form-item label="SPI 验签开关">
            <el-switch v-model="configForm.spiVerifyEnabled" active-value="1" inactive-value="0" active-text="开启"
              inactive-text="关闭" />
            <span class="form-tip">拿到抖音官方验签算法后再开启</span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" :loading="configLoading" @click="handleSaveConfig">保存配置</el-button>
            <el-button size="small" :disabled="configLoading" @click="loadConfig">重新读取</el-button>
            <span class="form-tip">AppSecret 留空表示不修改</span>
          </el-form-item>
        </el-form>

        <el-alert type="info" :closable="false" show-icon title="核销能力接入说明" style="max-width: 680px;">
          <div class="alert-text">
            <div>核销能力三件套接口已就绪（验券 / 核销 / 撤销）。</div>
            <div>退款审核 SPI 地址：https://api.dayousuoan.top/goodlife/v1/fulfilment/refund/audit/</div>
            <div>回调场景：抖音请求三方系统退款审核 / Scope fulfilment.order.refund_apply</div>
            <div>
              当前密钥状态：
              <el-tag v-if="configMeta.hasSecret" type="success" size="mini">已配置（{{ configMeta.clientSecretMask }}）</el-tag>
              <el-tag v-else type="danger" size="mini">未配置</el-tag>
            </div>
          </div>
        </el-alert>
      </el-tab-pane>

      <!-- ==================== 页签2: 核销记录 ==================== -->
      <el-tab-pane label="核销记录" name="verify">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" clearable placeholder="全部" style="width: 140px;">
              <el-option label="全部" value="" />
              <el-option label="已核销" value="1" />
              <el-option label="已撤销" value="2" />
              <el-option label="异常" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="会员ID" prop="userId">
            <el-input v-model="queryParams.userId" placeholder="会员ID（可空）" clearable style="width: 180px;"
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="verifyList">
          <el-table-column label="ID" align="center" prop="id" width="80" />
          <el-table-column label="会员ID" align="center" prop="userId" width="100" />
          <el-table-column label="套餐名" align="center" prop="productTitle" min-width="180" :show-overflow-tooltip="true" />
          <el-table-column label="券ID" align="center" prop="certificateId" min-width="180" :show-overflow-tooltip="true" />
          <el-table-column label="核销时间" align="center" prop="verifyTime" width="160" />
          <el-table-column label="状态" align="center" width="90">
            <template slot-scope="scope">
              <el-tag :type="statusTagType(scope.row.status)" size="mini">{{ statusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="备注" align="center" prop="remark" min-width="180" :show-overflow-tooltip="true" />
          <el-table-column label="操作" fixed="right" width="110" align="center" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-tooltip :disabled="canCancel(scope.row)" :content="cancelTip(scope.row)" placement="top">
                <span>
                  <el-button size="mini" type="text" icon="el-icon-refresh-left"
                    :disabled="!canCancel(scope.row) || cancelLoading" @click="handleCancel(scope.row)">撤销核销</el-button>
                </span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total>0" :total="total" :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize" @pagination="getList" />
      </el-tab-pane>

      <!-- ==================== 页签3: 套餐映射 ==================== -->
      <el-tab-pane label="套餐映射" name="productMap">
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAddMap">新增映射</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button icon="el-icon-refresh" size="mini" :disabled="mapLoading" @click="loadProductMaps">刷新</el-button>
          </el-col>
        </el-row>

        <el-alert type="info" :closable="false" show-icon style="margin-bottom: 10px;">
          <div class="alert-text">
            <div>抖音团购商品ID/名称以抖音来客上架后为准；未配置映射时，核销成功默认发放「全天体验卡」（term=1）。</div>
          </div>
        </el-alert>

        <el-table v-loading="mapLoading" :data="productMapList">
          <el-table-column label="抖音商品ID" align="center" prop="productId" min-width="160" :show-overflow-tooltip="true" />
          <el-table-column label="抖音商品名关键词" align="center" prop="productTitle" min-width="180" :show-overflow-tooltip="true" />
          <el-table-column label="映射本地卡" align="center" min-width="180">
            <template slot-scope="scope">
              <span>{{ cardTitleById(scope.row.cardId) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="发放内容" align="center" min-width="170">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.grantType === 'balance'" type="success" size="mini">
                充值余额 ¥{{ scope.row.balanceAmount || 0 }}
              </el-tag>
              <span v-else>{{ cardTitleById(scope.row.cardId) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="每用户限一次" align="center" width="110">
            <template slot-scope="scope">
              <el-tag v-if="Number(scope.row.oncePerUser) === 1" type="danger" size="mini">限一次</el-tag>
              <span v-else>不限</span>
            </template>
          </el-table-column>
          <el-table-column label="锁座方式" align="center" width="110">
            <template slot-scope="scope">
              <el-tag :type="scope.row.lockMode === 'period' ? 'warning' : 'success'" size="mini">
                {{ lockModeText(scope.row.lockMode) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="备注" align="center" prop="remark" min-width="160" :show-overflow-tooltip="true" />
          <el-table-column label="操作" fixed="right" width="130" align="center" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdateMap(scope.row)">编辑</el-button>
              <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDeleteMap(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/修改套餐映射对话框 -->
    <el-dialog :title="mapTitle" :visible.sync="mapOpen" width="560px" append-to-body>
      <el-form ref="mapForm" :model="mapForm" :rules="mapRules" label-width="130px">
        <el-form-item label="抖音商品ID" prop="productId">
          <el-input v-model.trim="mapForm.productId" placeholder="抖音来客商品ID(数字)" clearable />
        </el-form-item>
        <el-form-item label="商品名关键词" prop="productTitle">
          <el-input v-model.trim="mapForm.productTitle" placeholder="抖音来客上的商品名称/关键词" clearable />
        </el-form-item>
        <el-form-item label="发放类型" prop="grantType">
          <el-select v-model="mapForm.grantType" placeholder="请选择核销后发放什么" style="width: 100%;">
            <el-option label="发放周期卡" value="card" />
            <el-option label="充值余额（代金券）" value="balance" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="mapForm.grantType === 'balance'" label="充值金额(元)" prop="balanceAmount">
          <el-input-number v-model="mapForm.balanceAmount" :min="1" :precision="0" placeholder="留空则按券面额自动识别"
            style="width: 220px;" />
          <span style="margin-left:10px;color:#909399;font-size:12px;">留空时自动取券名里的金额或券面额</span>
        </el-form-item>
        <el-form-item v-if="mapForm.grantType !== 'balance'" label="本地卡券" prop="cardId">
          <el-select v-model="mapForm.cardId" filterable placeholder="请选择核销后要发放的本地卡券" style="width: 100%;">
            <el-option v-for="c in cardOptions" :key="c.id" :label="cardLabel(c)" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="每用户限核销一次" prop="oncePerUser">
          <el-switch v-model="mapForm.oncePerUser" :active-value="1" :inactive-value="0" />
          <span style="margin-left:10px;color:#909399;font-size:12px;">开启后同一用户只能核销一次（防重复薅，如双周卡）</span>
        </el-form-item>
        <el-form-item label="锁座方式" prop="lockMode">
          <el-select v-model="mapForm.lockMode" placeholder="请选择锁座方式" style="width: 100%;">
            <el-option label="当天有效" value="day" />
            <el-option label="按卡天数" value="period" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="mapForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button :loading="mapButtonLoading" type="primary" @click="submitMap">确 定</el-button>
        <el-button @click="cancelMap">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getDouyinConfig,
  saveDouyinConfig,
  listDouyinVerify,
  cancelDouyinVerify,
  listDouyinProductMap,
  saveDouyinProductMap,
  delDouyinProductMap,
  listDouyinCards
} from "@/api/studyroom/douyin";

/** 撤销窗口: 核销后 1 小时内(与后端 3600_000ms 限制保持一致) */
const CANCEL_WINDOW_MS = 3600 * 1000;

export default {
  name: "StudyroomDouyin",
  data() {
    return {
      activeTab: "config",
      // ===== 页签1: 核销配置 =====
      configLoading: false,
      configMeta: { clientSecretMask: "", hasSecret: false },
      configForm: { clientKey: undefined, clientSecret: undefined, poiId: undefined, enabled: "0", spiVerifyEnabled: "0" },
      configRules: {
        clientKey: [{ required: true, message: "抖音 client_key 不能为空", trigger: "blur" }]
      },
      // ===== 页签2: 核销记录 =====
      loading: false,
      showSearch: true,
      total: 0,
      verifyList: [],
      queryParams: { pageNum: 1, pageSize: 10, status: undefined, userId: undefined },
      cancelLoading: false,
      // ===== 页签3: 套餐映射 =====
      mapLoading: false,
      productMapList: [],
      cardOptions: [],
      mapOpen: false,
      mapTitle: "",
      mapButtonLoading: false,
      mapForm: { id: undefined, productId: undefined, productTitle: undefined, grantType: "card", balanceAmount: undefined, cardId: undefined, oncePerUser: 0, lockMode: "period", remark: undefined },
      mapRules: {
        productId: [{ required: true, message: "抖音商品ID不能为空", trigger: "blur" }],
        cardId: [{ required: true, message: "请选择要映射的本地卡券", trigger: "change" }]
      }
    };
  },
  computed: {
    /** AppSecret 输入框提示: 已配置时显示后端返回的掩码 */
    secretPlaceholder() {
      if (this.configMeta.hasSecret) {
        return "已配置：" + this.configMeta.clientSecretMask + "，留空表示不修改";
      }
      return "请输入抖音开放平台应用的 AppSecret（留空表示不修改）";
    }
  },
  created() {
    this.loadConfig();
    this.getList();
    this.loadCards();
    this.loadProductMaps();
  },
  methods: {
    /* ==================== 页签1: 核销配置 ==================== */

    /** 读取核销配置 */
    loadConfig() {
      this.configLoading = true;
      getDouyinConfig().then(res => {
        const data = (res && res.data) || {};
        this.configForm.clientKey = data.clientKey || undefined;
        // 密钥不回显, 留空即不修改
        this.configForm.clientSecret = undefined;
        this.configForm.poiId = data.poiId || undefined;
        this.configForm.enabled = this.normSwitch(data.enabled);
        this.configForm.spiVerifyEnabled = this.normSwitch(data.spiVerifyEnabled);
        this.configMeta.clientSecretMask = data.clientSecretMask || "";
        this.configMeta.hasSecret = !!data.hasSecret;
      }).finally(() => {
        this.configLoading = false;
      });
    },
    /** 后端配置值是字符串 "0"/"1", 统一成 switch 可识别的字符串 */
    normSwitch(value) {
      return (value === "1" || value === 1 || value === true) ? "1" : "0";
    },
    /** 保存核销配置 */
    handleSaveConfig() {
      this.$refs["configForm"].validate(valid => {
        if (!valid) {
          return;
        }
        this.configLoading = true;
        saveDouyinConfig({
          clientKey: this.configForm.clientKey,
          // 留空表示不修改(后端会忽略空值与掩码)
          clientSecret: this.configForm.clientSecret || "",
          poiId: this.configForm.poiId || "",
          enabled: this.configForm.enabled,
          spiVerifyEnabled: this.configForm.spiVerifyEnabled
        }).then(() => {
          this.$modal.msgSuccess("保存成功");
          this.loadConfig();
        }).finally(() => {
          this.configLoading = false;
        });
      });
    },

    /* ==================== 页签2: 核销记录 ==================== */

    /** 查询核销记录 */
    getList() {
      this.loading = true;
      const status = this.queryParams.status;
      const userId = (this.queryParams.userId === null || this.queryParams.userId === undefined)
        ? "" : String(this.queryParams.userId).trim();
      if (userId && !/^\d+$/.test(userId)) {
        this.loading = false;
        this.$modal.msgWarning("会员ID只能是数字");
        return;
      }
      const query = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize
      };
      // 空值不传, 避免后端参数转换告警
      if (status !== undefined && status !== null && status !== "") {
        query.status = status;
      }
      if (userId) {
        query.userId = userId;
      }
      listDouyinVerify(query).then(res => {
        const data = (res && res.data) || {};
        this.verifyList = data.rows || [];
        this.total = data.total || 0;
      }).finally(() => {
        this.loading = false;
      });
    },
    /** 搜索 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.status = undefined;
      this.queryParams.userId = undefined;
      this.handleQuery();
    },
    /** 状态文案 */
    statusText(status) {
      const map = { 1: "已核销", 2: "已撤销", 3: "异常" };
      return map[Number(status)] || "未知";
    },
    /** 状态标签颜色: 已核销=success 已撤销=info 异常=danger */
    statusTagType(status) {
      const map = { 1: "success", 2: "info", 3: "danger" };
      return map[Number(status)] || "info";
    },
    /** 时间(字符串/时间戳) → 毫秒时间戳, 解析失败返回 null */
    toTimestamp(time) {
      if (time === null || time === undefined || time === "") {
        return null;
      }
      if (typeof time === "number") {
        return String(time).length <= 10 ? time * 1000 : time;
      }
      const str = String(time).trim();
      if (/^\d+$/.test(str)) {
        const num = Number(str);
        return str.length <= 10 ? num * 1000 : num;
      }
      const m = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
      if (m) {
        return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]),
          Number(m[4]), Number(m[5]), Number(m[6])).getTime();
      }
      const date = new Date(str);
      return isNaN(date.getTime()) ? null : date.getTime();
    },
    /** 仅「已核销」且核销时间在 1 小时内可撤销 */
    canCancel(row) {
      if (!row || Number(row.status) !== 1) {
        return false;
      }
      const ts = this.toTimestamp(row.verifyTime);
      if (ts === null) {
        // 时间解析不出来时不本地拦截, 交由后端最终判定
        return true;
      }
      return Date.now() - ts <= CANCEL_WINDOW_MS;
    },
    /** 撤销按钮不可用时的提示 */
    cancelTip(row) {
      if (!row || Number(row.status) !== 1) {
        return "仅「已核销」的记录可撤销";
      }
      return "已超过1小时，不可撤销";
    },
    /** 撤销核销 */
    handleCancel(row) {
      if (!this.canCancel(row)) {
        return;
      }
      this.$modal.confirm("确认撤销该笔核销？将同时作废本地使用卡并释放座位").then(() => {
        this.cancelLoading = true;
        return cancelDouyinVerify({ id: row.id });
      }).then(res => {
        this.$modal.msgSuccess((res && res.data) ? String(res.data) : "撤销成功");
        this.getList();
      }).catch(err => {
        // 用户点「取消」关闭确认框, 静默处理
        if (err === "cancel" || err === "close") {
          return;
        }
        // 业务失败(如「已超过1小时，无法撤销核销」)后端返回 code=500 + msg,
        // request 拦截器已弹过一次提示, 这里用 msgError 再兜底一次保证 msg 可见
        const msg = (err && err.message) ? err.message : (typeof err === "string" ? err : "");
        if (msg && msg !== "error") {
          this.$modal.msgError(msg);
        }
      }).finally(() => {
        this.cancelLoading = false;
      });
    },

    /* ==================== 页签3: 套餐映射 ==================== */

    /** 本地卡券下拉(接口 8, 只显示名称+价格, 不拼 ID) */
    loadCards() {
      listDouyinCards().then(res => {
        this.cardOptions = (res && res.data) || [];
      });
    },
    /** 卡券下拉/表格展示文案 */
    cardLabel(card) {
      const price = card.price;
      const suffix = (price === null || price === undefined || price === "") ? "" : "（￥" + price + "）";
      return (card.cardTitle || "未命名卡券") + suffix;
    },
    /** 用 cardId 反查本地卡名称 */
    cardTitleById(cardId) {
      if (cardId === null || cardId === undefined || cardId === "") {
        return "-";
      }
      const card = this.cardOptions.find(item => String(item.id) === String(cardId));
      return card ? (card.cardTitle || "未命名卡券") : "该卡券已停用或不存在";
    },
    /** 已停用的卡券补一个占位选项, 避免下拉直接暴露 ID */
    ensureCardOption(cardId) {
      if (cardId === null || cardId === undefined || cardId === "") {
        return;
      }
      const exists = this.cardOptions.some(item => String(item.id) === String(cardId));
      if (!exists) {
        this.cardOptions.push({ id: cardId, cardTitle: "该卡券已停用或不存在", price: undefined });
      }
    },
    /** 锁座方式文案 */
    lockModeText(lockMode) {
      if (lockMode === "period") {
        return "按卡天数";
      }
      if (lockMode === "day") {
        return "当天有效";
      }
      return lockMode || "当天有效";
    },
    /** 查询套餐映射 */
    loadProductMaps() {
      this.mapLoading = true;
      listDouyinProductMap().then(res => {
        this.productMapList = (res && res.data) || [];
      }).finally(() => {
        this.mapLoading = false;
      });
    },
    /** 重置映射表单(手动赋值, 避免 resetFields 首次打开即锁定编辑值) */
    resetMapForm() {
      this.mapForm = {
        id: undefined,
        productId: undefined,
        productTitle: undefined,
        grantType: "card",
        balanceAmount: undefined,
        cardId: undefined,
        oncePerUser: 0,
        lockMode: "period",
        remark: undefined
      };
      this.$nextTick(() => {
        if (this.$refs["mapForm"]) {
          this.$refs["mapForm"].clearValidate();
        }
      });
    },
    /** 新增映射 */
    handleAddMap() {
      this.resetMapForm();
      this.mapTitle = "新增套餐映射";
      this.mapOpen = true;
    },
    /** 编辑映射 */
    handleUpdateMap(row) {
      this.resetMapForm();
      this.ensureCardOption(row.cardId);
      this.mapForm = {
        id: row.id,
        productId: row.productId,
        productTitle: row.productTitle,
        grantType: row.grantType || "card",
        balanceAmount: row.balanceAmount,
        cardId: row.cardId,
        oncePerUser: Number(row.oncePerUser) === 1 ? 1 : 0,
        lockMode: row.lockMode || "period",
        remark: row.remark
      };
      this.mapTitle = "修改套餐映射";
      this.mapOpen = true;
    },
    /** 取消 */
    cancelMap() {
      this.mapOpen = false;
      this.resetMapForm();
    },
    /** 提交映射 */
    submitMap() {
      this.$refs["mapForm"].validate(valid => {
        if (!valid) {
          return;
        }
        // 发放周期卡必须选卡; 充值余额可留空金额(按券面额自动识别)
        if (this.mapForm.grantType !== "balance" && !this.mapForm.cardId) {
          this.$modal.msgError("发放周期卡时必须选择本地卡券");
          return;
        }
        if (this.mapForm.grantType !== "balance" && !this.mapForm.productId) {
          this.$modal.msgError("请填写抖音商品ID");
          return;
        }
        this.mapButtonLoading = true;
        const isUpdate = (this.mapForm.id !== null && this.mapForm.id !== undefined);
        const payload = Object.assign({}, this.mapForm);
        if (payload.grantType === "balance") {
          payload.cardId = null;
        }
        saveDouyinProductMap(payload).then(() => {
          this.$modal.msgSuccess(isUpdate ? "修改成功" : "新增成功");
          this.mapOpen = false;
          this.loadProductMaps();
        }).finally(() => {
          this.mapButtonLoading = false;
        });
      });
    },
    /** 删除映射 */
    handleDeleteMap(row) {
      const name = row.productTitle || row.productId;
      this.$modal.confirm('是否确认删除商品「' + name + '」的套餐映射？').then(() => {
        this.mapLoading = true;
        return delDouyinProductMap(row.id);
      }).then(() => {
        this.loadProductMaps();
        this.$modal.msgSuccess("删除成功");
      }).catch(err => {
        // 用户取消 或 请求失败(错误提示已由 request 拦截器统一处理)
        if (err === "cancel" || err === "close") {
          return;
        }
      }).finally(() => {
        this.mapLoading = false;
      });
    }
  }
};
</script>

<style scoped>
.form-tip {
  color: #909399;
  font-size: 12px;
  margin-left: 10px;
}

.alert-text {
  line-height: 22px;
}
</style>
