// extra-modules.js - 额外模块加载器
// 此文件为兼容性占位文件，实际功能由 scripts.js 提供
(function() {
  'use strict';
  console.log('[extra-modules] 兼容模块已加载');
  
  // 导出空对象，防止引用错误
  window.ExtraModules = {
    init: function() { return Promise.resolve(); },
    load: function() { return Promise.resolve(); }
  };
})();
