// The front door added in the SaaS redesign: a marketing homepage (#homeScreen, z-index 150)
// covers everything until a launch control is clicked, and a workspace splash (#splash) sits
// behind it until an identity is stored. Both of the browser flows have to walk through that
// door before they can touch the scanner, so the walk lives here once.
//
// Real path by default: click the nav's "Launch the tool", then sign in through the splash
// form, and assert both layers are actually gone. A flow that only wants to get past it can
// pass { real: false } to seed localStorage and skip the clicks.
const IDENTITY = 'test@citationgap.local';

async function enterApp(pg, opts) {
  const real = !opts || opts.real !== false;
  if (real) {
    await pg.waitForSelector('#homeScreen:not([hidden])');
    await pg.click('.mkt-nav .mkt-btn.primary');
    await pg.waitForSelector('#homeScreen[hidden]', { state: 'attached' });
    if (await pg.$('#splash:not([hidden])')) {
      await pg.fill('#splashEmail', IDENTITY);
      await pg.fill('#splashPass', 'not-checked-by-anything');
      await pg.click('.splash-enter');
    }
  } else {
    await pg.evaluate((id) => {
      try { localStorage.setItem('cg.identity', id); } catch (e) {}
      var h = document.querySelector('#homeScreen'); if (h) h.hidden = true;
      var s = document.querySelector('#splash'); if (s) s.hidden = true;
    }, IDENTITY);
  }
  await pg.waitForSelector('#splash[hidden]', { state: 'attached' });
  const state = await pg.evaluate(() => ({
    home: !!(document.querySelector('#homeScreen') || {}).hidden,
    splash: !!(document.querySelector('#splash') || {}).hidden,
    // the scan controls must be reachable, not just present: a layer still painted over them
    // is the bug this helper exists to catch.
    reachable: (function () {
      var b = document.querySelector('#btnRun'); if (!b) return false;
      b.scrollIntoView({ block: 'center' });
      var r = b.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!top && (top === b || b.contains(top));
    })()
  }));
  if (!state.home || !state.splash || !state.reachable) {
    throw new Error('enterApp: front door did not open — ' + JSON.stringify(state));
  }
  return state;
}

module.exports = { enterApp, IDENTITY };
