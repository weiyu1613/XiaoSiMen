# TeachAny 小四门 · AI 执行优化任务清单

> 本文档供 AI 编程助手读取并执行。每个任务包含：文件路径、问题描述、具体修改步骤、代码片段、验证方法。按优先级（P0 → P1 → P2）顺序执行。

---

## 项目背景

- **项目名称**：TeachAny 小四门 · 初中政史地生互动课件
- **定位**：人教版初中道德与法治、历史、地理、生物互动课件平台
- **技术栈**：纯前端零依赖（HTML + CSS + JS），无构建工具，localStorage 持久化
- **目标用户**：12-15 岁初中学生
- **运行地址**：`http://localhost:8080/`

## 项目文件结构

```
d:\AIProject\Trae\XiaoSiMen\
├── index.html                          # 首页（深空蓝暗色门户）
├── scripts.js                          # 首页脚本（XP系统、粒子特效、连击）
├── styles.css                          # 首页样式
├── 01_初中历史\
│   ├── 七年级\
│   │   ├── shared\
│   │   │   ├── scripts.js              # 历史学科脚本
│   │   │   └── styles.css              # 历史学科样式
│   │   ├── 01_d1sy\
│   │   │   └── 1.1_bjr\
│   │   │       └── bjr.html            # 课件：第1课 北京人（约850行）
│   │   └── index.html                  # 历史七年级首页
│   ├── 八年级\                          # 结构同七年级
│   └── 九年级\
│       └── shared\
│           └── render.js               # 九年级数据驱动渲染（JSON + render）
├── 02_初中地理\
│   └── 七年级\
│       └── shared\
│           ├── config                  # 地理配置
│           ├── render.js               # 地理数据驱动渲染
│           ├── scripts.js
│           └── styles.css
├── 03_初中生物\                         # 结构同地理（含 config + render.js）
│   └── 七年级\shared\
├── 04_道德与法治\                       # 结构同地理（含 config + render.js）
│   └── 七年级\shared\
└── _dev-tools\                         # 开发工具
```

## 关键技术事实（源码审计校正版）

- 首页 `index.html` 是深色风格，学科页/课件页是浅色风格（存在视觉割裂）
- 七/八年级为静态 HTML，九年级为数据驱动渲染（`render.js` + JSON）
- 游戏化系统在 `shared/scripts.js` 中：XP 系统（10 级科举称号）、连击（`_currentStreak` 3 连触发）、粒子特效、Web Audio 音效
- localStorage key 为 `teachany_gamestate`，默认结构：`{xp:0, level:1, streak:0, lastStudyDate:null, totalCorrect:0, totalAnswered:0, lessonsCompleted:[], badges:[], history:{completedLessons:[]}}`
- **吉祥物系统已实现**：`shared/mascot.js` 包含 4 个学科角色（史小纪/地小探/生小命/法小正），12 种表情状态（idle/happy/confused/excited/encourage/thinking/proud/sad/surprised/sleepy/determined/celebrate），SVG 渲染，自动初始化。但存在事件链断裂（scripts.js 用 `setState()` 直接调用，从未 dispatch mascot 自定义事件）
- **答题选项已具备可访问性**：选项使用 `<div class="quiz-option" role="button" tabindex="0" aria-label="选项C：元谋人" aria-pressed="false" onkeydown="...">`，已支持键盘导航和屏幕阅读器
- **XP 难度加权已存在**：`DIFFICULTY_MULTIPLIERS = {basic:1, intermediate:1.5, advanced:2}` 已在代码中定义，但 `data-difficulty` 属性标注系统性错误
- 课件模板为 8 段式统一结构，四学科仅换配色变量与 emoji
- **道法配色三方不一致**：首页卡片绿 `#2E7D32`、课件页紫 `#7B1FA2`、吉祥物角色绿 `#2E7D32`
- **字体不一致**：首页使用 Noto Sans SC + ZCOOL KuaiLe（Google Fonts），课件页仅用系统字体
- 课件粒子颜色：`['#D4A574','#C17817','#8B4513','#A0522D','#FFD700','#FF6B6B','#4ECDC4']`
- 音效合成：答对=C5(523.25)→E5(659.25)→G5(783.99) 上行音阶；答错=200Hz 三角波
- 等级阈值：`[0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]`
- 科举称号链：`['入门学徒', '学堂书生', '秀才', '举人', '进士', '状元', '学者', '大师', '宗师', '至圣先师']`
- 每题基础 XP：10 × 难度系数（basic×1=10, intermediate×1.5=15, advanced×2=20）

## 2022 新课标核心素养参考

| 学科 | 核心素养 |
|------|----------|
| 历史 | 唯物史观、时空观念、史料实证、历史解释、家国情怀 |
| 地理 | 人地协调观、综合思维、区域认知、地理实践力 |
| 生物 | 生命观念、科学思维、探究实践、态度责任 |
| 道法 | 政治认同、道德修养、法治观念、健全人格、责任意识 |

---

## P0 任务（立即执行，影响所有用户）

> **源码审计说明**：以下 P0-0a ~ P0-0f 为源码级审计发现的真实 Bug，已验证代码行级问题。此前报告中关于"答题选项缺少可访问性"的描述有误 — 源码中选项已使用 `<div role="button" tabindex="0" aria-label="..." aria-pressed="..." onkeydown="...">`，具备完整的键盘/屏幕阅读器支持。

### 任务 P0-0a：旗舰课件 bjr.html 游戏化功能完全失效（源码审计 · 最高优先级）

**文件**：`01_初中历史/七年级/01_d1sy/1.1_bjr/bjr.html`

**问题**：bjr.html（北京人课件，旗舰展示页）内部定义了本地 `checkAnswer(element, isCorrect, questionNum, optionLetter)` 函数（4 参数版），该函数**完全绕过**了 `shared/scripts.js` 中的共享 `checkAnswer` / `awardXP` / `spawnParticles` / `playSound` / `mascotEngine.setState` / `updateStreak`。导致这节课中：
- 答题不获得 XP
- 无粒子特效
- 无音效反馈
- 吉祥物不响应
- 连击不计数
- 学习进度不记录

这是全站最核心的课件页，游戏化系统在此页**完全静默**。

**执行步骤**：
1. 打开 `bjr.html`，搜索本地 `function checkAnswer` 定义
2. 删除本地 4 参数版的 `checkAnswer` 函数
3. 确保该页面引用的 `shared/scripts.js` 中的共享 `checkAnswer` 被正确调用
4. 检查 HTML 中 `onclick="checkAnswer(this, true, 1, 'C')"` 调用是否与共享版签名兼容
5. 如果共享版签名不同，需要调整调用参数或添加适配层

**代码示例**（删除 bjr.html 中的本地覆盖）：
```html
<!-- 在 bjr.html 中找到类似以下代码并删除 -->
<script>
// 删除这段本地函数，让 shared/scripts.js 的版本生效
function checkAnswer(element, isCorrect, questionNum, optionLetter) {
    // ... 本地实现，绕过了所有游戏化功能 ...
}
</script>
```

**验证**：
1. 打开 bjr.html，答题后观察 XP 是否增加（检查 localStorage `teachany_gamestate`）
2. 答对时是否有粒子特效和音效
3. 吉祥物是否切换表情
4. 控制台无 `checkAnswer is not defined` 错误

---

### 任务 P0-0b：连胜计数数据结构不匹配（源码审计）

**文件**：`shared/scripts.js`、`index.html`

**问题**：`shared/scripts.js` 中 `updateStreak()` 将 `streak` 写为**数字**（`state.streak = 0` 或 `state.streak++`），但 `index.html` 首页读取时用 `state.streak.count`（**对象属性**）。数据结构不匹配导致首页连胜指示器**永远显示 0**。

**执行步骤**：
1. 统一数据结构为对象格式：`streak: { count: 0, lastDate: null, maxCount: 0 }`
2. 修改 `shared/scripts.js` 的 `updateStreak()` 写入对象格式
3. 修改 `index.html` 读取逻辑确保兼容

**代码示例**（修改 `shared/scripts.js`）：
```javascript
// 修改前（写入数字）
function updateStreak() {
    const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
    // ...
    state.streak = state.streak + 1; // 数字
    localStorage.setItem('teachany_gamestate', JSON.stringify(state));
}

// 修改后（写入对象）
function updateStreak() {
    const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
    const today = new Date().toDateString();
    
    if (!state.streak || typeof state.streak === 'number') {
        // 兼容旧数据：数字转对象
        state.streak = { count: typeof state.streak === 'number' ? state.streak : 0, lastDate: null, maxCount: 0 };
    }
    
    if (state.streak.lastDate === today) return; // 今日已打卡
    
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.streak.lastDate === yesterday) {
        state.streak.count++;
    } else {
        state.streak.count = 1;
    }
    state.streak.lastDate = today;
    state.streak.maxCount = Math.max(state.streak.maxCount, state.streak.count);
    
    localStorage.setItem('teachany_gamestate', JSON.stringify(state));
}
```

**验证**：学习一课后刷新首页，连胜计数器显示正确数字而非 0。

---

### 任务 P0-0c：连击（Combo）不持久化且无 XP 加成（源码审计）

**文件**：`shared/scripts.js`

**问题**：连击变量 `let _currentStreak = 0` 是内存变量，**不持久化到 localStorage**。页面刷新后连击归零。且连击仅触发视觉通知（`showComboNotification`），**不提供任何 XP 加成**，缺乏实质激励。

**执行步骤**：
1. 将 `_currentStreak` 持久化到 `teachany_gamestate.currentStreak`
2. 在 `awardXP()` 中增加连击倍率
3. 记录 `maxCombo` 到 localStorage

**代码示例**：
```javascript
// 修改前
let _currentStreak = 0; // 内存变量，刷新即丢失

function onAnswerCorrect() {
    _currentStreak++;
    if (_currentStreak >= 3) showComboNotification(_currentStreak);
    awardXP(10); // 固定 10 XP，无视连击
}

// 修改后
function onAnswerCorrect(difficulty = 'basic') {
    const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
    state.currentStreak = (state.currentStreak || 0) + 1;
    state.maxCombo = Math.max(state.maxCombo || 0, state.currentStreak);
    
    // 连击 XP 倍率
    const baseXP = 10 * (DIFFICULTY_MULTIPLIERS[difficulty] || 1);
    let multiplier = 1;
    if (state.currentStreak >= 10) multiplier = 3;
    else if (state.currentStreak >= 5) multiplier = 2;
    else if (state.currentStreak >= 3) multiplier = 1.5;
    
    const finalXP = Math.floor(baseXP * multiplier);
    awardXP(finalXP);
    
    if (state.currentStreak >= 3) showComboNotification(state.currentStreak, multiplier);
    
    localStorage.setItem('teachany_gamestate', JSON.stringify(state));
}

// 页面加载时恢复连击
function restoreStreak() {
    const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
    // 仅在同一学习会话内恢复（30分钟内）
    if (state.lastStudyTime && Date.now() - state.lastStudyTime < 1800000) {
        _currentStreak = state.currentStreak || 0;
    }
}
```

**验证**：连答 5 题后 XP 获得 ×2 倍率；刷新页面后 30 分钟内连击数恢复。

---

### 任务 P0-0d：data-difficulty 属性系统性标注错误（源码审计）

**文件**：所有课件 HTML 中带 `data-difficulty` 的题目元素

**问题**：代码中已定义 `DIFFICULTY_MULTIPLIERS = {basic:1, intermediate:1.5, advanced:2}`，但课件 HTML 中 `data-difficulty` 属性标注**系统性错误**：
- 中等难度题目被标为 `basic`
- 基础题目被标为 `advanced`
- `intermediate` 值几乎从未被使用

导致 XP 难度加权系统虽然存在但完全失灵。

**执行步骤**：
1. 全局搜索所有 `data-difficulty=` 属性
2. 逐题审核难度标注：记忆型→`basic`，理解型→`intermediate`，应用/分析型→`advanced`
3. 确保 `intermediate` 被正常使用

**代码示例**（bjr.html 中的修正）：
```html
<!-- 修改前（标注错误） -->
<div class="quiz-question" data-difficulty="advanced">
    <p>北京人遗址位于哪里？</p>  <!-- 这是记忆型基础题，不应标 advanced -->
</div>

<!-- 修改后 -->
<div class="quiz-question" data-difficulty="basic">
    <p>北京人遗址位于哪里？</p>  <!-- 记忆型 → basic -->
</div>

<div class="quiz-question" data-difficulty="intermediate">
    <p>根据北京人的石器特征，分析其生产生活方式。</p>  <!-- 理解型 → intermediate -->
</div>

<div class="quiz-question" data-difficulty="advanced">
    <p>比较北京人与元谋人的体质特征差异，探讨人类进化的规律。</p>  <!-- 分析型 → advanced -->
</div>
```

**验证**：检查所有课件的 `data-difficulty` 标注，确保三种难度均有使用且标注合理。

---

### 任务 P0-0e：道法学科配色三方不一致（源码审计）

**文件**：`index.html`（首页）、`04_道德与法治/七年级/shared/styles.css`（课件页）、`shared/mascot.js`（吉祥物）

**问题**：道法学科在三个位置使用了不同颜色：
- 首页学科卡片：绿色 `#2E7D32`（与生物撞色）
- 课件页 CSS 变量：紫色 `--primary: #7B1FA2`
- 吉祥物角色配色：绿色 `#2E7D32`

用户从首页点入道法课件时颜色突变，且首页道法与生物卡片难以区分。

**执行步骤**：
1. 统一道法配色为紫色系（`#7B1FA2`），与课件页一致
2. 修改首页 `index.html` 中道法卡片的颜色
3. 修改 `mascot.js` 中法小正角色的配色

**代码示例**：
```css
/* index.html 中道法卡片颜色修改 */
/* 修改前 */
.subject-daofa { --card-color: #2E7D32; }

/* 修改后 */
.subject-daofa { --card-color: #7B1FA2; }
```

```javascript
// mascot.js 中法小正配色修改
// 修改前
const daofaMascot = { color: '#2E7D32', /* ... */ };

// 修改后
const daofaMascot = { color: '#7B1FA2', /* ... */ };
```

**验证**：首页道法卡片为紫色，与生物绿色明显区分；进入课件页颜色一致无突变。

---

### 任务 P0-0f：首页与课件页字体不一致（源码审计）

**文件**：`index.html`、各学科 `shared/styles.css`

**问题**：首页使用 Google Fonts（`Noto Sans SC` + `ZCOOL KuaiLe`），课件页仅用系统字体（`-apple-system, BlinkMacSystemFont, sans-serif`）。视觉风格割裂，且课件页在无中文字体的系统上排版退化。

**执行步骤**：
1. 在各学科 `shared/styles.css` 的 `@import` 或 `<link>` 中引入与首页相同的 Google Fonts
2. 统一 `font-family` 声明

**代码示例**（添加到各学科 `shared/styles.css` 顶部）：
```css
/* 引入与首页一致的字体 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=ZCOOL+KuaiLe&display=swap');

:root {
    --font-body: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-title: 'ZCOOL KuaiLe', 'Noto Sans SC', sans-serif;
}

body {
    font-family: var(--font-body);
}

h1, h2, h3, .title {
    font-family: var(--font-title);
}
```

**验证**：首页与课件页字体一致，标题使用 ZCOOL KuaiLe，正文使用 Noto Sans SC。

---

### 任务 P0-1：深浅色视觉统一

**文件**：`index.html`、各学科 `shared/styles.css`

**问题**：首页深空蓝暗色门户与学科页/课件页浅色风格割裂，用户点击进入时有"换了个网站"的断裂感。

**执行步骤**：
1. 在各学科 `shared/styles.css` 中，为学科页顶部增加 80px 高的深色品牌栏过渡条
2. 使用 `linear-gradient` 从深色过渡到浅色，保持品牌色贯穿

**代码示例**（添加到各学科 `shared/styles.css`）：
```css
/* 品牌栏过渡条 */
.brand-transition-bar {
  height: 80px;
  background: linear-gradient(180deg, #0a0e1a 0%, #141a2e 50%, var(--bg-light, #f5f5f5) 100%);
  display: flex;
  align-items: center;
  padding: 0 2rem;
}
.brand-transition-bar .logo {
  color: #64ffda;
  font-weight: 700;
  font-size: 1.2rem;
}
```

**验证**：从首页点击进入学科页，过渡自然无断裂感。

---

### 任务 P0-2：学科配色重构

**文件**：各学科 `shared/styles.css`

**问题**：生物绿与道法绿辨识度低，用户难以快速区分。

**执行步骤**：
1. 在各学科 `shared/styles.css` 的 `:root` 中定义差异化色彩体系
2. 确保对比度 ≥ 4.5:1（WCAG AA）

**代码示例**：

历史 `01_初中历史/七年级/shared/styles.css`：
```css
:root {
  --subject-50: #fff8e1;
  --subject-100: #ffecb3;
  --subject-200: #ffe082;
  --subject-400: #ffb74d;
  --subject-700: #b8860b;
  --subject-primary: #b8860b;
}
```

地理 `02_初中地理/七年级/shared/styles.css`：
```css
:root {
  --subject-50: #e3f2fd;
  --subject-100: #bbdefb;
  --subject-200: #90caf9;
  --subject-400: #42a5f5;
  --subject-700: #1e88e5;
  --subject-primary: #1e88e5;
}
```

生物 `03_初中生物/七年级/shared/styles.css`：
```css
:root {
  --subject-50: #e8f5e9;
  --subject-100: #c8e6c9;
  --subject-200: #a5d6a7;
  --subject-400: #66bb6a;
  --subject-700: #2e7d32;
  --subject-primary: #2e7d32;
}
```

道法 `04_道德与法治/七年级/shared/styles.css`：
```css
:root {
  --subject-50: #f3e5f5;
  --subject-100: #e1bee7;
  --subject-200: #ce93d8;
  --subject-400: #ab47bc;
  --subject-700: #7b1fa2;
  --subject-primary: #7b1fa2;
}
```

**验证**：四学科首页并排打开，配色差异明显，无撞色。

---

### 任务 P0-3：微交互补全

**文件**：各学科 `shared/styles.css`、首页 `styles.css`

**问题**：部分按钮/选项卡缺乏即时反馈。

**执行步骤**：
1. 在各 `styles.css` 中添加通用交互类
2. 所有可交互元素增加 hover/active/focus 三态

**代码示例**（添加到各 `styles.css`）：
```css
/* 通用按钮交互 */
.btn, button, .card-clickable, .nav-item {
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.btn:hover, button:hover, .card-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}
.btn:active, button:active {
  transform: scale(0.96);
}
.btn:focus-visible, button:focus-visible, a:focus-visible {
  outline: 2px solid var(--subject-primary, #64ffda);
  outline-offset: 2px;
}

/* 选项卡滑动过渡 */
.tab-content {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
```

**验证**：鼠标悬停按钮有上浮效果，按下有缩放，Tab 键导航有 focus 轮廓。

---

### 任务 P0-4：导航回溯优化

**文件**：各课件 HTML（如 `01_初中历史/七年级/01_d1sy/1.1_bjr/bjr.html`）、各学科 `shared/scripts.js`

**问题**：课件内锚点跳转后缺乏返回机制，用户容易迷失位置。

**执行步骤**：
1. 在各课件 HTML 的 `<header>` 下方增加面包屑导航
2. 在 `scripts.js` 中添加滚动监听，显示返回顶部按钮
3. 增加侧边章节目录（可折叠）

**代码示例**（添加到课件 HTML 的 `<header>` 之后）：
```html
<!-- 面包屑导航 -->
<nav class="breadcrumb">
  <a href="../../../index.html">首页</a>
  <span>›</span>
  <a href="../../index.html">初中历史</a>
  <span>›</span>
  <a href="../index.html">七年级</a>
  <span>›</span>
  <a href="#">第1单元</a>
  <span>›</span>
  <span class="current">北京人</span>
</nav>

<!-- 浮动返回顶部按钮 -->
<button id="back-to-top" class="back-to-top" aria-label="返回顶部">↑</button>
```

**代码示例**（添加到 `scripts.js`）：
```javascript
// 返回顶部按钮
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
```

**代码示例**（添加到 `styles.css`）：
```css
.breadcrumb {
  padding: 0.75rem 2rem;
  font-size: 0.85rem;
  color: #666;
  background: rgba(0, 0, 0, 0.02);
}
.breadcrumb a { color: var(--subject-primary); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.breadcrumb .current { color: #333; font-weight: 600; }
.breadcrumb span { margin: 0 0.4rem; color: #ccc; }

.back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--subject-primary);
  color: #fff;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s, transform 0.2s;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.back-to-top.visible { opacity: 1; visibility: visible; }
.back-to-top:hover { transform: translateY(-4px); }
```

**验证**：课件页滚动 300px 后出现返回顶部按钮，点击平滑滚动到顶部；面包屑可逐级返回。

---

### 任务 P0-5：核心素养目标显性化

**文件**：各课件 HTML（学习目标 Section）

**问题**：学习目标未对接 2022 新课标的核心素养要求。

**执行步骤**：
1. 在各课件 HTML 的"学习目标"Section 增加 `<div class="competency-tags">` 区域
2. 添加对应学科的核心素养标签卡片

**代码示例**（历史课件）：
```html
<div class="competency-tags">
  <h4>本课核心素养目标</h4>
  <div class="competency-list">
    <span class="competency-tag">时空观念</span>
    <span class="competency-tag">史料实证</span>
    <span class="competency-tag">家国情怀</span>
  </div>
</div>
```

**代码示例**（添加到 `styles.css`）：
```css
.competency-tags { margin: 1rem 0; }
.competency-tags h4 {
  font-size: 0.9rem;
  color: var(--subject-700);
  margin-bottom: 0.5rem;
}
.competency-list { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.competency-tag {
  display: inline-block;
  padding: 4px 12px;
  background: var(--subject-50);
  color: var(--subject-700);
  border: 1px solid var(--subject-200);
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
}
```

**各学科素养标签参考**：
- 历史：唯物史观、时空观念、史料实证、历史解释、家国情怀
- 地理：人地协调观、综合思维、区域认知、地理实践力
- 生物：生命观念、科学思维、探究实践、态度责任
- 道法：政治认同、道德修养、法治观念、健全人格、责任意识

**验证**：课件页学习目标区域显示素养标签，颜色与学科主题一致。

---

### 任务 P0-6：四学科差异化内容模板

**文件**：各学科课件 HTML、各学科 `shared/styles.css`

**问题**：四学科使用完全相同的 8 段式模板，仅换配色与 emoji，同质化严重。

**执行步骤**：为每门学科增加特色内容模块（在现有 8 段结构基础上扩展，不破坏原有结构）。

#### 历史"时间旅行者"模板
在各历史课件正文前增加：
```html
<!-- 年代尺定位 -->
<section class="timeline-anchor">
  <h3>📍 时空定位</h3>
  <div class="timeline-bar">
    <!-- SVG 年代尺，本课时段高亮 -->
    <svg viewBox="0 0 800 60" class="timeline-svg">
      <line x1="0" y1="30" x2="800" y2="30" stroke="#b8860b" stroke-width="2"/>
      <!-- 各时段节点 -->
      <circle cx="100" cy="30" r="6" fill="#b8860b" opacity="0.3"/>
      <circle cx="250" cy="30" r="8" fill="#b8860b"/> <!-- 本课高亮 -->
      <text x="250" y="50" font-size="10" fill="#b8860b" text-anchor="middle">北京人</text>
    </svg>
  </div>
</section>

<!-- 史料研读 -->
<section class="source-reading">
  <h3>📜 史料研读</h3>
  <div class="source-material">
    <blockquote>（一手史料原文节选）</blockquote>
    <div class="source-questions">
      <p>设问1：根据材料，北京人使用什么工具？</p>
      <p>设问2：这与同时期其他地区人类相比有何特点？</p>
    </div>
  </div>
</section>
```

#### 地理"探索发现"模板
在各地理课件正文中增加：
```html
<!-- 交互地图 -->
<section class="interactive-map">
  <h3>🗺️ 读图任务</h3>
  <div class="map-container">
    <!-- SVG 地图 + 可点击热点 -->
    <svg viewBox="0 0 600 400" class="map-svg">
      <!-- 地图路径 -->
      <path d="..." fill="#e3f2fd" stroke="#1e88e5"/>
      <!-- 热点 -->
      <circle cx="300" cy="200" r="10" fill="#1e88e5" class="map-hotspot" data-info="点击查看详情"/>
    </svg>
  </div>
</section>

<!-- 自然/人文双栏分析 -->
<div class="dual-column">
  <div class="column natural">
    <h4>自然特征</h4>
    <ul><li>地形：...</li><li>气候：...</li><li>河流：...</li></ul>
  </div>
  <div class="column human">
    <h4>人文特征</h4>
    <ul><li>人口：...</li><li>经济：...</li><li>文化：...</li></ul>
  </div>
</div>
```

#### 生物"实验室"模板
在各生物课件正文中增加：
```html
<!-- 显微观察任务 -->
<section class="lab-task">
  <h3>🔬 实验观察</h3>
  <div class="microscope-view">
    <!-- SVG 细胞结构图 + 可点击细胞器 -->
    <svg viewBox="0 0 400 400" class="cell-diagram">
      <ellipse cx="200" cy="200" rx="180" ry="150" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
      <circle cx="200" cy="180" r="40" fill="#a5d6a7" class="organelle" data-name="细胞核" data-function="储存遗传物质"/>
      <ellipse cx="120" cy="220" rx="30" ry="15" fill="#66bb6a" class="organelle" data-name="叶绿体" data-function="进行光合作用"/>
    </svg>
    <div class="organelle-info" id="organelle-info">点击细胞器查看功能</div>
  </div>
</section>
```

#### 道法"生活剧场"模板
在各道法课件正文中增加：
```html
<!-- 情境剧场 -->
<section class="scenario-theater">
  <h3>🎭 情境剧场</h3>
  <div class="scenario-card">
    <p class="scenario-desc">（真实社会现象/新闻事件描述）</p>
    <div class="role-play">
      <p class="role-question">如果你是当事人，你会怎么做？</p>
      <div class="choice-buttons">
        <button class="choice-btn" data-branch="A">选择A：...</button>
        <button class="choice-btn" data-branch="B">选择B：...</button>
        <button class="choice-btn" data-branch="C">选择C：...</button>
      </div>
    </div>
    <div class="value-analysis" id="value-analysis"></div>
  </div>
</section>
```

**验证**：四学科课件页各有特色模块，不再完全雷同。

---

### 任务 P0-7：题目类型升级

**文件**：各课件 HTML（前测/后测 Section）、各学科 `shared/scripts.js`

**问题**：前测/后测偏记忆型，缺乏素养立意的高阶思维题。

**执行步骤**：
1. 在前测/后测 Section 增加三种新题型模板
2. 开放题设计"参考要点 + 自评"机制

**代码示例**（材料分析题）：
```html
<div class="question material-analysis">
  <div class="question-type-label">材料分析题</div>
  <div class="material">
    <p>（史料/图表/案例材料）</p>
  </div>
  <p class="question-text">根据上述材料，分析...</p>
  <textarea class="answer-textarea" placeholder="请在此作答..."></textarea>
  <button class="show-reference">查看参考要点</button>
  <div class="reference-answer" style="display:none;">
    <p>参考要点：</p>
    <ul><li>要点1...</li><li>要点2...</li></ul>
  </div>
</div>
```

**代码示例**（图表判读题）：
```html
<div class="question chart-reading">
  <div class="question-type-label">图表判读题</div>
  <div class="chart-container">
    <!-- SVG 图表（等高线/气候图/统计图） -->
    <svg viewBox="0 0 500 300" class="chart-svg"><!-- 图表内容 --></svg>
  </div>
  <p class="question-text">根据上图，回答以下问题：</p>
  <div class="options">
    <label><input type="radio" name="q1" value="A"> A. ...</label>
    <label><input type="radio" name="q1" value="B"> B. ...</label>
  </div>
</div>
```

**代码示例**（开放论述题）：
```html
<div class="question open-ended">
  <div class="question-type-label">开放论述题</div>
  <p class="question-text">结合所学知识，谈谈你对...的理解。（答案不唯一，多角度分析）</p>
  <textarea class="answer-textarea" rows="5" placeholder="请多角度分析..."></textarea>
  <div class="self-assessment" style="display:none;">
    <p>自评要点（勾选你涵盖的角度）：</p>
    <label><input type="checkbox"> 角度1</label>
    <label><input type="checkbox"> 角度2</label>
  </div>
</div>
```

**验证**：前测/后测包含材料分析、图表判读、开放论述三种新题型。

---

### 任务 P0-8：单页信息密度优化

**文件**：各课件 HTML、各学科 `shared/scripts.js`

**问题**：单课件页约 850 行，对 12-15 岁学生认知负荷偏高。

**执行步骤**：
1. 为次要内容添加 `<details>` 折叠组件
2. 在 `scripts.js` 中增加 Section 分步解锁逻辑
3. 关键概念卡片化

**代码示例**（HTML 折叠次要内容）：
```html
<details class="expandable-content">
  <summary>📖 拓展阅读：北京人的发现历程（点击展开）</summary>
  <div class="expanded-content">
    <p>（拓展内容...）</p>
  </div>
</details>
```

**代码示例**（JS 分步解锁，添加到 `scripts.js`）：
```javascript
// 分步解锁：前测完成后解锁正文
function checkPreTestCompletion() {
  const preTest = document.querySelector('[data-section="pre-test"]');
  const mainContent = document.querySelector('[data-section="main-content"]');
  if (!preTest || !mainContent) return;

  const answered = preTest.querySelectorAll('.question.answered').length;
  const total = preTest.querySelectorAll('.question').length;

  if (answered >= total) {
    mainContent.classList.remove('locked');
    mainContent.scrollIntoView({ behavior: 'smooth' });
  }
}

// 锁定样式
// CSS: .locked { opacity: 0.5; pointer-events: none; filter: blur(3px); }
```

**验证**：课件页次要内容默认折叠，前测完成后正文自动解锁。

---

### 任务 P0-9：PBL 闭环补全（徽章系统）

**文件**：`scripts.js`（首页）、各学科 `shared/scripts.js`、新建 `shared/badges.js`

**问题**：只有 XP 积分，无徽章和排行榜。

**执行步骤**：
1. 扩展 `teachany_gamestate` 增加 `badges` 字段
2. 创建 `badges.js` 定义徽章规则
3. 在首页增加成就墙入口

**代码示例**（新建 `shared/badges.js`）：
```javascript
// 徽章定义
const BADGE_DEFINITIONS = [
  { id: 'first_lesson', name: '初学者', desc: '完成第一节课', icon: '🎓', condition: (state) => state.completedLessons >= 1 },
  { id: 'combo_3', name: '连击新手', desc: '连续答对3题', icon: '🔥', condition: (state) => state.maxCombo >= 3 },
  { id: 'combo_10', name: '连击大师', desc: '连续答对10题', icon: '⚡', condition: (state) => state.maxCombo >= 10 },
  { id: 'perfect_lesson', name: '满分达人', desc: '一节课全部答对', icon: '💯', condition: (state) => state.perfectLessons >= 1 },
  { id: 'streak_7', name: '坚持一周', desc: '连续学习7天', icon: '📅', condition: (state) => state.streak >= 7 },
  { id: 'streak_30', name: '月度坚持', desc: '连续学习30天', icon: '🏆', condition: (state) => state.streak >= 30 },
  { id: 'subject_master_history', name: '历史通', desc: '完成全部历史课程', icon: '📖', condition: (state) => state.subjectProgress?.history >= 100 },
  { id: 'subject_master_geo', name: '地理通', desc: '完成全部地理课程', icon: '🌍', condition: (state) => state.subjectProgress?.geography >= 100 },
  { id: 'subject_master_bio', name: '生物通', desc: '完成全部生物课程', icon: '🧬', condition: (state) => state.subjectProgress?.biology >= 100 },
  { id: 'subject_master_ddf', name: '道法通', desc: '完成全部道法课程', icon: '⚖️', condition: (state) => state.subjectProgress?.politics >= 100 },
  { id: 'level_5', name: '小秀才', desc: '达到5级', icon: '🏅', condition: (state) => state.level >= 5 },
  { id: 'level_10', name: '状元及第', desc: '达到10级', icon: '👑', condition: (state) => state.level >= 10 },
];

// 检查并解锁徽章
function checkBadges() {
  const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
  if (!state.badges) state.badges = [];

  BADGE_DEFINITIONS.forEach(badge => {
    if (!state.badges.includes(badge.id) && badge.condition(state)) {
      state.badges.push(badge.id);
      showBadgeUnlock(badge);
    }
  });

  localStorage.setItem('teachany_gamestate', JSON.stringify(state));
}

// 徽章解锁弹窗
function showBadgeUnlock(badge) {
  const popup = document.createElement('div');
  popup.className = 'badge-popup';
  popup.innerHTML = `
    <div class="badge-popup-content">
      <div class="badge-icon">${badge.icon}</div>
      <h3>徽章解锁！</h3>
      <p class="badge-name">${badge.name}</p>
      <p class="badge-desc">${badge.desc}</p>
    </div>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add('show'), 100);
  setTimeout(() => popup.remove(), 4000);
}
```

**代码示例**（首页成就墙 HTML）：
```html
<section class="achievement-wall">
  <h2>🏆 我的成就</h2>
  <div class="badge-grid" id="badge-grid">
    <!-- JS 动态填充 -->
  </div>
</section>
```

**代码示例**（成就墙渲染 JS）：
```javascript
function renderBadgeWall() {
  const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
  const earnedBadges = state.badges || [];
  const grid = document.getElementById('badge-grid');

  grid.innerHTML = BADGE_DEFINITIONS.map(badge => {
    const earned = earnedBadges.includes(badge.id);
    return `
      <div class="badge-item ${earned ? 'earned' : 'locked'}">
        <div class="badge-icon">${earned ? badge.icon : '🔒'}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.desc}</div>
      </div>
    `;
  }).join('');
}
```

**验证**：答对 3 题后弹出连击徽章解锁弹窗，首页成就墙显示已获/未获徽章。

---

## P1 任务（重点提升）

### 任务 P1-1：吉祥物事件链修复与增强（源码审计校正）

**文件**：`shared/mascot.js`（已存在）、`shared/scripts.js`（已存在）

**问题**：吉祥物系统**已完整实现**（4 角色 × 12 表情 × SVG 渲染），但存在**事件链断裂**：
- `mascot.js` 监听自定义事件 `mascot:correct` / `mascot:wrong` / `mascot:combo` / `mascot:levelup`
- `scripts.js` 仅用 `mascotEngine.setState()` 直接调用，**从未 dispatch 上述自定义事件**
- 导致 mascot.js 中的事件监听器全部空转，部分高级表情（combo、levelup 触发的 celebrate、proud）无法触发
- 配合 P0-0a 修复后（bjr.html 不再绕过 scripts.js），吉祥物才能正常工作

**执行步骤**：
1. 在 `scripts.js` 的答题判定逻辑中，**除了调用 `setState()` 外，同时 dispatch 自定义事件**
2. 确保 `mascot.js` 的事件监听器与 `scripts.js` 的事件 dispatch 对接
3. 增加连击和升级时的专属表情触发

**代码示例**（修改 `shared/scripts.js`）：
```javascript
// 在答题正确逻辑中
function onAnswerCorrect(combo, difficulty) {
    // ... 已有的 setState 调用保留 ...
    if (window.mascotEngine) {
        window.mascotEngine.setState(combo >= 5 ? 'excited' : 'happy');
    }
    
    // 新增：dispatch 自定义事件，让 mascot.js 的事件监听器也能响应
    document.dispatchEvent(new CustomEvent('mascot:correct', {
        detail: { combo, difficulty }
    }));
    
    // 连击事件
    if (combo >= 3) {
        document.dispatchEvent(new CustomEvent('mascot:combo', {
            detail: { count: combo }
        }));
    }
}

// 在答题错误逻辑中
function onAnswerWrong() {
    if (window.mascotEngine) {
        window.mascotEngine.setState('encourage');
    }
    
    document.dispatchEvent(new CustomEvent('mascot:wrong'));
}

// 在升级逻辑中
function onLevelUp(newLevel, newTitle) {
    if (window.mascotEngine) {
        window.mascotEngine.setState('celebrate');
    }
    
    document.dispatchEvent(new CustomEvent('mascot:levelup', {
        detail: { level: newLevel, title: newTitle }
    }));
}
```

**代码示例**（确认 `mascot.js` 的事件监听已存在，无需新建）：
```javascript
// mascot.js 中已有的事件监听（确认存在即可，无需修改）
document.addEventListener('mascot:correct', (e) => {
    // 触发 happy/excited 表情 + 对话气泡
});
document.addEventListener('mascot:wrong', () => {
    // 触发 encourage 表情 + 鼓励语
});
document.addEventListener('mascot:combo', (e) => {
    // 触发 excited/celebrate 表情 + 连击鼓励
});
document.addEventListener('mascot:levelup', (e) => {
    // 触发 proud/celebrate 表情 + 升级祝贺
});
```

**额外增强建议**：
- 增加 `mascot:idle` 事件：30 秒无操作时吉祥物切换为 `sleepy` 状态
- 增加 `mascot:thinking` 事件：答题思考超过 20 秒时切换为 `thinking` 状态
- 对话气泡文本根据学科上下文动态生成

**验证**：
1. 答对题目时吉祥物显示 happy/excited 表情 + 对话气泡
2. 连续答对 3 题时触发 combo 专属表情
3. 升级时触发 celebrate/proud 表情
4. 30 秒无操作时吉祥物切换为 sleepy

---

### 任务 P1-2：连续打卡增强与日历热力图（源码审计校正）

**文件**：`scripts.js`（已存在 streak 逻辑）、`index.html`、`styles.css`

**问题**：连胜系统**已存在**但存在数据结构 Bug（见 P0-0b）。修复 Bug 后，需增加可视化激励：
- 首页缺少连胜日历热力图
- 缺少里程碑提醒（7天/30天/100天）
- 缺少连胜保护道具

**前置依赖**：必须先完成 P0-0b（streak 数据结构修复）

**执行步骤**：
1. 确保 P0-0b 已修复数据结构（`streak: { count, lastDate, maxCount }`）
2. 扩展 streak 对象增加 `history` 数组和 `freezes` 字段
3. 在首页增加日历热力图组件
4. 实现连胜保护道具机制

**代码示例**（扩展 streak 结构，修改 `scripts.js`）：
```javascript
// 在 P0-0b 修复的基础上扩展
function updateStreak() {
    const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
    const today = new Date().toDateString();
    
    // P0-0b 已确保 streak 是对象格式
    if (!state.streak || typeof state.streak === 'number') {
        state.streak = { count: 0, lastDate: null, maxCount: 0, history: [], freezes: 1 };
    }
    // 确保 history 和 freezes 字段存在（兼容旧数据）
    if (!state.streak.history) state.streak.history = [];
    if (state.streak.freezes === undefined) state.streak.freezes = 1;
    
    if (state.streak.lastDate === today) return;
    
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.streak.lastDate === yesterday) {
        state.streak.count++;
    } else if (state.streak.freezes > 0 && state.streak.lastDate) {
        // 使用连胜保护道具
        state.streak.freezes--;
        state.streak.count++;
    } else {
        state.streak.count = 1;
    }
    state.streak.lastDate = today;
    state.streak.maxCount = Math.max(state.streak.maxCount, state.streak.count);
    state.streak.history.push(today);
    if (state.streak.history.length > 365) state.streak.history.shift();
    
    // 每 100 XP 奖励 1 个冻结道具
    if (state.xp && state.xp % 100 === 0 && state.xp > 0) {
        state.streak.freezes++;
    }
    
    // 里程碑提醒
    if ([7, 30, 100].includes(state.streak.count)) {
        showStreakMilestone(state.streak.count);
    }
    
    localStorage.setItem('teachany_gamestate', JSON.stringify(state));
}

function showStreakMilestone(days) {
    const messages = { 7: '连续学习7天！坚持就是胜利！', 30: '连续学习30天！你太棒了！', 100: '连续学习100天！你是学习之神！' };
    // 复用 badge-popup 样式显示里程碑弹窗
    const popup = document.createElement('div');
    popup.className = 'badge-popup';
    popup.innerHTML = `
        <div class="badge-popup-content">
            <div class="badge-icon">🔥</div>
            <h3>${messages[days]}</h3>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 100);
    setTimeout(() => popup.remove(), 4000);
}
```

**代码示例**（首页日历热力图，添加到 `index.html`）：
```html
<section class="streak-calendar">
  <h3>📅 学习日历</h3>
  <div class="heatmap-grid" id="heatmap-grid">
    <!-- JS 动态生成 365 天热力图 -->
  </div>
  <div class="streak-stats">
    <span class="streak-flame">🔥</span>
    <span class="streak-count" id="streak-count">0</span> 天连胜
    <span class="streak-freezes">🛡️ <span id="freeze-count">1</span></span>
    <span class="streak-max">最高 <span id="streak-max">0</span> 天</span>
  </div>
</section>
```

**验证**：连续两天学习后，首页日历热力图显示连续两格高亮，连胜计数 +1，断签后可用保护道具。

---

### 任务 P1-3：自适应难度推荐引擎（源码审计校正）

**文件**：各学科 `shared/scripts.js`（已存在 `DIFFICULTY_MULTIPLIERS`）

**问题**：XP 难度加权机制**已存在**（`DIFFICULTY_MULTIPLIERS = {basic:1, intermediate:1.5, advanced:2}`），但：
- `data-difficulty` 属性标注系统性错误（见 P0-0d，需先修复）
- 连击 XP 倍率不存在（见 P0-0c，需先修复）
- 缺少自适应难度推荐：系统不会根据学生答题表现动态推荐下一题难度

**前置依赖**：必须先完成 P0-0d（难度标签修复）和 P0-0c（连击 XP 倍率）

**执行步骤**：
1. 确保 P0-0d 已修复 `data-difficulty` 标注
2. 确保 P0-0c 已实现连击 XP 倍率
3. 在 `scripts.js` 中增加自适应难度推荐引擎
4. 根据答题表现动态高亮推荐难度的题目

**代码示例**（自适应引擎，添加到 `shared/scripts.js`）：
```javascript
// 自适应难度引擎（纯前端，无需 AI 后端）
const AdaptiveEngine = {
    score: 0,             // 难度分数：-5 到 +5
    recentAnswers: [],    // 最近 5 题答题记录

    recordAnswer(isCorrect, responseTime) {
        this.recentAnswers.push({ isCorrect, responseTime, timestamp: Date.now() });
        if (this.recentAnswers.length > 5) this.recentAnswers.shift();

        if (isCorrect) {
            // 快速答对加分更多（< 10 秒）
            this.score += responseTime < 10000 ? 2 : 1;
        } else {
            this.score -= 2;
        }
        this.score = Math.max(-5, Math.min(5, this.score));
        
        // 持久化
        const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
        state.adaptiveScore = this.score;
        localStorage.setItem('teachany_gamestate', JSON.stringify(state));
    },

    getRecommendedDifficulty() {
        if (this.score >= 3) return 'advanced';      // 连续答对→推荐挑战题
        if (this.score <= -3) return 'basic';         // 连续答错→推荐基础题
        return 'intermediate';                         // 默认提高题
    },

    getMotivationalMessage() {
        if (this.score >= 4) return '你状态很好，来挑战一下！';
        if (this.score <= -3) return '别灰心，先巩固一下基础！';
        return null;
    },

    // 页面加载时恢复
    restore() {
        const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
        this.score = state.adaptiveScore || 0;
    }
};

// 在答题判定后调用
function onAnswerSubmit(isCorrect, responseTime, difficulty) {
    AdaptiveEngine.recordAnswer(isCorrect, responseTime);
    
    // 高亮推荐难度的题目
    const recommended = AdaptiveEngine.getRecommendedDifficulty();
    document.querySelectorAll('[data-difficulty]').forEach(el => {
        el.classList.remove('recommended');
        if (el.dataset.difficulty === recommended) {
            el.classList.add('recommended');
        }
    });
    
    // 显示推荐提示
    const message = AdaptiveEngine.getMotivationalMessage();
    if (message && window.mascotEngine) {
        document.dispatchEvent(new CustomEvent('mascot:combo', {
            detail: { message }
        }));
    }
}
```

**CSS 补充**（推荐难度高亮）：
```css
.quiz-question.recommended {
    border: 2px solid var(--primary);
    box-shadow: 0 0 12px rgba(var(--primary-rgb), 0.2);
    position: relative;
}
.quiz-question.recommended::before {
    content: '⭐ 推荐';
    position: absolute;
    top: -12px;
    right: 12px;
    background: var(--primary);
    color: #fff;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.7rem;
}
```

**验证**：连续答对 3 题后系统推荐 advanced 难度题目并高亮标注；连续答错 2 题后推荐 basic 难度。

---

### 任务 P1-4：跨学科主题学习栏目

**文件**：`index.html`、新建跨学科专题目录

**执行步骤**：
1. 在首页导航增加"跨学科专题"入口
2. 创建专题目录页
3. 设计 4 个跨学科专题

**专题列表**：
| 专题 | 学科组合 | 内容 |
|------|----------|------|
| 丝绸之路 | 历史+地理 | 地理基础（地形/气候）+ 历史影响（文化交流/贸易） |
| 生物多样性保护 | 生物+道法 | 科学认知（生态系统）+ 社会责任（保护行动） |
| 革命文化与政治认同 | 历史+道法 | 红色基因（历史事件）+ 价值观（政治认同） |
| 人口与资源 | 地理+生物 | 人地协调（资源分布）+ 可持续发展（生态平衡） |

**验证**：首页可见"跨学科专题"入口，点击进入专题列表。

---

### 任务 P1-5：道法时政素材库

**文件**：新建 `04_道德与法治/shared/current-affairs.json`

**代码示例**：
```json
{
  "2026": [
    {
      "id": "ca_2026_01",
      "date": "2026-01",
      "category": "科技创新",
      "title": "中国空间站全面建成",
      "description": "中国空间站完成全面建造，标志着中国航天进入新阶段...",
      "relatedTopics": ["九年级-富强与创新", "政治认同", "责任意识"],
      "analysisAngles": [
        "从科技创新角度看国家发展",
        "从国际合作看人类命运共同体",
        "从自主创新看民族精神"
      ],
      "referencePoints": [
        "创新是引领发展的第一动力",
        "科技自立自强是国家发展的战略支撑",
        "构建人类命运共同体理念"
      ]
    }
  ]
}
```

**验证**：道法课件可动态加载时政素材，按考点关键词匹配。

---

### 任务 P1-6：地理读图训练专项

**文件**：新建 `02_初中地理/shared/map-training/` 目录

**执行步骤**：
1. 创建 4 个读图训练模块（SVG 交互式）
2. 在地理年级首页增加"读图训练"入口

**模块列表**：
1. 地图三要素（比例尺/方向/图例）
2. 等高线地形图判读
3. 气候类型图判读
4. 统计图表分析

**验证**：地理首页可见"读图训练"入口，点击进入可交互练习。

---

### 任务 P1-7：开卷考试适配

**文件**：新建 `shared/search-index.json`、各课件考点总结 Section

**执行步骤**：
1. 创建关键词索引文件
2. 在品牌栏增加搜索图标
3. 考点总结增加"教材定位"标签

**代码示例**（`search-index.json`）：
```json
[
  { "keyword": "北京人", "path": "01_初中历史/七年级/01_d1sy/1.1_bjr/bjr.html", "textbook": "人教版七上 P2-P5" },
  { "keyword": "分封制", "path": "01_初中历史/七年级/.../xx.html", "textbook": "人教版七上 P20-P23" }
]
```

**验证**：在搜索框输入"北京人"，可快速定位到对应课件和教材页码。

---

### 任务 P1-8：移动端适配强化

**文件**：各 `styles.css`

**代码示例**：
```css
@media (max-width: 768px) {
  .mobile-toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: var(--bg-dark, #0a0e1a);
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 1000;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
  }
  .mobile-toolbar button {
    min-width: 44px;
    min-height: 44px;
    background: none;
    border: none;
    color: #64ffda;
    font-size: 1.2rem;
    cursor: pointer;
  }
  /* 所有可点击元素最小 44x44 */
  button, .btn, .choice-btn, a.nav-item {
    min-width: 44px;
    min-height: 44px;
  }
}
```

**验证**：移动端底部出现固定操作栏，所有按钮点击区域足够大。

---

### 任务 P1-9：连胜火苗与保护道具（已合并至 P1-2）

> **源码审计校正**：此任务原为新建连胜系统，但源码审计发现连胜系统**已存在**（仅存在数据结构 Bug）。连胜火苗、保护道具、里程碑提醒等内容已**合并至 P1-2**（连续打卡增强与日历热力图）。请直接执行 P1-2，无需重复执行本任务。

---

### 任务 P1-10：专注模式与舒缓界面（2026 新增）

**文件**：`index.html`、各学科 `shared/styles.css`、`scripts.js`

**问题**：粒子特效较多，对部分学生造成注意力分散。

**执行步骤**：
1. 品牌栏增加月亮图标切换专注模式
2. CSS 实现专注模式样式降级
3. 尊重 `prefers-reduced-motion` 用户偏好

**代码示例**（`index.html`）：
```html
<button class="focus-toggle" id="focus-toggle" aria-label="切换专注模式">🌙</button>
```

**代码示例**（`scripts.js`）：
```javascript
const focusToggle = document.getElementById('focus-toggle');
if (focusToggle) {
  // 读取偏好
  const isFocus = localStorage.getItem('teachany_focus_mode') === 'true';
  if (isFocus) document.body.classList.add('focus-mode');

  focusToggle.addEventListener('click', () => {
    document.body.classList.toggle('focus-mode');
    const enabled = document.body.classList.contains('focus-mode');
    localStorage.setItem('teachany_focus_mode', enabled);
    focusToggle.textContent = enabled ? '☀️' : '🌙';
    focusToggle.setAttribute('aria-label', enabled ? '退出专注模式' : '切换专注模式');
  });
}

// 自动检测系统偏好
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.body.classList.add('reduced-motion');
}
```

**CSS**：
```css
/* 专注模式：关闭装饰性动画 */
body.focus-mode .particle,
body.focus-mode .glow-orb,
body.focus-mode .floating-light {
  display: none !important;
}
body.focus-mode {
  background: var(--bg) !important;
}
body.focus-mode .card {
  box-shadow: none;
  border: 1px solid var(--rule);
}

/* 尊重系统偏好 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .particle, .glow-orb { display: none !important; }
}
```

**验证**：点击月亮图标后粒子特效消失，界面变简洁；系统开启减少动画时自动降级。

---

### 任务 P1-11：AI 自适应难度引擎（已合并至 P1-3）

> **源码审计校正**：此任务原为新建自适应难度系统，但已在 P1-3（自适应难度推荐引擎）中完整实现。`DIFFICULTY_MULTIPLIERS` 已在源码中存在，自适应推荐引擎代码已写入 P1-3。请直接执行 P1-3，无需重复执行本任务。

---

### 任务 P1-12：叙事化滚动学习（2026 新增）

**文件**：各课件 HTML、各学科 `shared/scripts.js`、`shared/styles.css`

**问题**：8 段内容平铺直叙，缺乏滚动叙事感。

**执行步骤**：
1. 使用 `IntersectionObserver` 监测 Section 进入视口
2. 触发 fade-in + slide-up 动画
3. 前测答错的知识点在正文中自动高亮

**代码示例**（`scripts.js`）：
```javascript
// 叙事化滚动
const narrativeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('narrative-visible');
      // 更新进度条
      const index = Array.from(entry.target.parentElement.children).indexOf(entry.target);
      updateProgressBar(index + 1);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.courseware-section').forEach(section => {
  narrativeObserver.observe(section);
});

// 前测结果影响正文高亮
function highlightWeakPoints() {
  const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
  const wrongAnswers = state.wrongAnswers || [];

  wrongAnswers.forEach(item => {
    const target = document.querySelector(`[data-knowledge-point="${item.point}"]`);
    if (target) {
      target.classList.add('weak-point');
      target.innerHTML += '<span class="review-hint">📌 前测答错，重点复习</span>';
    }
  });
}
```

**CSS**：
```css
.courseware-section {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.courseware-section.narrative-visible {
  opacity: 1;
  transform: translateY(0);
}
.weak-point {
  background: rgba(255, 183, 77, 0.1);
  border-left: 3px solid var(--warn);
  padding-left: 0.75rem;
}
.review-hint {
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: var(--warn);
  font-weight: 600;
}
```

**验证**：滚动课件页时每个 Section 渐入显示，前测答错的知识点在正文中高亮标注。

---

### 任务 P1-13：徽章分享卡片生成器（2026 新增）

**文件**：`shared/badges.js`（已有）、`scripts.js`

**问题**：徽章仅本地展示，无法分享，缺乏社交货币属性。

**执行步骤**：
1. 徽章解锁后调用 Canvas API 生成分享卡片
2. 支持保存图片

**代码示例**：
```javascript
// 徽章分享卡片生成
function generateBadgeShareCard(badge) {
  const canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
  gradient.addColorStop(0, '#0a0e1a');
  gradient.addColorStop(1, '#141a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 750, 1080);

  // 标题
  ctx.fillStyle = '#64ffda';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TeachAny 小四门', 375, 80);

  // 徽章图标（大号 emoji）
  ctx.font = '120px sans-serif';
  ctx.fillText(badge.icon, 375, 280);

  // 徽章名称
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText(badge.name, 375, 380);

  // 描述
  ctx.fillStyle = '#8892b0';
  ctx.font = '24px sans-serif';
  ctx.fillText(badge.desc, 375, 430);

  // 用户统计
  const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
  ctx.fillStyle = '#bb86fc';
  ctx.font = '28px sans-serif';
  ctx.fillText(`等级 ${state.level || 1} · XP ${state.xp || 0}`, 375, 520);
  ctx.fillText(`已学 ${state.completedLessons || 0} 课`, 375, 570);

  // 底部
  ctx.fillStyle = '#8892b0';
  ctx.font = '20px sans-serif';
  ctx.fillText('一起来学政史地生吧！', 375, 1000);

  // 下载
  const link = document.createElement('a');
  link.download = `teachany-badge-${badge.id}.png`;
  link.href = canvas.toDataURL();
  link.click();
}

// 在徽章解锁弹窗中增加分享按钮
function showBadgeUnlock(badge) {
  const popup = document.createElement('div');
  popup.className = 'badge-popup';
  popup.innerHTML = `
    <div class="badge-popup-content">
      <div class="badge-icon">${badge.icon}</div>
      <h3>徽章解锁！</h3>
      <p class="badge-name">${badge.name}</p>
      <p class="badge-desc">${badge.desc}</p>
      <button class="badge-share-btn" onclick="generateBadgeShareCard(${JSON.stringify(badge).replace(/"/g, '&quot;')})">
        📸 生成分享卡片
      </button>
    </div>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add('show'), 100);
}
```

**验证**：徽章解锁后点击"生成分享卡片"，浏览器自动下载 PNG 图片。

---

## P2 任务（长期演进）

### 任务 P2-1：Bento Grid 布局

**文件**：`index.html`、`styles.css`

将首页学科卡片区域改为 CSS Grid Bento 布局，大小卡片组合。

### 任务 P2-2：科举等级体系深化

**文件**：`scripts.js`、新建 `rank-showcase.html`

增加称号解锁动画、称号展示页、专属视觉特权。

### 任务 P2-3 ~ P2-7：创意提案实现

| 编号 | 创意 | 实现技术 |
|------|------|----------|
| P2-3 | 历史"时空穿越"时间轴 | CSS 3D transform + SVG 时间轴 |
| P2-4 | 地理"地球仪"3D 探索 | Three.js 地球模型 |
| P2-5 | 道法"道德法庭"模拟器 | 分支叙事 JSON + 投票机制 |
| P2-6 | 生物"细胞实验室" | SVG/Canvas + 交互热点 |
| P2-7 | 吉祥物成长系统 | SVG + localStorage 成长记录 |

---

## 执行顺序建议（源码审计校正版）

```
阶段零（源码 Bug 紧急修复 · 最高优先级）:
  P0-0a 旗舰课件 bjr.html 游戏化功能失效修复
  → P0-0b 连胜计数数据结构不匹配修复
  → P0-0c 连击持久化与 XP 加成
  → P0-0d data-difficulty 标注错误修复
  → P0-0e 道法配色三方不一致修复
  → P0-0f 首页与课件页字体统一

阶段一（P0 基础体验）:
  P0-1 深浅色统一 → P0-2 配色重构 → P0-4 导航回溯
  → P0-3 微交互补全 → P0-8 信息密度优化
  → P0-5 核心素养 → P0-6 差异化模板 → P0-7 题型升级
  → P0-9 PBL 闭环

阶段二（P1 系统增强）:
  P1-1 吉祥物事件链修复（依赖 P0-0a）
  → P1-2 连续打卡增强（依赖 P0-0b）
  → P1-3 自适应难度推荐（依赖 P0-0c、P0-0d）
  → P1-4 跨学科 → P1-5 时政库 → P1-6 读图训练
  → P1-7 开卷适配 → P1-8 移动端
  → P1-10 专注模式 → P1-12 叙事化滚动 → P1-13 徽章分享卡片
  （P1-9 已合并至 P1-2，P1-11 已合并至 P1-3，无需单独执行）

阶段三（P2 长期演进）:
  P2-7 吉祥物成长（衔接 P1-1）
  → P2-1 Bento 布局 → P2-2 科举深化
  → P2-3~P2-6 创意提案
```

## 注意事项

1. **纯前端零依赖**：所有修改不引入构建工具，不引入 npm 依赖（Three.js 除外，可用 CDN 或本地文件）
2. **向后兼容**：修改不破坏现有功能，XP 系统和已有课件内容保持正常
3. **localStorage 结构**：扩展 `teachany_gamestate` 时新增字段需有默认值处理，避免旧数据报错
4. **四学科一致性**：修改 `shared/` 下文件时，需同步更新四个学科的对应文件
5. **响应式**：所有新组件需适配 PC（≥1200px）、平板（768-1200px）、手机（≤768px）三档断点
6. **无障碍**：所有交互元素支持键盘导航，颜色对比度 ≥ 4.5:1（WCAG AA）
7. **路径检查（新增）**：部署到 GitHub Pages 前必须检查所有脚本/样式引用为相对路径，不含 localhost
8. **学习目标第一（新增）**：游戏化机制必须服务于学习目标，持续 A/B 测试找到激励与干扰的平衡点
9. **用户控制权（新增）**：AI 功能和情感化设计需提供关闭开关，尊重用户选择

## 本次源码审计校正总结（2026.06 修订版）

### 重大勘误

本次基于 `https://weiyu1613.github.io/XiaoSiMen/` 线上版深度体验 + **源码级审计**，对前版报告中的错误假设进行了全面修正：

| 勘误项 | 前版错误描述 | 源码审计真实情况 |
|--------|-------------|-----------------|
| 吉祥物系统 | "mascotEngine 从未定义实现" | `mascot.js` 已完整实现：4 角色 × 12 表情 × SVG 渲染 × 自动初始化 |
| 答题可访问性 | "选项未暴露为交互元素，需紧急修复" | 选项已使用 `<div role="button" tabindex="0" aria-label aria-pressed onkeydown>` |
| XP 难度加权 | "需新增难度加权机制" | `DIFFICULTY_MULTIPLIERS` 已存在，但 `data-difficulty` 标注系统性错误 |
| 连击系统 | "需新增连击机制" | `_currentStreak` 已存在，但不持久化且无 XP 加成 |
| 连胜系统 | "需新增连胜系统" | `updateStreak()` 已存在，但数据结构不匹配导致永远显示 0 |

### 新增源码级 Bug 修复任务（6 项 P0）

- **P0-0a**：bjr.html 本地 `checkAnswer` 绕过全部游戏化功能（旗舰课件完全失效）
- **P0-0b**：streak 数据结构不匹配（数字 vs 对象属性，首页永远显示 0）
- **P0-0c**：`_currentStreak` 不持久化且无 XP 加成
- **P0-0d**：`data-difficulty` 属性系统性标注错误
- **P0-0e**：道法配色三方不一致（首页绿 / 课件紫 / 吉祥物绿）
- **P0-0f**：首页与课件页字体不一致

### 修正的任务

- **P1-1**：从"新建 mascot.js"改为"修复吉祥物事件链断裂"（scripts.js 从未 dispatch 自定义事件）
- **P1-2**：从"新建连胜系统"改为"增强已有连胜系统"（修复 Bug + 日历热力图 + 保护道具）
- **P1-3**：从"新增 XP 难度加权"改为"自适应难度推荐引擎"（加权已存在，需修复标签 + 增加推荐）
- **P1-9**：已合并至 P1-2（连胜系统已存在，无需新建）
- **P1-11**：已合并至 P1-3（自适应引擎已在 P1-3 中实现）

### 有效任务统计

- **P0 源码 Bug 修复**：6 项（P0-0a ~ P0-0f）
- **P0 基础体验**：9 项（P0-1 ~ P0-9）
- **P1 系统增强**：9 项有效任务（P1-9 和 P1-11 已合并，实际执行 11 项中的 9 项）
- **P2 长期演进**：7 项
- **合计有效任务**：31 项
