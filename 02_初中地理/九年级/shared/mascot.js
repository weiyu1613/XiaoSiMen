/* =============================================================
   TeachAny 吉祥物系统 (MascotEngine)
   版本：v8.0.0
   功能：4学科精灵 / 12种表情状态 / 成长系统 / 互动对话
   ============================================================= */

/* ========== 吉祥物配置 ========== */
const MASCOT_CONFIG = {
  // 根据当前页面路径自动检测学科
  detectSubject() {
    const path = window.location.pathname;
    if (path.includes('01_') || path.includes('历史')) return 'history';
    if (path.includes('02_') || path.includes('地理')) return 'geography';
    if (path.includes('03_') || path.includes('生物')) return 'biology';
    if (path.includes('04_') || path.includes('道德')) return 'morality';
    return 'history'; // 默认
  },

  // 学科精灵配置
  characters: {
    history: {
      name: '史小纪',
      title: '时光守护者',
      color: '#8B4513',
      accentColor: '#D4A574',
      icon: '📜',
      personality: '博古通今，沉稳睿智',
      dialogues: {
        idle: ['和我一起穿越时空吧！', '历史是未来的明镜', '每一次回望都是为了更好地前行'],
        happy: ['太棒了！你的历史感很强！', '答对了！这就是历史的魅力', '精彩！你掌握了这个知识点'],
        confused: ['别担心，历史需要慢慢品味', '再想想看，线索就在文中', '错了没关系，失败也是学习'],
        excited: ['哇！你太厉害了！', '连击！你就是历史达人！', '势不可挡！继续前进！'],
        encourage: ['坚持就是胜利！', '每一步都在靠近真相', '我相信你能做到！']
      }
    },
    geography: {
      name: '地小探',
      title: '山河探索者',
      color: '#1565C0',
      accentColor: '#00BCD4',
      icon: '🌍',
      personality: '好奇探索，视野开阔',
      dialogues: {
        idle: ['一起去探索地球的奥秘吧！', '世界那么大，一起去看看', '经纬之间，万象更新'],
        happy: ['方向感不错嘛！', '答对了！你就是小探险家', '太棒了！地理知识很扎实'],
        confused: ['方向有点偏哦', '再看看地图，答案就在那里', '没关系，探索就是试错的过程'],
        excited: ['太厉害了！环球旅行家！', '连击！你对世界了如指掌！', '势不可挡的探索者！'],
        encourage: ['继续探索，世界等你发现！', '每个坐标都有故事', '勇敢前行，大地是你的课堂！']
      }
    },
    biology: {
      name: '生小命',
      title: '生命解码者',
      color: '#558B2F',
      accentColor: '#8BC34A',
      icon: '🧬',
      personality: '生机勃勃，细致观察',
      dialogues: {
        idle: ['一起来发现生命的奇迹吧！', '每个生命都有它的故事', '从细胞到生态，处处是奥秘'],
        happy: ['生命力满满！', '答对了！你就是生物小专家', '太棒了！你对生命理解很深'],
        confused: ['再仔细观察一下', '生命的答案藏在细节里', '没关系，科学需要耐心'],
        excited: ['惊人的观察力！', '连击！你就是生命科学家！', '万物生长，你也在成长！'],
        encourage: ['每个发现都值得庆祝！', '生命不息，探索不止', '相信你的观察力！']
      }
    },
    morality: {
      name: '法小正',
      title: '正义守护者',
      color: '#2E7D32',
      accentColor: '#FF8F00',
      icon: '⚖️',
      personality: '公正严明，温暖有力',
      dialogues: {
        idle: ['一起学会做人做事吧！', '法治精神，从我做起', '品德是人生最亮的底色'],
        happy: ['品德高尚！', '答对了！你就是品德小标兵', '太棒了！你的判断很正确'],
        confused: ['再思考一下什么是对的', '法律的答案需要仔细推敲', '没关系，思考本身就是成长'],
        excited: ['正义之光闪耀！', '连击！你就是法治小卫士！', '品德满分，令人钦佩！'],
        encourage: ['做一个有温度的人！', '每次选择都塑造更好的你', '坚持正道，未来可期！']
      }
    }
  },

  // 表情状态定义
  states: {
    idle: { eyes: 'normal', mouth: 'smile', accessory: 'none' },
    happy: { eyes: 'happy', mouth: 'open-smile', accessory: 'sparkle' },
    confused: { eyes: 'confused', mouth: 'small-o', accessory: 'question' },
    excited: { eyes: 'star', mouth: 'big-smile', accessory: 'stars' },
    encourage: { eyes: 'warm', mouth: 'smile', accessory: 'heart' },
    thinking: { eyes: 'thinking', mouth: 'line', accessory: 'ellipsis' },
    proud: { eyes: 'proud', mouth: 'grin', accessory: 'crown' },
    sad: { eyes: 'sad', mouth: 'frown', accessory: 'tear' },
    surprised: { eyes: 'wide', mouth: 'o', accessory: 'exclaim' },
    sleepy: { eyes: 'closed', mouth: 'small-smile', accessory: 'zzz' },
    determined: { eyes: 'determined', mouth: 'determined', accessory: 'fire' },
    celebrate: { eyes: 'happy', mouth: 'big-smile', accessory: 'confetti' }
  }
};

/* ========== MascotEngine 核心类 ========== */
class MascotEngine {
  constructor() {
    this.subject = MASCOT_CONFIG.detectSubject();
    this.character = MASCOT_CONFIG.characters[this.subject];
    this.currentState = 'idle';
    this.container = null;
    this.svgElement = null;
    this.dialogueBox = null;
    this.tooltip = null;
    this.dialogueTimeout = null;
    this.idleInterval = null;
    this.level = this.getLevel();
    this.init();
  }

  init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.createContainer();
    this.createSVG();
    this.bindEvents();
    this.startIdleBehavior();
    // 暴露到全局供 scripts.js 调用
    window.mascotEngine = this;
    console.log(` mascot ${this.character.name}(${this.subject}) 已加载`);
  }

  /* ========== 创建容器 ========== */
  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'mascot-container';
    this.container.innerHTML = `
      <div class="mascot-dialogue" id="mascot-dialogue"></div>
      <div class="mascot-svg-wrapper" id="mascot-svg-wrapper"></div>
      <div class="mascot-level-badge" id="mascot-level-badge"></div>
    `;
    document.body.appendChild(this.container);

    // 动态注入学科色彩
    this.container.style.setProperty('--mascot-color', this.character.color);
    this.container.style.setProperty('--mascot-accent', this.character.accentColor);
  }

  /* ========== 创建SVG精灵 ========== */
  createSVG() {
    const wrapper = document.getElementById('mascot-svg-wrapper');
    if (!wrapper) return;

    const svg = this.buildMascotSVG();
    wrapper.innerHTML = svg;
    this.svgElement = wrapper.querySelector('svg');

    // 入场动画
    setTimeout(() => {
      this.container.classList.add('mascot-loaded');
    }, 300);
  }

  buildMascotSVG() {
    const c = this.character;
    const state = MASCOT_CONFIG.states[this.currentState] || MASCOT_CONFIG.states.idle;

    return `
    <svg viewBox="0 0 120 120" width="64" height="64" xmlns="http://www.w3.org/2000/svg" class="mascot-svg" id="mascot-svg">
      <defs>
        <radialGradient id="mascot-body-grad-${this.subject}">
          <stop offset="0%" stop-color="${c.accentColor}" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="${c.color}" stop-opacity="1"/>
        </radialGradient>
        <filter id="mascot-glow-${this.subject}">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- 阴影 -->
      <ellipse cx="60" cy="108" rx="28" ry="4" fill="rgba(0,0,0,0.15)"/>

      <!-- 身体（圆形主体） -->
      <circle cx="60" cy="56" r="34" fill="url(#mascot-body-grad-${this.subject})" filter="url(#mascot-glow-${this.subject})" class="mascot-body"/>

      <!-- 学科图标（头顶） -->
      <text x="60" y="24" text-anchor="middle" font-size="20" class="mascot-icon-text">${c.icon}</text>

      <!-- 眼睛 -->
      ${this.renderEyes(state.eyes)}

      <!-- 嘴巴 -->
      ${this.renderMouth(state.mouth)}

      <!-- 配饰 -->
      ${this.renderAccessory(state.accessory)}

      <!-- 腮红 -->
      <circle cx="42" cy="62" r="5" fill="rgba(255,100,100,0.2)" class="mascot-blush" style="display:${state.eyes === 'happy' || state.eyes === 'star' ? 'inline' : 'none'}"/>
      <circle cx="78" cy="62" r="5" fill="rgba(255,100,100,0.2)" class="mascot-blush" style="display:${state.eyes === 'happy' || state.eyes === 'star' ? 'inline' : 'none'}"/>
    </svg>`;
  }

  renderEyes(type) {
    switch (type) {
      case 'happy':
        return '<path d="M 46 50 Q 50 46 54 50" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M 66 50 Q 70 46 74 50" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      case 'confused':
        return '<circle cx="50" cy="50" r="4" fill="#fff"/><circle cx="70" cy="48" r="4" fill="#fff"/><circle cx="50" cy="51" r="2" fill="#333"/><circle cx="70" cy="49" r="2" fill="#333"/>';
      case 'star':
        return '<text x="50" y="54" text-anchor="middle" font-size="12" fill="#FFD700">★</text><text x="70" y="54" text-anchor="middle" font-size="12" fill="#FFD700">★</text>';
      case 'warm':
        return '<circle cx="50" cy="50" r="4" fill="#fff"/><circle cx="70" cy="50" r="4" fill="#fff"/><circle cx="50" cy="50" r="2.5" fill="${this.character.color}"/><circle cx="70" cy="50" r="2.5" fill="${this.character.color}"/>';
      case 'thinking':
        return '<circle cx="48" cy="50" r="4" fill="#fff"/><circle cx="72" cy="48" r="4" fill="#fff"/><circle cx="48" cy="51" r="2" fill="#333"/><circle cx="72" cy="49" r="2" fill="#333"/>';
      case 'proud':
        return '<path d="M 46 48 L 54 50" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M 66 50 L 74 48" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>';
      case 'sad':
        return '<path d="M 46 52 Q 50 48 54 52" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" transform="rotate(180 50 50)"/><path d="M 66 52 Q 70 48 74 52" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" transform="rotate(180 70 50)"/>';
      case 'wide':
        return '<circle cx="50" cy="50" r="6" fill="#fff"/><circle cx="70" cy="50" r="6" fill="#fff"/><circle cx="50" cy="50" r="3" fill="#333"/><circle cx="70" cy="50" r="3" fill="#333"/>';
      case 'closed':
        return '<path d="M 46 50 L 54 50" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M 66 50 L 74 50" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>';
      case 'determined':
        return '<path d="M 45 48 L 55 51" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M 65 51 L 75 48" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
      default: // normal
        return '<circle cx="50" cy="50" r="4" fill="#fff"/><circle cx="70" cy="50" r="4" fill="#fff"/><circle cx="50" cy="50" r="2" fill="#333"/><circle cx="70" cy="50" r="2" fill="#333"/>';
    }
  }

  renderMouth(type) {
    switch (type) {
      case 'open-smile':
        return '<path d="M 52 64 Q 60 70 68 64" stroke="#fff" stroke-width="2.5" fill="rgba(255,255,255,0.2)" stroke-linecap="round"/>';
      case 'big-smile':
        return '<path d="M 48 63 Q 60 74 72 63" stroke="#fff" stroke-width="2.5" fill="rgba(255,255,255,0.25)" stroke-linecap="round"/>';
      case 'small-o':
        return '<circle cx="60" cy="66" r="3" fill="#fff"/>';
      case 'o':
        return '<circle cx="60" cy="66" r="4" fill="#fff"/>';
      case 'line':
        return '<path d="M 55 67 L 65 67" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>';
      case 'grin':
        return '<path d="M 50 64 L 70 64 L 68 68 L 52 68 Z" fill="#fff"/>';
      case 'frown':
        return '<path d="M 52 68 Q 60 62 68 68" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      case 'determined':
        return '<path d="M 52 66 L 68 66" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
      case 'small-smile':
        return '<path d="M 54 65 Q 60 68 66 65" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>';
      default: // smile
        return '<path d="M 52 64 Q 60 68 68 64" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
    }
  }

  renderAccessory(type) {
    switch (type) {
      case 'sparkle':
        return '<text x="36" y="38" font-size="12" fill="#FFD700" opacity="0.8">✦</text><text x="84" y="38" font-size="12" fill="#FFD700" opacity="0.8">✦</text>';
      case 'question':
        return '<text x="88" y="36" font-size="16" fill="#FFD700" font-weight="bold">?</text>';
      case 'stars':
        return '<text x="30" y="35" font-size="14" fill="#FFD700">✨</text><text x="84" y="35" font-size="14" fill="#FFD700">✨</text>';
      case 'heart':
        return '<text x="86" y="40" font-size="14" fill="#FF6B6B">♥</text>';
      case 'ellipsis':
        return '<text x="84" y="34" font-size="12" fill="#fff" opacity="0.6">...</text>';
      case 'crown':
        return '<text x="60" y="18" text-anchor="middle" font-size="16">👑</text>';
      case 'tear':
        return '<path d="M 50 56 Q 49 62 50 64 Q 51 62 50 56" fill="#5BC0EB" opacity="0.7"/>';
      case 'exclaim':
        return '<text x="88" y="36" font-size="16" fill="#FF6B6B" font-weight="bold">!</text>';
      case 'zzz':
        return '<text x="85" y="30" font-size="12" fill="#fff" opacity="0.5">z</text><text x="92" y="24" font-size="14" fill="#fff" opacity="0.4">Z</text>';
      case 'fire':
        return '<text x="30" y="38" font-size="14">🔥</text><text x="84" y="38" font-size="14">🔥</text>';
      case 'confetti':
        return '<text x="28" y="30" font-size="14">🎉</text><text x="86" y="30" font-size="14">🎉</text>';
      default:
        return '';
    }
  }

  /* ========== 状态切换 ========== */
  setState(stateName, duration = 3000) {
    if (!MASCOT_CONFIG.states[stateName]) stateName = 'idle';
    this.currentState = stateName;

    // 重建SVG以更新表情
    const wrapper = document.getElementById('mascot-svg-wrapper');
    if (wrapper) {
      wrapper.innerHTML = this.buildMascotSVG();
    }

    // 添加状态动画类
    if (this.container) {
      this.container.className = `mascot-container mascot-state-${stateName} mascot-loaded`;
    }

    // 显示对应对话
    this.showDialogue(stateName);

    // 定时恢复到 idle
    if (this.stateTimeout) clearTimeout(this.stateTimeout);
    if (stateName !== 'idle' && duration > 0) {
      this.stateTimeout = setTimeout(() => {
        this.setState('idle', 0);
      }, duration);
    }
  }

  /* ========== 对话系统 ========== */
  showDialogue(stateName) {
    const dialogues = this.character.dialogues[stateName] || this.character.dialogues.idle;
    const text = dialogues[Math.floor(Math.random() * dialogues.length)];

    const box = document.getElementById('mascot-dialogue');
    if (!box) return;

    box.textContent = text;
    box.classList.add('show');

    // 自动隐藏
    if (this.dialogueTimeout) clearTimeout(this.dialogueTimeout);
    this.dialogueTimeout = setTimeout(() => {
      box.classList.remove('show');
    }, 4000);
  }

  showCustomDialogue(text, duration = 4000) {
    const box = document.getElementById('mascot-dialogue');
    if (!box) return;
    box.textContent = text;
    box.classList.add('show');
    if (this.dialogueTimeout) clearTimeout(this.dialogueTimeout);
    this.dialogueTimeout = setTimeout(() => {
      box.classList.remove('show');
    }, duration);
  }

  /* ========== 闲置行为 ========== */
  startIdleBehavior() {
    // 每15-30秒随机显示一条idle对话
    const scheduleNext = () => {
      const delay = 15000 + Math.random() * 15000;
      this.idleInterval = setTimeout(() => {
        if (this.currentState === 'idle') {
          this.showDialogue('idle');
          // 偶尔切换到 thinking 状态
          if (Math.random() < 0.3) {
            this.setState('thinking', 2000);
          }
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    // 首次加载欢迎语
    setTimeout(() => {
      this.showCustomDialogue(`你好！我是${this.character.name}，${this.character.title}！`, 5000);
    }, 1500);
  }

  /* ========== 等级系统 ========== */
  getLevel() {
    try {
      const state = JSON.parse(localStorage.getItem('teachany_gamestate')) || { xp: 0, level: 1 };
      return state.level || 1;
    } catch (e) {
      return 1;
    }
  }

  updateLevelBadge() {
    const badge = document.getElementById('mascot-level-badge');
    if (!badge) return;
    const level = this.getLevel();
    badge.textContent = `Lv.${level}`;
    badge.style.display = level > 0 ? 'flex' : 'none';
  }

  /* ========== 事件绑定 ========== */
  bindEvents() {
    // 点击吉祥物
    this.container.addEventListener('click', () => {
      const reactions = ['happy', 'excited', 'proud', 'surprised'];
      const reaction = reactions[Math.floor(Math.random() * reactions.length)];
      this.setState(reaction, 3000);
    });

    // 悬停提示
    this.container.addEventListener('mouseenter', () => {
      this.showTooltip(`${this.character.name} · ${this.character.title}`);
    });

    this.container.addEventListener('mouseleave', () => {
      this.hideTooltip();
    });

    // 监听答题事件（由 scripts.js 触发）
    document.addEventListener('mascot:correct', () => {
      if (Math.random() < 0.5) {
        this.setState('excited', 2500);
      } else {
        this.setState('happy', 2500);
      }
    });

    document.addEventListener('mascot:wrong', () => {
      this.setState('confused', 3000);
    });

    document.addEventListener('mascot:combo', (e) => {
      this.setState('celebrate', 3000);
      this.showCustomDialogue(`连击 ${e.detail.combo}！太厉害了！`, 3000);
    });

    document.addEventListener('mascot:levelup', (e) => {
      this.setState('proud', 5000);
      this.showCustomDialogue(`恭喜升级到 Lv.${e.detail.level}！`, 5000);
    });

    // 更新等级徽章
    this.updateLevelBadge();
  }

  showTooltip(text) {
    this.hideTooltip();
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'mascot-tooltip';
    this.tooltip.textContent = text;
    document.body.appendChild(this.tooltip);

    const rect = this.container.getBoundingClientRect();
    this.tooltip.style.left = (rect.left + rect.width / 2) + 'px';
    this.tooltip.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }
}

/* ========== 自动初始化 ========== */
// 延迟初始化，确保在其他脚本之后
setTimeout(() => {
  if (!window.mascotEngine) {
    new MascotEngine();
  }
}, 500);
