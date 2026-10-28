/* ============================================================
   auto-task.js - 「自动任务」页面组件
   ------------------------------------------------------------
   对应原系统：巨量 → 推广管理 → 自动化投放
   包含 4 个页签：任务模板 / 执行记录 / 标准投放 / 全域投放
   其中「任务模板」是核心，包含：
   筛选查询、新建/编辑/复制/开关/日志、批量操作、分页
   ============================================================ */

window.AutoTaskPage = {
  name: 'AutoTaskPage',

  template: `
  <div class="auto-task-page">

    <!-- ================= 4 个页签 ================= -->
    <el-tabs v-model="activeTab" class="task-tabs">

      <!-- ========== 页签 1：任务模板（核心） ========== -->
      <el-tab-pane label="任务模板" name="template">

        <!-- 筛选区 + 新建按钮 -->
        <div class="toolbar">
          <div class="filters">
            <el-input
              v-model="filters.keyword"
              placeholder="请输入任务模板名称"
              clearable
              style="width: 220px"
              @keyup.enter="onSearch"
            />
            <el-select v-model="filters.status" placeholder="请选择状态" clearable style="width: 140px">
              <el-option label="开启" value="on" />
              <el-option label="停用" value="off" />
            </el-select>
            <el-select v-model="filters.creator" placeholder="请选择创建人" clearable style="width: 140px">
              <el-option v-for="c in creators" :key="c" :label="c" :value="c" />
            </el-select>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </div>
          <el-button type="primary" @click="openCreate">新建任务</el-button>
        </div>

        <!-- 批量操作条：勾选了任务才显示 -->
        <div class="bulk-bar" v-show="selection.length > 0">
          已选择 <b>{{ selection.length }}</b> 条
          <el-button size="small" type="success" plain @click="bulkToggle(true)">批量开启</el-button>
          <el-button size="small" type="danger" plain @click="bulkToggle(false)">批量停用</el-button>
        </div>

        <!-- 数据表格 -->
        <el-table
          :data="rows"
          border
          stripe
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="42" />
          <el-table-column prop="id" label="ID" width="52" />
          <el-table-column label="状态" width="68">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                active-value="on"
                inactive-value="off"
                @change="onToggle(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="name" label="任务模板" min-width="140" show-overflow-tooltip />
          <el-table-column prop="dramaCount" label="短剧数" width="64" align="center" />
          <el-table-column label="全局ROI系数" width="94" align="center">
            <template #default="{ row }">{{ row.roi.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="日预算" width="100" align="right">
            <template #default="{ row }">{{ fmtMoney(row.dailyBudget) }}</template>
          </el-table-column>
          <el-table-column prop="creator" label="创建人" width="72" />
          <el-table-column prop="createdAt" label="创建时间" width="158" />
          <el-table-column prop="updater" label="更新人" width="72" />
          <el-table-column prop="updatedAt" label="更新时间" width="158" />
          <el-table-column label="操作" width="176" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="primary" @click="onCopy(row)">复制</el-button>
              <el-button link type="primary" @click="showLogs(row)">日志</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="fetch"
            @size-change="onSearch"
          />
        </div>
      </el-tab-pane>

      <!-- ========== 页签 2：执行记录 ========== -->
      <el-tab-pane label="执行记录" name="records">
        <el-table :data="allLogs" border stripe>
          <el-table-column prop="time" label="时间" width="170" />
          <el-table-column prop="taskName" label="任务模板" min-width="170" show-overflow-tooltip />
          <el-table-column prop="action" label="动作" width="100" />
          <el-table-column prop="operator" label="操作人" width="90" />
          <el-table-column prop="detail" label="详情" min-width="220" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>

      <!-- ========== 页签 3 / 4：建设中 ========== -->
      <el-tab-pane label="标准投放" name="standard">
        <div class="coming">
          「标准投放」模块建设中<br/>
          完成主教程后，可参照附录 B 把它扩展出来
        </div>
      </el-tab-pane>
      <el-tab-pane label="全域投放" name="omni">
        <div class="coming">
          「全域投放」模块建设中<br/>
          完成主教程后，可参照附录 B 把它扩展出来
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ================= 新建 / 编辑 弹窗 ================= -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId === null ? '新建任务' : '编辑任务'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="任务模板名称" prop="name">
          <el-input v-model="form.name" placeholder="如：1027-新剧全量铺投" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="短剧数" prop="dramaCount">
          <el-input-number v-model="form.dramaCount" :min="1" :max="99" style="width: 180px" />
        </el-form-item>
        <el-form-item label="执行间隔（分钟）" prop="intervalMin">
          <el-input-number v-model="form.intervalMin" :min="1" :max="1440" style="width: 180px" />
        </el-form-item>
        <el-form-item label="投放变现模式" prop="promoMode">
          <el-select v-model="form.promoMode" style="width: 180px">
            <el-option label="混合投放" value="混合投放" />
            <el-option label="标准投放" value="标准投放" />
            <el-option label="极速投放" value="极速投放" />
          </el-select>
        </el-form-item>
        <el-form-item label="全局ROI系数" prop="roi">
          <el-input-number v-model="form.roi" :min="0.1" :max="10" :step="0.01" :precision="2" style="width: 180px" />
        </el-form-item>
        <el-form-item label="日预算（元）" prop="dailyBudget">
          <el-input-number v-model="form.dailyBudget" :min="0" :step="10000" style="width: 180px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveTask">保 存</el-button>
      </template>
    </el-dialog>

    <!-- ================= 日志弹窗 ================= -->
    <el-dialog
      v-model="logDialogVisible"
      :title="'执行日志 - ' + logTaskName"
      width="680px"
    >
      <el-table :data="logRows" border max-height="360">
        <el-table-column prop="time" label="时间" width="170" />
        <el-table-column prop="action" label="动作" width="100" />
        <el-table-column prop="operator" label="操作人" width="90" />
        <el-table-column prop="detail" label="详情" min-width="220" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
  `,

  /* ---------- 页面自己的数据 ---------- */
  data: function () {
    return {
      activeTab: 'template',

      // 筛选条件
      filters: { keyword: '', status: '', creator: '' },
      creators: [],

      // 表格数据与分页
      rows: [],
      total: 0,
      page: 1,
      pageSize: 10,
      selection: [],

      // 新建 / 编辑弹窗
      dialogVisible: false,
      editingId: null,
      form: this.defaultForm(),
      rules: {
        name: [{ required: true, message: '请输入任务模板名称', trigger: 'blur' }]
      },

      // 日志弹窗
      logDialogVisible: false,
      logTaskName: '',
      logRows: [],

      // 执行记录页签
      allLogs: []
    };
  },

  mounted: function () {
    this.fetch();
    this.creators = window.MockAPI.creators();
  },

  methods: {
    // 新建任务时的默认表单值
    defaultForm: function () {
      return {
        name: '',
        dramaCount: 1,
        intervalMin: 10,
        promoMode: '混合投放',
        roi: 1.10,
        dailyBudget: 100000
      };
    },

    // 拉取列表（同时刷新执行记录）
    fetch: function () {
      var result = window.MockAPI.listTasks({
        keyword: this.filters.keyword,
        status: this.filters.status,
        creator: this.filters.creator,
        page: this.page,
        pageSize: this.pageSize
      });
      this.rows = result.rows;
      this.total = result.total;
      this.selection = [];
      this.allLogs = window.MockAPI.allLogs();
    },

    // 查询 / 重置
    onSearch: function () {
      this.page = 1;
      this.fetch();
    },
    onReset: function () {
      this.filters = { keyword: '', status: '', creator: '' };
      this.onSearch();
    },

    // 表格勾选变化
    onSelectionChange: function (sel) {
      this.selection = sel;
    },

    // 打开新建弹窗
    openCreate: function () {
      this.editingId = null;
      this.form = this.defaultForm();
      this.dialogVisible = true;
      this.clearValidate();
    },

    // 打开编辑弹窗（把行数据回填进表单）
    openEdit: function (row) {
      this.editingId = row.id;
      this.form = {
        name: row.name,
        dramaCount: row.dramaCount,
        intervalMin: row.intervalMin,
        promoMode: row.promoMode,
        roi: row.roi,
        dailyBudget: row.dailyBudget
      };
      this.dialogVisible = true;
      this.clearValidate();
    },

    // 清除上一次的校验红字
    clearValidate: function () {
      var self = this;
      this.$nextTick(function () {
        if (self.$refs.formRef) self.$refs.formRef.clearValidate();
      });
    },

    // 保存（新建或编辑）
    saveTask: function () {
      var self = this;
      this.$refs.formRef.validate(function (valid) {
        if (!valid) return;
        if (self.editingId === null) {
          window.MockAPI.createTask(self.form);
          self.$message.success('任务创建成功');
        } else {
          window.MockAPI.updateTask(self.editingId, self.form);
          self.$message.success('修改已保存');
        }
        self.dialogVisible = false;
        self.fetch();
      });
    },

    // 复制任务
    onCopy: function (row) {
      var task = window.MockAPI.copyTask(row.id);
      if (task) {
        this.$message.success('已复制出任务「' + task.name + '」');
        this.fetch();
      }
    },

    // 单个开关
    onToggle: function (row) {
      var on = row.status === 'on';
      window.MockAPI.toggleTask(row.id, on);
      this.$message.success(on ? '任务已开启' : '任务已停用');
      this.fetch();
    },

    // 批量开关
    bulkToggle: function (on) {
      if (this.selection.length === 0) {
        this.$message.warning('请先勾选任务');
        return;
      }
      var ids = this.selection.map(function (r) { return r.id; });
      var count = window.MockAPI.bulkToggle(ids, on);
      this.$message.success('已批量' + (on ? '开启' : '停用') + ' ' + count + ' 个任务');
      this.fetch();
    },

    // 查看某个任务的日志
    showLogs: function (row) {
      this.logTaskName = row.name;
      this.logRows = window.MockAPI.taskLogs(row.id);
      this.logDialogVisible = true;
    },

    // 金额加千分位：9999999 -> 9,999,999
    fmtMoney: function (n) {
      return Number(n).toLocaleString('zh-CN');
    }
  }
};
