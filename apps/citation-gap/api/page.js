// Thin entry point. The implementation is written to api/page.impl.js by build.js at build
// time from an immutable, hash-verified staging URL (see build.js), so a production deploy
// carries a few small files instead of re-sending every function body inline.
module.exports = require('./page.impl.js');
