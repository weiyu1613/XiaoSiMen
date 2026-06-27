// 徽章系统 - TeachAny 小四门互动课件
// 读取 localStorage 中的 teachany_gamestate，自动检测并解锁徽章

// 徽章定义
const BADGE_DEFINITIONS = [
  { id: 'first_lesson', name: '初学者', desc: '完成第一节课', icon: '🎓', condition: (s) => (s.completedLessons||0) >= 1 },
  { id: 'combo_3', name: '连击新手', desc: '连续答对3题', icon: '🔥', condition: (s) => (s.maxCombo||0) >= 3 },
  { id: 'combo_10', name: '连击大师', desc: '连续答对10题', icon: '⚡', condition: (s) => (s.maxCombo||0) >= 10 },
  { id: 'perfect_lesson', name: '满分达人', desc: '一节课全部答对', icon: '💯', condition: (s) => (s.perfectLessons||0) >= 1 },
  { id: 'streak_7', name: '坚持一周', desc: '连续学习7天', icon: '📅', condition: (s) => (s.streak?.count||0) >= 7 },
  { id: 'streak_30', name: '月度坚持', desc: '连续学习30天', icon: '🏆', condition: (s) => (s.streak?.count||0) >= 30 },
  { id: 'level_5', name: '小秀才', desc: '达到5级', icon: '🏅', condition: (s) => (s.level||1) >= 5 },
  { id: 'level_10', name: '状元及第', desc: '达到10级', icon: '👑', condition: (s) => (s.level||1) >= 10 },
];

function checkBadges() {
  const state = JSON.parse(localStorage.getItem('teachany_gamestate') || '{}');
  if (!state.badges) state.badges = [];
  let newBadges = [];
  BADGE_DEFINITIONS.forEach(badge => {
    if (!state.badges.includes(badge.id) && badge.condition(state)) {
      state.badges.push(badge.id);
      newBadges.push(badge);
    }
  });
  if (newBadges.length > 0) {
    localStorage.setItem('teachany_gamestate', JSON.stringify(state));
    newBadges.forEach(b => showBadgeUnlock(b));
  }
}

function showBadgeUnlock(badge) {
  const popup = document.createElement('div');
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.8);background:white;border-radius:20px;padding:32px 48px;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:10000;text-align:center;opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);';
  popup.innerHTML = '<div style="font-size:64px;margin-bottom:16px;">'+badge.icon+'</div><h3 style="color:#333;font-size:20px;margin-bottom:8px;">徽章解锁！</h3><p style="font-size:18px;font-weight:700;color:#7B1FA2;margin-bottom:4px;">'+badge.name+'</p><p style="color:#666;font-size:14px;">'+badge.desc+'</p>';
  document.body.appendChild(popup);
  setTimeout(() => { popup.style.opacity='1'; popup.style.transform='translate(-50%,-50%) scale(1)'; }, 100);
  setTimeout(() => { popup.style.opacity='0'; popup.style.transform='translate(-50%,-50%) scale(0.8)'; }, 3500);
  setTimeout(() => popup.remove(), 4000);
}

// 自动检查
if (document.readyState !== 'loading') { setTimeout(checkBadges, 1000); }
else { document.addEventListener('DOMContentLoaded', () => setTimeout(checkBadges, 1000)); }

// ====== P1-13 徽章分享卡片 ======
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
