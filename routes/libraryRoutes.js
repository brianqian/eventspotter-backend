const router = require('express').Router();
const cache = require('../../cache');
const format = require('../../utils/format');
const spotifyService = require('../services/spotifyService');
const libraryController = require('../controllers/libraryController');
const userLibraryController = require('../controllers/userLibraryController');
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
     * DATA FLOW--
     * GET: Spotify (if new user) > Database > Cache > End User;
     * Database will only receive information from spotify
     * Cache will only receive information from database
     * Front end will only receive information from cache
     *
     * ALL'S RESPONSIBILITIES--
     * PREVIOUS USER:
     * - Check for existing songs in cache or database.
     * - Compare current library with spotify library and update if necessary
     *
     * EXISTING USER:
     * - Retrieve songs from Spotify, update database, and enter into cache
     *
     * - Return existing songs in cache or library.
     * ***********
     */
    console.log(`**********ROUTING TO /ALL**********`);
    /** ***************************************************
     * ATTAIN USER CREDENTIALS FOR FETCHING FROM SPOTIFY
     * ***************************************************
     */

    const { spotifyID, accessToken } = res.locals;
    const cachedUser = cache.get(spotifyID);
    let userLibrary = cachedUser.library;
    // IF USER EXISTS IN DATABASE AND DONT NEED TO UPDATE, RETURN CACHE
    // IF LIBRARY DOESNT EXIST, CHECK DATABASE
    if (!userLibrary) {
      console.log('LIBRARY IN CACHE NOT FOUND, CHECKING DATABASE');
      userLibrary = await userLibraryController.getUserLibrary(spotifyID);
      if (!userLibrary.length) {
        console.log('LIBRARY IN DATABASE NOT FOUND, CHECKING SPOTIFY');
        const spotifyLibrary = await spotifyService.getSongs(accessToken, 2);
        userLibraryController.setUserLibrary(spotifyID, spotifyLibrary);
        const cacheLibrary = format.spotifyLibraryToCache(spotifyLibrary);
        cache.setLibrary(spotifyID, cacheLibrary);
        return res.json({ data: cacheLibrary });
      }
      cache.setLibrary(spotifyID, userLibrary);
    } else {
      console.log('LIBRARY FOUND IN CACHE:');
    }
    console.log('RETURNING TO FRONT WITH', userLibrary[0], userLibrary.length);
    res.json({ data: userLibrary });

    /** ********************
     * UPDATE USER LIBRARY
     * TODO: If the very first song is deleted, the entire library is rebuilt.
     * Make a workaround that checks for differences.
     * Possible turn this into a middleware function.
     ********************* */
    // Attempt partial update if possible;
    console.log('CHECKING FOR PARTIAL UPDATE');
    const spotifyLibrary = await spotifyService.spotifyFetch(
      `https://api.spotify.com/v1/me/tracks?limit=50`,
      accessToken
    );

    authController.editUserSongTotal(spotifyID, spotifyLibrary.total);
    userLibrary = cache.getKey(spotifyID, 'library');
    console.log(
      `USER LIBRARY length: ${userLibrary && userLibrary.length}`,
      `firstItem: ${userLibrary && userLibrary[0]}`
    );
    const lastCachedSong = userLibrary[0];
    const lastCachedSongIndex = spotifyLibrary.items.findIndex(
      item => item.track.id === lastCachedSong.id && item.added_at === lastCachedSong.dateAdded
    );

    console.log('LAST CACHED SONG INDEX:', lastCachedSongIndex);
    if (lastCachedSongIndex === 0 && spotifyLibrary.total === cachedUser.totalSongs)
      return console.log('NO NEW SONGS FOUND, INDEX: ', lastCachedSongIndex);
    if (lastCachedSongIndex > 0) {
      console.log('PARTIAL UPDATING USER LIBRARY');
      const newSongs = [];
      for (let i = 0; i < lastCachedSongIndex; i += 1) {
        newSongs.push(spotifyLibrary.items[i]);
      }
      userLibraryController.setUserLibrary(spotifyID, newSongs);
      libraryController.setLibraryBasic(newSongs);
      userLibrary = [...format.spotifyLibraryToCache(newSongs), ...userLibrary];
    } else {
      console.log('FULL UPDATING USER LIBRARY');
      userLibrary = await spotifyService.getSongs(accessToken, 2);
      userLibraryController.setUserLibrary(spotifyID, userLibrary);
      userLibrary = format.spotifyLibraryToCache(userLibrary);
    }
    cache.setLibrary(spotifyID, userLibrary);
    cache.setKey(spotifyID, 'totalSongs', spotifyLibrary.total);
    console.log('END OF /ALL******************');
  })
);

router.get('/next_songs', async (req, res) => {
  const { spotifyID, accessToken } = res.locals;
  const { offset } = req.query;
  const nextSongs = format.spotifyLibraryToCache(
    await spotifyService.getSongs(accessToken, 4, offset)
  );
  userLibraryController.setUserLibrary(spotifyID, nextSongs);
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
