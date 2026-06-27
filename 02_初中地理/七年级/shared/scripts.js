/* =============================================================
   TeachAny 通用交互脚本（适用于所有历史课件）
   版本：v8.0.0
   功能：测验题、选项卡、手风琴、锚点、进度条、时间线
   升级：粒子效果 / Web Audio音效 / XP经验系统 / 连击系统
         滚动效果 / 步骤进度追踪 / 品牌栏XP显示
   ============================================================= */

/* ========== 通用配置 ========== */
const COURSE_INFO = {
  subject: 'history',
  grade: 'middle-7',
  totalSections: 5,  // 默认5个section，各课件可覆盖
  currentSection: 1
};

/* ========== 初始化 ========== */
document.addEventListener('DOMContentLoaded', function() {
  console.log('📚 TeachAny 历史课件系统加载完成');

  // 自动高亮当前导航
  highlightCurrentNav();

  // 初始化进度条
  updateProgressBar();

  // 初始化第一个选项卡
  initFirstTab();

  // 初始化时间线动画
  initTimelineAnimation();

  /* --- v8.0 新增初始化 --- */

  // 在品牌栏中动态创建XP显示区
  ensureXPDisplay();

  // 初始化XP显示
  updateXPDisplay();

  // 初始化滚动效果（导航栏紧凑 + Hero视差）
  initScrollEffects();

  // 初始化步骤进度追踪
  initStepProgress();
});

/* ========== 导航高亮 ========== */
function highlightCurrentNav() {
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.nav-btn');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) {
      link.classList.add('active');
      link.style.background = 'var(--primary)';
      link.style.color = 'white';
    }
  });
}

/* ========== 进度条 ========== */
function updateProgressBar() {
  const progressFill = document.querySelector('.progress-fill');
  const progressLabel = document.querySelector('.progress-label');

  if (!progressFill) return;

  // 从URL或COURSE_INFO获取当前进度
  const current = COURSE_INFO.currentSection || 1;
  const total = COURSE_INFO.totalSections || 5;
  const percent = Math.round((current / total) * 100);

  progressFill.style.width = percent + '%';

  if (progressLabel) {
    progressLabel.textContent = `第 ${current}/${total} 节 · ${percent}%`;
  }
}

function setProgress(current, total) {
  COURSE_INFO.currentSection = current;
  COURSE_INFO.totalSections = total;
  updateProgressBar();
}

/* ========== 测验题功能（v8.0 升级：粒子 + 音效 + XP + 连击） ========== */

// 前测检查（升级版）
function checkPreQuiz(element, isCorrect) {
  const parent = element.closest('.quiz-options');
  const feedback = document.getElementById('pre-feedback') ||
                   parent.parentElement.querySelector('.feedback');

  // 清除之前的状态
  parent.querySelectorAll('.quiz-option').forEach(opt => {
    opt.classList.remove('correct', 'wrong');
    opt.style.pointerEvents = 'auto';
  });

  // 标记正确/错误
  if (isCorrect) {
    element.classList.add('correct');
    element.style.animation = 'correctBounce 0.4s ease';
    spawnParticles(element, 12);
    playSound('correct');
    addXP(10);
    updateStreak(true);
    showFloatingXP(element, '+10 XP');
    if (window.mascotEngine) window.mascotEngine.setState('happy');
    if (feedback) {
      feedback.innerHTML = '<strong>✅ 答对了！</strong> ' +
                         (feedback.dataset.correct || '你的基础知识很扎实！');
      feedback.className = 'feedback show correct-fb';
    }
  } else {
    element.classList.add('wrong');
    element.style.animation = 'shake 0.4s ease';
    playSound('wrong');
    updateStreak(false);
    if (window.mascotEngine) window.mascotEngine.setState('confused');
    // 高亮正确答案
    parent.querySelectorAll('.quiz-option').forEach(opt => {
      if (opt.onclick && opt.onclick.toString().includes('true')) {
        opt.classList.add('correct');
      }
    });
    if (feedback) {
      feedback.innerHTML = '<strong>❌ 再想想。</strong> ' +
                         (feedback.dataset.incorrect || '回顾一下基础知识。');
      feedback.className = 'feedback show wrong-fb';
    }
  }

  // 禁用所有选项
  parent.querySelectorAll('.quiz-option').forEach(opt => {
    opt.style.pointerEvents = 'none';
  });
}

// 后测检查（升级版：独立功能，与checkPreQuiz区分便于扩展）
function checkPostQuiz(element, isCorrect) {
  const parent = element.closest('.quiz-options');
  const feedback = document.getElementById('post-feedback') ||
                   parent.parentElement.querySelector('.feedback');

  // 清除之前的状态
  parent.querySelectorAll('.quiz-option').forEach(opt => {
    opt.classList.remove('correct', 'wrong');
    opt.style.pointerEvents = 'auto';
  });

  // 标记正确/错误
  if (isCorrect) {
    element.classList.add('correct');
    element.style.animation = 'correctBounce 0.4s ease';
    spawnParticles(element, 12);
    playSound('correct');
    addXP(10);
    updateStreak(true);
    showFloatingXP(element, '+10 XP');
    if (window.mascotEngine) window.mascotEngine.setState('happy');
    if (feedback) {
      feedback.innerHTML = '<strong>✅ 正确！</strong> ' +
                         (feedback.dataset.correct || '掌握得很好！');
      feedback.className = 'feedback show correct-fb';
    }
  } else {
    element.classList.add('wrong');
    element.style.animation = 'shake 0.4s ease';
    playSound('wrong');
    updateStreak(false);
    if (window.mascotEngine) window.mascotEngine.setState('confused');
    // 高亮正确答案
    parent.querySelectorAll('.quiz-option').forEach(opt => {
      if (opt.onclick && opt.onclick.toString().includes('true')) {
        opt.classList.add('correct');
      }
    });
    if (feedback) {
      feedback.innerHTML = '<strong>❌ 不对哦。</strong> ' +
                         (feedback.dataset.incorrect || '再复习一下这部分内容。');
      feedback.className = 'feedback show wrong-fb';
    }
  }

  // 禁用所有选项
  parent.querySelectorAll('.quiz-option').forEach(opt => {
    opt.style.pointerEvents = 'none';
  });
}

// 通用答案检查（v8.0 升级版：推荐使用）
function checkAnswer(element, isCorrect) {
  const parent = element.closest('.quiz-box') || element.closest('.quiz-options').parentElement;
  const feedback = parent.querySelector('.feedback');
  const allOptions = parent.querySelectorAll('.quiz-option');

  // 清除状态
  allOptions.forEach(opt => {
    opt.classList.remove('correct', 'wrong');
    opt.style.pointerEvents = 'auto';
  });

  // 标记
  if (isCorrect) {
    element.classList.add('correct');
    element.style.animation = 'correctBounce 0.4s ease';
    spawnParticles(element, 12);
    playSound('correct');
    addXP(10);
    updateStreak(true);
    showFloatingXP(element, '+10 XP');
    if (window.mascotEngine) window.mascotEngine.setState('happy');
    if (feedback) {
      feedback.innerHTML = '<strong>✅ 正确！</strong>';
      feedback.className = 'feedback show correct-fb';
    }
  } else {
    element.classList.add('wrong');
    element.style.animation = 'shake 0.4s ease';
    playSound('wrong');
    updateStreak(false);
    if (window.mascotEngine) window.mascotEngine.setState('confused');
    // 高亮正确答案
    allOptions.forEach(opt => {
      if (opt.onclick && opt.onclick.toString().includes('true')) {
        opt.classList.add('correct');
      }
    });
    if (feedback) {
      feedback.innerHTML = '<strong>❌ 不对哦。</strong>';
      feedback.className = 'feedback show wrong-fb';
    }
  }

  // 禁用
  allOptions.forEach(opt => opt.style.pointerEvents = 'none');
}

/* ========== 选项卡功能 ========== */
function switchTab(button, tabId) {
  // 更新按钮状态
  const tabNav = button.closest('.tab-nav');
  tabNav.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  button.classList.add('active');

  // 更新面板显示（带动画）
  const tabContainer = tabNav.parentElement;
  tabContainer.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  const targetPanel = document.getElementById(tabId);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }
}

function initFirstTab() {
  document.querySelectorAll('.tab-nav').forEach(nav => {
    const firstBtn = nav.querySelector('.tab-btn');
    if (firstBtn && !nav.querySelector('.tab-btn.active')) {
      firstBtn.click();
    }
  });
}

/* ========== 手风琴功能 ========== */
function toggleAccordion(header) {
  const item = header.closest('.accordion-item');
  const body = item.querySelector('.accordion-body');
  const isOpen = header.classList.contains('open');

  // 切换当前（使用 scrollHeight 实现平滑过渡 + opacity 渐入）
  if (isOpen) {
    header.classList.remove('open');
    body.classList.remove('open');
    body.style.maxHeight = '0';
  } else {
    header.classList.add('open');
    body.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
  }
}

/* ========== 问题锚点功能 ========== */
const anchorContents = {};  // 由各课件填充

function showAnchor(anchorNum) {
  const displayArea = document.getElementById('anchor-display') ||
                     document.querySelector('.anchor-display');
  if (!displayArea) return;

  // 更新按钮状态
  document.querySelectorAll('.anchor-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // 显示内容
  const content = anchorContents[anchorNum];
  if (content) {
    displayArea.innerHTML = content;
    displayArea.classList.add('anim');
  }
}

function initAnchorContents() {
  // 各课件在页面加载后调用此函数填充 anchorContents
  console.log('📍 问题锚点系统就绪');
}

/* ========== 时间线动画 ========== */
function initTimelineAnimation() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  if (timelineItems.length === 0) return;

  // 使用 Intersection Observer 实现滚动触发动画
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('anim');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2
  });

  timelineItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = `all 0.6s ease ${index * 0.1}s`;
    observer.observe(item);
  });
}

/* ========== 拖拽匹配游戏 ========== */
let draggedItem = null;

function handleDragStart(e) {
  draggedItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedItem !== this) {
    // 检查匹配
    const dragId = draggedItem.dataset.id;
    const dropId = this.dataset.target;

    if (dragId === dropId) {
      this.innerHTML = `<strong>✅ 匹配成功！</strong><br>${draggedItem.innerHTML}`;
      draggedItem.style.display = 'none';
      this.classList.add('matched');
    } else {
      this.innerHTML = `<strong>❌ 再试试看</strong>`;
      setTimeout(() => {
        this.innerHTML = this.dataset.originalText || '<strong>放置区</strong>';
      }, 1000);
    }
  }

  return false;
}

function initDragGame() {
  const dragItems = document.querySelectorAll('.drag-item');
  const dropZones = document.querySelectorAll('.drop-zone');

  dragItems.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
  });

  dropZones.forEach(zone => {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('drop', handleDrop);
    zone.dataset.originalText = zone.innerHTML;
  });
}

/* ========== SVG 交互 ========== */
function initSvgInteractions() {
  // 为所有SVG元素添加悬停提示
  document.querySelectorAll('svg [data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', function() {
      const tooltip = this.dataset.tooltip;
      // 创建提示框（简单实现）
      const tipBox = document.createElement('div');
      tipBox.className = 'svg-tooltip';
      tipBox.textContent = tooltip;
      tipBox.style.cssText = `
        position: absolute;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
      `;
      document.body.appendChild(tipBox);

      const rect = this.getBoundingClientRect();
      tipBox.style.left = rect.left + 'px';
      tipBox.style.top = (rect.top - 30) + 'px';

      this._tooltip = tipBox;
    });

    el.addEventListener('mouseleave', function() {
      if (this._tooltip) {
        this._tooltip.remove();
        this._tooltip = null;
      }
    });
  });
}

/* ========== 知识图谱（Canvas） ========== */
class KnowledgeGraph {
  constructor(canvasId, nodes, edges) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.nodes = nodes || [];
    this.edges = edges || [];
    this.nodeRadius = 30;

    this.init();
  }

  init() {
    this.draw();
    this.addClickHandler();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 清空画布
    ctx.clearRect(0, 0, w, h);

    // 画边
    this.edges.forEach(edge => {
      const fromNode = this.nodes.find(n => n.id === edge.from);
      const toNode = this.nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = '#d2b48c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 箭头
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
        const arrowLen = 10;
        ctx.beginPath();
        ctx.moveTo(toNode.x, toNode.y);
        ctx.lineTo(
          toNode.x - arrowLen * Math.cos(angle - Math.PI / 6),
          toNode.y - arrowLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          toNode.x - arrowLen * Math.cos(angle + Math.PI / 6),
          toNode.y - arrowLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = '#d2b48c';
        ctx.fill();
      }
    });

    // 画节点
    this.nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, this.nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color || '#8b4513';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 文字
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });
  }

  addClickHandler() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.nodes.forEach(node => {
        const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (dist <= this.nodeRadius) {
          alert(`📖 ${node.label}\n\n${node.description || '暂无详细描述'}`);
        }
      });
    });
  }
}

/* =============================================================
   v8.0 新增功能
   ============================================================= */

/* ========== 粒子效果 ========== */
function spawnParticles(element, count) {
  /* 从元素中心生成彩色粒子飞散效果 */
  const rect = element.getBoundingClientRect();
  const colors = ['#D4A574', '#C17817', '#8B4513', '#A0522D', '#FFD700', '#FF6B6B', '#4ECDC4'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 4 + Math.random() * 6;
    p.style.cssText =
      `left:${rect.left + rect.width / 2}px;` +
      `top:${rect.top + rect.height / 2}px;` +
      `--dx:${(Math.random() - 0.5) * 180}px;` +
      `--dy:${(Math.random() - 0.5) * 180}px;` +
      `background:${colors[Math.floor(Math.random() * colors.length)]};` +
      `width:${size}px;height:${size}px;` +
      `animation:particleFly ${0.5 + Math.random() * 0.3}s ease-out forwards;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
}

/* ========== Web Audio 音效 ========== */
let _audioCtx = null;

/* 获取或创建 AudioContext（延迟初始化，避免浏览器自动播放策略限制） */
function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

/* 播放音效：'correct' 正确提示音，'wrong' 错误提示音 */
function playSound(type) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      /* 正确音效：上行三音阶（C5-E5-G5），欢快明亮 */
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);       // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'wrong') {
      /* 错误音效：低沉短促的三角波 */
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    /* 静默失败：部分浏览器或环境可能不支持 Web Audio */
  }
}

/* ========== XP 飘字效果 ========== */
function showFloatingXP(element, text) {
  /* 在元素右上角显示 "+10 XP" 飘字上浮消失动画 */
  const rect = element.getBoundingClientRect();
  const xp = document.createElement('div');
  xp.className = 'xp-float';
  xp.textContent = text;
  xp.style.cssText = `left:${rect.right}px;top:${rect.top}px;font-size:16px;`;
  document.body.appendChild(xp);
  setTimeout(() => xp.remove(), 800);
}

/* ========== XP 经验值系统 ========== */

/* 从 localStorage 加载游戏状态 */
function loadGameState() {
  try {
    return JSON.parse(localStorage.getItem('teachany_gamestate')) || getDefaultGameState();
  } catch (e) {
    return getDefaultGameState();
  }
}

/* 获取默认游戏状态 */
function getDefaultGameState() {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastStudyDate: null,
    totalCorrect: 0,
    totalAnswered: 0,
    lessonsCompleted: [],
    badges: [],
    history: { completedLessons: [] }
  };
}

/* 保存游戏状态到 localStorage */
function saveGameState(state) {
  try {
    localStorage.setItem('teachany_gamestate', JSON.stringify(state));
  } catch (e) {
    /* 存储空间不足时静默失败 */
  }
}

/* 增加经验值并检查升级 */
function addXP(amount) {
  const state = loadGameState();
  state.xp += amount;
  const newLevel = calculateLevel(state.xp);
  if (newLevel > state.level) {
    state.level = newLevel;
    showLevelUpNotification(newLevel);
  }
  saveGameState(state);
  updateXPDisplay();
}

/* 根据 XP 值计算当前等级 */
function calculateLevel(xp) {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

/* 获取等级对应称号 */
function getLevelTitle(level) {
  const titles = ['入门学徒', '学堂书生', '秀才', '举人', '进士', '状元', '学者', '大师', '宗师', '至圣先师'];
  return titles[Math.min(level - 1, titles.length - 1)];
}

/* 获取下一级所需的总 XP */
function getXPForNextLevel(level) {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
  return level < thresholds.length ? thresholds[level] : thresholds[thresholds.length - 1];
}

/* 获取当前等级起始 XP */
function getXPForCurrentLevel(level) {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
  return level > 1 ? thresholds[level - 1] : 0;
}

/* 更新品牌栏中的 XP 显示区 */
function updateXPDisplay() {
  const el = document.getElementById('xp-display');
  if (!el) return;

  const state = loadGameState();
  const title = getLevelTitle(state.level);
  const nextXP = getXPForNextLevel(state.level);
  const currXP = getXPForCurrentLevel(state.level);
  const progress = Math.round(((state.xp - currXP) / (nextXP - currXP)) * 100);

  el.innerHTML =
    `<span class="level-badge">Lv.${state.level} ${title}</span>` +
    `<div class="xp-bar-mini"><div class="xp-fill" style="width:${progress}%"></div></div>` +
    `<span class="xp-text">${state.xp} / ${nextXP} XP</span>`;
}

/* 显示升级通知弹窗 */
function showLevelUpNotification(level) {
  const title = getLevelTitle(level);
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;animation:fadeInUp 0.3s ease;';
  overlay.innerHTML =
    `<div style="background:white;border-radius:20px;padding:40px;text-align:center;max-width:320px;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:correctBounce 0.5s ease;">` +
    `<div style="font-size:48px;margin-bottom:12px;">🎉</div>` +
    `<h2 style="color:#8B4513;margin-bottom:8px;">升级了！</h2>` +
    `<p style="font-size:20px;font-weight:800;color:#C17817;">Lv.${level} ${title}</p>` +
    `<p style="color:#666;margin-top:8px;font-size:14px;">继续加油！</p>` +
    `<button onclick="this.closest('div[style]').remove()" style="margin-top:20px;padding:10px 30px;background:linear-gradient(135deg,#8B4513,#C17817);color:white;border:none;border-radius:25px;font-size:15px;font-weight:700;cursor:pointer;">太棒了！</button>` +
    `</div>`;
  document.body.appendChild(overlay);
}

/* ========== 连击系统 ========== */
let _currentStreak = 0;

/* 更新连击计数：correct 连续答对 +1，答错归零 */
function updateStreak(correct) {
  if (correct) {
    _currentStreak++;
    if (_currentStreak >= 3) {
      showComboNotification(_currentStreak);
    }
  } else {
    _currentStreak = 0;
  }
}

/* 显示连击通知（3连击及以上触发） */
function showComboNotification(combo) {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
    'z-index:9999;font-size:28px;font-weight:900;color:#C17817;' +
    'text-shadow:0 2px 8px rgba(193,120,23,0.4);' +
    'animation:xpFloat 1s ease-out forwards;pointer-events:none;';
  el.textContent = `🔥 ${combo}x 连击!`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

/* ========== 品牌栏 XP 显示区（JS 动态创建，无需修改 HTML） ========== */
function ensureXPDisplay() {
  if (document.getElementById('xp-display')) { updateXPDisplay(); return; }
  const container = document.querySelector('.brand-bar .container');
  if (!container) return;
  /* 让 container 支持换行，给 XP 栏留空间 */
  container.style.flexWrap = 'wrap';
  container.style.gap = '4px 12px';
  const xpDiv = document.createElement('div');
  xpDiv.id = 'xp-display';
  xpDiv.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;width:100%;justify-content:center;margin-top:4px;color:#fff;';
  container.appendChild(xpDiv);
  updateXPDisplay();
}

/* ========== 滚动效果 ========== */
function initScrollEffects() {
  /* 导航栏滚动变化：滚动超过100px后添加紧凑 + 阴影效果 */
  window.addEventListener('scroll', throttle(function() {
    const nav = document.querySelector('.nav-bar');
    if (!nav) return;
    if (window.pageYOffset > 100) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  }, 100));

  /* Hero 视差滚动效果：Hero 区域随页面滚动产生位移 + 透明度变化 */
  window.addEventListener('scroll', throttle(function() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const scrolled = window.pageYOffset;
    const heroHeight = hero.offsetHeight;
    if (scrolled < heroHeight) {
      hero.style.transform = `translateY(${scrolled * 0.2}px)`;
      hero.style.opacity = 1 - (scrolled / heroHeight) * 0.3;
    }
  }, 16));
}

/* ========== 步骤进度追踪 ========== */
function initStepProgress() {
  /* 通过 IntersectionObserver 监听各 section 可见性，自动更新步骤进度条 */
  const steps = document.querySelectorAll('.step-progress-item');
  if (steps.length === 0) return;

  const sectionIds = [];
  steps.forEach(s => {
    if (s.dataset.section) sectionIds.push(s.dataset.section);
  });
  if (sectionIds.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = sectionIds.indexOf(entry.target.id);
        if (idx >= 0) {
          /* 更新所有步骤点的状态：之前的完成、当前的激活 */
          steps.forEach((s, i) => {
            s.classList.remove('active');
            if (i < idx) s.classList.add('completed');
            if (i === idx) s.classList.add('active');
          });
          /* 更新连接线状态 */
          const lines = document.querySelectorAll('.step-progress-line');
          lines.forEach((line, i) => {
            if (i < idx) line.classList.add('completed');
            else line.classList.remove('completed');
          });
        }
      }
    });
  }, { threshold: 0.3 });

  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

/* =============================================================
   工具函数
   ============================================================= */

/* 防抖 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/* 节流 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/* 平滑滚动 */
function smoothScrollTo(targetId) {
  const target = document.getElementById(targetId);
  if (target) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

/* 打印优化 */
function preparePrint() {
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.quiz-option').forEach(opt => {
      opt.style.pointerEvents = 'auto';
    });
  });
}

/* ========== 初始化打印优化 ========== */
preparePrint();

console.log('🚀 TeachAny 通用脚本加载完成（历史学科适配版 v8.0）');
