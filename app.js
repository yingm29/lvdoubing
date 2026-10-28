/* ============================================================
   app.js - 应用启动文件
   ------------------------------------------------------------
   职责：
   1. 定义左侧菜单结构（MENUS）
   2. 极简 hash 路由：地址栏 #/ai-auto-task 显示自动任务页
   3. 创建 Vue 应用，注册组件，挂载到 index.html 的 #app 上
   ============================================================ */

/* ---------- 1. 菜单配置：改菜单只需要改这个数组 ----------
   index  = 菜单项的英文标识（同时就是路由地址 #/index）
   title  = 菜单显示文字
   crumbs = 面包屑（不写就自动是 首页 / 分组名 / 菜单名）      */
var MENUS = [
  { index: 'dashboard', title: '数据看板' },
  {
    title: '巨量',
    children: [
      { index: 'project',      title: '项目管理' },
      { index: 'global-promo', title: '全局投放' },
      { index: 'ai-material',  title: 'AI素材推广' },
      {
        index: 'ai-auto-task',
        title: '自动任务',
        crumbs: ['首页', '巨量', '推广管理', '自动任务']   // 模仿原系统的深层面包屑
      },
      { index: 'omni-promo',     title: '全域推广' },
      { index: 'standard-promo', title: '标准推广' }
    ]
  },
  {
    title: '资产管理',
    children: [
      { index: 'asset',     title: '资产管理' },
      { index: 'ks-account', title: '快手号' },
      { index: 'miniapp',   title: '小程序' }
    ]
  },
  {
    title: '系统管理',
    children: [
      { index: 'op-logs',    title: '操作记录' },
      { index: 'permission', title: '权限管理' },
      { index: 'settings',   title: '网站设置' }
    ]
  }
];

/* ---------- 2. 根据路由地址找到对应菜单项 ---------- */
function findMenu(key) {
  var found = null;
  MENUS.forEach(function (menu) {
    if (menu.index === key) found = menu;                       // 顶层菜单
    (menu.children || []).forEach(function (item) {
      if (item.index === key) found = Object.assign({ group: menu.title }, item); // 分组里的菜单
    });
  });
  return found;
}

/* ---------- 3. 创建 Vue 应用 ---------- */
var app = Vue.createApp({

  data: function () {
    return {
      menus: MENUS,
      collapsed: false,                       // 侧栏是否收起
      clock: '',                              // 顶栏时钟
      routeKey: 'dashboard',                  // 当前路由（菜单标识）
      current: {                              // 当前页面信息
        page: 'placeholder-page',
        title: '数据看板',
        crumbs: ['首页', '数据看板']
      },
      user: window.MockAPI.user               // 当前登录用户（演示）
    };
  },

  computed: {
    activeMenu: function () {
      return this.routeKey;
    }
  },

  mounted: function () {
    var self = this;
    // 时钟每秒刷新一次
    this.tick();
    setInterval(this.tick, 1000);
    // 监听地址栏 # 后面的变化（也就是我们的"路由"）
    window.addEventListener('hashchange', function () { self.resolveRoute(); });
    this.resolveRoute();
  },

  methods: {
    tick: function () {
      var d = new Date();
      function p(n) { return (n < 10 ? '0' : '') + n; }
      this.clock = 'UTC+8 ' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
        ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    },

    // 把地址栏的 #/xxx 解析成要显示的页面
    resolveRoute: function () {
      var key = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
      this.routeKey = key;
      var item = findMenu(key);
      if (!item) {
        this.current = { page: 'placeholder-page', title: '未知页面', crumbs: ['首页', '未知页面'] };
        return;
      }
      var crumbs = item.crumbs ||
        ['首页'].concat(item.group ? [item.group] : []).concat([item.title]);
      this.current = {
        page: item.index === 'ai-auto-task' ? 'auto-task-page' : 'placeholder-page',
        title: item.title,
        crumbs: crumbs
      };
    },

    // 点击菜单 = 改地址栏 hash，剩下交给 resolveRoute
    onMenuSelect: function (index) {
      window.location.hash = '#/' + index;
    },

    // 顶栏右上角下拉菜单
    onUserCommand: function (cmd) {
      var self = this;
      if (cmd === 'reset') {
        this.$confirm('将清空所有本地修改，恢复到初始演示数据，是否继续？', '重置演示数据', {
          type: 'warning',
          confirmButtonText: '重置',
          cancelButtonText: '取消'
        }).then(function () {
          window.MockAPI.reseed();
          self.$message.success('已恢复初始演示数据');
          setTimeout(function () { window.location.reload(); }, 400);
        }).catch(function () { /* 点了取消，什么都不做 */ });
      } else if (cmd === 'logout') {
        this.$message.info('演示环境：退出登录仅为交互演示');
      }
    }
  }
});

/* ---------- 4. 注册 Element Plus（中文语言包） ---------- */
app.use(ElementPlus, { locale: ElementPlusLocaleZhCn });

/* ---------- 5. 注册两个页面组件 ---------- */
// 5.1 核心页面：自动任务（代码在 auto-task.js）
app.component('auto-task-page', window.AutoTaskPage);

// 5.2 占位页：其他菜单点进去都显示它
app.component('placeholder-page', {
  props: ['title'],
  template: '\
  <div class="placeholder">\
    <div class="ph-icon">{{ title[0] }}</div>\
    <div class="ph-title">{{ title }}</div>\
    <div class="ph-desc">该模块为占位演示页，本教程只实现「自动任务」模块。<br/>\
    完成主教程后，可以按照附录 B 的方法把其他模块也补充出来。</div>\
  </div>'
});

/* ---------- 6. 挂载到 index.html 里的 <div id="app"> ---------- */
app.mount('#app');
