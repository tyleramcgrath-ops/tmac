// index.html is no longer the only file the page needs: it loads /score.js as a classic external
// script, and a test server that answers that request with the HTML page (or a 404) leaves the
// browser with none of the scoring globals and an app that silently does nothing. Every flow that
// stands up a server routes static requests through here, so adding the next shipped static file
// is one edit rather than three.
const fs = require('fs'), path = require('path');
const STATIC = { '/score.js': ['score.js', 'text/javascript'] };

// Returns true when it answered the request; the caller carries on otherwise.
function serveStatic(pathname, res, root) {
  const hit = STATIC[pathname];
  if (!hit) return false;
  res.setHeader('content-type', hit[1]);
  res.end(fs.readFileSync(path.join(root, hit[0])));
  return true;
}

// The front door added in the SaaS redesign: a marketing homepage (#homeScreen) covers everything
// until a launch control is clicked. Behind it is an optional workspace panel (#splash) that must
// NOT block the way in — clicking "Run a scan" is a promise to show the scan form, so anything
// standing between the click and #btnRun is a bug, and this helper is where it gets caught.
const IDENTITY = 'test@citationgap.local';

async function enterApp(pg, opts) {
  const real = !opts || opts.real !== false;
  if (real) {
    await pg.waitForSelector('#homeScreen:not([hidden])');
    await pg.click('.mkt-nav .mkt-btn.primary');
    await pg.waitForSelector('#homeScreen[hidden]', { state: 'attached' });
  } else {
    await pg.evaluate(() => {
      var h = document.querySelector('#homeScreen'); if (h) h.hidden = true;
      var s = document.querySelector('#splash'); if (s) s.hidden = true;
    });
  }
  const state = await pg.evaluate(() => ({
    home: !!(document.querySelector('#homeScreen') || {}).hidden,
    // the workspace panel must still be down: a free scan does not ask who you are first
    splash: !!(document.querySelector('#splash') || {}).hidden,
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
    throw new Error('enterApp: front door did not open cleanly — ' + JSON.stringify(state));
  }
  return state;
}

// The workspace panel is opt-in: Sign in opens it, and it can always be dismissed without
// naming yourself. Exercised once by demo-flow so the opt-in path cannot rot unnoticed.
async function workspacePanel(pg) {
  // Sign in is also a launch control, so each click drops the homepage behind it; the panel has to
  // be re-opened from a re-shown front door rather than from a hidden one.
  const openPanel = async () => {
    await pg.evaluate(() => { var h = document.querySelector('#homeScreen'); if (h) h.hidden = false; });
    await pg.waitForSelector('.mkt-signin', { state: 'visible' });
    await pg.click('.mkt-signin');
    await pg.waitForSelector('#splash:not([hidden])');
  };
  await openPanel();
  const hasPassword = await pg.$('#splashPass');
  await pg.click('#splashSkip');
  await pg.waitForSelector('#splash[hidden]', { state: 'attached' });
  const skipped = await pg.evaluate(() => {
    try { return !localStorage.getItem('cg.identity'); } catch (e) { return true; }
  });
  await openPanel();
  await pg.fill('#splashEmail', IDENTITY);
  await pg.click('.splash-enter');
  await pg.waitForSelector('#splash[hidden]', { state: 'attached' });
  const named = await pg.evaluate(() => ({
    stored: (function () { try { return localStorage.getItem('cg.identity'); } catch (e) { return null; } })(),
    sidebar: (document.querySelector('#sideUserEmail') || {}).textContent
  }));
  return { askedForPassword: !!hasPassword, skipLeavesNoIdentity: skipped, named };
}

module.exports = { enterApp, workspacePanel, serveStatic, IDENTITY };
