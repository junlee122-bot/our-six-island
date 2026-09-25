//! 범타듀 밸리 desktop shell.
//!
//! The game itself is the static web build in `desktop/dist` (see
//! `npm run build:desktop`). This crate only adds what a browser tab cannot:
//! a real window, one running copy, OS notifications, self-updates, invite
//! deep links (`beomtadew://lounge/<code>`) and a few keyboard/link fixes
//! injected by `desktop-init.js`.

use tauri::webview::DownloadEvent;
use tauri::{Manager, WebviewWindowBuilder};

#[cfg(desktop)]
use tauri_plugin_deep_link::DeepLinkExt;

/// Invite links: `beomtadew://lounge/<code>` (also `beomtadew://lounge=<code>`).
/// The page parses and validates the code (app/desktop-bridge.ts deepLinkCode).
#[cfg_attr(not(desktop), allow(dead_code))]
fn is_invite_link(url: &str) -> bool {
    url.to_ascii_lowercase().starts_with("beomtadew://lounge")
}

/// Hands invite links to the running game as a `beomtadew:deep-link` window
/// event (app/desktop-bridge.ts onDesktopDeepLink) and brings the window up.
/// The link is also left in `__BEOMTADEW_LAUNCH_LINK__`, so a link that
/// arrives on the login screen is used right after logging in.
#[cfg(desktop)]
fn forward_deep_links(app: &tauri::AppHandle, urls: &[String]) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    for url in urls.iter().filter(|u| is_invite_link(u)) {
        if let Ok(detail) = serde_json::to_string(url) {
            let _ = window.eval(&format!(
                "window.__BEOMTADEW_LAUNCH_LINK__ = {detail}; \
                 window.dispatchEvent(new CustomEvent('beomtadew:deep-link', {{ detail: {detail} }}))"
            ));
        }
    }
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}

/// Runs in the page before the game's own scripts (main frame only):
/// F11 fullscreen toggle and "external links open in the default browser".
const INIT_SCRIPT: &str = include_str!("desktop-init.js");

pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        // Must be registered first: a second launch (double-click on the icon,
        // or an invite deep link) focuses the running window instead. With the
        // "deep-link" feature the link itself reaches on_open_url below.
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
        builder = builder
            .plugin(tauri_plugin_deep_link::init())
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
            // An invite link that launched the app: the page reads it at start
            // (like a web invite's #lounge= hash, see app/lounge-game.tsx).
            #[allow(unused_mut)]
            let mut launch_link = String::new();
            #[cfg(desktop)]
            {
                // Installers register the scheme; dev runs on Windows/Linux need this.
                #[cfg(all(debug_assertions, any(windows, target_os = "linux")))]
                let _ = app.deep_link().register_all();
                if let Ok(Some(urls)) = app.deep_link().get_current() {
                    if let Some(url) = urls.iter().map(|u| u.to_string()).find(|u| is_invite_link(u)) {
                        launch_link = url;
                    }
                }
                let handle = app.handle().clone();
                app.deep_link().on_open_url(move |event| {
                    let urls: Vec<String> = event.urls().iter().map(|u| u.to_string()).collect();
                    forward_deep_links(&handle, &urls);
                });
            }
            let launch_script = format!(
                "window.__BEOMTADEW_LAUNCH_LINK__ = {};",
                serde_json::to_string(&launch_link).unwrap_or_else(|_| "\"\"".into())
            );
            WebviewWindowBuilder::from_config(app.handle(), &config)?
                .initialization_script(INIT_SCRIPT)
                .initialization_script(&launch_script)
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
