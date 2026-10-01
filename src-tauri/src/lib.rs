use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

/// 写备份文件（导入导出用）。
/// 路径由系统「另存为」对话框给出，因此不需要申请额外的文件系统权限。
#[tauri::command]
fn write_backup_file(path: String, contents: String) -> Result<String, String> {
  std::fs::write(&path, contents).map_err(|e| format!("写入失败：{e}"))?;
  Ok(path)
}

#[tauri::command]
fn read_backup_file(path: String) -> Result<String, String> {
  std::fs::read_to_string(&path).map_err(|e| format!("读取失败：{e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // 本地 SQLite 数据库：所有任务与番茄钟记录都落在这个文件里，
  // 通过版本化迁移保证后续结构升级安全。
  //
  // 数据库位置沿用 Windows 标准约定（%APPDATA%\<identifier>\taskease.db）：
  // 这里刻意使用相对路径，由 Tauri 按系统规范解析，不自行改写数据目录。
  let migrations = vec![Migration {
    version: 1,
    description: "create_initial_tables",
    sql: include_str!("../migrations/001_init.sql"),
    kind: MigrationKind::Up,
  }];

  tauri::Builder::default()
    // 单实例锁必须第一个注册：重复启动时不再开新窗口，
    // 而是把已有窗口唤到前台（避免两个窗口同时写同一个数据库）
    .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
      }
    }))
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:taskease.db", migrations)
        .build(),
    )
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![write_backup_file, read_backup_file])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
