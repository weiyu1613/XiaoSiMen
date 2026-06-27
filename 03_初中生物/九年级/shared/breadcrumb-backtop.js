/**
 * =============================================================
 * P1-14: 面包屑导航 + 返回顶部按钮（breadcrumb-backtop.js）
 * -------------------------------------------------------------
 * 功能：
 *  1. 自动检测当前页面路径，生成面包屑（首页 > 学科 > 年级 > 单元 > 课件）
 *  2. 面包屑插入页面顶部（header / nav 下方，无则 body 顶部）
 *  3. 返回顶部按钮：滚动超过 300px 显示，点击平滑滚动回顶部
 *  4. 按钮使用学科主题色（读取 --primary），带向上箭头图标
 *  5. 所有操作有平滑过渡动画，并尊重 prefers-reduced-motion
 * 自动初始化，引用本脚本即可生效，无需手动调用。
 * =============================================================
 */
(function () {
  'use strict';

  // 防止重复初始化
  if (window.__P114_BREADCRUMB_BACKTOP__) return;
  window.__P114_BREADCRUMB_BACKTOP__ = true;

  /* ---------- 工具函数 ---------- */
  function prefersReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // 学科目录前缀 → 友好名称
  var SUBJECT_MAP = [
    { re: /^01_初中历史|^01_/, name: '初中历史' },
    { re: /^02_初中地理|^02_/, name: '初中地理' },
    { re: /^03_初中生物|^03_/, name: '初中生物' },
    { re: /^04_道德与法治|^04_/, name: '道德与法治' }
  ];

  function subjectName(seg) {
    if (!seg) return '';
    for (var i = 0; i < SUBJECT_MAP.length; i++) {
      if (SUBJECT_MAP[i].re.test(seg)) return SUBJECT_MAP[i].name;
    }
    return seg;
  }

  // 将 URL 路径拆分为有效片段（剔除空串与 shared 等非内容目录）
  function pathSegments() {
    var path = decodeURIComponent(window.location.pathname);
    // 兼容 file:// 与 http://
    var parts = path.split(/[\/\\]/).filter(function (p) { return p && p.length; });
    // 去掉文件名之前的处理稍后做，这里先返回目录+文件
    return parts;
  }

  // 计算相对根路径（用于"首页"链接）
  function relRoot(depth) {
    var d = Math.max(depth, 0);
    var prefix = '';
    for (var i = 0; i < d; i++) prefix += '../';
    return prefix || './';
  }

  // 清洗标题：去掉末尾" - 学科年级"等后缀
  function cleanTitle(raw) {
    if (!raw) return '当前页';
    return raw.replace(/\s*[-—|]\s*[^-|]*$/,'').trim() || raw.trim();
  }

  // 把 01_d1zy 这类片段转为可读名（去前导编号）
  function humanize(seg) {
    if (!seg) return '';
    var m = String(seg).match(/^\d+[_-]?(.*)$/);
    return m ? m[1] : seg;
  }

  /* ---------- 构建面包屑数据 ---------- */
  function buildCrumbs() {
    var segs = pathSegments();
    var crumbs = [];
    // 末尾若是 .html 文件，分离出来
    var fileName = '';
    var dirSegs = segs.slice();
    var last = dirSegs[dirSegs.length - 1];
    if (last && /\.html?$/i.test(last)) {
      fileName = last;
      dirSegs = dirSegs.slice(0, -1);
    }

    // 识别学科片段
    var subjIdx = -1;
    for (var i = 0; i < dirSegs.length; i++) {
      if (/^(01|02|03|04)_/.test(dirSegs[i])) { subjIdx = i; break; }
    }

    // 计算"首页"相对根深度：从当前文件所在目录回到站点根
    // 深度 = 学科之前的片段数（站点根目录下的子目录层数）+ 学科 + 年级 + 单元 + 文件
    var depthToFile = subjIdx >= 0 ? (dirSegs.length - subjIdx) : dirSegs.length;
    if (fileName) depthToFile += 1; // 文件本身占一层
    var root = relRoot(depthToFile - 1); // 回到站点根

    crumbs.push({ label: '首页', href: root + 'index.html' });

    if (subjIdx >= 0) {
      // 学科
      var subjSeg = dirSegs[subjIdx];
      var toSubj = relRoot(dirSegs.length - subjIdx - 1);
      crumbs.push({ label: subjectName(subjSeg), href: toSubj + subjSeg + '/index.html' });

      // 年级
      if (dirSegs[subjIdx + 1]) {
        var gradeSeg = dirSegs[subjIdx + 1];
        var toGrade = relRoot(dirSegs.length - subjIdx - 2);
        crumbs.push({ label: gradeSeg, href: toGrade + gradeSeg + '/index.html' });

        // 单元
        if (dirSegs[subjIdx + 2]) {
          var unitSeg = dirSegs[subjIdx + 2];
          var toUnit = relRoot(dirSegs.length - subjIdx - 3);
          // 单元名用可读化或原片段
          var unitLabel = humanize(unitSeg) || unitSeg;
          // 单元目录通常没有独立 index，链接指向其父级年级目录
          crumbs.push({ label: unitLabel, href: toUnit + 'index.html' });
        }
      }
    }

    // 课件（当前页）
    if (fileName) {
      crumbs.push({ label: cleanTitle(document.title) || fileName, href: null });
    } else if (crumbs.length && crumbs[crumbs.length - 1].href) {
      // 若停在 index.html，则末项改为当前页（无链接）
      crumbs[crumbs.length - 1].href = null;
    }
    return crumbs;
  }

  /* ---------- 注入样式 ---------- */
  function injectStyles() {
    var css = '' +
      '.p114-breadcrumb{max-width:1200px;margin:0 auto;padding:8px 20px;' +
      'font-size:13px;color:#888;display:flex;flex-wrap:wrap;align-items:center;' +
      'gap:2px;line-height:1.6;z-index:90;}' +
      '.p114-breadcrumb a{color:var(--primary,#1565C0);text-decoration:none;' +
      'transition:opacity .2s ease,color .2s ease;}' +
      '.p114-breadcrumb a:hover{opacity:.8;text-decoration:underline;}' +
      '.p114-breadcrumb a:active{opacity:.6;}' +
      '.p114-breadcrumb a:focus-visible{outline:2px solid var(--primary,#1565C0);outline-offset:2px;border-radius:2px;}' +
      '.p114-breadcrumb .p114-sep{margin:0 6px;color:#bbb;user-select:none;}' +
      '.p114-breadcrumb .p114-current{color:#555;font-weight:600;' +
      'max-width:60vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
      '.p114-backtop{position:fixed;right:24px;bottom:32px;width:48px;height:48px;' +
      'border:none;border-radius:50%;background:var(--primary,#1565C0);color:#fff;' +
      'font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;' +
      'justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.18);z-index:9999;' +
      'opacity:0;visibility:hidden;transform:translateY(16px) scale(.8);' +
      'transition:opacity .3s ease,transform .3s ease,box-shadow .25s ease,background .25s ease;' +
      '-webkit-tap-highlight-color:transparent;}' +
      '.p114-backtop.is-visible{opacity:1;visibility:visible;transform:translateY(0) scale(1);}' +
      '.p114-backtop:hover{transform:translateY(-3px) scale(1.05);' +
      'box-shadow:0 10px 26px rgba(0,0,0,.24);background:var(--primary-dark,var(--primary,#1565C0));}' +
      '.p114-backtop:active{transform:translateY(0) scale(.94);}' +
      '.p114-backtop:focus-visible{outline:2px solid var(--primary,#1565C0);outline-offset:3px;}' +
      '.p114-backtop svg{width:22px;height:22px;display:block;}' +
      '@media (max-width:600px){.p114-breadcrumb{padding:8px 14px;font-size:12px}' +
      '.p114-backtop{right:16px;bottom:20px;width:44px;height:44px;font-size:20px}}' +
      '@media (prefers-reduced-motion:reduce){.p114-backtop{transition:opacity .2s linear!important;transform:none!important}' +
      '.p114-backtop:hover{transform:none!important}}';
    var style = document.createElement('style');
    style.setAttribute('data-p114', 'breadcrumb-backtop');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- 渲染面包屑 ---------- */
  function renderBreadcrumb() {
    var crumbs = buildCrumbs();
    if (crumbs.length < 2) return; // 信息不足则不渲染

    var nav = document.createElement('nav');
    nav.className = 'p114-breadcrumb';
    nav.setAttribute('aria-label', '面包屑导航');

    crumbs.forEach(function (c, i) {
      if (i > 0) {
        var sep = document.createElement('span');
        sep.className = 'p114-sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '›';
        nav.appendChild(sep);
      }
      if (c.href) {
        var a = document.createElement('a');
        a.href = c.href;
        a.textContent = c.label;
        nav.appendChild(a);
      } else {
        var cur = document.createElement('span');
        cur.className = 'p114-current';
        cur.setAttribute('aria-current', 'page');
        cur.textContent = c.label;
        nav.appendChild(cur);
      }
    });

    // 插入位置：优先放在 header/nav-bar 之后；否则 body 顶部
    var anchor = document.querySelector('header, .nav-bar, .navbar, [role="banner"]');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(nav, anchor.nextSibling);
    } else {
      document.body.insertBefore(nav, document.body.firstChild);
    }
  }

  /* ---------- 渲染返回顶部按钮 ---------- */
  var backtopBtn = null;
  function renderBackTop() {
    // 若已存在同 id 的旧按钮，先移除以防重复
    var old = document.getElementById('back-to-top');
    if (old && old.id === 'back-to-top' && !old.dataset.p114) {
      // 保留既有按钮功能，仅增强：监听同一滚动逻辑，不强制移除
    }
    // 创建本组件专属按钮
    if (document.getElementById('p114-backtop')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'p114-backtop';
    btn.className = 'p114-backtop';
    btn.setAttribute('aria-label', '返回顶部');
    btn.title = '返回顶部';
    // 向上箭头 SVG 图标
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    btn.addEventListener('click', function () {
      var reduce = prefersReducedMotion();
      if ('scrollBehavior' in document.documentElement.style && !reduce) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // 平滑回退：动画帧逐步滚动
        smoothScrollTop(reduce);
      }
    });
    document.body.appendChild(btn);
    backtopBtn = btn;
  }

  function smoothScrollTop(reduce) {
    if (reduce) { window.scrollTo(0, 0); return; }
    var start = window.pageYOffset || document.documentElement.scrollTop;
    var startTime = performance.now();
    var duration = 450;
    function step(now) {
      var t = Math.min((now - startTime) / duration, 1);
      // easeOutCubic
      var e = 1 - Math.pow(1 - t, 3);
      window.scrollTo(0, start * (1 - e));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- 滚动监听（节流） ---------- */
  function bindScroll() {
    if (!backtopBtn) return;
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.pageYOffset || document.documentElement.scrollTop;
        if (y > 300) {
          backtopBtn.classList.add('is-visible');
        } else {
          backtopBtn.classList.remove('is-visible');
        }
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 初始化 ---------- */
  function init() {
    try {
      injectStyles();
      renderBreadcrumb();
      renderBackTop();
      bindScroll();
    } catch (e) {
      // 静默失败，避免影响课件主功能
      if (window.console && console.warn) console.warn('[P1-14] 初始化失败:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
