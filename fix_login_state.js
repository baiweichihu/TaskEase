// TaskEase 登录状态修复脚本
// 用于强制清除残留的登录状态

function fixLoginState() {
  console.log('开始修复登录状态...');
  
  // 清除所有相关的本地存储
  const keysToRemove = [
    'sb-ccfmbcvlmlvirkattqnv-auth-token',
    'sb-ccfmbcvlmlvirkattqnv-auth-refresh-token',
    'taskease_todos_guest',
    'taskease_theme_mode',
    'taskease_lang',
    'taskease_clock_format'
  ];
  
  // 添加所有可能的用户相关键
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('taskease_todos_') || key.startsWith('taskease_pending_username_'))) {
      keysToRemove.push(key);
    }
  }
  
  // 清除所有键
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`已清除: ${key}`);
    } catch (error) {
      console.log(`清除失败: ${key}`, error);
    }
  });
  
  // 清除sessionStorage
  sessionStorage.clear();
  
  console.log('登录状态修复完成！请刷新页面。');
  alert('登录状态已修复，请刷新页面重新加载应用。');
}

// 执行修复
fixLoginState();