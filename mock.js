/* ============================================================
   mock.js - 模拟后端（假接口 + 本地存储）
   ------------------------------------------------------------
   GitHub Pages 是纯静态空间，没有服务器和数据库。
   所以我们用浏览器自带的 localStorage 当"数据库"，
   用这个文件里的函数当"接口"，让页面表现得像真系统一样：
   新建 / 编辑 / 复制 / 开关任务后，刷新页面数据依然在。
   ============================================================ */

(function () {

  /* ---------- 1. 基础配置 ---------- */

  // 存储键名（带上版本号，将来改数据结构时换键名即可）
  var TASK_KEY = 'skad_demo_tasks_v1';
  var LOG_KEY = 'skad_demo_logs_v1';

  // 当前登录用户（演示用，写死的）
  var CURRENT_USER = { name: '李白' };

  /* ---------- 2. 初始演示数据（第一次打开页面时自动种入） ---------- */

  var SEED_TASKS = [
    { id: 8, name: '1027-新剧全量铺投',   dramaCount: 6, intervalMin: 10, promoMode: '混合投放', roi: 1.10, dailyBudget: 200000,  status: 'on',  creator: '李白', createdAt: '2026-10-27 09:12:35', updater: '李白', updatedAt: '2026-10-27 15:04:22' },
    { id: 7, name: '恋爱糖分-真人引流',   dramaCount: 3, intervalMin: 10, promoMode: '混合投放', roi: 1.10, dailyBudget: 9999999, status: 'on',  creator: '林一', createdAt: '2026-10-26 14:20:08', updater: '林一', updatedAt: '2026-10-27 11:40:19' },
    { id: 6, name: '豪门千金的逆袭-强制', dramaCount: 2, intervalMin: 15, promoMode: '混合投放', roi: 1.08, dailyBudget: 500000,  status: 'off', creator: '陈默', createdAt: '2026-10-25 10:05:44', updater: '陈默', updatedAt: '2026-10-26 09:31:02' },
    { id: 5, name: '九九剧场-封心葬爱',   dramaCount: 4, intervalMin: 10, promoMode: '混合投放', roi: 1.12, dailyBudget: 920655,  status: 'on',  creator: '林一', createdAt: '2026-10-24 16:44:31', updater: '李白', updatedAt: '2026-10-27 10:22:47' },
    { id: 4, name: '王爷别来无恙-测试',   dramaCount: 1, intervalMin: 20, promoMode: '标准投放', roi: 1.05, dailyBudget: 100000,  status: 'off', creator: '李白', createdAt: '2026-10-23 11:30:15', updater: '李白', updatedAt: '2026-10-23 18:02:39' },
    { id: 3, name: '闪婚老伴是豪门',      dramaCount: 2, intervalMin: 10, promoMode: '混合投放', roi: 1.10, dailyBudget: 300000,  status: 'on',  creator: '陈默', createdAt: '2026-10-22 09:55:27', updater: '陈默', updatedAt: '2026-10-25 14:11:58' },
    { id: 2, name: '任务模板-备份用',     dramaCount: 1, intervalMin: 30, promoMode: '极速投放', roi: 1.00, dailyBudget: 50000,   status: 'off', creator: '林一', createdAt: '2026-10-21 15:30:00', updater: '林一', updatedAt: '2026-10-21 15:30:00' },
    { id: 1, name: '初始化演示任务',      dramaCount: 1, intervalMin: 60, promoMode: '混合投放', roi: 1.00, dailyBudget: 10000,   status: 'on',  creator: '李白', createdAt: '2026-10-20 10:00:00', updater: '李白', updatedAt: '2026-10-20 10:00:00' }
  ];

  var SEED_LOGS = [
    { time: '2026-10-27 15:04:22', taskId: 8, taskName: '1027-新剧全量铺投',   action: '编辑任务', operator: '李白', detail: '全局 ROI 系数调整为 1.10' },
    { time: '2026-10-27 11:40:19', taskId: 7, taskName: '恋爱糖分-真人引流',   action: '开启任务', operator: '林一', detail: '任务开启，开始按 10 分钟间隔执行' },
    { time: '2026-10-27 10:22:47', taskId: 5, taskName: '九九剧场-封心葬爱',   action: '编辑任务', operator: '李白', detail: '日预算调整为 920,655 元' },
    { time: '2026-10-26 09:31:02', taskId: 6, taskName: '豪门千金的逆袭-强制', action: '停用任务', operator: '陈默', detail: '手动停用任务' },
    { time: '2026-10-25 14:11:58', taskId: 3, taskName: '闪婚老伴是豪门',      action: '复制任务', operator: '陈默', detail: '由「闪婚老伴是豪门」复制创建' },
    { time: '2026-10-24 16:44:31', taskId: 5, taskName: '九九剧场-封心葬爱',   action: '创建任务', operator: '林一', detail: '创建任务模板，ROI 系数 1.12' }
  ];

  /* ---------- 3. 读写 localStorage 的小工具 ---------- */

  function read(key, seed) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 存储不可用时忽略，走种子数据 */ }
    var copy = JSON.parse(JSON.stringify(seed));
    write(key, copy);
    return copy;
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* 忽略写入失败（如无痕模式） */ }
  }

  var tasks = read(TASK_KEY, SEED_TASKS);   // 页面打开时：有存档就读存档，没有就种入演示数据
  var logs = read(LOG_KEY, SEED_LOGS);

  function saveTasks() { write(TASK_KEY, tasks); }
  function saveLogs() { write(LOG_KEY, logs); }

  // 返回 "2026-10-27 16:00:00" 格式的当前时间
  function now() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  // 生成下一个自增 ID
  function nextId() {
    var max = 0;
    tasks.forEach(function (t) { if (t.id > max) max = t.id; });
    return max + 1;
  }

  // 记一条操作日志（最新的排最前）
  function addLog(taskId, taskName, action, detail) {
    logs.unshift({
      time: now(), taskId: taskId, taskName: taskName,
      action: action, operator: CURRENT_USER.name, detail: detail
    });
    if (logs.length > 500) logs.length = 500;   // 最多留 500 条，防止存储爆满
    saveLogs();
  }

  /* ---------- 4. 对外提供的"接口" ---------- */

  window.MockAPI = {

    user: CURRENT_USER,

    // 任务列表（支持关键词 / 状态 / 创建人筛选 + 分页）
    listTasks: function (query) {
      query = query || {};
      var keyword = (query.keyword || '').trim();
      var list = tasks.filter(function (t) {
        if (keyword && t.name.indexOf(keyword) === -1) return false;
        if (query.status && t.status !== query.status) return false;
        if (query.creator && t.creator !== query.creator) return false;
        return true;
      });
      list.sort(function (a, b) { return b.id - a.id; });   // 新的排前面
      var total = list.length;
      var page = query.page || 1;
      var pageSize = query.pageSize || 10;
      var rows = list.slice((page - 1) * pageSize, page * pageSize)
        .map(function (t) { return Object.assign({}, t); }); // 复制一份给页面，防止页面直接改到存储
      return { rows: rows, total: total };
    },

    // 所有创建人（用于筛选下拉框）
    creators: function () {
      var set = {};
      tasks.forEach(function (t) { set[t.creator] = 1; });
      set[CURRENT_USER.name] = 1;
      return Object.keys(set);
    },

    // 新建任务
    createTask: function (data) {
      var task = {
        id: nextId(),
        name: data.name,
        dramaCount: data.dramaCount,
        intervalMin: data.intervalMin,
        promoMode: data.promoMode,
        roi: data.roi,
        dailyBudget: data.dailyBudget,
        status: 'on',
        creator: CURRENT_USER.name,
        createdAt: now(),
        updater: CURRENT_USER.name,
        updatedAt: now()
      };
      tasks.unshift(task);
      saveTasks();
      addLog(task.id, task.name, '创建任务', '创建任务模板，ROI 系数 ' + task.roi.toFixed(2));
      return task;
    },

    // 编辑任务
    updateTask: function (id, patch) {
      var task = null;
      tasks.forEach(function (t) {
        if (t.id === id) {
          t.name = patch.name;
          t.dramaCount = patch.dramaCount;
          t.intervalMin = patch.intervalMin;
          t.promoMode = patch.promoMode;
          t.roi = patch.roi;
          t.dailyBudget = patch.dailyBudget;
          t.updater = CURRENT_USER.name;
          t.updatedAt = now();
          task = t;
        }
      });
      saveTasks();
      if (task) addLog(id, task.name, '编辑任务', '修改了任务配置');
      return task;
    },

    // 复制任务（完整克隆一份，名字加 _副本）
    copyTask: function (id) {
      var src = null;
      tasks.forEach(function (t) { if (t.id === id) src = t; });
      if (!src) return null;
      var task = Object.assign({}, src, {
        id: nextId(),
        name: src.name + '_副本',
        creator: CURRENT_USER.name,
        createdAt: now(),
        updater: CURRENT_USER.name,
        updatedAt: now()
      });
      tasks.unshift(task);
      saveTasks();
      addLog(task.id, task.name, '复制任务', '由「' + src.name + '」复制创建');
      return task;
    },

    // 开启 / 停用单个任务
    toggleTask: function (id, on) {
      var task = null;
      tasks.forEach(function (t) { if (t.id === id) { t.status = on ? 'on' : 'off'; t.updater = CURRENT_USER.name; t.updatedAt = now(); task = t; } });
      saveTasks();
      if (task) addLog(id, task.name, on ? '开启任务' : '停用任务', on ? '任务开启，按设定间隔执行' : '手动停用任务');
      return task;
    },

    // 批量开启 / 停用
    bulkToggle: function (ids, on) {
      var me = CURRENT_USER.name, time = now();
      var count = 0;
      tasks.forEach(function (t) {
        if (ids.indexOf(t.id) !== -1) {
          t.status = on ? 'on' : 'off';
          t.updater = me; t.updatedAt = time;
          count++;
          addLog(t.id, t.name, on ? '开启任务' : '停用任务', '批量' + (on ? '开启' : '停用') + '操作');
        }
      });
      saveTasks();
      return count;
    },

    // 某个任务的日志
    taskLogs: function (taskId) {
      return logs.filter(function (l) { return l.taskId === taskId; });
    },

    // 全部日志（执行记录页签用）
    allLogs: function () {
      return logs.slice(0, 100);
    },

    // 恢复初始演示数据
    reseed: function () {
      tasks = JSON.parse(JSON.stringify(SEED_TASKS));
      logs = JSON.parse(JSON.stringify(SEED_LOGS));
      saveTasks();
      saveLogs();
    }
  };

})();
