const router = require('express').Router();
const cache = require('../cache');
const format = require('../utils/format');
const spotifyService = require('../services/spotifyService');
const libraryController = require('../controllers/libraryController');
const { getUserLibrary, addSongsToUserLibrary } = require('../controllers/userLibraryController');
const authController = require('../controllers/authController');
const { requiresLogin } = require('./middleware/authMiddleware');
const { catchAsyncError } = require('./middleware/errorMiddleware');

// require('dotenv').config();

router.route('/all').get(
  requiresLogin,
  catchAsyncError(async (req, res) => {
    /** ***********
     * This is the route hit by the library page. First middleware will trigger and update the cache.
     *
     *
     * /ALL'S RESPONSIBILITIES--
     * PREVIOUS USER:
     * - Check for existing songs in cache.
     * - Compare current library with spotify library and update if necessary
     *
     * EXISTING USER:
     * - Retrieve songs from Spotify, update database, and enter into cache
     * - Return existing songs in cache or library.
     * ***********
     */
    console.log(`**********ROUTING TO /ALL**********`);

    const { spotifyID, accessToken } = res.locals;
    const cachedUser = cache.get(spotifyID);
    let cacheLibrary = cachedUser.library;
    //Return cached library if it exists
    if (cacheLibrary) res.json({ data: cacheLibrary });
    // If it's a new user, retrieve database from library
    if (!cacheLibrary) {
      /*****
       *
       * Below section should be handled by cache middleware
       */

      // console.log('Library not in cache. Checking database for existing user.');
      // //If cached library doesn't exist, check database (ie. returning user not in cache)
      // const dbLibrary = format.dbLibraryToCache(await getUserLibrary(spotifyID));
      // //Return database to user if it exists;
      // if (dbLibrary.length) res.json({data: dbLibrary});
      // if (!dbLibrary.length) {
      // If new user, retrieve full library from Spotify

      console.log('Library not found. Retreiving library from Spotify');
      //! currently if new user, total songs are not added to cache or return to frontend
      const spotifyLibrary = await spotifyService.getSongs(accessToken, 2);
      addSongsToUserLibrary(spotifyID, spotifyLibrary);
      cacheLibrary = format.spotifyLibraryToCache(spotifyLibrary);
      cache.setLibrary(spotifyID, cacheLibrary);
      //If new user, update library can be skipped.
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
    console.log('CHECKING FOR PARTIAL UPDATE');
    const spotifyLibrary = await spotifyService.spotifyFetch(
      `https://api.spotify.com/v1/me/tracks?limit=50`,
      accessToken
    );
    const lastCachedSong = cacheLibrary[0];
    const lastCachedSongIndex = spotifyLibrary.items.findIndex(
      item => item.track.id === lastCachedSong.id && item.added_at === lastCachedSong.dateAdded
    );

    console.log('LAST CACHED SONG INDEX:', lastCachedSongIndex);

    if (lastCachedSongIndex === 0 && spotifyLibrary.total === cachedUser.totalSongs)
      return console.log('NO NEW SONGS FOUND, INDEX: ', lastCachedSongIndex);
    // If the last cached song is within the last 50...
    if (lastCachedSongIndex > 0) {
      // Append only the new songs instead of rebuilding the library.
      console.log('PARTIAL UPDATING USER LIBRARY');
      const newSongs = [];
      for (let i = 0; i < lastCachedSongIndex; i++) {
        newSongs.push(spotifyLibrary.items[i]);
      }
      addSongsToUserLibrary(spotifyID, newSongs);
      libraryController.setLibraryBasic(newSongs);
      cacheLibrary = [...format.spotifyLibraryToCache(newSongs), ...cacheLibrary];
    } else {
      //The last cached song is not found, assume many songs were added
      console.log('FULL UPDATING USER LIBRARY');
      cacheLibrary = await spotifyService.getSongs(accessToken, 2);
      addSongsToUserLibrary(spotifyID, cacheLibrary);
      libraryController.setLibraryBasic(cacheLibrary);
      cacheLibrary = format.spotifyLibraryToCache(cacheLibrary);
    }

    cache.setLibrary(spotifyID, cacheLibrary);
    cache.setKey(spotifyID, 'totalSongs', spotifyLibrary.total);
    authController.editUserSongTotal(spotifyID, spotifyLibrary.total);
    console.log('END OF /ALL******************');
  })
);

router.get('/next_songs', async (req, res) => {
  const { spotifyID, accessToken } = res.locals;
  const { offset } = req.query;
  const nextSongs = format.spotifyLibraryToCache(
    await spotifyService.getSongs(accessToken, 4, offset)
  );
  addSongsToUserLibrary(spotifyID, nextSongs);
  libraryController.setLibraryBasic(nextSongs);
  const userLibrary = cache.getKey(spotifyID, 'library');
  userLibrary.push(...nextSongs);
  cache.setLibrary(spotifyID, userLibrary);

  res.json({ updatedLibrary: userLibrary });

  // res.json({nextSongs})
});

router.get('/top_artists', async (req, res) => {
  const { accessToken } = res.locals;
  const topArtists = await spotifyService.getTopArtists(accessToken);
  console.log('IN BACKEND TOP ARTIST', topArtists.items[0], topArtists.items.length);
  res.json({ data: topArtists.items });
});

module.exports = router;
