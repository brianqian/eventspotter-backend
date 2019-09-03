const jwt = require('jsonwebtoken');
const { cache } = require('../../cache');
const { updateAccessToken } = require('../../services/spotifyService');
const authController = require('../../controllers/authController');
const ServerError = require('../../ServerError');
const { catchAsyncError } = require('../middleware/errorMiddleware');

const validateToken = catchAsyncError(async (req, res, next) => {
  // console.log('🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 ');
  const encodedToken = req.headers && req.headers['x-token'];
  // console.log('ENCODED TOKEN: ', encodedToken);
  if (!encodedToken) return next();
  try {
    const { userInfo = null } = await jwt.verify(encodedToken, process.env.JWT_SECRET_KEY);
    if (!userInfo) throw new ServerError('validateToken', 401, `JWT Verify failed.`);
    console.log('Cookie Validated:', userInfo.spotifyID);
    res.locals.spotifyID = userInfo.spotifyID;
    next();
  } catch (err) {
    console.error('validateToken error-- ', err.message);
    throw err;
  }
});

const requiresLogin = (req, res, next) => {
  // console.log('✋************************✋');
  // console.log('requiresLogin MIDDLEWARE HIT ');
  // console.log('✋*************************✋');
  const { spotifyID = null, accessToken = null } = res.locals;
  // console.log('MIDDLEWARE - RES.LOCALS:', res.locals);
  if (!spotifyID || !accessToken) {
    console.log('🚫 🚫 🚫 ACCESS DENIED 🚫 🚫 🚫');
    next(new ServerError(`requiresLogin -> ${req.path}`, 401, 'Not Authorized'));
  } else {
    next();
  }
};

const updateSpotifyToken = catchAsyncError(async (req, res, next) => {
  console.log('♻~~~~~~~~~~~~~~~~~~~~~~~~~~♻');
  // console.log('PATH:', req.path);
  // console.log('UPDATING SPOTIFY TOKEN START');
  const { spotifyID = null } = res.locals;
  if (!spotifyID) return next();
  const cachedUser = cache.get(spotifyID);
  const tokenExpired = Date.now() > cachedUser.accessTokenExpiration;
  console.log(`TOKEN EXPIRED: ${tokenExpired}, ${Date.now()}`, cachedUser.accessTokenExpiration);

  if (tokenExpired) {
    const newTokens = await updateAccessToken(cachedUser.refreshToken);
    const { accessToken, accessTokenExpiration } = newTokens;
    const updatedUser = cache.set(spotifyID, {
      ...cachedUser,
      accessToken,
      accessTokenExpiration,
    });
    res.locals.accessToken = accessToken;
    authController.editUserInfo(updatedUser);
  } else {
    res.locals.accessToken = cachedUser.accessToken;
  }
  // console.log('UPDATING SPOTIFY TOKEN END');
  console.log('♻~~~~~~~~~~~~~~~~~~~~~~~~♻`');
  return next();
});

module.exports = {
  validateToken,
  updateSpotifyToken,
  requiresLogin,
};
