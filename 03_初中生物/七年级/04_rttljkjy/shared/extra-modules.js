/* =============================================================
   第四单元额外模块：AI学伴 + 知识图谱 + 导师卡片
   ============================================================= */

// ---------- AI学伴（绿色主题悬浮窗） ----------
function initAIPartner() {
  var wrapper = document.getElementById('ai-partner-wrapper');
  if (!wrapper) return;
  var box = document.getElementById('ai-partner-box');
  var btn = document.getElementById('ai-partner-toggle');
  if (!box || !btn) return;
  btn.addEventListener('click', function() {
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  });
  var closeBtn = document.getElementById('ai-partner-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() { box.style.display = 'none'; });
  }
  var sendBtn = document.getElementById('ai-partner-send');
  var input = document.getElementById('ai-partner-input');
  var thread = document.getElementById('ai-partner-thread');
  if (sendBtn && input && thread) {
    sendBtn.addEventListener('click', function() { doPartnerChat(input, thread); });
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); doPartnerChat(input, thread); }
    });
  }
}

function doPartnerChat(input, thread) {
  var msg = input.value.trim();
  if (msg.length < 2) return;
  var youDiv = document.createElement('div');
  youDiv.style.cssText = 'background:#e8f5e9;border-radius:12px;padding:10px 14px;margin-bottom:8px;font-size:13px;';
  youDiv.innerHTML = '<strong style="color:#1b5e20">你：</strong> ' + msg;
  thread.appendChild(youDiv);
  input.value = '';
  setTimeout(function() {
    var reply = getAIPartnerReply(msg);
    var repDiv = document.createElement('div');
    repDiv.style.cssText = 'background:#2e7d32;color:white;border-radius:12px;padding:10px 14px;margin-bottom:8px;font-size:13px;';
    repDiv.innerHTML = '<strong style="color:#a5d6a7">🌿 AI学伴：</strong> ' + reply;
    thread.appendChild(repDiv);
    thread.scrollTop = thread.scrollHeight;
  }, 600);
}

function getAIPartnerReply(msg) {
  var lower = msg.toLowerCase();
  if (lower.includes('睾丸') || lower.includes('卵巢') || lower.includes('生殖')) return '男性主要生殖器官是睾丸（产生精子和雄性激素），女性是卵巢（产生卵子和雌性激素）。受精发生在输卵管，胚胎在子宫中发育。';
  if (lower.includes('青春')) return '青春期是童年到成年的过渡期，显著特点是身高体重突增、性器官发育、第二性征出现。心理上独立意识增强、情绪波动大，都是正常的！';
  if (lower.includes('营养') || lower.includes('糖类') || lower.includes('维生素')) return '糖类是主要供能物质，脂肪是备用供能物质，蛋白质是构建身体的原料。维生素不提供能量但作用大，缺乏维生素A→夜盲症，维生素C→坏血病。';
  if (lower.includes('消化') || lower.includes('小肠')) return '消化的主要部位是小肠（5-6米长，有皱襞和绒毛）。胆汁不含消化酶但能乳化脂肪。吸收是指营养物质进入循环系统的过程。';
  if (lower.includes('合理营养') || lower.includes('食品安全')) return '合理营养=种类齐全+比例合适。平衡膳食宝塔：谷物最底层（最多）→蔬菜水果→肉蛋奶→油脂最顶层（最少）。不吃发芽马铃薯和野生蘑菇！';
  if (lower.includes('呼吸道') || lower.includes('肺')) return '呼吸道包括鼻、咽、喉、气管、支气管，对空气有清洁、温暖、湿润的作用。肺泡与血液通过气体扩散作用进行气体交换。';
  if (lower.includes('血液') || lower.includes('红细胞') || lower.includes('白细胞') || lower.includes('血小板')) return '红细胞运输氧气（含血红蛋白）；白细胞吞噬病菌防御疾病；血小板促进止血加速凝血。贫血要多吃含铁和蛋白质的食物！';
  if (lower.includes('血管') || lower.includes('动脉') || lower.includes('静脉')) return '动脉运血出心，壁厚弹性大，流速最快；静脉运血回心，壁薄弹性小（有静脉瓣）；毛细血管管壁最薄，适于物质交换。';
  if (lower.includes('心脏') || lower.includes('血液循环')) return '心脏四个腔：左心房、右心房、左心室、右心室。体循环：左心室→全身→右心房（动脉血变静脉血）；肺循环：右心室→肺→左心房（静脉血变动脉血）。';
  if (lower.includes('尿') || lower.includes('肾') || lower.includes('废物')) return '排泄途径：呼吸（排CO₂）、皮肤（排汗）、泌尿（排尿）。尿液形成：肾小球滤过→原尿；肾小管重吸收→尿液。原尿含葡萄糖，尿液不含（被肾小管全部重吸收）。';
  return '这个问题很有价值！先记住核心知识点，再做几道练习题巩固一下吧 🌿';
}

document.addEventListener('DOMContentLoaded', function() { initAIPartner(); });

// ---------- 导师卡片（固定在页面末尾或侧边栏） ----------
// 导师数据（由各页面注入）
window.mentorData = window.mentorData || {
  name: '生物课堂导师',
  title: '七年级生物 · 第四单元',
  avatar: 'https://webcdn.m.qq.com/webcdn/qclaw/expert/icons/1779262074383__20260520092829.png',
  tag: '互动课件',
  intro: '专注K12生物教学设计，帮你用最短的时间掌握人体生理核心考点。'
};

// 注入导师卡片的HTML片段（在footer前调用）
function renderMentorCard(targetId) {
  var el = document.getElementById(targetId);
  if (!el) return;
  var d = window.mentorData;
  var html = '<div id="mentor-card" style="background:linear-gradient(135deg,#1b5e20,#2e7d32,#4caf50);border-radius:16px;padding:24px;margin:24px 0;color:white;box-shadow:0 4px 20px rgba(46,125,50,0.3);">' +
    '<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">' +
    '<img src="' + d.avatar + '" alt="' + d.name + '" style="width:64px;height:64px;border-radius:50%;border:3px solid rgba(255,255,255,0.4);object-fit:cover;" onerror="this.style.display=\'none\'">' +
    '<div><div style="font-size:14px;color:#a5d6a7;margin-bottom:2px;">' + d.tag + '</div><div style="font-size:18px;font-weight:700;">' + d.name + '</div><div style="font-size:13px;opacity:0.8;">' + d.title + '</div></div></div>' +
    '<p style="font-size:14px;line-height:1.7;opacity:0.9;margin-bottom:0;">' + d.intro + '</p></div>';
  el.innerHTML = html;
}
