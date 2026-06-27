#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TeachAny 小四门互动课件 - P0-1 / P1-8 / P1-10 / P1-13 批量优化脚本
幂等：可重复运行，不会重复插入。
"""
import os
import re

ROOT = r'd:\AIProject\Trae\XiaoSiMen'

# 需要排除的目录（开发工具 / 分析报告 / 版本控制 / 临时目录）
EXCLUDE_DIRS = {'_dev-tools', '设计分析报告', '.trae', '.git', 'node_modules',
                '.uploads', '__pycache__'}

# ============================================================
# CSS 片段
# ============================================================
CSS_P01 = """/* ====== P0-1 品牌过渡条 ====== */
.brand-transition-bar {
  height: 4px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 50%, var(--primary-light) 100%);
  position: relative;
  overflow: hidden;
}
.brand-transition-bar::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: brandShine 3s ease-in-out infinite;
}
@keyframes brandShine { 0% { left: -100%; } 100% { left: 200%; } }
"""

CSS_P18 = """/* ====== P1-8 移动端工具栏 ====== */
.mobile-toolbar {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
  padding: 8px 0;
  z-index: 95;
  justify-content: space-around;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
}
.mobile-toolbar-item {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 6px 12px; border: none; background: none; cursor: pointer;
  color: var(--text-muted); font-size: 10px; text-decoration: none;
  transition: color 0.2s;
}
.mobile-toolbar-item.active, .mobile-toolbar-item:hover { color: var(--primary); }
.mobile-toolbar-item i { font-size: 18px; }
@media (max-width: 768px) {
  .mobile-toolbar { display: flex; }
  body { padding-bottom: 60px; }
}
"""

CSS_P110 = """/* ====== P1-10 专注模式 ====== */
body.focus-mode .hero-section,
body.focus-mode .brand-bar,
body.focus-mode .breadcrumb,
body.focus-mode .mobile-toolbar,
body.focus-mode .mascot-container { display: none !important; }
body.focus-mode .nav-bar { position: sticky; }
body.focus-mode .section { padding: 20px 0; }
body.focus-mode .container { max-width: 800px; }
body.focus-mode .card { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
body.focus-mode .focus-toggle { background: var(--primary); color: white; }
"""

# CSS 标记（用于幂等检测）
CSS_BLOCKS = [
    ('P0-1 品牌过渡条', CSS_P01),
    ('P1-8 移动端工具栏', CSS_P18),
    ('P1-10 专注模式', CSS_P110),
]

# ============================================================
# HTML 片段
# ============================================================
BRAND_BAR_DIV = '<div class="brand-transition-bar"></div>'

FOCUS_TOGGLE_BTN = (
    '<button class="focus-toggle" '
    'onclick="document.body.classList.toggle(\'focus-mode\')" '
    'style="background:none;border:none;color:var(--primary);cursor:pointer;'
    'font-size:16px;padding:6px 8px;border-radius:6px;" '
    'aria-label="切换专注模式" title="专注模式">'
    '<i class="fa-solid fa-eye"></i></button>'
)

MOBILE_TOOLBAR_HTML = (
    '  <!-- P1-8 移动端工具栏 -->\n'
    '  <div class="mobile-toolbar">\n'
    '    <a href="../../index.html" class="mobile-toolbar-item">'
    '<i class="fa-solid fa-house"></i><span>首页</span></a>\n'
    '    <a href="#" class="mobile-toolbar-item" '
    'onclick="window.scrollTo({top:0,behavior:\'smooth\'});return false;">'
    '<i class="fa-solid fa-arrow-up"></i><span>顶部</span></a>\n'
    '    <a href="#" class="mobile-toolbar-item" '
    'onclick="document.querySelector(\'.quiz-option\')?.scrollIntoView({behavior:\'smooth\'});return false;">'
    '<i class="fa-solid fa-question"></i><span>答题</span></a>\n'
    '    <a href="#" class="mobile-toolbar-item" '
    'onclick="document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();return false;">'
    '<i class="fa-solid fa-expand"></i><span>全屏</span></a>\n'
    '  </div>\n'
)

# ============================================================
# badges.js 分享卡片函数
# ============================================================
BADGE_SHARE_JS = """// ====== P1-13 徽章分享卡片 ======
function generateBadgeShareCard(badgeId) {
  const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
  if (!badge) return;
  const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
  const level = state.level || 1;
  const xp = state.xp || 0;
  const streak = state.streak?.count || 0;

  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 560;
  const ctx = canvas.getContext('2d');

  // 背景
  const grad = ctx.createLinearGradient(0, 0, 400, 560);
  grad.addColorStop(0, '#4A148C'); grad.addColorStop(0.5, '#7B1FA2'); grad.addColorStop(1, '#AB47BC');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 400, 560);

  // 装饰圆
  ctx.globalAlpha = 0.1; ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.arc(200, 180, 120, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // 徽章图标（用emoji渲染）
  ctx.font = '80px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(badge.icon, 200, 180);

  // 标题
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 24px sans-serif';
  ctx.fillText('徽章成就', 200, 290);

  // 徽章名称
  ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif';
  ctx.fillText(badge.name, 200, 340);

  // 描述
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '16px sans-serif';
  ctx.fillText(badge.desc, 200, 380);

  // 用户信息
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '14px sans-serif';
  ctx.fillText('等级 ' + level + '  ·  XP ' + xp + '  ·  连胜 ' + streak + '天', 200, 440);

  // 品牌
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '12px sans-serif';
  ctx.fillText('TeachAny 小四门互动课件', 200, 520);

  // 下载
  const link = document.createElement('a');
  link.download = 'badge-' + badgeId + '.png';
  link.href = canvas.toDataURL();
  link.click();
}
window.generateBadgeShareCard = generateBadgeShareCard;
"""

# ============================================================
# 读写工具（保留 BOM 状态，UTF-8 编码）
# ============================================================
def read_text(path):
    with open(path, 'rb') as f:
        data = f.read()
    has_bom = data.startswith(b'\xef\xbb\xbf')
    text = data.decode('utf-8-sig')
    return text, has_bom


def write_text(path, text, has_bom):
    with open(path, 'wb') as f:
        if has_bom:
            f.write(b'\xef\xbb\xbf')
        f.write(text.encode('utf-8'))


# ============================================================
# 文件发现
# ============================================================
def _excluded(rel_path):
    parts = rel_path.replace('/', os.sep).split(os.sep)
    return any(p in EXCLUDE_DIRS for p in parts)


def find_css_files():
    """所有 shared/styles.css（共 13 个，含 04_rttljkjy 嵌套目录）"""
    result = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel = os.path.relpath(dirpath, ROOT)
        if _excluded(rel):
            continue
        if os.path.basename(dirpath) == 'shared':
            for fn in filenames:
                if fn.lower() == 'styles.css':
                    result.append(os.path.join(dirpath, fn))
    return sorted(result)


def find_badges_files():
    """所有 shared/badges.js（共 12 个）"""
    result = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel = os.path.relpath(dirpath, ROOT)
        if _excluded(rel):
            continue
        if os.path.basename(dirpath) == 'shared':
            for fn in filenames:
                if fn.lower() == 'badges.js':
                    result.append(os.path.join(dirpath, fn))
    return sorted(result)


def find_courseware_html():
    """所有课件 HTML：含 nav-bar 且非 index.html"""
    result = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel = os.path.relpath(dirpath, ROOT)
        if _excluded(rel):
            continue
        for fn in filenames:
            if not fn.lower().endswith('.html'):
                continue
            if fn.lower() == 'index.html':
                continue
            result.append(os.path.join(dirpath, fn))
    return sorted(result)


# ============================================================
# 标签匹配（按 div / nav 嵌套深度）
# ============================================================
def find_tag_open(text, tag, attr_class):
    """查找 <tag ... class="attr_class" ...>，返回其结束位置（即 > 之后），未找到返回 -1"""
    pat = re.compile(
        r'<' + tag + r'\b[^>]*\bclass="' + re.escape(attr_class) + r'"[^>]*>',
        re.IGNORECASE)
    m = pat.search(text)
    return m.end() if m else -1


def find_matching_close(text, start_pos, tag):
    """从 start_pos 起按嵌套深度查找匹配的 </tag>，返回其起始位置，未找到返回 -1"""
    pat = re.compile(r'<' + tag + r'\b[^>]*>|</' + tag + r'>', re.IGNORECASE)
    depth = 1
    for m in pat.finditer(text, start_pos):
        tok = m.group().lower()
        if tok.startswith('</' + tag):
            depth -= 1
            if depth == 0:
                return m.start()
        else:
            depth += 1
    return -1


# ============================================================
# 任务 1+2+3：更新 CSS 文件
# ============================================================
def update_css_files():
    css_files = find_css_files()
    modified = 0
    for path in css_files:
        text, bom = read_text(path)
        changed = False
        for marker, block in CSS_BLOCKS:
            if marker in text:
                continue  # 已存在，幂等跳过
            if not text.endswith('\n'):
                text += '\n'
            text += '\n' + block
            changed = True
        if changed:
            if not text.endswith('\n'):
                text += '\n'
            write_text(path, text, bom)
            modified += 1
    return modified, len(css_files)


# ============================================================
# 任务 4：更新 badges.js（追加 + 同步）
# ============================================================
def update_badges_files():
    src = os.path.join(ROOT, '01_初中历史', '七年级', 'shared', 'badges.js')
    src_text, src_bom = read_text(src)
    src_appended = False
    # 1) 源文件追加分享卡片函数（幂等）
    if 'generateBadgeShareCard' not in src_text:
        if not src_text.endswith('\n'):
            src_text += '\n'
        src_text += '\n' + BADGE_SHARE_JS
        if not src_text.endswith('\n'):
            src_text += '\n'
        write_text(src, src_text, src_bom)
        src_appended = True
    # 重新读取最终源内容
    final_text, _ = read_text(src)
    # 2) 同步到全部 12 个 shared 目录
    targets = find_badges_files()
    synced = 0
    for path in targets:
        cur, cur_bom = read_text(path)
        if cur == final_text:
            continue  # 内容已一致
        write_text(path, final_text, cur_bom)  # 保留各目标原 BOM 状态
        synced += 1
    return synced, len(targets), src_appended


# ============================================================
# 任务 1+2+3 的 HTML 部分：更新课件 HTML
# ============================================================
def process_one_html(text):
    """对单个课件 HTML 文本执行 P0-1 / P1-8 / P1-10，返回 (新文本, 是否改动)"""
    changed = False

    # --- P1-10 专注模式按钮：优先 nav-inner 内最后，兜底 nav-bar </nav> 之前 ---
    if 'focus-toggle' not in text:
        inserted = False
        ni_open = find_tag_open(text, 'div', 'nav-inner')
        if ni_open != -1:
            ni_close = find_matching_close(text, ni_open, 'div')
            if ni_close != -1:
                ins = '\n    ' + FOCUS_TOGGLE_BTN + '\n'
                text = text[:ni_close] + ins + text[ni_close:]
                inserted = True
        if not inserted:  # 无 nav-inner 的课件：插入到 nav-bar 的 </nav> 之前
            nb_open = find_tag_open(text, 'nav', 'nav-bar')
            if nb_open != -1:
                nb_close = find_matching_close(text, nb_open, 'nav')
                if nb_close != -1:
                    ins = '\n    ' + FOCUS_TOGGLE_BTN + '\n'
                    text = text[:nb_close] + ins + text[nb_close:]
                    inserted = True
        if inserted:
            changed = True

    # --- P0-1 品牌过渡条：nav-bar </nav> 之后 ---
    if 'brand-transition-bar' not in text:
        nb_open = find_tag_open(text, 'nav', 'nav-bar')
        if nb_open != -1:
            nb_close = find_matching_close(text, nb_open, 'nav')
            if nb_close != -1:
                end = nb_close + len('</nav>')
                ins = '\n  ' + BRAND_BAR_DIV
                text = text[:end] + ins + text[end:]
                changed = True

    # --- P1-8 移动端工具栏：优先 </body> 前，兜底 </html> 前，再兜底文件末尾 ---
    if 'mobile-toolbar' not in text:
        m = re.search(r'</body\s*>', text, re.IGNORECASE)
        if m:
            idx = m.start()
        else:
            m = re.search(r'</html\s*>', text, re.IGNORECASE)
            if m:
                idx = m.start()
            else:
                idx = len(text.rstrip())  # 文件末尾（无闭合标签的残缺课件）
        text = text[:idx] + MOBILE_TOOLBAR_HTML + '\n' + text[idx:]
        changed = True

    return text, changed


def update_html_files():
    html_files = find_courseware_html()
    modified = 0
    skipped_no_navbar = 0
    for path in html_files:
        text, bom = read_text(path)
        # 仅处理含 nav-bar 的课件
        if find_tag_open(text, 'nav', 'nav-bar') == -1:
            skipped_no_navbar += 1
            continue
        new_text, changed = process_one_html(text)
        if changed:
            write_text(path, new_text, bom)
            modified += 1
    return modified, len(html_files), skipped_no_navbar


# ============================================================
# 任务 4 的 index.html 部分：成就墙分享按钮
# ============================================================
INDEX_BADGE_OLD_RE = re.compile(
    r"([ \t]*)(\(isUnlocked \?) '' "
    r"(: '<span class=\"badge-lock-icon\"><i class=\"fa-solid fa-lock\"></i></span>'\);)"
)


def _index_repl(m):
    indent = m.group(1)
    head = m.group(2)   # (isUnlocked ?
    tail = m.group(3)   # : '<span ...></span>');
    button = (
        "'<button onclick=\"generateBadgeShareCard(\\'' + badge.id + '\\')\" "
        "style=\"margin-top:8px;padding:4px 12px;font-size:11px;font-weight:600;"
        "border:1px solid rgba(255,152,0,0.5);background:rgba(255,152,0,0.1);"
        "color:#E65100;border-radius:8px;cursor:pointer;\">分享</button>'"
    )
    return indent + head + ' ' + button + ' ' + tail


def update_index_html():
    idx = os.path.join(ROOT, 'index.html')
    text, bom = read_text(idx)
    if 'generateBadgeShareCard' in text:
        return 0  # 幂等：已添加分享按钮
    new_text, n = INDEX_BADGE_OLD_RE.subn(_index_repl, text, count=1)
    if n > 0:
        write_text(idx, new_text, bom)
        return 1
    return 0


# ============================================================
# 主流程
# ============================================================
def main():
    print('=' * 64)
    print('TeachAny 小四门 优化脚本 (P0-1 / P1-8 / P1-10 / P1-13)')
    print('=' * 64)

    css_mod, css_total = update_css_files()
    print('[CSS] 扫描 %d 个 styles.css，修改 %d 个' % (css_total, css_mod))

    badge_sync, badge_total, src_appended = update_badges_files()
    print('[badges.js] 源文件追加=%s，同步目标 %d/%d 个' %
          ('是' if src_appended else '否(已存在)', badge_sync, badge_total))

    html_mod, html_total, skipped = update_html_files()
    print('[HTML] 扫描 %d 个候选 HTML（含 nav-bar 课件），修改 %d 个（无 nav-bar 跳过 %d）'
          % (html_total, html_mod, skipped))

    idx_mod = update_index_html()
    print('[index.html] 成就墙分享按钮修改 %d 个' % idx_mod)

    # badges.js：源文件本次追加计 1，同步写入的目标计 badge_sync（源自身因已一致会被跳过）
    badges_writes = badge_sync + (1 if src_appended else 0)
    total = css_mod + badges_writes + html_mod + idx_mod

    print('-' * 64)
    print('修改文件总数：%d' % total)
    print('  - styles.css 修改：%d' % css_mod)
    print('  - badges.js 写入：%d' % badges_writes)
    print('  - 课件 HTML 修改：%d' % html_mod)
    print('  - index.html 修改：%d' % idx_mod)
    print('=' * 64)
    return total


if __name__ == '__main__':
    main()
