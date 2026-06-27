/**
 * ChildLearn 渲染脚本
 * 版本: v1.0
 * 功能: 数据驱动的页面渲染
 */

// ============================================
// 学科首页渲染
// ============================================

/**
 * 渲染学科首页
 * 数据源: history-7.json
 */
async function renderSubjectHome() {
  try {
    const config = await fetch('shared/config/history-7.json').then(r => r.json());
    
    // 渲染Hero区
    renderHero(config.subject);
    
    // 渲染时间线导航
    renderTimeline(config.units);
    
    // 渲染手风琴（所有单元）
    renderAccordions(config.units);
    
    console.log('✅ 学科首页渲染完成');
  } catch (error) {
    console.error('❌ 学科首页渲染失败:', error);
  }
}

/**
 * 渲染Hero区
 */
function renderHero(subject) {
  const heroIcon = document.querySelector('.hero-icon');
  const heroTitle = document.querySelector('.hero-title');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  const heroBadges = document.querySelector('.hero-badges');
  
  if (heroIcon) heroIcon.textContent = subject.icon;
  if (heroTitle) heroTitle.textContent = subject.name;
  if (heroSubtitle) heroSubtitle.textContent = 
    `${subject.version} · 互动课件系统 · 全${subject.totalLessons}课`;
  
  if (heroBadges && subject.badges) {
    heroBadges.innerHTML = subject.badges.map(b => 
      `<span class="hero-badge"><i class="fas ${b.icon}"></i> ${b.text}</span>`
    ).join('');
  }
}

/**
 * 渲染时间线导航
 */
function renderTimeline(units) {
  const container = document.querySelector('.timeline-container');
  if (!container) return;
  
  const html = units.map(u => `
    <div class="timeline-node" data-unit="${u.id}">
      <span class="t-icon">${u.icon}</span>
      <span class="t-num">第${u.id}单元</span>
      <span class="t-name">${u.name}</span>
      <span class="t-count">${u.lessonCount}课</span>
    </div>
  `).join('');
  
  container.innerHTML = html;
  
  // 绑定点击事件
  container.querySelectorAll('.timeline-node').forEach(node => {
    node.addEventListener('click', () => {
      const unitId = node.dataset.unit;
      toggleAccordion(`unit-${unitId}`);
    });
  });
}

/**
 * 渲染手风琴（所有单元）
 */
function renderAccordions(units) {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  const html = units.map(u => `
    <div class="accordion-item" id="unit-${u.id}">
      <div class="accordion-header" onclick="toggleAccordion('unit-${u.id}')">
        <div class="accordion-icon">${u.icon}</div>
        <div class="accordion-info">
          <div class="accordion-title">${u.fullName}</div>
          <div class="accordion-subtitle">${u.subtitle}</div>
          <div class="accordion-meta">
            <span><i class="fas fa-book"></i> ${u.lessonCount}节课</span>
            <span><i class="fas fa-clock"></i> ${u.lessonRange}</span>
          </div>
        </div>
        <i class="fas fa-chevron-down accordion-arrow"></i>
      </div>
      <div class="accordion-body">
        <div class="lessons-grid">
          ${u.lessons.map(l => `
            <a href="${u.path}/${l.path}" class="lesson-card">
              <span class="lesson-num">${l.num}</span>
              <div class="lesson-info"><div class="lesson-title">${l.title}</div></div>
              <i class="fas fa-chevron-right lesson-arrow"></i>
            </a>
          `).join('')}
        </div>
        <div class="unit-actions">
          <a href="${u.path}/d${u.id}sy.html" class="unit-btn unit-btn-primary">
            <i class="fas fa-play"></i> 进入学习
          </a>
        </div>
      </div>
    </div>
  `).join('');
  
  mainContent.innerHTML = html;
  
  // 默认展开第一个单元
  const firstUnit = document.querySelector('.accordion-item');
  if (firstUnit) {
    firstUnit.classList.add('active');
    const body = firstUnit.querySelector('.accordion-body');
    if (body) body.style.maxHeight = body.scrollHeight + 'px';
  }
}

// ============================================
// 单元目录页渲染
// ============================================

/**
 * 渲染单元目录页
 * 数据源: history-7.json (指定单元)
 */
async function renderUnitIndex(unitId) {
  try {
    const config = await fetch('../shared/config/history-7.json').then(r => r.json());
    const unit = config.units.find(u => u.id === unitId);
    
    if (!unit) {
      console.error('❌ 未找到单元:', unitId);
      return;
    }
    
    // 渲染Hero区
    renderUnitHero(unit);
    
    // 渲染朝代时间线（如有）
    if (unit.dynasties) renderDynastyTimeline(unit.dynasties);
    
    // 渲染进度条
    renderProgress(unit);
    
    // 渲染课程卡片
    renderLessonCards(unit);
    
    console.log('✅ 单元目录页渲染完成:', unit.fullName);
  } catch (error) {
    console.error('❌ 单元目录页渲染失败:', error);
  }
}

/**
 * 渲染单元Hero区
 */
function renderUnitHero(unit) {
  const heroIcon = document.querySelector('.hero-icon');
  const heroTitle = document.querySelector('.hero-title');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  
  if (heroIcon) heroIcon.textContent = unit.icon;
  if (heroTitle) heroTitle.textContent = unit.fullName;
  if (heroSubtitle) heroSubtitle.textContent = unit.subtitle;
}

/**
 * 渲染朝代时间线
 */
function renderDynastyTimeline(dynasties) {
  const container = document.querySelector('.dynasty-timeline');
  if (!container) return;
  
  const html = dynasties.map(d => `
    <div class="timeline-item">
      <div class="timeline-dot">${d.icon}</div>
      <span class="timeline-label">${d.name}</span>
      <span style="font-size:0.75rem;opacity:0.7;">${d.period}</span>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

/**
 * 渲染进度条
 */
function renderProgress(unit) {
  const progressFill = document.querySelector('.progress-fill');
  const progressLabel = document.querySelector('.progress-label');
  
  const completed = unit.lessons.filter(l => l.status === '完成').length;
  const total = unit.lessonCount;
  const percent = (completed / total) * 100;
  
  if (progressFill) progressFill.style.width = percent + '%';
  if (progressLabel) progressLabel.textContent = `第${unit.id}单元 · ${completed}/${total}课已完成`;
}

/**
 * 渲染课程卡片
 */
function renderLessonCards(unit) {
  const grid = document.querySelector('.lessons-grid');
  if (!grid) return;
  
  const html = unit.lessons.map((l, i) => `
    <div class="lesson-card fade-in" style="animation-delay: ${0.1 + i * 0.05}s">
      <div class="card-header">
        <span class="lesson-num">${l.num}</span>
        <div class="lesson-meta">
          <div class="lesson-title">${l.title}</div>
          ${l.subtitle ? `<div class="lesson-subtitle">${l.subtitle}</div>` : ''}
        </div>
        <span class="status-badge status-${l.status || '完成'}">
          <i class="fas fa-check-circle"></i> ${l.status || '已完成'}
        </span>
      </div>
      ${l.desc ? `
        <div class="card-body">
          <p class="lesson-desc">${l.desc}</p>
        </div>
      ` : ''}
      <div class="card-footer">
        <a href="${l.path}" class="lesson-link">
          <i class="fas fa-play"></i> 开始学习
        </a>
      </div>
    </div>
  `).join('');
  
  grid.innerHTML = html;
}

// ============================================
// 课件页渲染
// ============================================

/**
 * 渲染课件页
 * 数据源: history-7-lesson-X.json
 */
async function renderLessonPage(lessonId) {
  try {
    const config = await fetch(`../../shared/config/lessons/history-7-lesson-${lessonId}.json`).then(r => r.json());
    
    // 渲染Hero区
    renderLessonHero(config.lesson);
    
    // 渲染问题锚点
    if (config.anchors) renderAnchors(config.anchors);
    
    // 渲染选择题
    if (config.quiz) renderQuiz(config.quiz);
    
    // 渲染考点卡片
    if (config.examPoints) renderExamPoints(config.examPoints);
    
    console.log('✅ 课件页渲染完成:', config.lesson.title);
  } catch (error) {
    console.error('❌ 课件页渲染失败:', error);
  }
}

/**
 * 渲染课件Hero区
 */
function renderLessonHero(lesson) {
  const heroIcon = document.querySelector('.hero-icon');
  const heroTitle = document.querySelector('.hero-title');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  
  if (heroIcon) heroIcon.textContent = lesson.icon;
  if (heroTitle) heroTitle.textContent = lesson.title;
  if (heroSubtitle) heroSubtitle.textContent = lesson.subtitle;
}

/**
 * 渲染问题锚点
 */
function renderAnchors(anchors) {
  const container = document.querySelector('.anchor-points');
  if (!container) return;
  
  const html = anchors.map(a => `
    <button class="anchor-btn" data-anchor-choice="${a.question}" onclick="selectAnchor(this, ${a.id})">
      ${a.icon} ${a.question}
    </button>
  `).join('');
  
  container.innerHTML = html;
}

/**
 * 渲染选择题
 */
function renderQuiz(quiz) {
  const container = document.querySelector('.quiz-container');
  if (!container) return;
  
  const html = quiz.map(q => `
    <div class="quiz-box" data-question="${q.id}">
      <div class="quiz-question">${q.id}. ${q.question}</div>
      <div class="quiz-options">
        ${q.options.map(o => `
          <button class="quiz-option" onclick="checkAnswer(this, ${o.correct}, ${q.id}, '${o.letter}')" ${o.feedback ? `data-feedback="${o.feedback}"` : ''}>
            <span class="opt-letter">${o.letter}</span>
            <span class="opt-text">${o.text}</span>
          </button>
        `).join('')}
      </div>
      <div class="explanation" id="explanation-${q.id}">
        <strong>📖 解析：</strong>${q.explanation}
      </div>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

/**
 * 渲染考点卡片
 */
function renderExamPoints(examPoints) {
  const container = document.querySelector('.exam-container');
  if (!container) return;
  
  const html = examPoints.map(e => `
    <div class="exam-card" style="background:linear-gradient(135deg,${e.levelColor}22,${e.levelColor}44);border:1px solid ${e.levelColor}66;">
      <div class="exam-card-header">
        <strong style="color:${e.levelColor};">🔥 ${e.level}考点：${e.title}</strong>
        <span class="exam-tag" style="background:${e.levelColor};">${e.frequency}</span>
      </div>
      <ul>
        ${e.points.map(p => `<li>${p}</li>`).join('')}
      </ul>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

// ============================================
// 辅助函数
// ============================================

/**
 * 切换手风琴
 */
function toggleAccordion(id) {
  const item = document.getElementById(id);
  if (!item) return;
  
  const body = item.querySelector('.accordion-body');
  const isActive = item.classList.contains('active');
  
  // 关闭所有手风琴
  document.querySelectorAll('.accordion-item').forEach(i => {
    i.classList.remove('active');
    const b = i.querySelector('.accordion-body');
    if (b) b.style.maxHeight = null;
  });
  
  // 打开目标手风琴
  if (!isActive) {
    item.classList.add('active');
    if (body) body.style.maxHeight = body.scrollHeight + 'px';
  }
  
  // 更新时间线高亮
  const unitId = id.replace('unit-', '');
  document.querySelectorAll('.timeline-node').forEach(node => {
    node.classList.toggle('active', node.dataset.unit === unitId);
  });
}

/**
 * 选择问题锚点
 */
function selectAnchor(btn, id) {
  document.querySelectorAll('.anchor-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  console.log('选择问题:', btn.dataset.anchorChoice);
}

/**
 * 检查答案
 */
function checkAnswer(btn, correct, questionId, letter) {
  const options = btn.parentElement.querySelectorAll('.quiz-option');
  const explanation = document.getElementById(`explanation-${questionId}`);
  
  // 显示解析
  if (explanation) explanation.style.display = 'block';
  
  // 标记选项
  options.forEach(opt => {
    opt.classList.remove('selected', 'correct', 'wrong');
  });
  
  btn.classList.add('selected');
  btn.classList.add(correct ? 'correct' : 'wrong');
  
  // 显示反馈
  if (btn.dataset.feedback) {
    console.log(btn.dataset.feedback);
  }
}
