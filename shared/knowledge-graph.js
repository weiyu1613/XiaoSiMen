/**
 * TeachAny P2-10: 知识图谱可折叠交互
 * 使用 ECharts 的 graph 图表类型（力导向布局）
 *
 * 依赖：ECharts 5.x，CDN 引入：
 *   https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js
 * 若页面尚未加载 ECharts，本脚本会自动按上述 CDN 注入。
 *
 * 数据格式：
 *   {
 *     nodes: [
 *       { id: 'bjr', name: '北京人', category: '史前人类', value: '中国境内早期人类代表' }
 *       // value 可为字符串（说明）或数字（重要度，影响节点大小）
 *     ],
 *     links: [
 *       { source: 'unit1', target: 'bjr', value: '包含', type: 'tree' }
 *       // type: 'tree'（父子层级，默认）/ 'cross'（关联关系）
 *     ],
 *     categories: ['史前人类', '农耕文明', '传说时代']  // 可选，省略时自动从节点 category 推导
 *   }
 *
 * 用法：
 *   var kg = new KnowledgeGraph('graph-container', data, { /* options *\/ });
 *   节点点击：展开/折叠子节点；悬停：显示知识点详情；支持滚轮缩放与拖拽。
 */
(function () {
  'use strict';

  /* 学科 / 分类默认配色（按 category 名匹配；未命中则使用回退调色板） */
  var CATEGORY_COLOR_MAP = {
    '史前人类': '#8B4513',
    '农耕文明': '#2e7d32',
    '传说时代': '#1565C0',
    '单元':    '#6a1b9a',
    'history':  '#8B4513',
    'geography': '#1e6091',
    'biology':  '#2e7d32',
    'politics': '#c62828'
  };
  var FALLBACK_PALETTE = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#c0504d'
  ];

  var ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js';

  function colorForCategory(name, index) {
    if (name && CATEGORY_COLOR_MAP[name]) return CATEGORY_COLOR_MAP[name];
    return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
  }

  function isNum(v) { return typeof v === 'number' && !isNaN(v); }

  var KnowledgeGraph = function (containerId, data, options) {
    this.containerId = containerId;
    this.container = typeof containerId === 'string'
      ? document.getElementById(containerId) : containerId;
    if (!this.container) {
      console.warn('[KnowledgeGraph] 容器不存在:', containerId);
      return;
    }

    this.rawData = data || { nodes: [], links: [] };
    this.options = options || {};

    // 分类列表（含颜色）
    this.categories = this._buildCategories(this.rawData.categories, this.rawData.nodes);
    // 父子结构（仅 type !== 'cross' 的连边参与）
    this.childrenMap = this._buildChildrenMap(this.rawData.links);
    // 根节点：无 tree 类型入边的节点
    this.rootIds = this._findRoots(this.rawData.nodes, this.rawData.links);
    // 展开状态：nodeId -> boolean
    this.expanded = {};

    // 节点查找表
    this.nodeMap = {};
    this.rawData.nodes.forEach(function (n) { this.nodeMap[n.id] = n; }, this);

    // 默认展开根节点
    this.rootIds.forEach(function (id) { this.expanded[id] = true; }, this);

    // 确保 ECharts 就绪后初始化
    this._ensureEcharts(this._initChart.bind(this));
  };

  KnowledgeGraph.prototype = {

    /* ---------- 类目构建 ---------- */
    _buildCategories: function (catNames, nodes) {
      var names = [];
      if (catNames && catNames.length) {
        names = catNames.slice();
      } else {
        var seen = {};
        nodes.forEach(function (n) {
          var c = n.category || '默认';
          if (!seen[c]) { seen[c] = 1; names.push(c); }
        });
      }
      return names.map(function (name, i) {
        return { name: name, itemStyle: { color: colorForCategory(name, i) } };
      });
    },

    _categoryIndex: function (name) {
      for (var i = 0; i < this.categories.length; i++) {
        if (this.categories[i].name === (name || '默认')) return i;
      }
      return 0;
    },

    /* ---------- 父子结构 ---------- */
    _buildChildrenMap: function (links) {
      var map = {};
      (links || []).forEach(function (l) {
        if (l.type === 'cross') return; // 关联边不构成父子
        var key = l.source;
        if (!map[key]) map[key] = [];
        map[key].push(l.target);
      });
      return map;
    },

    _findRoots: function (nodes, links) {
      var targeted = {};
      (links || []).forEach(function (l) {
        if (l.type !== 'cross') targeted[l.target] = 1;
      });
      var roots = [];
      nodes.forEach(function (n) {
        if (!targeted[n.id]) roots.push(n.id);
      });
      // 若全部节点都有入边（成环兜底），取第一个节点作为根
      if (roots.length === 0 && nodes.length) roots.push(nodes[0].id);
      return roots;
    },

    /* ---------- ECharts 加载 ---------- */
    _ensureEcharts: function (cb) {
      if (window.echarts) { cb(); return; }
      if (this._echartsLoading) {
        // 已在加载中，轮询等待
        var self = this;
        this._echartsQueue = this._echartsQueue || [];
        this._echartsQueue.push(cb);
        return;
      }
      this._echartsLoading = true;
      this._echartsQueue = [cb];
      var s = document.createElement('script');
      s.src = ECHARTS_CDN;
      s.onload = function () {
        this._echartsLoading = false;
        (this._echartsQueue || []).forEach(function (fn) { try { fn(); } catch (e) {} });
        this._echartsQueue = [];
      }.bind(this);
      s.onerror = function () {
        console.error('[KnowledgeGraph] ECharts CDN 加载失败，请检查网络或手动引入 echarts.min.js');
      };
      document.head.appendChild(s);
    },

    /* ---------- 图表初始化 ---------- */
    _initChart: function () {
      if (!window.echarts) return;
      this.chart = echarts.init(this.container);
      this._render();
      this._bindEvents();
      var self = this;
      window.addEventListener('resize', function () { if (self.chart) self.chart.resize(); });
    },

    /* ---------- 计算可见节点 / 连边 ---------- */
    _computeVisible: function () {
      var visibleNodes = {};
      var visibleLinks = [];
      var self = this;

      // 递归遍历：仅当节点展开时显示其子节点
      function walk(nodeId, visited) {
        if (visibleNodes[nodeId] || visited[nodeId]) return;
        visibleNodes[nodeId] = true;
        visited[nodeId] = true;
        var isExpanded = !!self.expanded[nodeId];
        var kids = self.childrenMap[nodeId] || [];
        kids.forEach(function (kidId) {
          if (isExpanded) {
            visibleLinks.push({ source: nodeId, target: kidId, _tree: true });
            walk(kidId, visited);
          }
          // 折叠时子节点不显示
        });
      }

      var visited = {};
      this.rootIds.forEach(function (id) { walk(id, visited); });

      // 关联边（cross）：仅当两端均可见时显示
      (this.rawData.links || []).forEach(function (l) {
        if (l.type === 'cross' && visibleNodes[l.source] && visibleNodes[l.target]) {
          visibleLinks.push({ source: l.source, target: l.target, _tree: false, value: l.value });
        }
      });

      // 组装 ECharts 节点数据
      var nodes = [];
      Object.keys(visibleNodes).forEach(function (id) {
        var raw = self.nodeMap[id] || { id: id, name: id };
        var hasChildren = (self.childrenMap[id] || []).length > 0;
        var isExpanded = !!self.expanded[id];
        var size = self._nodeSize(raw, hasChildren);
        var name = raw.name || id;
        if (hasChildren) {
          name = (isExpanded ? '▾ ' : '▸ ') + name;
        }
        nodes.push({
          id: id,
          name: name,
          _rawName: raw.name || id,
          category: self._categoryIndex(raw.category),
          value: raw.value,
          symbolSize: size,
          hasChildren: hasChildren,
          expanded: isExpanded,
          _raw: raw,
          label: { show: true }
        });
      });

      return { nodes: nodes, links: visibleLinks };
    },

    _nodeSize: function (raw, hasChildren) {
      var base = hasChildren ? 46 : 30;
      if (isNum(raw.value)) {
        // 数值作为重要度，映射到 22~60
        return Math.max(22, Math.min(60, 22 + raw.value * 4));
      }
      return base;
    },

    /* ---------- 渲染 ---------- */
    _render: function () {
      if (!this.chart) return;
      var vis = this._computeVisible();
      var self = this;

      var option = {
        tooltip: {
          formatter: function (p) {
            if (p.dataType === 'node') {
              var raw = p.data._raw || {};
              var cat = self.categories[p.data.category] ? self.categories[p.data.category].name : '';
              var desc = raw.value;
              if (isNum(desc)) desc = '重要度：' + desc;
              var state = p.data.hasChildren
                ? (p.data.expanded ? '（已展开，点击折叠）' : '（已折叠，点击展开）')
                : '';
              var kids = (self.childrenMap[raw.id] || []).length;
              var html = '<div style="max-width:260px;">' +
                '<b style="font-size:14px;">' + (raw.name || raw.id) + '</b>' + state +
                (cat ? '<br><span style="color:#888;">分类：' + cat + '</span>' : '') +
                (desc ? '<br><span>' + desc + '</span>' : '') +
                (kids ? '<br><span style="color:#aaa;">子知识点：' + kids + ' 个</span>' : '') +
                '</div>';
              return html;
            } else if (p.dataType === 'edge') {
              return p.data.value ? ('关系：' + p.data.value) : '关联';
            }
            return p.name;
          }
        },
        legend: [{
          data: this.categories.map(function (c) { return c.name; }),
          textStyle: { color: '#555' },
          top: 10
        }],
        animationDurationUpdate: 600,
        animationEasingUpdate: 'cubicInOut',
        series: [{
          type: 'graph',
          layout: 'force',
          roam: true,            // 缩放 + 拖拽平移
          draggable: true,      // 节点可拖拽
          categories: this.categories,
          data: vis.nodes,
          links: vis.links,
          label: {
            show: true,
            position: 'right',
            formatter: function (p) { return p.data._rawName || p.data.name; },
            fontSize: 12,
            color: '#333'
          },
          lineStyle: {
            color: 'source',
            curveness: 0.18,
            width: 1.4,
            opacity: 0.7
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 3, opacity: 1 },
            label: { fontSize: 14, fontWeight: 'bold' }
          },
          force: {
            repulsion: this.options.repulsion || 220,
            edgeLength: this.options.edgeLength || [60, 140],
            gravity: this.options.gravity || 0.08,
            layoutAnimation: true
          },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [0, 7]
        }]
      };

      this.chart.setOption(option, true);
    },

    /* ---------- 事件绑定 ---------- */
    _bindEvents: function () {
      var self = this;
      this.chart.on('click', function (params) {
        if (params.dataType !== 'node') return;
        var id = params.data.id;
        if (!id) return;
        if ((self.childrenMap[id] || []).length === 0) {
          // 叶子节点：触发详情回调
          if (typeof self.options.onLeafClick === 'function') {
            self.options.onLeafClick(self.nodeMap[id], params);
          }
          return;
        }
        self._toggleNode(id);
      });
    },

    /* ---------- 展开 / 折叠 ---------- */
    _toggleNode: function (id) {
      if (this.expanded[id]) {
        // 折叠：同时折叠所有后代
        this.expanded[id] = false;
        this._collapseDescendants(id);
      } else {
        this.expanded[id] = true;
      }
      this._render();
      if (typeof this.options.onToggle === 'function') {
        this.options.onToggle(id, !!this.expanded[id], this);
      }
    },

    _collapseDescendants: function (id) {
      var self = this;
      (this.childrenMap[id] || []).forEach(function (kid) {
        self.expanded[kid] = false;
        self._collapseDescendants(kid);
      });
    },

    /* ===================== 公开 API ===================== */

    /** 展开指定节点 */
    expand: function (id) {
      this.expanded[id] = true;
      this._render();
    },

    /** 折叠指定节点（及其后代） */
    collapse: function (id) {
      this.expanded[id] = false;
      this._collapseDescendants(id);
      this._render();
    },

    /** 全部展开 */
    expandAll: function () {
      var self = this;
      this.rawData.nodes.forEach(function (n) { self.expanded[n.id] = true; });
      this._render();
    },

    /** 折叠到只显示根节点及其直接子节点 */
    collapseToRoot: function () {
      var self = this;
      this.rawData.nodes.forEach(function (n) { self.expanded[n.id] = false; });
      this.rootIds.forEach(function (id) { self.expanded[id] = true; });
      this._render();
    },

    /** 重新装载数据并渲染 */
    setData: function (data) {
      this.rawData = data || { nodes: [], links: [] };
      this.categories = this._buildCategories(this.rawData.categories, this.rawData.nodes);
      this.childrenMap = this._buildChildrenMap(this.rawData.links);
      this.rootIds = this._findRoots(this.rawData.nodes, this.rawData.links);
      this.nodeMap = {};
      this.rawData.nodes.forEach(function (n) { this.nodeMap[n.id] = n; }, this);
      this.expanded = {};
      this.rootIds.forEach(function (id) { this.expanded[id] = true; }, this);
      this._render();
    },

    /** 销毁实例，释放资源 */
    dispose: function () {
      if (this.chart) { this.chart.dispose(); this.chart = null; }
    }
  };

  // 暴露到全局
  window.KnowledgeGraph = KnowledgeGraph;
})();
