const { setLibrary } = require('../controllers/libraryController');
const { addSongsToUserLibrary } = require('../controllers/userLibraryController');
const { spotifyFetch, getSongs, getSongFeatures } = require('../services/spotifyService');
const authController = require('../controllers/authController');
const { cache } = require('../cache');
const format = require('../utils/format');

const updateDbAndCache = (spotifyID, songs, total, songFeatures) => {
  setLibrary(songs, songFeatures);
  addSongsToUserLibrary(spotifyID, songs);
  authController.editUserSongTotal(spotifyID, total);
  cache.setLibrary(spotifyID, format.spotifyLibraryToCache(songs, songFeatures));
};

const fullUpdate = async (spotifyID, accessToken) => {
  const { library, total } = await getSongs(accessToken, 1);
  const features = await getSongFeatures(accessToken, library);
  updateDbAndCache(spotifyID, library, total, features);
  console.log('FULL UPDATE FINISHED');
};

/** ********************
 * UPDATE USER LIBRARY
 * TODO: If the very first song is deleted, the entire library is rebuilt.
 * Make a workaround that checks for differences.
 ********************* */

const attemptPartialUpdate = async (spotifyID) => {
  console.log('CHECKING FOR PARTIAL UPDATE');
  const cachedUser = cache.get(spotifyID);
  const { accessToken, library: cacheLibrary } = cachedUser;
  const spotifyLibrary = await spotifyFetch(
    'https://api.spotify.com/v1/me/tracks?limit=50',
    accessToken
  );
  const lastCachedSong = cacheLibrary[0];
  const lastCachedSongIndex = spotifyLibrary.items.findIndex(
    (item) => item.track.id === lastCachedSong.id && item.added_at === lastCachedSong.dateAdded
  );
  const libraryHasChanged = spotifyLibrary.total !== cachedUser.totalSongs;

  // If the last cached song is within the last 50...
  if (lastCachedSongIndex > 0 && libraryHasChanged) {
    // Append only the new songs instead of rebuilding the library.
    console.log('PARTIAL UPDATING USER LIBRARY');
    const newSongs = spotifyLibrary.items.slice(0, lastCachedSongIndex);
    const songFeatures = await getSongFeatures(accessToken, newSongs);
    updateDbAndCache(spotifyID, newSongs, spotifyLibrary.total, songFeatures);
  } else if (libraryHasChanged) {
    // The last cached song is not found, rebuild full library;
    console.log('FULL UPDATING USER LIBRARY');
    fullUpdate(spotifyID, accessToken);
  } else {
    return console.log('NO NEW SONGS FOUND, INDEX: ', lastCachedSongIndex);
  }
};

module.exports = {
  updateDbAndCache,
  attemptPartialUpdate,
  fullUpdate,
};
