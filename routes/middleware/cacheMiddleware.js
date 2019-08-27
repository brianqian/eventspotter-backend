const authController = require('../../controllers/authController');
const cache = require('../../cache');
const format = require('../../utils/format');
const { catchAsyncError } = require('./errorMiddleware');
const { getUserLibrary } = require('../../controllers/userLibraryController');

const cacheMiddleware = catchAsyncError(async (req, res, next) => {
  /** ****************************************************
   *  RESPONSIBILITIES
   * - Bring update user recency in cache.
   * - If user not in cache, set user in cache from database
   * **************************************************
   */

  console.log('Updating user in cache...');

  const { spotifyID = null } = res.locals;
  if (!spotifyID) return next();
  // IF VALID JWT, CHECK FOR USER IN CACHE
  let cachedUser = cache.get(spotifyID);
  if (!cachedUser) {
    // IF USER IS NOT IN CACHE, RETRIEVE USER FROM DB AND UPDATE CACHE
    const userFromDatabase = await authController.getUserByID(spotifyID);
    cachedUser = cache.set(spotifyID, format.dbProfileToCache(userFromDatabase));
  }
  const userLibrary = await getUserLibrary(spotifyID);
  if (userLibrary.length) cache.setLibrary(spotifyID, format.dbLibraryToCache(userLibrary));
  return next();
});

module.exports = cacheMiddleware;
