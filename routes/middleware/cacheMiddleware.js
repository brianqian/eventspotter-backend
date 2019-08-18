const authController = require('../../controllers/authController');
const cache = require('../../../cache');
const format = require('../../../utils/format');
const { catchAsyncError } = require('./errorMiddleware');

const cacheMiddleware = catchAsyncError(async (req, res, next) => {
  /** ****************************************************
   * MIDDLEWARE RESPONSIBILITIES
   * - Bring update user recency in cache.
   * - If user not in cache, bring into cache from database
   *  -Get user info from authController
   *
   * **************************************************
   */

  console.log('************MAIN MIDDLEWARE HIT');

  /** *********************************************
   * UPDATE CACHE FROM DATABASE IF USER NOT IN CACHE
   ************************************************ */

  const { spotifyID = null } = res.locals;
  if (!spotifyID) return next();
  // IF VALID JWT, CHECK FOR USER IN CACHE
  let cachedUser = cache.get(spotifyID);
  if (!cachedUser) {
    // IF USER IS NOT IN CACHE, RETRIEVE USER FROM DB AND UPDATE CACHE
    const userFromDatabase = await authController.getUserByID(spotifyID);
    cachedUser = cache.set(spotifyID, format.dbProfileToCache(userFromDatabase));
  }
  return next();
});

module.exports = cacheMiddleware;
