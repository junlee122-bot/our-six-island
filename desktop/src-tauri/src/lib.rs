//! 범타듀 밸리 desktop shell.
//!
//! The game itself is the static web build in `desktop/dist` (see
//! `npm run build:desktop`). This crate only adds what a browser tab cannot:
//! a real window, one running copy, OS notifications, self-updates and a few
//! keyboard/link fixes injected by `desktop-init.js`.

use tauri::webview::DownloadEvent;
use tauri::{Manager, WebviewWindowBuilder};

/// Runs in the page before the game's own scripts (main frame only):
/// F11 fullscreen toggle and "external links open in the default browser".
const INIT_SCRIPT: &str = include_str!("desktop-init.js");

pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        // Must be registered first: a second launch (double-click on the icon,
        // or later an invite deep link) focuses the running window instead.
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_process::init());
    }

    builder
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // The window is declared in tauri.conf.json with `"create": false`
            // so it can be built here with the init script and download handler.
            let config = app
                .config()
                .app
                .windows
                .iter()
                .find(|w| w.label == "main")
                .cloned()
                .expect("tauri.conf.json must declare the \"main\" window");
            WebviewWindowBuilder::from_config(app.handle(), &config)?
                .initialization_script(INIT_SCRIPT)
                .on_download(|webview, event| {
                    // Recovery-code .txt and wardrobe/theater PNGs use
                    // <a download>; save them to the user's Downloads folder.
                    if let DownloadEvent::Requested { destination, .. } = event {
                        if let Ok(dir) = webview.path().download_dir() {
                            let name = destination
                                .file_name()
                                .map(|n| n.to_owned())
                                .unwrap_or_else(|| "beomtadew-download".into());
                            *destination = dir.join(name);
                        }
                    }
                    true
                })
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("범타듀 밸리를 시작하지 못했어요");
}
