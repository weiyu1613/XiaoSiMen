/**
 * AI自适应难度引擎
 * 根据学生答题表现动态调整题目难度
 */
const AdaptiveEngine = {
  state: {
    correctRate: 0,
    recentAnswers: [],
    currentLevel: 'basic',
    difficultyProgression: ['basic', 'intermediate', 'advanced'],
  },

  init() {
    const saved = JSON.parse(localStorage.getItem('adaptive_engine') || '{}');
    Object.assign(this.state, saved);
  },

  recordAnswer(isCorrect, difficulty) {
    this.state.recentAnswers.push({ correct: isCorrect, difficulty, time: Date.now() });
    if (this.state.recentAnswers.length > 20) this.state.recentAnswers.shift();
    this.updateDifficulty();
    this.save();
  },

  updateDifficulty() {
    if (this.state.recentAnswers.length < 5) return;
    const recent = this.state.recentAnswers.slice(-5);
    const correctCount = recent.filter(a => a.correct).length;
    const rate = correctCount / recent.length;
    if (rate >= 0.8) {
      const idx = this.state.difficultyProgression.indexOf(this.state.currentLevel);
      if (idx < this.state.difficultyProgression.length - 1) {
        this.state.currentLevel = this.state.difficultyProgression[idx + 1];
      }
    } else if (rate <= 0.3) {
      const idx = this.state.difficultyProgression.indexOf(this.state.currentLevel);
      if (idx > 0) {
        this.state.currentLevel = this.state.difficultyProgression[idx - 1];
      }
    }
  },

  getRecommendedDifficulty() { return this.state.currentLevel; },
  getStats() {
    const correct = this.state.recentAnswers.filter(a => a.correct).length;
    return { total: this.state.recentAnswers.length, correct, rate: this.state.recentAnswers.length ? correct / this.state.recentAnswers.length : 0, level: this.state.currentLevel };
  },
  save() { localStorage.setItem('adaptive_engine', JSON.stringify(this.state)); },
};

AdaptiveEngine.init();
window.AdaptiveEngine = AdaptiveEngine;
