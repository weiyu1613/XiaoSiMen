/**
 * TeachAny P2-8: 分步解锁机制
 * 前测→正文→后测的渐进式学习解锁
 * 使用 localStorage 持久化解锁状态
 *
 * 用法：在课件页面底部引入
 *   <script src="../shared/step-unlock.js"></script>
 * 脚本会自动检测页面结构并初始化：
 *   - 若页面存在"前测 / 正文 / 后测"三阶段结构，则启用分步锁定与解锁；
 *   - 否则仅在顶部展示三阶段进度条（不锁定任何内容）。
 *
 * 兼容性：通过 MutationObserver 监听答题后 DOM 类名变化（checkAnswer /
 * checkPreQuiz / checkPostQuiz 均会为选项添加 .correct/.wrong），不修改、
 * 不破坏现有 checkAnswer 函数，零侵入。
 */
(function () {
  'use strict';

  /* ===================== 常量 ===================== */
  var STORAGE_PREFIX = 'teachany_unlock_';   // localStorage key 前缀
  var PROGRESS_ID = 'su-progress-bar';        // 进度条容器 id
  var OVERLAY_CLASS = 'su-lock-overlay';      // 锁定遮罩 class
  var INIT_FLAG = '__stepUnlockInit';         // 防重复初始化标志
  var SCROLL_THRESHOLD = 120;                 // 正文滚动判定阈值(px)

  // 三阶段定义：pre-test(前测) → content(正文) → post-test(后测)
  var STEP_DEFS = [
    { id: 'pre-test',  name: '课前预习', icon: '📋', desc: '完成前测题目解锁正文' },
    { id: 'content',   name: '课件正文', icon: '📖', desc: '学习正文内容解锁后测' },
    { id: 'post-test', name: '课后检测', icon: '✅', desc: '完成后测检验学习成果' }
  ];

  /* ===================== 主对象 ===================== */
  var StepUnlock = {
    steps: STEP_DEFS,

    courseId: null,
    sections: {},          // { 'pre-test': el, 'post-test': el }
    contentSections: [],   // 正文阶段涉及的元素列表（前测与后测之间）
    hasThreeStages: false, // 是否检测到完整三阶段结构
    status: null,          // 当前持久化状态
    _unlockedContent: false,
    _unlockedPostTest: false,
    _observer: null,
    _scrollBound: false,
    _silent: false,        // 静默模式（加载时应用已存状态，不弹 toast）

    /* ---------- 初始化入口 ---------- */
    init: function () {
      if (window[INIT_FLAG]) return;
      window[INIT_FLAG] = true;
      // 允许通过 body.step-unlock-disabled 整体关闭
      if (document.body && document.body.classList.contains('step-unlock-disabled')) return;

      // 1. 获取课件 ID（meta 优先，回退到页面路径）
      this.courseId = this._getCourseId();
      if (!this.courseId) return;

      // 2. 注入样式
      this._injectStyles();

      // 3. 检测三阶段结构
      this._detectSections();

      // 4. 渲染顶部进度条
      this._renderProgressBar();

      // 5. 若存在三阶段，则设置锁定与监听
      if (this.hasThreeStages) {
        // 读取持久化状态
        this.status = this.getStatus(this.courseId);
        // 初始应用锁定（依据是否含前测题目决定是否锁定正文）
        this._applyInitialLocks();
        // 设置答题 / 滚动监听
        this._setupListeners();
      } else {
        // 无三阶段：进度条仅作展示，全部标记为可访问
        this._setStepState('pre-test', 'active');
      }

      console.log('[StepUnlock] 初始化完成 courseId=' + this.courseId +
        ' threeStages=' + this.hasThreeStages);
    },

    /* ===================== 课程 ID ===================== */
    _getCourseId: function () {
      var meta = document.querySelector('meta[name="course-id"]');
      var meta2 = document.querySelector('meta[name="teachany-node"]');
      var id = (meta && meta.getAttribute('content')) ||
               (meta2 && meta2.getAttribute('content'));
      if (!id) {
        // 回退：使用相对路径去除扩展名
        id = location.pathname.replace(/\.html?$/i, '').replace(/[\/\\]/g, '_') || 'course';
      }
      return id;
    },

    /* ===================== 三阶段检测 ===================== */
    _detectSections: function () {
      // 前测：优先 ID 匹配，其次文本关键词
      this.sections['pre-test'] = this._findSection(
        ['section-prequiz', 'section-pre-test', 'pre-test', 'prequiz'],
        ['前测', '课前预习', '先备知识', '预习检测']
      );
      // 后测
      this.sections['post-test'] = this._findSection(
        ['section-postquiz', 'section-post-test', 'post-test', 'postquiz'],
        ['后测', '课后检测', '学习成果', '课堂检测']
      );

      var pre = this.sections['pre-test'];
      var post = this.sections['post-test'];

      if (pre && post) {
        // 正文 = main 内位于前测与后测之间的全部子元素
        this.contentSections = this._collectBetween(pre, post);
      }

      this.hasThreeStages = !!(pre && post && this.contentSections.length > 0);
    },

    _findSection: function (ids, keywords) {
      var i, el;
      for (i = 0; i < ids.length; i++) {
        el = document.getElementById(ids[i]);
        if (el) return el;
      }
      // 关键词兜底：遍历 section 元素，匹配标题文本
      var secs = document.querySelectorAll('section, .section');
      for (i = 0; i < secs.length; i++) {
        var txt = (secs[i].textContent || secs[i].innerText || '').slice(0, 60);
        for (var k = 0; k < keywords.length; k++) {
          if (txt.indexOf(keywords[k]) !== -1) return secs[i];
        }
      }
      return null;
    },

    _collectBetween: function (pre, post) {
      var main = document.querySelector('main') || document.body;
      var children = Array.prototype.slice.call(main.children);
      var a = children.indexOf(pre);
      var b = children.indexOf(post);
      if (a === -1 || b === -1 || b <= a + 1) return [];
      return children.slice(a + 1, b);
    },

    /* ===================== 初始锁定 ===================== */
    _applyInitialLocks: function () {
      this._silent = true;
      // 正文是否需要锁定：仅当存在前测题目时才锁定正文
      var hasPreQuiz = this._countPreQuizzes() > 0;

      if (this.status.preTestDone || !hasPreQuiz) {
        // 前测已完成（或无前测题目）：正文直接可访问
        this._unlockedContent = true;
        this._setStepState('pre-test', 'completed');
        this._setStepState('content', 'active');
      } else {
        // 锁定正文
        this._lockRegion(this.contentSections, 'content', '完成前测后解锁正文');
        this._setStepState('pre-test', 'active');
        this._setStepState('content', 'locked');
      }

      if (this.status.contentDone) {
        this._unlockedContent = true;
        this._unlockedPostTest = true;
        this._unlockRegion(this.contentSections, true); // 静默移除遮罩
        this._unlockElement(this.sections['post-test'], true);
        this._setStepState('content', 'completed');
        this._setStepState('post-test', 'active');
      } else {
        // 锁定后测
        this._lockElement(this.sections['post-test'], 'post-test', '学习正文后解锁后测');
        if (this._unlockedContent) {
          this._setStepState('content', 'active');
        }
        this._setStepState('post-test', 'locked');
      }
      this._silent = false;
    },

    /* ===================== 锁定 / 解锁元素 ===================== */
    _lockRegion: function (els, stepId, hint) {
      var self = this;
      els.forEach(function (el) { self._lockElement(el, stepId, hint); });
    },

    _lockElement: function (el, stepId, hint) {
      if (!el) return;
      if (el.querySelector(':scope > .' + OVERLAY_CLASS)) return;
      var pos = getComputedStyle(el).position;
      if (pos === 'static') el.style.position = 'relative';
      el.classList.add('su-locked');
      var ov = document.createElement('div');
      ov.className = OVERLAY_CLASS;
      ov.setAttribute('data-step', stepId);
      ov.innerHTML =
        '<div class="su-lock-inner">' +
          '<div class="su-lock-icon">🔒</div>' +
          '<div class="su-lock-title">' + (hint || '内容已锁定') + '</div>' +
          '<div class="su-lock-hint">完成上一阶段后自动解锁</div>' +
        '</div>';
      el.appendChild(ov);
    },

    _unlockRegion: function (els, silent) {
      var self = this;
      els.forEach(function (el) { self._unlockElement(el, silent); });
    },

    _unlockElement: function (el, silent) {
      if (!el) return;
      el.classList.remove('su-locked');
      var ovs = el.querySelectorAll(':scope > .' + OVERLAY_CLASS);
      Array.prototype.forEach.call(ovs, function (o) {
        if (silent) { o.remove(); return; }
        o.classList.add('su-unlocking');
        setTimeout(function () { o.remove(); }, 480);
      });
    },

    /* ===================== 监听器 ===================== */
    _setupListeners: function () {
      var self = this;

      // 前测完成检测：MutationObserver 监听选项类名变化（兼容 checkAnswer 全家桶）
      if (!this._unlockedContent && this.sections['pre-test']) {
        this._observer = new MutationObserver(function () {
          self._checkPreTestCompletion();
        });
        this._observer.observe(this.sections['pre-test'], {
          subtree: true, attributes: true, attributeFilter: ['class']
        });
      }

      // 正文滚动检测：节流
      if (!this._scrollBound) {
        this._scrollBound = true;
        var ticking = false;
        window.addEventListener('scroll', function () {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(function () {
              self._checkContentScrolled();
              ticking = false;
            });
          }
        }, { passive: true });
        window.addEventListener('resize', function () { self._checkContentScrolled(); });
      }

      // 进度条点击：跳转到对应阶段
      var bar = document.getElementById(PROGRESS_ID);
      if (bar) {
        bar.addEventListener('click', function (e) {
          var step = e.target.closest('.su-step');
          if (!step) return;
          var id = step.getAttribute('data-step');
          self._jumpToStep(id);
        });
      }
    },

    _countPreQuizzes: function () {
      var pre = this.sections['pre-test'];
      if (!pre) return 0;
      return pre.querySelectorAll('.quiz-box, .quiz-container').length;
    },

    /* ---------- 前测完成判定 ---------- */
    _checkPreTestCompletion: function () {
      if (this._unlockedContent) return;
      var pre = this.sections['pre-test'];
      if (!pre) return;
      var boxes = pre.querySelectorAll('.quiz-box, .quiz-container');
      if (boxes.length === 0) return; // 无题目则交由滚动逻辑处理

      var allAnswered = true;
      Array.prototype.forEach.call(boxes, function (box) {
        var opts = box.querySelectorAll('.quiz-option');
        var answered = false;
        Array.prototype.forEach.call(opts, function (opt) {
          if (opt.classList.contains('correct') || opt.classList.contains('wrong')) {
            answered = true;
          }
        });
        if (!answered) allAnswered = false;
      });

      if (allAnswered) {
        this.unlockContent(this.courseId);
      }
    },

    /* ---------- 正文滚动判定 ---------- */
    _checkContentScrolled: function () {
      if (!this._unlockedContent || this._unlockedPostTest) return;
      var region = this.contentSections;
      if (!region || region.length === 0) return;
      var last = region[region.length - 1];
      var rect = last.getBoundingClientRect();
      // 正文最后一个元素底部进入视口附近 → 视为浏览完毕
      if (rect.bottom <= window.innerHeight + SCROLL_THRESHOLD) {
        this.unlockPostTest(this.courseId);
      }
    },

    /* ===================== 公开 API ===================== */

    /** 前测完成 → 解锁正文 */
    unlockContent: function (courseId) {
      if (this._unlockedContent) return;
      this._unlockedContent = true;
      this.status.preTestDone = true;
      this._saveStatus();

      // 移除正文遮罩（带动画）
      this._unlockRegion(this.contentSections, false);
      // 停止前测观察
      if (this._observer) { this._observer.disconnect(); this._observer = null; }

      this._setStepState('pre-test', 'completed');
      this._setStepState('content', 'active');

      if (!this._silent) {
        this._toast('正文已解锁，开始学习吧！', '🔓');
      }
      // 解锁后立即检测一次滚动位置
      var self = this;
      setTimeout(function () { self._checkContentScrolled(); }, 300);
    },

    /** 正文浏览完毕 → 解锁后测 */
    unlockPostTest: function (courseId) {
      if (this._unlockedPostTest) return;
      this._unlockedPostTest = true;
      this.status.contentDone = true;
      this._saveStatus();

      this._unlockElement(this.sections['post-test'], false);
      this._setStepState('content', 'completed');
      this._setStepState('post-test', 'active');

      if (!this._silent) {
        this._toast('后测已解锁，检验学习成果！', '🎯');
        // 平滑滚动到后测
        var self = this;
        setTimeout(function () {
          var el = self.sections['post-test'];
          if (el) {
            try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            catch (e) { /* 部分环境不支持 options，回退 */ try { el.scrollIntoView(); } catch (e2) {} }
          }
        }, 600);
      }
    },

    /** 获取当前解锁状态（从 localStorage 读取） */
    getStatus: function (courseId) {
      var key = STORAGE_PREFIX + courseId;
      try {
        var raw = localStorage.getItem(key);
        if (raw) {
          var obj = JSON.parse(raw);
          return {
            preTestDone: !!obj.preTestDone,
            contentDone: !!obj.contentDone,
            postTestDone: !!obj.postTestDone
          };
        }
      } catch (e) { /* 解析失败则使用默认 */ }
      return { preTestDone: false, contentDone: false, postTestDone: false };
    },

    /** 重置某课件的解锁状态 */
    reset: function (courseId) {
      try { localStorage.removeItem(STORAGE_PREFIX + courseId); } catch (e) {}
      this.status = { preTestDone: false, contentDone: false, postTestDone: false };
      this._unlockedContent = false;
      this._unlockedPostTest = false;
      // 重新初始化锁定
      if (this.hasThreeStages) {
        this._applyInitialLocks();
        this._setupListeners();
      }
    },

    /* ===================== 内部工具 ===================== */
    _saveStatus: function () {
      try {
        localStorage.setItem(STORAGE_PREFIX + this.courseId, JSON.stringify(this.status));
      } catch (e) { /* 存储满或禁用，静默失败 */ }
    },

    _jumpToStep: function (id) {
      var target;
      if (id === 'pre-test') target = this.sections['pre-test'];
      else if (id === 'content') target = this.contentSections[0];
      else if (id === 'post-test') target = this.sections['post-test'];
      if (target) {
        try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        catch (e) { try { target.scrollIntoView(); } catch (e2) {} }
      }
    },

    /* ---------- 进度条 ---------- */
    _renderProgressBar: function () {
      if (document.getElementById(PROGRESS_ID)) return;
      var bar = document.createElement('div');
      bar.id = PROGRESS_ID;
      bar.className = 'su-progress';
      var html = '';
      this.steps.forEach(function (step, idx) {
        if (idx > 0) html += '<div class="su-connector"></div>';
        html +=
          '<div class="su-step" data-step="' + step.id + '" data-state="locked">' +
            '<div class="su-step-icon">' + step.icon + '</div>' +
            '<div class="su-step-name">' + step.name + '</div>' +
            '<div class="su-step-desc">' + step.desc + '</div>' +
          '</div>';
      });
      bar.innerHTML = html;

      // 插入到导航栏之后、Hero 之前
      var anchor =
        document.querySelector('.brand-transition-bar') ||
        document.querySelector('.nav-bar') ||
        document.querySelector('.hero');
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(bar, anchor.nextSibling);
      } else {
        document.body.insertBefore(bar, document.body.firstChild);
      }
    },

    _setStepState: function (stepId, state) {
      var node = document.querySelector('#' + PROGRESS_ID + ' .su-step[data-step="' + stepId + '"]');
      if (!node) return;
      node.setAttribute('data-state', state);
      // 锁定态显示锁图标
      var iconNode = node.querySelector('.su-step-icon');
      var def = this.steps.filter(function (s) { return s.id === stepId; })[0];
      if (state === 'locked') {
        iconNode.textContent = '🔒';
      } else {
        iconNode.textContent = def ? def.icon : '●';
      }
    },

    /* ---------- Toast ---------- */
    _toast: function (message, icon) {
      var t = document.createElement('div');
      t.className = 'su-toast';
      t.innerHTML =
        '<span class="su-toast-icon">' + (icon || '🎉') + '</span>' +
        '<span class="su-toast-msg">' + message + '</span>';
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('su-show'); });
      setTimeout(function () {
        t.classList.remove('su-show');
        setTimeout(function () { t.remove(); }, 400);
      }, 2800);
    },

    /* ---------- 样式注入 ---------- */
    _injectStyles: function () {
      if (document.getElementById('su-styles')) return;
      var css = document.createElement('style');
      css.id = 'su-styles';
      css.textContent = [
        '/* ===== StepUnlock P2-8 ===== */',
        '.su-progress{display:flex;align-items:flex-start;justify-content:center;gap:0;',
        'max-width:980px;margin:14px auto;padding:14px 16px;',
        'background:linear-gradient(135deg,#ffffff,#f8fafc);',
        'border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.05);',
        'font-family:inherit;flex-wrap:wrap;}',
        '.su-progress .su-step{flex:1;min-width:120px;max-width:220px;text-align:center;',
        'cursor:pointer;padding:6px 8px;border-radius:12px;transition:transform .2s ease,background .2s ease;}',
        '.su-progress .su-step:hover{background:rgba(99,102,241,0.06);transform:translateY(-2px);}',
        '.su-step-icon{width:46px;height:46px;margin:0 auto 6px;border-radius:50%;',
        'display:flex;align-items:center;justify-content:center;font-size:22px;',
        'background:#eef2ff;color:#6366f1;transition:all .3s ease;',
        'box-shadow:0 2px 8px rgba(99,102,241,0.15);}',
        '.su-step-name{font-size:14px;font-weight:700;color:#1f2937;}',
        '.su-step-desc{font-size:11px;color:#9ca3af;margin-top:2px;line-height:1.4;}',
        '.su-connector{flex:0 0 auto;align-self:center;width:36px;height:3px;margin-top:18px;',
        'background:linear-gradient(90deg,#e5e7eb,#cbd5e1);border-radius:2px;transition:background .3s ease;}',
        '/* 状态：active（进行中）*/',
        '.su-step[data-state="active"] .su-step-icon{',
        'background:linear-gradient(135deg,var(--primary,#6366f1),var(--primary-light,#818cf8));',
        'color:#fff;box-shadow:0 4px 14px rgba(99,102,241,0.35);animation:suPulse 2s ease-in-out infinite;}',
        '@keyframes suPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}',
        '/* 状态：completed（已完成）*/',
        '.su-step[data-state="completed"] .su-step-icon{background:linear-gradient(135deg,#10b981,#34d399);color:#fff;}',
        '.su-step[data-state="completed"] + .su-connector,' +
        '.su-connector:has(+ .su-step[data-state="completed"]){background:linear-gradient(90deg,#10b981,#34d399);}',
        '/* 状态：locked（锁定）*/',
        '.su-step[data-state="locked"]{opacity:.6;}',
        '.su-step[data-state="locked"] .su-step-icon{background:#f3f4f6;color:#9ca3af;box-shadow:none;}',
        '.su-step[data-state="locked"] .su-step-name{color:#9ca3af;}',
        '/* 锁定遮罩 */',
        '.su-locked{position:relative !important;}',
        '.su-lock-overlay{position:absolute;inset:0;z-index:40;',
        'background:rgba(241,245,249,0.88);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);',
        'display:flex;align-items:center;justify-content:center;border-radius:inherit;',
        'animation:suFadeIn .25s ease;}',
        '.su-lock-overlay.su-unlocking{animation:suFadeOut .45s ease forwards;}',
        '.su-lock-inner{text-align:center;padding:20px;}',
        '.su-lock-icon{font-size:40px;margin-bottom:8px;filter:grayscale(.2);animation:suLockBob 2.4s ease-in-out infinite;}',
        '@keyframes suLockBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}',
        '.su-lock-title{font-size:15px;font-weight:700;color:#475569;}',
        '.su-lock-hint{font-size:12px;color:#94a3b8;margin-top:4px;}',
        '@keyframes suFadeIn{from{opacity:0}to{opacity:1}}',
        '@keyframes suFadeOut{from{opacity:1}to{opacity:0;visibility:hidden}}',
        '/* Toast */',
        '.su-toast{position:fixed;top:18%;left:50%;transform:translate(-50%,-20px);',
        'z-index:9999;display:flex;align-items:center;gap:10px;',
        'background:linear-gradient(135deg,#10b981,#059669);color:#fff;',
        'padding:14px 22px;border-radius:14px;font-size:15px;font-weight:600;',
        'box-shadow:0 12px 32px rgba(16,185,129,0.35);opacity:0;pointer-events:none;',
        'transition:opacity .35s ease,transform .35s cubic-bezier(0.34,1.56,0.64,1);}',
        '.su-toast.su-show{opacity:1;transform:translate(-50%,0);}',
        '.su-toast-icon{font-size:20px;}',
        '/* 响应式 */',
        '@media(max-width:640px){',
        '.su-progress{flex-direction:column;gap:6px;}',
        '.su-connector{width:3px;height:18px;margin:0 auto;background:linear-gradient(180deg,#e5e7eb,#cbd5e1) !important;}',
        '.su-step{max-width:100%;}}'
      ].join('\n');
      document.head.appendChild(css);
    }
  };

  /* ===================== 自动初始化 ===================== */
  if (document.readyState !== 'loading') {
    StepUnlock.init();
  } else {
    document.addEventListener('DOMContentLoaded', function () { StepUnlock.init(); });
  }

  // 暴露到全局
  window.StepUnlock = StepUnlock;
})();
