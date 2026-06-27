/**
 * TeachAny 道德与法治 - 情境剧场组件 (ScenarioTheater)
 * 版本：v1.0.0
 * 功能：提供角色扮演和情境抉择功能，结合核心素养价值观念标注
 * 依赖：mascot.js（可选，用于触发 mascot:correct 事件）
 *
 * 用法：
 *   new ScenarioTheater('container-id', {
 *     title: '情境标题',
 *     desc: '情境描述...',
 *     roles: [
 *       { name: '选项A名称', action: '采取的行动', consequence: '产生的后果', value: '道德修养', optimal: true },
 *       { name: '选项B名称', action: '采取的行动', consequence: '产生的后果', value: '法治观念' },
 *       { name: '选项C名称', action: '采取的行动', consequence: '产生的后果', value: '责任意识' }
 *     ]
 *   });
 *
 * 支持的核心素养价值观念：
 *   政治认同 / 道德修养 / 法治观念 / 健全人格 / 责任意识
 */
(function (global) {
  'use strict';

  /* ========== 静态样式（仅注入一次） ========== */
  const ST_STYLE_ID = 'scenario-theater-style';
  function injectStyles() {
    if (document.getElementById(ST_STYLE_ID)) return;
    const css = `
    .scenario-theater {
      --st-primary: #7B1FA2;
      --st-primary-light: #AB47BC;
      --st-primary-dark: #4A148C;
      --st-accent: #FF8F00;
      --st-bg: #faf5ff;
      --st-bg-elevated: #f3e5f5;
      --st-text: #2c3e50;
      --st-text-muted: #6b7280;
      --st-white: #ffffff;
      --st-border: #e1bee7;
      --st-success: #27ae60;
      --st-danger: #e74c3c;
      --st-radius: 16px;
      --st-shadow: 0 4px 20px rgba(123, 31, 162, 0.12);
      --st-shadow-hover: 0 8px 32px rgba(123, 31, 162, 0.20);
      font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
      max-width: 880px;
      margin: 0 auto;
      color: var(--st-text);
    }
    .scenario-theater * { box-sizing: border-box; }

    /* 情境描述区（卡片样式，紫色主题） */
    .scenario-theater .st-scene-card {
      position: relative;
      background: linear-gradient(135deg, var(--st-primary) 0%, var(--st-primary-light) 60%, var(--st-accent) 130%);
      color: var(--st-white);
      border-radius: var(--st-radius);
      padding: 28px 28px 24px;
      box-shadow: var(--st-shadow);
      overflow: hidden;
    }
    .scenario-theater .st-scene-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.6;
      pointer-events: none;
    }
    .scenario-theater .st-scene-card > * { position: relative; z-index: 1; }
    .scenario-theater .st-scene-head {
      display: flex; align-items: center; gap: 10px;
      font-size: 0.82rem; font-weight: 600; letter-spacing: 1px;
      opacity: 0.92; margin-bottom: 10px; text-transform: uppercase;
    }
    .scenario-theater .st-scene-head .st-tag {
      background: rgba(255,255,255,0.22);
      padding: 4px 12px; border-radius: 14px;
      backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.25);
    }
    .scenario-theater .st-scene-title {
      font-size: 1.4rem; font-weight: 700; margin-bottom: 10px;
      text-shadow: 0 2px 6px rgba(0,0,0,0.18);
    }
    .scenario-theater .st-scene-desc {
      font-size: 1rem; line-height: 1.75; opacity: 0.96;
      background: rgba(255,255,255,0.12);
      padding: 14px 16px; border-radius: 12px;
      border-left: 4px solid rgba(255,255,255,0.5);
    }

    /* 提示语 */
    .scenario-theater .st-prompt {
      margin: 18px 2px 12px;
      font-size: 0.95rem; font-weight: 600; color: var(--st-primary-dark);
      display: flex; align-items: center; gap: 8px;
    }
    .scenario-theater .st-prompt i { color: var(--st-accent); }

    /* 角色选择按钮区 */
    .scenario-theater .st-roles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }
    .scenario-theater .st-role-btn {
      position: relative;
      display: flex; flex-direction: column; gap: 6px;
      text-align: left;
      background: var(--st-white);
      border: 2px solid var(--st-border);
      border-radius: 14px;
      padding: 16px 18px;
      cursor: pointer;
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
      font-family: inherit;
      color: var(--st-text);
    }
    .scenario-theater .st-role-btn:hover:not(:disabled) {
      transform: translateY(-4px);
      box-shadow: var(--st-shadow-hover);
      border-color: var(--st-primary-light);
      background: var(--st-bg);
    }
    .scenario-theater .st-role-btn:disabled { cursor: default; opacity: 0.92; }
    .scenario-theater .st-role-btn .st-role-letter {
      display: inline-flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, var(--st-primary), var(--st-primary-light));
      color: #fff; font-weight: 700; font-size: 0.95rem;
      flex-shrink: 0;
    }
    .scenario-theater .st-role-top { display: flex; align-items: center; gap: 10px; }
    .scenario-theater .st-role-name { font-size: 1rem; font-weight: 700; color: var(--st-primary-dark); }
    .scenario-theater .st-role-action { font-size: 0.88rem; color: var(--st-text-muted); line-height: 1.5; padding-left: 40px; }
    .scenario-theater .st-role-btn.selected {
      border-color: var(--st-primary);
      background: linear-gradient(135deg, var(--st-bg-elevated), var(--st-bg));
      box-shadow: var(--st-shadow);
    }
    .scenario-theater .st-role-btn.selected-optimal {
      border-color: var(--st-success);
      background: linear-gradient(135deg, #e8f5e9, #f1f8f1);
    }
    .scenario-theater .st-role-btn.selected-optimal .st-role-letter {
      background: linear-gradient(135deg, var(--st-success), #2ecc71);
    }
    .scenario-theater .st-role-btn.selected-nonoptimal {
      border-color: var(--st-danger);
      background: linear-gradient(135deg, #fdecea, #fff5f4);
    }
    .scenario-theater .st-role-btn.selected-nonoptimal .st-role-letter {
      background: linear-gradient(135deg, var(--st-danger), #ff7b6b);
    }
    .scenario-theater .st-role-btn:disabled:not(.selected) { opacity: 0.55; filter: grayscale(0.3); }

    /* 推荐标记 */
    .scenario-theater .st-optimal-flag {
      position: absolute; top: -10px; right: 12px;
      background: var(--st-success); color: #fff;
      font-size: 0.7rem; font-weight: 700;
      padding: 3px 10px; border-radius: 10px;
      box-shadow: 0 2px 8px rgba(39,174,96,0.35);
    }

    /* 后果分析区 */
    .scenario-theater .st-consequence {
      margin-top: 18px;
      background: var(--st-white);
      border-radius: var(--st-radius);
      box-shadow: var(--st-shadow);
      overflow: hidden;
      border: 1px solid var(--st-border);
      opacity: 0;
      max-height: 0;
      transition: opacity 0.4s ease, max-height 0.5s ease, margin-top 0.4s ease;
    }
    .scenario-theater .st-consequence.show {
      opacity: 1;
      max-height: 600px;
    }
    .scenario-theater .st-consequence-inner { padding: 22px 24px; }
    .scenario-theater .st-cons-head {
      display: flex; align-items: center; gap: 10px;
      font-size: 1.05rem; font-weight: 700; margin-bottom: 14px;
      color: var(--st-primary-dark);
    }
    .scenario-theater .st-cons-head .st-cons-icon {
      width: 34px; height: 34px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--st-bg-elevated); font-size: 18px;
    }
    .scenario-theater .st-cons-result {
      font-size: 0.98rem; line-height: 1.75; color: var(--st-text);
      background: var(--st-bg);
      border-left: 4px solid var(--st-primary-light);
      padding: 14px 16px; border-radius: 0 12px 12px 0;
      margin-bottom: 16px;
    }

    /* 价值观念标注 */
    .scenario-theater .st-value-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .scenario-theater .st-value-label {
      font-size: 0.82rem; font-weight: 600; color: var(--st-text-muted);
    }
    .scenario-theater .st-value-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, var(--st-primary), var(--st-primary-light));
      color: #fff; font-size: 0.85rem; font-weight: 600;
      padding: 6px 16px; border-radius: 18px;
      box-shadow: 0 3px 10px rgba(123,31,162,0.25);
    }
    .scenario-theater .st-value-badge.optimal {
      background: linear-gradient(135deg, var(--st-success), #2ecc71);
      box-shadow: 0 3px 10px rgba(39,174,96,0.30);
    }

    /* 操作区 */
    .scenario-theater .st-actions {
      display: flex; justify-content: flex-end; gap: 10px;
      margin-top: 16px;
    }
    .scenario-theater .st-reset-btn {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--st-white);
      color: var(--st-primary);
      border: 2px solid var(--st-primary-light);
      border-radius: 12px;
      padding: 10px 20px;
      font-size: 0.9rem; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: all 0.25s ease;
    }
    .scenario-theater .st-reset-btn:hover {
      background: var(--st-primary);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: var(--st-shadow);
    }

    /* 价值图例 */
    .scenario-theater .st-legend {
      display: flex; flex-wrap: wrap; gap: 8px;
      margin-top: 18px; padding: 14px 16px;
      background: var(--st-bg-elevated);
      border-radius: 12px;
      font-size: 0.78rem; color: var(--st-text-muted);
    }
    .scenario-theater .st-legend strong { color: var(--st-primary-dark); margin-right: 4px; }
    .scenario-theater .st-legend .st-legend-item {
      background: rgba(255,255,255,0.7);
      padding: 3px 10px; border-radius: 10px;
      border: 1px solid var(--st-border);
    }

    @media (max-width: 600px) {
      .scenario-theater .st-roles { grid-template-columns: 1fr; }
      .scenario-theater .st-scene-title { font-size: 1.2rem; }
      .scenario-theater .st-scene-card { padding: 22px 18px; }
    }
    `;
    const styleEl = document.createElement('style');
    styleEl.id = ST_STYLE_ID;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  /* ========== 价值观念图标映射 ========== */
  const VALUE_ICONS = {
    '政治认同': '🇨🇳',
    '道德修养': '🌸',
    '法治观念': '⚖️',
    '健全人格': '💪',
    '责任意识': '🛡️'
  };

  /* ========== ScenarioTheater 核心类 ========== */
  class ScenarioTheater {
    constructor(containerId, config) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.warn('[ScenarioTheater] 未找到容器：' + containerId);
        return;
      }
      this.config = config || {};
      this.selectedIndex = -1;
      this.optimalIndex = this._findOptimal();
      injectStyles();
      this.render();
    }

    _findOptimal() {
      const roles = this.config.roles || [];
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].optimal) return i;
      }
      return -1;
    }

    _escape(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    render() {
      const cfg = this.config;
      const roles = cfg.roles || [];
      const letters = ['A', 'B', 'C', 'D', 'E'];

      const roleButtons = roles.map((role, i) => {
        const isOptimal = i === this.optimalIndex;
        return `
          <button type="button" class="st-role-btn" data-index="${i}" aria-label="选择${this._escape(role.name)}">
            ${isOptimal ? '<span class="st-optimal-flag">推荐</span>' : ''}
            <span class="st-role-top">
              <span class="st-role-letter">${letters[i] || (i + 1)}</span>
              <span class="st-role-name">${this._escape(role.name)}</span>
            </span>
            ${role.action ? `<span class="st-role-action">${this._escape(role.action)}</span>` : ''}
          </button>`;
      }).join('');

      this.container.innerHTML = `
        <div class="scenario-theater">
          <div class="st-scene-card">
            <div class="st-scene-head">
              <span class="st-tag">🎭 情境剧场</span>
              ${cfg.sceneLabel ? `<span class="st-tag">${this._escape(cfg.sceneLabel)}</span>` : ''}
            </div>
            <h3 class="st-scene-title">${this._escape(cfg.title || '情境抉择')}</h3>
            ${cfg.desc ? `<div class="st-scene-desc">${this._escape(cfg.desc)}</div>` : ''}
          </div>

          <p class="st-prompt"><i class="fas fa-hand-pointer"></i> 如果是你，你会怎么做？请选择一个角色：</p>

          <div class="st-roles">
            ${roleButtons}
          </div>

          <div class="st-consequence" id="${this._cid('consequence')}">
            <div class="st-consequence-inner"></div>
          </div>

          <div class="st-actions">
            <button type="button" class="st-reset-btn" id="${this._cid('reset')}">
              <i class="fas fa-rotate-left"></i> 重置选择
            </button>
          </div>

          <div class="st-legend">
            <strong>核心素养：</strong>
            <span class="st-legend-item">🇨🇳 政治认同</span>
            <span class="st-legend-item">🌸 道德修养</span>
            <span class="st-legend-item">⚖️ 法治观念</span>
            <span class="st-legend-item">💪 健全人格</span>
            <span class="st-legend-item">🛡️ 责任意识</span>
          </div>
        </div>
      `;

      this._bindEvents();
    }

    _cid(suffix) {
      return 'st-' + suffix + '-' + Math.random().toString(36).slice(2, 9);
    }

    _bindEvents() {
      const btns = this.container.querySelectorAll('.st-role-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.selectedIndex !== -1) return; // 已选择则锁定
          const idx = parseInt(btn.dataset.index, 10);
          this.showConsequence(idx);
        });
      });

      const resetEl = this.container.querySelector('.st-reset-btn');
      if (resetEl) {
        resetEl.addEventListener('click', () => this.reset());
      }
    }

    showConsequence(roleIndex) {
      const roles = this.config.roles || [];
      const role = roles[roleIndex];
      if (!role) return;

      this.selectedIndex = roleIndex;
      const isOptimal = roleIndex === this.optimalIndex;

      // 更新按钮状态
      const btns = this.container.querySelectorAll('.st-role-btn');
      btns.forEach((btn, i) => {
        btn.disabled = true;
        if (i === roleIndex) {
          btn.classList.add('selected');
          btn.classList.add(isOptimal ? 'selected-optimal' : 'selected-nonoptimal');
        }
      });

      // 渲染后果分析
      const consBox = this.container.querySelector('.st-consequence');
      const inner = consBox.querySelector('.st-consequence-inner');
      const valueIcon = VALUE_ICONS[role.value] || '⭐';
      const headIcon = isOptimal ? '✅' : '💡';
      const headText = isOptimal ? '推荐抉择 · 价值彰显' : '反思抉择 · 换个角度';

      inner.innerHTML = `
        <div class="st-cons-head">
          <span class="st-cons-icon">${headIcon}</span>
          <span>${this._escape(headText)}</span>
        </div>
        <div class="st-cons-result">${this._escape(role.consequence || '')}</div>
        <div class="st-value-row">
          <span class="st-value-label">体现的核心素养：</span>
          <span class="st-value-badge ${isOptimal ? 'optimal' : ''}">
            ${valueIcon} ${this._escape(role.value || '价值分析')}
          </span>
        </div>
      `;

      // 触发展开动画
      requestAnimationFrame(() => {
        consBox.classList.add('show');
        consBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });

      // 触发吉祥物事件
      if (isOptimal) {
        // 推荐选择：触发 correct 事件
        document.dispatchEvent(new CustomEvent('mascot:correct'));
        if (global.mascotEngine && typeof global.mascotEngine.setState === 'function') {
          global.mascotEngine.setState('happy', 2800);
        }
        if (global.mascotEngine && typeof global.mascotEngine.showCustomDialogue === 'function') {
          global.mascotEngine.showCustomDialogue('明智的抉择！你体现了' + (role.value || '良好品德') + '。', 4000);
        }
      } else {
        // 非推荐选择：提示反思
        if (global.mascotEngine && typeof global.mascotEngine.setState === 'function') {
          global.mascotEngine.setState('thinking', 3000);
        }
        if (global.mascotEngine && typeof global.mascotEngine.showCustomDialogue === 'function') {
          global.mascotEngine.showCustomDialogue('再想想看，有没有更好的选择？', 4000);
        }
      }
    }

    reset() {
      this.selectedIndex = -1;
      const btns = this.container.querySelectorAll('.st-role-btn');
      btns.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('selected', 'selected-optimal', 'selected-nonoptimal');
      });
      const consBox = this.container.querySelector('.st-consequence');
      consBox.classList.remove('show');
      const inner = consBox.querySelector('.st-consequence-inner');
      inner.innerHTML = '';
      if (global.mascotEngine && typeof global.mascotEngine.setState === 'function') {
        global.mascotEngine.setState('idle', 1500);
      }
    }
  }

  // 暴露到全局
  global.ScenarioTheater = ScenarioTheater;
})(window);
