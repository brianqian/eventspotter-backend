const { verifyJWT } = require('../../utils/format');
const jwt = require('jsonwebtoken');
const cache = require('../../cache');
const { updateAccessToken } = require('../../services/spotifyService');
const authController = require('../../controllers/authController');
const ServerError = require('../../ServerError');
const { catchAsyncError } = require('../middleware/errorMiddleware');

const validateCookie = catchAsyncError(async (req, res, next) => {
  console.log('🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 ');
  console.log('PATH:', req.path);
  console.log('HEADERS', req.headers);
  console.log('req.headers.cookie', req.headers.cookie);
  const encodedToken = req.headers && req.headers['x-token'];
  if (!encodedToken) return next();
  const decodedToken = await jwt.verify(encodedToken, process.env.JWT_SECRET_KEY);
  if (!decodedToken) return next();
  console.log('IN VALIDATE COOKIE. decoded token:', decodedToken);
  res.locals.spotifyID = decodedToken.spotifyID;
  console.log('SPOTIFYID ', res.locals.spotifyID);
  next();
});

const requiresLogin = (req, res, next) => {
  console.log('✋************************✋');
  console.log('requiresLogin MIDDLEWARE HIT ');
  console.log('✋*************************✋');

  const { spotifyID = null, accessToken = null } = res.locals;
  console.log('MIDDLEWARE - RES.LOCALS:', res.locals);
  if (!spotifyID || !accessToken) {
    console.log('🚫 🚫 🚫 ACCESS DENIED -- REROUTING 🚫 🚫 🚫');
    next(new ServerError(req.path, 401, `Not Authorized`));
  } else {
    next();
  }
};

const updateSpotifyToken = catchAsyncError(async (req, res, next) => {
  console.log('♻~~~~~~~~~~~~~~~~~~~~~~~~~~♻');
  console.log('PATH:', req.path);
  console.log('UPDATING SPOTIFY TOKEN START');
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
      accessTokenExpiration
    });
    res.locals.accessToken = accessToken;
    authController.editUserInfo(updatedUser);
  } else {
    res.locals.accessToken = cachedUser.accessToken;
  }
  console.log('UPDATING SPOTIFY TOKEN END');
  console.log('♻~~~~~~~~~~~~~~~~~~~~~~~~♻`');
  return next();
});

module.exports = {
  validateCookie,
  updateSpotifyToken,
  requiresLogin
};
