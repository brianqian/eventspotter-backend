const router = require('express').Router();
const cache = require('../cache');
const format = require('../utils/format');
const spotifyService = require('../services/spotifyService');
const { setLibraryBasic } = require('../controllers/libraryController');
const { addSongsToUserLibrary } = require('../controllers/userLibraryController');
const authController = require('../controllers/authController');
const { requiresLogin } = require('./middleware/authMiddleware');
const { catchAsyncError } = require('./middleware/errorMiddleware');
const libraryService = require('../services/libraryService');

router.route('/all').get(
  requiresLogin,
  catchAsyncError(async (req, res) => {
    /** ***********
     * This is the route hit by the library page.
     * This route requires login so a valid token, spotifyID, and a valid accessToken can be assumed.
     *
     * /ALL'S RESPONSIBILITIES--
     *
     * - Returns existing user's cache.
     * - Checks for updates to the cache.
     *  -- OR --
     * - Retrieves songs from Spotify if no library exists.
     *
     * -- ALWAYS --
     * - Adds any new songs found to Library
     * - Adds any new songs found to UserLibrary
     * ***********
     */
    console.log('**********ROUTING TO /ALL**********');

    const { spotifyID, accessToken } = res.locals;
    const cachedUser = cache.get(spotifyID);
    let cacheLibrary = cachedUser.library;
    // Return cached library if it exists
    if (cacheLibrary) {
      res.json({ data: cacheLibrary });
    } else {
      // If it's a new user, retrieve library from Spotify
      console.log('Library not found. Retreiving library from Spotify');
      //! currently if new user, total songs are not added to cache or returned to frontend
      const spotifyLibrary = await spotifyService.getSongs(accessToken, 2);
      addSongsToUserLibrary(spotifyID, spotifyLibrary);
      setLibraryBasic(spotifyLibrary);
      cacheLibrary = format.spotifyLibraryToCache(spotifyLibrary);
      cache.setLibrary(spotifyID, cacheLibrary);
      // If new user, update library below can be skipped.
      return res.json({ data: cacheLibrary });
      // }
    }

    console.log('RETURNING TO FRONT WITH', cacheLibrary[0], cacheLibrary.length);

    /** ********************
     * UPDATE USER LIBRARY
     * TODO: If the very first song is deleted, the entire library is rebuilt.
     * Make a workaround that checks for differences.
     * Consider turning this into a middleware function.
     ********************* */

    // Attempt partial update if possible;
    libraryService.updateLibraries(spotifyID, cachedUser);
    //   console.log('CHECKING FOR PARTIAL UPDATE');
    //   const spotifyLibrary = await spotifyService.spotifyFetch(
    //     'https://api.spotify.com/v1/me/tracks?limit=50',
    //     accessToken
    //   );
    //   const lastCachedSong = cacheLibrary[0];
    //   const lastCachedSongIndex = spotifyLibrary.items.findIndex(
    //     item => item.track.id === lastCachedSong.id && item.added_at === lastCachedSong.dateAdded
    //   );
    //   const libraryHasChanged = spotifyLibrary.total !== cachedUser.totalSongs;

    //   // If the last cached song is within the last 50...
    //   if (lastCachedSongIndex > 0 && libraryHasChanged) {
    //     // Append only the new songs instead of rebuilding the library.
    //     console.log('PARTIAL UPDATING USER LIBRARY');
    //     const newSongs = spotifyLibrary.slice(0, lastCachedSongIndex);
    //     addSongsToUserLibrary(spotifyID, newSongs);
    //     setLibraryBasic(newSongs);
    //     cacheLibrary = [...format.spotifyLibraryToCache(newSongs), ...cacheLibrary];
    //   } else if (libraryHasChanged) {
    //     // The last cached song is not found, rebuild full library;
    //     console.log('FULL UPDATING USER LIBRARY');
    //     cacheLibrary = await spotifyService.getSongs(accessToken, 2);
    //     addSongsToUserLibrary(spotifyID, cacheLibrary);
    //     setLibraryBasic(cacheLibrary);
    //     cacheLibrary = format.spotifyLibraryToCache(cacheLibrary);
    //   } else {
    //     return console.log('NO NEW SONGS FOUND, INDEX: ', lastCachedSongIndex);
    //   }
    //   authController.editUserSongTotal(spotifyID, spotifyLibrary.total);
    //   console.log('END OF /ALL******************');
    // })
    cache.setLibrary(spotifyID, cacheLibrary);
    cache.setKey(spotifyID, 'totalSongs', spotifyLibrary.total);
  })
);

router.get('/next_songs', async (req, res) => {
  const { spotifyID, accessToken } = res.locals;
  const { offset } = req.query;
  const nextSongs = format.spotifyLibraryToCache(
    await spotifyService.getSongs(accessToken, 4, offset)
  );
  addSongsToUserLibrary(spotifyID, nextSongs);
  setLibraryBasic(nextSongs);
  const userLibrary = cache.getKey(spotifyID, 'library');
  userLibrary.push(...nextSongs);
  cache.setLibrary(spotifyID, userLibrary);

  res.json({ updatedLibrary: userLibrary });
});

router.get('/top_artists', async (req, res) => {
  const { accessToken } = res.locals;
  const topArtists = await spotifyService.getTopArtists(accessToken);
  console.log('IN BACKEND TOP ARTIST', topArtists.items[0], topArtists.items.length);
  res.json({ data: topArtists.items });
});

module.exports = router;
