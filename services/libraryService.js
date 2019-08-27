const { setLibraryBasic } = require('../controllers/libraryController');
const { addSongsToUserLibrary } = require('../controllers/userLibraryController');
const { spotifyFetch, getSongs } = require('../services/spotifyService');
const authController = require('../controllers/authController');

const addSongsToUserAndLibrary = (spotifyID, songArray) => {
  setLibraryBasic(songArray);
  addSongsToUserLibrary(spotifyID, songArray);
};

const updateLibraries = async (spotifyID, cachedUser) => {
  console.log('CHECKING FOR PARTIAL UPDATE');
  const { accessToken, library } = cachedUser;
  const spotifyLibrary = await spotifyFetch(
    'https://api.spotify.com/v1/me/tracks?limit=50',
    accessToken
  );
  authController.editUserSongTotal(spotifyID, spotifyLibrary.total);
  const lastCachedSong = library[0];
  const lastCachedSongIndex = spotifyLibrary.items.findIndex(
    item => item.track.id === lastCachedSong.id && item.added_at === lastCachedSong.dateAdded
  );
  const libraryHasChanged = spotifyLibrary.total !== cachedUser.totalSongs;

  // If the last cached song is within the last 50...
  if (lastCachedSongIndex > 0 && libraryHasChanged) {
    // Append only the new songs instead of rebuilding the library.
    console.log('PARTIAL UPDATING USER LIBRARY');
    const newSongs = spotifyLibrary.slice(0, lastCachedSongIndex);
    addSongsToUserAndLibrary(spotifyID, newSongs);
  } else if (libraryHasChanged) {
    // The last cached song is not found, rebuild full library;
    console.log('FULL UPDATING USER LIBRARY');
    addSongsToUserAndLibrary(spotifyID, await getSongs(accessToken, 2));
  } else {
    return console.log('NO NEW SONGS FOUND, INDEX: ', lastCachedSongIndex);
  }
  console.log('END OF /ALL******************');
};

module.exports = {
  addSongsToUserAndLibrary,
  updateLibraries,
};
