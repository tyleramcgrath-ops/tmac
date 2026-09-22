// Thin entry point. The implementation lives in lib/page.impl.js, a committed file whose hash
// build.js verifies before anything ships (see build.js and ship-manifest.json).
//
// It lives outside api/ because Vercel turns every .js under api/ into a serverless function,
// and the Hobby plan allows twelve. An implementation module is not an endpoint and should not
// spend one of those slots.
module.exports = require('../lib/page.impl.js');
