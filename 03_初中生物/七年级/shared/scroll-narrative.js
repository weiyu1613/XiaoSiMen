/**
 * =============================================================
 * P1-15: 滚动叙事动画（scroll-narrative.js）
 * -------------------------------------------------------------
 * 基于 IntersectionObserver 实现元素进入视口时的动画效果。
 * 功能：
 *  1. 自动为 section / .card / .lesson-card / figure 等元素添加滚动动画
 *  2. 元素进入视口时添加 .in-view，触发淡入 + 位移动画
 *  3. 元素离开视口时可配置移除 .in-view（默认只触发一次）
 *  4. 支持多种动画类型：fade-up / fade-left / fade-right / zoom-in
 *  5. 通过 data-animation 属性配置动画类型
 *  6. 同组元素依次出现（stagger 延迟）
 *  7. 尊重 prefers-reduced-motion 设置
 *  8. 自动初始化，无需手动调用
 *
 * 可用 data-* 配置：
 *   data-animation="fade-up|fade-left|fade-right|zoom-in|none"  动画类型
 *   data-narrative="off"        关闭该元素动画
 *   data-narrative-repeat="true"  离开视口后再次进入可重复播放
 *   data-stagger="0.08"         同组每项延迟（秒），用于父容器
 *   data-narrative-delay="0.2"  单元素固定延迟（秒）
 * =============================================================
 */
(function () {
  'use strict';

  if (window.__P115_SCROLL_NARRATIVE__) return;
  window.__P115_SCROLL_NARRATIVE__ = true;

  /* ---------- 配置 ---------- */
  var SELECTOR = [
    'section',
    '.card',
    '.lesson-card',
    '.info-card',
    '.knowledge-card',
    '.feature-card',
    '.summary-card',
    '.timeline-card',
    'figure',
    '[data-animation]'
  ].join(',');

  var ANIM_TYPES = ['fade-up', 'fade-left', 'fade-right', 'zoom-in'];
  var DEFAULT_TYPE = 'fade-up';
  var DEFAULT_STAGGER = 0.08; // 秒
  var MAX_STAGGER_DELAY = 0.6; // 单组最大延迟上限

  function prefersReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- 注入样式 ---------- */
  function injectStyles() {
    var css = '' +
      '[data-sn-skip]{opacity:1!important;transform:none!important;}' +
      '.sn-animate{opacity:0;will-change:opacity,transform;' +
      'transition:opacity .6s cubic-bezier(.4,0,.2,1),transform .6s cubic-bezier(.4,0,.2,1);' +
      'transition-delay:var(--sn-delay,0s);}' +
      '.sn-fade-up{transform:translate3d(0,28px,0);}' +
      '.sn-fade-left{transform:translate3d(-32px,0,0);}' +
      '.sn-fade-right{transform:translate3d(32px,0,0);}' +
      '.sn-zoom-in{transform:scale(.9);}' +
      '.sn-animate.in-view{opacity:1;transform:none;}' +
      '@media (prefers-reduced-motion:reduce){' +
      '.sn-animate{opacity:1!important;transform:none!important;transition:none!important;}' +
      '}';
    var style = document.createElement('style');
    style.setAttribute('data-p115', 'scroll-narrative');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- 收集目标元素 ---------- */
  function collectTargets() {
    var nodes = document.querySelectorAll(SELECTOR);
    var targets = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      // 跳过：明确关闭、动画类型为 none、或嵌套在已收集父级内的同类型元素
      if (el.getAttribute('data-narrative') === 'off') continue;
      if (el.getAttribute('data-animation') === 'none') {
        el.setAttribute('data-sn-skip', '');
        continue;
      }
      targets.push(el);
    }
    return targets;
  }

  /* ---------- 解析动画类型 ---------- */
  function animTypeOf(el) {
    var t = (el.getAttribute('data-animation') || '').trim();
    if (ANIM_TYPES.indexOf(t) >= 0) return t;
    return DEFAULT_TYPE;
  }

  /* ---------- 计算 stagger 延迟 ---------- */
  // 按父容器分组，对同一父级下的目标元素依次递增延迟
  function applyStagger(targets) {
    var groups = {}; // key: parent signature -> {items:[], stagger:秒}
    targets.forEach(function (el) {
      var parent = el.parentElement;
      if (!parent) return;
      // 仅当父级声明 data-stagger，或父级包含多个目标时启用分组
      var pStagger = parent.getAttribute('data-stagger');
      var key = parent;
      if (!groups[key]) {
        groups[key] = { items: [], stagger: pStagger ? parseFloat(pStagger) : null };
      }
      groups[key].items.push(el);
    });

    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      if (!g.items.length) return;
      // 父级显式声明 stagger，或同组 ≥2 项时启用
      var useStagger = g.stagger !== null || g.items.length >= 2;
      if (!useStagger) {
        // 仅处理单项固定延迟
        g.items.forEach(function (el) {
          var d = el.getAttribute('data-narrative-delay');
          if (d) el.style.setProperty('--sn-delay', parseFloat(d) + 's');
        });
        return;
      }
      var step = (g.stagger !== null && !isNaN(g.stagger)) ? g.stagger : DEFAULT_STAGGER;
      g.items.forEach(function (el, idx) {
        // 若元素自身有固定延迟，叠加
        var fixed = parseFloat(el.getAttribute('data-narrative-delay')) || 0;
        var delay = Math.min(idx * step + fixed, MAX_STAGGER_DELAY);
        el.style.setProperty('--sn-delay', delay + 's');
      });
    });
  }

  /* ---------- 准备元素初始状态 ---------- */
  function prepare(el) {
    var type = animTypeOf(el);
    el.classList.add('sn-animate', 'sn-' + type);
  }

  /* ---------- 主初始化 ---------- */
  function init() {
    try {
      var reduce = prefersReducedMotion();
      if (reduce) {
        // 减少动态：注入样式后直接显示，不做隐藏/观察
        injectStyles();
        return;
      }
      injectStyles();

      var targets = collectTargets();
      if (!targets.length) return;
      applyStagger(targets);

      // 不支持 IntersectionObserver 时降级：直接显示
      if (!('IntersectionObserver' in window)) {
        targets.forEach(function (el) {
          prepare(el);
          el.classList.add('in-view');
        });
        return;
      }

      targets.forEach(prepare);

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var el = entry.target;
          if (entry.isIntersecting) {
            el.classList.add('in-view');
            // 默认只播放一次
            if (el.getAttribute('data-narrative-repeat') !== 'true') {
              observer.unobserve(el);
            }
          } else if (el.getAttribute('data-narrative-repeat') === 'true') {
            // 可重复播放：离开视口时移除，便于再次进入触发
            el.classList.remove('in-view');
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -8% 0px', // 提前一点触发，体验更自然
        threshold: 0.12
      });

      targets.forEach(function (el) { observer.observe(el); });

      // 暴露给外部以便调试/手动刷新（动态插入内容后可调用）
      window.P115ScrollNarrative = {
        refresh: function () {
          var fresh = collectTargets();
          fresh.forEach(function (el) {
            if (el.classList.contains('sn-animate')) return;
            prepare(el);
            observer.observe(el);
          });
          applyStagger(fresh);
        },
        observer: observer
      };
    } catch (e) {
      if (window.console && console.warn) console.warn('[P1-15] 初始化失败:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
