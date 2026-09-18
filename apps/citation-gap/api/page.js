// Thin entry point. The implementation lives in api/page.impl.js, a committed file whose hash
// build.js verifies before anything ships (see build.js and ship-manifest.json).
module.exports = require('./page.impl.js');
