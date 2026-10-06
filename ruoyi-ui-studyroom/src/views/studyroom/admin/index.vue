<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" type="border-card" @tab-click="onTabClick">
      <!-- ========== 代占座/锁座 ========== -->
      <el-tab-pane label="代占座/锁座" name="occupy">
        <el-form ref="occupyForm" :model="occupyForm" :rules="occupyRules" label-width="110px" size="small" style="max-width: 640px;">
          <el-form-item label="会员" prop="userId">
            <el-select v-model="occupyForm.userId" filterable placeholder="搜索昵称/手机号选择会员" style="width: 100%;" @focus="!userOptions.length && loadUsers()">
              <el-option v-for="u in userOptions" :key="u.userId" :label="u.nickname + (u.phone ? '（' + u.phone + '）' : '')" :value="u.userId" />
            </el-select>
          </el-form-item>
          <el-form-item label="自习室" prop="roomId">
            <el-select v-model="occupyForm.roomId" placeholder="选择自习室" style="width: 100%;" @change="handleRoomChange">
              <el-option v-for="r in roomOptions" :key="r.roomId" :label="r.roomName" :value="r.roomId" />
            </el-select>
          </el-form-item>
          <el-form-item label="座位" prop="seatId">
            <el-select v-model="occupyForm.seatId" :disabled="!occupyForm.roomId" filterable placeholder="先选自习室再选座位" style="width: 100%;">
              <el-option v-for="s in seatOptions" :key="s.seatId" :label="s.areaName + ' ' + s.seatNum + ' 号座'" :value="s.seatId" />
            </el-select>
          </el-form-item>
          <el-form-item label="占座开始时间">
            <el-date-picker v-model="occupyForm.startTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="缺省=今天0点" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="占座结束时间">
            <el-date-picker v-model="occupyForm.endTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="缺省=开始+1天" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="同时创建锁座">
            <el-switch v-model="occupyForm.createLock" :active-value="1" :inactive-value="0" active-text="是" inactive-text="否" />
          </el-form-item>
          <el-form-item label="锁座开始日期" v-if="occupyForm.createLock === 1">
            <el-date-picker v-model="occupyForm.lockStartDate" type="date" value-format="yyyy-MM-dd"
              placeholder="缺省=今天" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="锁座结束日期" v-if="occupyForm.createLock === 1">
            <el-date-picker v-model="occupyForm.lockEndDate" type="date" value-format="yyyy-MM-dd"
              placeholder="缺省=开始+30天" style="width: 100%;" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" :loading="occupyLoading" @click="handleOccupy">执行代占座</el-button>
            <el-button size="small" @click="resetOccupy">重置</el-button>
            <span style="color: #909399; font-size: 12px; margin-left: 10px;">直接写入占座记录, 可选同时创建长期锁座记录</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ========== 撤销权限 ========== -->
      <el-tab-pane label="撤销权限" name="revoke">
        <el-form ref="revokeForm" :model="revokeForm" :rules="revokeRules" label-width="110px" size="small" style="max-width: 640px;">
          <el-form-item label="锁座记录ID">
            <el-input v-model="revokeForm.lockId" placeholder="按锁座记录撤销(优先)" clearable />
          </el-form-item>
          <el-form-item label="会员">
            <el-select v-model="revokeForm.userId" filterable clearable placeholder="搜索昵称/手机号选择会员(按用户撤销全部)" style="width: 100%;" @focus="!userOptions.length && loadUsers()">
              <el-option v-for="u in userOptions" :key="u.userId" :label="u.nickname + (u.phone ? '（' + u.phone + '）' : '')" :value="u.userId" />
            </el-select>
          </el-form-item>
          <el-form-item label="自习室">
            <el-select v-model="revokeForm.roomId" clearable placeholder="按用户撤销时可限定自习室(可选)" style="width: 100%;">
              <el-option v-for="r in roomOptions" :key="r.roomId" :label="r.roomName" :value="r.roomId" />
            </el-select>
          </el-form-item>
          <el-form-item label="撤销原因">
            <el-input v-model="revokeForm.reason" type="textarea" :rows="2" placeholder="可选" />
          </el-form-item>
          <el-form-item>
            <el-button type="warning" size="small" :loading="revokeLoading" @click="handleRevoke">执行撤销</el-button>
            <el-button size="small" @click="resetRevoke">重置</el-button>
            <span style="color: #909399; font-size: 12px; margin-left: 10px;">撤销门禁授权+锁座记录置取消(锁座ID与用户ID二选一)</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ========== 退款 ========== -->
      <el-tab-pane label="退款" name="refund">
        <el-form ref="refundForm" :model="refundForm" :rules="refundRules" label-width="110px" size="small" style="max-width: 640px;">
          <el-form-item label="订单ID">
            <el-input v-model="refundForm.orderId" placeholder="sr_order.id(与订单号二选一)" clearable />
          </el-form-item>
          <el-form-item label="订单号">
            <el-input v-model="refundForm.orderNo" placeholder="order_id 字符串(与订单ID二选一)" clearable />
          </el-form-item>
          <el-form-item label="退款金额">
            <el-input-number v-model="refundForm.amount" :min="0" :precision="2" placeholder="缺省=订单全额" style="width: 200px;" />
          </el-form-item>
          <el-form-item label="退款说明">
            <el-input v-model="refundForm.reason" type="textarea" :rows="2" placeholder="可选" />
          </el-form-item>
          <el-form-item>
            <el-button type="danger" size="small" :loading="refundLoading" @click="handleRefund">执行退款</el-button>
            <el-button size="small" @click="resetRefund">重置</el-button>
            <span style="color: #909399; font-size: 12px; margin-left: 10px;">金额退回用户余额(点), 订单标记已退款</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ========== 特殊卡发放 ========== -->
      <el-tab-pane label="特殊卡发放" name="grant">
        <el-form ref="grantForm" :model="grantForm" :rules="grantRules" label-width="110px" size="small" style="max-width: 640px;">
          <el-form-item label="会员" prop="userId">
            <el-select v-model="grantForm.userId" filterable placeholder="搜索昵称/手机号选择会员" style="width: 100%;" @focus="!userOptions.length && loadUsers()">
              <el-option v-for="u in userOptions" :key="u.userId" :label="u.nickname + (u.phone ? '（' + u.phone + '）' : '')" :value="u.userId" />
            </el-select>
          </el-form-item>
          <el-form-item label="卡券" prop="cardId">
            <el-select v-model="grantForm.cardId" filterable placeholder="搜索选择要发放的卡券" style="width: 100%;">
              <el-option v-for="c in cardOptions" :key="c.id" :label="c.cardTitle + (c.price != null ? '（￥' + c.price + '）' : '')" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="到期时间">
            <el-date-picker v-model="grantForm.expiryTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="留空 = 不预设到期日, 客户首次预约使用时起算" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="发放说明">
            <el-input v-model="grantForm.reason" type="textarea" :rows="2" placeholder="可选" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" :loading="grantLoading" @click="handleGrant">执行发卡</el-button>
            <el-button size="small" @click="resetGrant">重置</el-button>
            <span style="color: #909399; font-size: 12px; margin-left: 10px;">直接发放, 不经过支付</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ========== 特殊卡修改 ========== -->
      <el-tab-pane label="特殊卡修改" name="updateCard">
        <el-form ref="updateCardForm" :model="updateCardForm" :rules="updateCardRules" label-width="110px" size="small" style="max-width: 640px;">
          <el-form-item label="用户卡记录ID" prop="cardUserId">
            <el-input v-model="updateCardForm.cardUserId" placeholder="必填: sr_card_user.id" clearable />
          </el-form-item>
          <el-form-item label="新到期时间">
            <el-date-picker v-model="updateCardForm.expiryTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="不填则不修改" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="新离开次数">
            <el-input-number v-model="updateCardForm.leaveCount" :min="0" placeholder="不填则不修改" style="width: 200px;" />
          </el-form-item>
          <el-form-item label="修改说明">
            <el-input v-model="updateCardForm.reason" type="textarea" :rows="2" placeholder="可选" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" :loading="updateCardLoading" @click="handleUpdateCard">执行修改</el-button>
            <el-button size="small" @click="resetUpdateCard">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ========== 发放请假次数 ========== -->
      <el-tab-pane label="发放请假次数" name="leaveGrant">
        <el-alert type="info" :closable="false" show-icon
          title="仅月卡/季卡等长期卡(有效期 ≥30 天)可请假停卡，每张卡默认 3 次；此处在原额度上累加，不覆盖。" />
        <el-form ref="leaveGrantForm" :model="leaveGrantForm" :rules="leaveGrantRules" label-width="110px" size="small" style="max-width: 640px; margin-top: 16px;">
          <el-form-item label="用户卡记录ID" prop="cardUserId">
            <el-input v-model="leaveGrantForm.cardUserId" placeholder="必填: sr_card_user.id（卡券列表里那串数字ID）" clearable />
          </el-form-item>
          <el-form-item label="追加次数" prop="count">
            <el-input-number v-model="leaveGrantForm.count" :min="1" :max="100" style="width: 200px;" />
            <span style="color: #909399; font-size: 12px; margin-left: 10px;">在原额度上累加，例：原 3 次 + 追加 2 次 = 5 次</span>
          </el-form-item>
          <el-form-item label="发放说明">
            <el-input v-model="leaveGrantForm.reason" type="textarea" :rows="2" placeholder="可选，例：客户出差申请追加（记录用）" />
          </el-form-item>
          <el-form-item>
            <el-button type="warning" size="small" :loading="leaveGrantLoading" @click="handleGrantLeave">发放请假次数</el-button>
            <el-button size="small" @click="resetGrantLeave">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ========== 灯控自检 ========== -->
      <el-tab-pane label="灯控自检" name="miot">
        <el-alert :type="miot && miot.healthy ? 'success' : 'error'" :closable="false" show-icon
          :title="miot && miot.healthy ? '灯控正常（米家登录态有效）' : '灯控异常：需要重新登录米家'"
          :description="miot && miot.lastCheck ? ('最近巡检：' + miot.lastCheck) : '暂无巡检记录，点「立即自检」测一次'" />
        <el-table :data="miotRows" size="small" border style="margin-top: 16px; max-width: 960px;">
          <el-table-column label="检查项" prop="k" width="170" />
          <el-table-column label="结果" prop="v" />
        </el-table>
        <div style="margin-top: 16px;">
          <el-button type="primary" size="small" :loading="miotLoading" @click="runSelfCheck">立即自检</el-button>
          <el-button type="warning" size="small" :loading="reloginLoading" @click="genQr">生成米家登录二维码</el-button>
          <el-button size="small" @click="loadMiot">刷新状态</el-button>
        </div>
        <div v-if="qrUrl" style="margin-top: 16px;">
          <el-alert type="info" :closable="false" show-icon
            title="用手机「米家」App → 右上角 + → 扫一扫，扫下方二维码并确认登录；扫完点「刷新状态」确认已恢复" />
          <img :src="qrUrl" style="width: 240px; height: 240px; margin-top: 10px; border: 1px solid #eee; padding: 6px;" />
          <div style="color: #909399; font-size: 12px; margin-top: 6px;">生成时间：{{ qrTime }}（二维码几分钟内有效，过期请重新生成）</div>
          <div v-if="qrLink" style="color: #909399; font-size: 12px; word-break: break-all; margin-top: 4px;">备用链接：{{ qrLink }}</div>
        </div>
        <div style="margin-top: 16px; max-width: 960px;">
          <div style="font-weight: 600; margin-bottom: 6px;">最近巡检日志</div>
          <pre
            style="background: #f8f8f8; padding: 10px; border-radius: 4px; max-height: 260px; overflow: auto; font-size: 12px; line-height: 1.6; margin: 0;">{{ (miot.logTail || []).join('\n') || '暂无日志' }}</pre>
        </div>
        <div style="color: #909399; font-size: 12px; margin-top: 10px;">
          说明：座位灯通过服务器脚本调用米家接口，依赖米家登录态；系统每天 08:00 / 20:30 自动巡检一次（结果见上方日志），
          若显示异常，点「生成米家登录二维码」扫码即可修复。
        </div>
      </el-tab-pane>
      <!-- ========== 双人卡兑换码 ========== -->
      <el-tab-pane label="双人卡兑换码" name="cardRedeem">
        <el-alert type="info" :closable="false" show-icon
          title="双人套餐(如双人同行上岸卡)：一人付全款 → 系统给购买者发卡并生成 1 个兑换码 → 同伴用自己的微信号在「我的-双人卡兑换」输入即领卡。此处可查询/作废/手工补发。" />
        <el-form :model="codeQuery" size="small" :inline="true" style="margin-top: 16px;">
          <el-form-item label="兑换码">
            <el-input v-model="codeQuery.code" placeholder="完整兑换码" clearable style="width: 170px"
              @keyup.enter.native="loadCodes" />
          </el-form-item>
          <el-form-item label="购买者">
            <el-input v-model="codeQuery.ownerNickname" placeholder="昵称关键字" clearable style="width: 150px"
              @keyup.enter.native="loadCodes" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="codeQuery.status" placeholder="全部" clearable style="width: 120px">
              <el-option label="待兑换" :value="0" />
              <el-option label="已兑换" :value="1" />
              <el-option label="已作废" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="small" @click="loadCodes">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="codeList" size="small" border v-loading="codeLoading" style="margin-top: 6px;">
          <el-table-column label="兑换码" prop="code" width="140" />
          <el-table-column label="卡券" prop="cardTitle" min-width="170" :show-overflow-tooltip="true" />
          <el-table-column label="购买者" prop="ownerNickname" width="130" />
          <el-table-column label="状态" width="90">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : (scope.row.status === 2 ? 'info' : 'warning')"
                size="mini">{{ scope.row.status === 1 ? '已兑换' : (scope.row.status === 2 ? '已作废' : '待兑换') }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="兑换人" prop="usedByNickname" width="120">
            <template slot-scope="scope">{{ scope.row.usedByNickname || '-' }}</template>
          </el-table-column>
          <el-table-column label="兑换时间" prop="usedTime" width="150">
            <template slot-scope="scope">{{ scope.row.usedTime || '-' }}</template>
          </el-table-column>
          <el-table-column label="码有效期" prop="expireTime" width="150">
            <template slot-scope="scope">{{ scope.row.expireTime || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template slot-scope="scope">
              <el-button v-if="scope.row.status === 0" size="mini" type="text" icon="el-icon-close"
                @click="handleInvalidate(scope.row)">作废</el-button>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="codeTotal > 0" :total="codeTotal" :page.sync="codeQuery.pageNum"
          :limit.sync="codeQuery.pageSize" @pagination="loadCodes" />

        <el-divider content-position="left">手工生成 / 补发兑换码</el-divider>
        <el-form ref="generateForm" :model="generateForm" :rules="generateRules" label-width="110px" size="small"
          style="max-width: 640px;">
          <el-form-item label="卡券" prop="cardId">
            <el-select v-model="generateForm.cardId" placeholder="请选择卡券" filterable clearable style="width: 100%;">
              <el-option v-for="c in cardOptions" :key="c.id" :value="c.id"
                :label="c.cardTitle + (c.partySize === 2 ? '（双人套餐）' : '')" />
            </el-select>
          </el-form-item>
          <el-form-item label="购买者" prop="ownerUserId">
            <el-select v-model="generateForm.ownerUserId" filterable clearable
              placeholder="搜索昵称/手机号选择会员(购买者)" style="width: 100%;"
              @focus="!userOptions.length && loadUsers()">
              <el-option v-for="u in userOptions" :key="u.userId" :value="u.userId"
                :label="(u.nickname || ('用户' + u.userId)) + (u.phone ? '（' + u.phone + '）' : '')" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="generateForm.remark" placeholder="如: 补发(购卡时生成失败)" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" :loading="generateLoading" @click="handleGenerate">生成兑换码</el-button>
            <el-button size="small" @click="resetGenerate">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!--
        门禁设备人员: 显示门禁机里真实存着的人(数据实时来自设备), 与我们库里的档案不是一回事。
        历史上有一批人是通过厂商页面/App 直接录进设备的 —— 系统看不见、预约结束也不会自动撤销,
        这个页面的主要用途就是把那些人找出来核对/清理。
      -->
      <el-tab-pane label="门禁设备人员" name="deviceUsers">
        <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 12px">
          <template slot="title">
            这里显示的是<strong>门禁机里真实存着的人</strong>（共 {{ deviceTotal }} 人，其中
            <strong>{{ deviceManaged }}</strong> 人来自本系统）。标为「厂商渠道」的那些是历史上通过厂商页面/App
            直接录进设备的，<strong>系统管不到、预约结束也不会自动撤销</strong>，需要的话在这里逐个核对删除。
          </template>
        </el-alert>

        <el-form :inline="true" size="small" style="margin-bottom: 10px">
          <el-form-item>
            <el-button type="primary" icon="el-icon-refresh" :loading="deviceLoading" @click="loadDeviceUsers(false)">刷新列表</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="warning" icon="el-icon-connection" :loading="deviceLoading" @click="syncDevice">同步门禁（真读设备）</el-button>
          </el-form-item>
          <el-form-item label="只看厂商渠道">
            <el-switch v-model="deviceOnlyVendor" />
          </el-form-item>
          <el-form-item label="搜索">
            <el-input v-model="deviceKeyword" placeholder="姓名 / 账号 / 设备ID" clearable style="width: 220px" />
          </el-form-item>
          <el-form-item v-if="deviceSn">
            <span style="color: #909399; font-size: 12px;">设备 SN：{{ deviceSn }}</span>
          </el-form-item>
        </el-form>

        <el-table :data="deviceFiltered" border size="mini" v-loading="deviceLoading" max-height="620">
          <el-table-column label="人脸" width="92" align="center">
            <template slot-scope="s">
              <el-image v-if="s.row.faceImg" :src="'data:image/jpeg;base64,' + s.row.faceImg"
                :preview-src-list="['data:image/jpeg;base64,' + s.row.faceImg]" fit="cover"
                style="width: 56px; height: 56px; border-radius: 4px;" />
              <span v-else style="color: #c0c4cc;">未录</span>
            </template>
          </el-table-column>
          <el-table-column label="姓名" prop="userName" width="140" show-overflow-tooltip />
          <el-table-column label="账号" prop="userAcct" min-width="220" show-overflow-tooltip />
          <el-table-column label="来源" width="110" align="center">
            <template slot-scope="s">
              <el-tag :type="s.row.managed ? 'success' : 'warning'" size="mini">{{ s.row.source }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="设备ID" prop="userId" width="90" align="center" />
          <el-table-column label="人脸数" prop="faceCount" width="90" align="center" />
          <el-table-column label="有效期" width="120" align="center">
            <template slot-scope="s">
              <span v-if="!s.row.expOpt || s.row.expOpt === '0'">永久</span>
              <span v-else>{{ s.row.expOpt }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template slot-scope="s">
              <el-button type="text" size="mini" style="color: #f56c6c;" @click="deleteDeviceUser(s.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top: 10px; color: #909399; font-size: 12px; line-height: 1.8;">
          说明：人脸图片实时取自门禁机，<strong>服务器不留存</strong>（后端仅有 60 秒内存缓存，用于避免反复向设备拉取）。
          每次查看都会记入系统操作日志。
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { adminOccupy, adminRevoke, adminRefund, adminGrantCard, adminUpdateCard, adminGrantLeave,
  adminDeviceUsers, adminDeviceSync, adminDeviceFaces, adminDeviceDeleteUser } from "@/api/studyroom/admin";
import { listRoom } from "@/api/store/room";
import { listSeat } from "@/api/store/seat";
import { listUser } from "@/api/member/user";
import { listCard } from "@/api/store/card";
import { miotHealth, miotSelfCheck, miotRelogin } from "@/api/studyroom/miot";
import { listCardRedeem, generateCardRedeem, invalidateCardRedeem } from "@/api/studyroom/cardRedeem";

export default {
  name: "StudyroomAdmin",
  data() {
    return {
      activeTab: "occupy",
      // 门禁设备人员(设备里真实存着的人, 与我们库里的档案不是一回事)
      deviceLoading: false,
      deviceUsers: [],
      deviceSn: "",
      deviceTotal: 0,
      deviceManaged: 0,
      deviceOnlyVendor: false,
      deviceKeyword: "",
      // 下拉选项数据
      roomOptions: [],
      seatOptions: [],
      userOptions: [],
      cardOptions: [],
      // 代占座
      occupyForm: { userId: undefined, seatId: undefined, roomId: undefined, startTime: undefined, endTime: undefined, createLock: 0, lockStartDate: undefined, lockEndDate: undefined },
      occupyRules: {
        userId: [{ required: true, message: "请选择会员", trigger: "change" }],
        seatId: [{ required: true, message: "请选择座位", trigger: "change" }],
        roomId: [{ required: true, message: "请选择自习室", trigger: "change" }]
      },
      occupyLoading: false,
      // 撤销
      revokeForm: { lockId: undefined, userId: undefined, roomId: undefined, reason: undefined },
      revokeRules: {},
      revokeLoading: false,
      // 退款
      refundForm: { orderId: undefined, orderNo: undefined, amount: undefined, reason: undefined },
      refundRules: {},
      refundLoading: false,
      // 发卡
      grantForm: { userId: undefined, cardId: undefined, expiryTime: undefined, reason: undefined },
      grantRules: {
        userId: [{ required: true, message: "请选择会员", trigger: "change" }],
        cardId: [{ required: true, message: "请选择要发放的卡券", trigger: "change" }]
      },
      grantLoading: false,
      // 改卡
      updateCardForm: { cardUserId: undefined, expiryTime: undefined, leaveCount: undefined, reason: undefined },
      updateCardRules: {
        cardUserId: [{ required: true, message: "用户卡记录ID不能为空", trigger: "blur" }]
      },
      updateCardLoading: false,
      // 发放请假次数(长期卡停卡额度)
      leaveGrantForm: { cardUserId: undefined, count: 1, reason: undefined },
      leaveGrantRules: {
        cardUserId: [{ required: true, message: "用户卡记录ID不能为空", trigger: "blur" }],
        count: [{ required: true, message: "追加次数不能为空", trigger: "blur" }]
      },
      leaveGrantLoading: false,
      // 灯控自检(米家桥接健康状态)
      miot: {},
      miotLoading: false,
      reloginLoading: false,
      qrUrl: "",
      qrTime: "",
      qrLink: "",
      // 双人卡兑换码
      codeQuery: { pageNum: 1, pageSize: 10, code: undefined, ownerNickname: undefined, status: undefined },
      codeList: [],
      codeTotal: 0,
      codeLoading: false,
      generateForm: { cardId: undefined, ownerUserId: undefined, remark: undefined },
      generateRules: {
        cardId: [{ required: true, message: "请选择卡券", trigger: "change" }],
        ownerUserId: [{ required: true, message: "请选择购买者", trigger: "change" }]
      },
      generateLoading: false
    };
  },
  computed: {
    // 灯控自检: 把后端返回的健康信息整理成表格行
    miotRows() {
      const m = this.miot || {};
      return [
        { k: "米家认证文件", v: m.authExists ? ("存在　" + (m.authFile || "")) : "缺失 —— 需要重新扫码登录" },
        { k: "认证有效期至", v: m.authExpire || "-" },
        { k: "认证文件生成于", v: m.authSaveTime || "-" },
        { k: "桥接脚本", v: (m.bridgeExists ? "存在　" : "缺失　") + (m.bridgeScript || "") },
        { k: "Python 解释器", v: (m.pythonExists ? "存在　" : "缺失　") + (m.python || "") },
        { k: "最近巡检结果", v: m.lastCheck || "暂无记录" },
        { k: "最近异常记录", v: m.lastFail || "无" }
      ];
    },
    // 门禁设备人员: 支持"只看厂商渠道"与关键字过滤(前端过滤, 名单只有百来条)
    deviceFiltered() {
      let list = this.deviceUsers || [];
      if (this.deviceOnlyVendor) list = list.filter(u => !u.managed);
      const kw = (this.deviceKeyword || "").trim().toLowerCase();
      if (kw) {
        list = list.filter(u =>
          String(u.userName || "").toLowerCase().indexOf(kw) > -1 ||
          String(u.userAcct || "").toLowerCase().indexOf(kw) > -1 ||
          String(u.userId || "").indexOf(kw) > -1);
      }
      return list;
    }
  },
  created() {
    this.loadRooms();
    this.loadCards();
    this.loadMiot();
    this.loadCodes();
  },
  methods: {
    // ========== 门禁设备人员 ==========
    // 切到该标签页时才加载(人员清单读本地镜像, 不碰设备)
    onTabClick(tab) {
      if (tab && tab.name === "deviceUsers" && !this.deviceUsers.length && !this.deviceLoading) {
        this.loadDeviceUsers(false);
      }
    },
    // 人员清单来自本地镜像(后端 Redis), 打开页面不会去抓门禁;
    // 人脸缩略图单独取(服务端进程内缓存), 只有缓存过期才会读一次设备
    loadDeviceUsers(force) {
      this.deviceLoading = true;
      const p = force ? { refresh: 1 } : {};
      adminDeviceUsers(p).then(res => {
        const d = res.data || {};
        this.deviceSn = d.sn || "";
        this.deviceUsers = d.users || [];
        this.deviceTotal = d.total || this.deviceUsers.length;
        this.deviceManaged = d.managed || 0;
        if (d.autoSynced) this.$modal.msgSuccess("首次使用，已自动同步一次门禁人员");
        this.loadDeviceFaces();
      }).catch(() => {
        this.deviceLoading = false;
      });
    },
    // 人脸缩略图: 失败就静默(列表没图也能用), 不要把整个页面卡住
    loadDeviceFaces() {
      const self = this;
      adminDeviceFaces(this.deviceSn ? { sn: this.deviceSn } : {}).then(res => {
        const map = res.data || {};
        const list = self.deviceUsers || [];
        for (let i = 0; i < list.length; i++) {
          if (map[list[i].userId]) self.$set(list[i], "faceImg", map[list[i].userId]);
        }
        self.deviceUsers = list;
      }).catch(() => {}).then(() => {
        self.deviceLoading = false;
      });
    },
    // 唯一真正读设备的入口
    syncDevice() {
      this.deviceLoading = true;
      const p = this.deviceSn ? { sn: this.deviceSn } : {};
      adminDeviceSync(p).then(() => {
        this.$modal.msgSuccess("已从门禁设备同步");
        this.loadDeviceUsers(true);
      }).catch(() => {
        this.deviceLoading = false;
      });
    },
    deleteDeviceUser(row) {
      this.$confirm(
        "确定要从门禁机删除「" + (row.userName || row.userAcct) + "」吗？\n删除后该人员将立即刷不开门（账号：" + row.userAcct + "，设备ID：" + row.userId + "）",
        "危险操作", { type: "warning", confirmButtonText: "确认删除", cancelButtonText: "取消" }
      ).then(() => {
        return adminDeviceDeleteUser({ userId: row.userId, sn: this.deviceSn });
      }).then(() => {
        this.$modal.msgSuccess("已删除");
        this.loadDeviceUsers(true);
      }).catch(() => {});
    },
    // ========== 双人卡兑换码 ==========
    loadCodes() {
      this.codeLoading = true;
      listCardRedeem(this.codeQuery).then(res => {
        this.codeList = res.rows || [];
        this.codeTotal = res.total || 0;
        this.codeLoading = false;
      }).catch(() => {
        this.codeLoading = false;
      });
    },
    handleInvalidate(row) {
      this.$modal.confirm("确认作废兑换码 " + row.code + " ？作废后同伴将无法再兑换。").then(() => {
        return invalidateCardRedeem(row.id, "后台作废");
      }).then(() => {
        this.$modal.msgSuccess("已作废");
        this.loadCodes();
      }).catch(() => { });
    },
    handleGenerate() {
      this.$refs["generateForm"].validate(valid => {
        if (!valid) {
          return;
        }
        this.generateLoading = true;
        generateCardRedeem(this.generateForm).then(res => {
          const d = res.data || {};
          this.$modal.msgSuccess("已生成兑换码：" + (d.code || ""));
          this.loadCodes();
        }).catch(e => {
          this.$modal.msgError("生成失败：" + ((e && e.msg) || e));
        }).finally(() => {
          this.generateLoading = false;
        });
      });
    },
    resetGenerate() {
      this.generateForm = { cardId: undefined, ownerUserId: undefined, remark: undefined };
      this.$refs["generateForm"].clearValidate();
    },
    // ========== 灯控自检 ==========
    loadMiot() {
      miotHealth().then(res => {
        this.miot = res.data || {};
      }).catch(() => { });
    },
    runSelfCheck() {
      this.miotLoading = true;
      miotSelfCheck().then(res => {
        const d = res.data || {};
        if (d.health) {
          this.miot = d.health;
        }
        if (d.success) {
          this.$modal.msgSuccess("灯控正常：" + ((d.probe && d.probe.deviceName) || ""));
        } else {
          this.$modal.msgError(d.msg || "灯控异常");
        }
      }).catch(e => {
        this.$modal.msgError("自检失败：" + ((e && e.msg) || e));
      }).finally(() => {
        this.miotLoading = false;
      });
    },
    genQr() {
      this.reloginLoading = true;
      miotRelogin().then(res => {
        const d = res.data || {};
        if (d.alreadyOk) {
          this.qrUrl = "";
          this.qrTime = "";
          this.qrLink = "";
          this.$modal.msgSuccess(d.msg || "当前登录态有效，无需重新登录");
          return;
        }
        if (d.success) {
          this.qrUrl = d.qrUrl + "?t=" + (d.qrStamp || Date.now());
          this.qrTime = d.qrTime || "";
          this.qrLink = d.qrLink || "";
          this.$modal.msgSuccess("二维码已生成，请用米家App扫码");
        } else {
          this.$modal.msgError(d.msg || "生成二维码失败");
        }
      }).catch(e => {
        this.$modal.msgError("生成二维码失败：" + ((e && e.msg) || e));
      }).finally(() => {
        this.reloginLoading = false;
      });
    },
    /** 加载卡券下拉(特殊卡发放用) */
    loadCards() {
      listCard({ pageNum: 1, pageSize: 100 }).then(res => {
        this.cardOptions = res.rows || [];
      });
    },
    /** 加载自习室下拉 */
    loadRooms() {
      listRoom({ pageNum: 1, pageSize: 100 }).then(res => {
        this.roomOptions = res.rows || [];
        // 只有一家店时自动选中, 座位直接联动
        if (this.roomOptions.length === 1) {
          this.occupyForm.roomId = this.roomOptions[0].roomId;
          this.handleRoomChange(this.occupyForm.roomId);
        }
      });
    },
    /** 自习室切换 → 加载该店座位列表 */
    handleRoomChange(roomId) {
      this.occupyForm.seatId = undefined;
      this.seatOptions = [];
      if (!roomId) return;
      listSeat({ pageNum: 1, pageSize: 500, roomId: roomId }).then(res => {
        this.seatOptions = (res.rows || []).sort((a, b) => (a.seatNum || 0) - (b.seatNum || 0));
      });
    },
    /** 加载会员下拉(首次聚焦时触发, 可输入昵称/手机号搜索) */
    loadUsers() {
      listUser({ pageNum: 1, pageSize: 500 }).then(res => {
        this.userOptions = res.rows || [];
      });
    },
    handleOccupy() {
      this.$refs.occupyForm.validate(valid => {
        if (!valid) return;
        this.occupyLoading = true;
        adminOccupy(this.occupyForm).then(() => {
          this.$modal.msgSuccess("代占座成功");
          this.resetOccupy();
        }).finally(() => { this.occupyLoading = false; });
      });
    },
    handleRevoke() {
      if (!this.revokeForm.lockId && !this.revokeForm.userId) {
        this.$modal.msgWarning("锁座记录ID与会员ID至少填一个");
        return;
      }
      this.$modal.confirm('确认执行撤销权限操作？').then(() => {
        this.revokeLoading = true;
        return adminRevoke(this.revokeForm);
      }).then(() => {
        this.$modal.msgSuccess("撤销成功");
        this.resetRevoke();
      }).finally(() => { this.revokeLoading = false; });
    },
    handleRefund() {
      if (!this.refundForm.orderId && !this.refundForm.orderNo) {
        this.$modal.msgWarning("订单ID与订单号至少填一个");
        return;
      }
      this.$modal.confirm('确认执行退款操作？').then(() => {
        this.refundLoading = true;
        return adminRefund(this.refundForm);
      }).then(() => {
        this.$modal.msgSuccess("退款成功");
        this.resetRefund();
      }).finally(() => { this.refundLoading = false; });
    },
    handleGrant() {
      this.$refs.grantForm.validate(valid => {
        if (!valid) return;
        this.grantLoading = true;
        adminGrantCard(this.grantForm).then(() => {
          this.$modal.msgSuccess("发卡成功");
          this.resetGrant();
        }).finally(() => { this.grantLoading = false; });
      });
    },
    handleUpdateCard() {
      this.$refs.updateCardForm.validate(valid => {
        if (!valid) return;
        this.updateCardLoading = true;
        adminUpdateCard(this.updateCardForm).then(() => {
          this.$modal.msgSuccess("修改成功");
          this.resetUpdateCard();
        }).finally(() => { this.updateCardLoading = false; });
      });
    },
    resetOccupy() {
      this.occupyForm = { userId: undefined, seatId: undefined, roomId: undefined, startTime: undefined, endTime: undefined, createLock: 0, lockStartDate: undefined, lockEndDate: undefined };
      // 单店场景: 重置后自动回选唯一的自习室
      if (this.roomOptions.length === 1) {
        this.occupyForm.roomId = this.roomOptions[0].roomId;
        this.handleRoomChange(this.occupyForm.roomId);
      }
    },
    resetRevoke() {
      this.revokeForm = { lockId: undefined, userId: undefined, roomId: undefined, reason: undefined };
    },
    resetRefund() {
      this.refundForm = { orderId: undefined, orderNo: undefined, amount: undefined, reason: undefined };
    },
    resetGrant() {
      this.grantForm = { userId: undefined, cardId: undefined, expiryTime: undefined, reason: undefined };
    },
    resetUpdateCard() {
      this.updateCardForm = { cardUserId: undefined, expiryTime: undefined, leaveCount: undefined, reason: undefined };
    },
    handleGrantLeave() {
      this.$refs.leaveGrantForm.validate(valid => {
        if (!valid) return;
        this.$modal.confirm(
          "确认给卡记录 " + this.leaveGrantForm.cardUserId + " 追加 "
          + this.leaveGrantForm.count + " 次请假额度？\n（仅长期卡可请假，额度在原值上累加）"
        ).then(() => {
          this.leaveGrantLoading = true;
          return adminGrantLeave(this.leaveGrantForm);
        }).then(res => {
          this.$modal.msgSuccess((res && res.msg) || "发放成功");
          this.resetGrantLeave();
        }).catch(() => {
          // 用户取消确认：静默忽略，避免未处理的 promise 拒绝
        }).finally(() => { this.leaveGrantLoading = false; });
      });
    },
    resetGrantLeave() {
      this.leaveGrantForm = { cardUserId: undefined, count: 1, reason: undefined };
    }
  }
};
</script>
