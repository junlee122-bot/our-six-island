// The primitives page (app/ui/UiKit.tsx) is dev-only: `?ui-kit` opens it in
// `vinext dev`, and in a Pages build only when built with UI_KIT=1
// (scripts/build-standalone.mjs defines __UI_KIT__; the regression screenshots
// in scripts/ui-shots.mjs do that). Player builds drop the page entirely.
declare const __UI_KIT__: boolean | undefined;

export function uiKitRequested(): boolean {
  const enabled = typeof __UI_KIT__ !== 'undefined' ? __UI_KIT__ : process.env.NODE_ENV === 'development';
  return !!enabled && typeof location !== 'undefined' && new URLSearchParams(location.search).has('ui-kit');
}
