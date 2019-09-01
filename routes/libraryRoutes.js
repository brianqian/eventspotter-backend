const router = require('express').Router();
// const sizeof = require('object-sizeof');
const cache = require('../cache');
const spotifyService = require('../services/spotifyService');

// const format = require('../utils/format');
// const { setLibraryBasic } = require('../controllers/libraryController');
// const { addSongsToUserLibrary } = require('../controllers/userLibraryController');
// const authController = require('../controllers/authController');
const libraryController = require('../controllers/libraryController');
const userLibraryController = require('../controllers/userLibraryController');

const { requiresLogin } = require('./middleware/authMiddleware');
const { catchAsyncError } = require('./middleware/errorMiddleware');
const libraryService = require('../services/libraryService');

router.route('/all').get(
  requiresLogin,
  catchAsyncError(async (req, res) => {
    /** ***********
     * This is the route hit by the library page.
     * This route requires login so a valid token, spotifyID, and a valid accessToken can be assumed
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
    const cacheLibrary = cachedUser.library;
    // Return cached library if it exists
    if (cacheLibrary) {
      res.json({ data: cacheLibrary });
    } else {
      // If it's a new user, retrieve library from Spotify
      console.log('Library not found. Retreiving library from Spotify');
      await libraryService.fullUpdate(spotifyID, accessToken);
      const { library } = cache.get(spotifyID);
      return res.json({ data: library });
      // }
    }
    console.log('RETURNING TO FRONT WITH', cacheLibrary[0], cacheLibrary.length);
    libraryService.attemptPartialUpdate(spotifyID, cachedUser);
    console.log('END OF /ALL******************');
  })
);

// router.get('/next_songs', async (req, res) => {
//   const { spotifyID, accessToken } = res.locals;
//   const { offset } = req.query;
//   const nextSongs = format.spotifyLibraryToCache(
//     await spotifyService.getSongs(accessToken, 4, offset) //! rewrite: see getSongs
//   );
//   addSongsToUserLibrary(spotifyID, nextSongs);
//   setLibrary(nextSongs);
//   const userLibrary = cache.getKey(spotifyID, 'library');
//   userLibrary.push(...nextSongs);
//   cache.setLibrary(spotifyID, userLibrary);

//   res.json({ updatedLibrary: userLibrary });
// });

router.get('/artists', async (req, res) => {
  const { accessToken } = res.locals;
  const topArtists = await spotifyService.getTopArtists(accessToken);
  console.log('IN BACKEND TOP ARTIST', topArtists.items[0], topArtists.items.length);
  res.json({ data: topArtists.items });
});

router.get('/top/:filterBy', async (req, res) => {
  const { accessToken, spotifyID } = res.locals;
  const { filterBy } = req.params;
  let data;
  const whitelist = [
    'acousticness',
    'danceability',
    'energy',
    'instrumentalness',
    'loudness',
    'tempo',
    'valence',
    'speechiness',
    'liveness',
  ];
  if (filterBy === 'artists') {
    const topArtists = await spotifyService.getTopArtists(accessToken);
    data = topArtists.items;
  } else if (whitelist.includes(filterBy)) {
    data = await userLibraryController.getUserLibraryByAnalytic(spotifyID, filterBy);
    console.log(data.length, data[0]);
  } else {
    return res.json({ data: [] });
  }
  console.log('IN BACKEND TOP ARTIST', data[0], data.length);
  res.json({ data });
});

// router.get(
//   '/test',
//   catchAsyncError(async (req, res) => {
//     const user = cache.get('122716131');
//     console.log(sizeof(user.library));
//   })
// );

module.exports = router;
