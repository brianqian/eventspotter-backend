const connection = require('../db');
const format = require('../../utils/format');
const ServerError = require('../ServerError');

module.exports = {
  getUserLibrary: spotifyID => {
    return new Promise((resolve, reject) => {
      connection.query(
        'SELECT * FROM library JOIN UserLibrary ON library.song_id = UserLibrary.song_id WHERE library.song_id IN (SELECT song_id FROM UserLibrary WHERE user_id = ?) ORDER BY date_added DESC;',
        [spotifyID],
        (err, data) => {
          console.log('🛑🛑🛑🛑', err);
          if (err) reject(new ServerError('UserLibrary - getUserLibrary failed'));
          data.forEach(item => {
            delete item.user_id;
          });

          console.log('in lib controller, getuserlib', data[0], data.length);
          resolve(format.dbLibraryToCache(data));
        }
      );
    });
  },
  setUserLibrary: (spotifyID, spotifyLib) => {
    const insertArray = spotifyLib.map(song => [spotifyID, song.track.id, song.added_at]);
    connection.query(
      'INSERT IGNORE INTO UserLibrary (user_id, song_id, date_added) VALUES ?',
      [insertArray],
      err => {
        if (err) throw new ServerError('UserLibrary - setUserLibrary failed');
      }
    );
  }
};
