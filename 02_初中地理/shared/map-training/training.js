// 读图训练交互引擎
const MapTraining = {
  currentExercise: 0,
  correctCount: 0,
  exercises: [],
  
  async init() {
    try {
      const res = await fetch('training-data.json');
      this.exercises = (await res.json()).exercises;
    } catch(e) { console.warn('训练数据加载失败', e); return; }
    this.render();
  },
  
  render() {
    const ex = this.exercises[this.currentExercise];
    if (!ex) { this.showResult(); return; }
    const container = document.getElementById('training-container');
    if (!container) return;
    container.innerHTML = `
      <div class="exercise-card" style="background:white;border-radius:12px;padding:24px;margin:16px 0;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <span style="background:#1565C0;color:white;padding:4px 12px;border-radius:12px;font-size:12px;">第${this.currentExercise+1}/${this.exercises.length}题</span>
          <span style="font-size:12px;color:#888;">${ex.difficulty}</span>
        </div>
        <h3 style="margin-bottom:16px;color:#333;">${ex.question}</h3>
        <div id="options-list">${ex.options.map((o,i)=>`<div class="map-option" data-idx="${i}" onclick="MapTraining.selectAnswer(${i})" style="padding:12px 16px;border:2px solid #e0e0e0;border-radius:8px;margin-bottom:8px;cursor:pointer;transition:all 0.2s;">${String.fromCharCode(65+i)}. ${o}</div>`).join('')}</div>
        <div id="feedback-area" style="display:none;margin-top:16px;padding:12px;border-radius:8px;"></div>
      </div>`;
  },
  
  selectAnswer(idx) {
    const ex = this.exercises[this.currentExercise];
    const correct = idx === ex.answer;
    if (correct) this.correctCount++;
    document.querySelectorAll('.map-option').forEach((el,i)=>{
      el.style.pointerEvents='none';
      if(i===ex.answer){el.style.borderColor='#27ae60';el.style.background='#e8f5e9';}
      else if(i===idx&&!correct){el.style.borderColor='#e74c3c';el.style.background='#fdecea';}
    });
    const fb=document.getElementById('feedback-area');
    fb.style.display='block';
    fb.style.background=correct?'#e8f5e9':'#fdecea';
    fb.style.borderLeft=`4px solid ${correct?'#27ae60':'#e74c3c'}`;
    fb.innerHTML=`<p style="font-weight:600;color:${correct?'#27ae60':'#e74c3c'};">${correct?'✓ 回答正确！':'✗ 答案错误'}</p><p style="color:#666;margin-top:8px;">${ex.explanation}</p>`;
    setTimeout(()=>{this.currentExercise++;this.render();},2500);
  },
  
  showResult() {
    const rate=Math.round(this.correctCount/this.exercises.length*100);
    const container=document.getElementById('training-container');
    if(container){
      container.innerHTML=`<div style="text-align:center;padding:40px;"><div style="font-size:64px;margin-bottom:16px;">${rate>=80?'🏆':rate>=60?'👍':'💪'}</div><h2 style="color:#333;margin-bottom:8px;">训练完成！</h2><p style="font-size:20px;color:#1565C0;font-weight:700;">${this.correctCount}/${this.exercises.length} 正确 · ${rate}%</p><button onclick="MapTraining.restart()" style="margin-top:20px;padding:10px 24px;background:#1565C0;color:white;border:none;border-radius:8px;cursor:pointer;">重新训练</button></div>`;
    }
  },
  
  restart(){this.currentExercise=0;this.correctCount=0;this.render();}
};
window.MapTraining=MapTraining;
