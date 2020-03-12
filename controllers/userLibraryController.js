/* eslint-disable camelcase */
const connection = require('../db');
const ServerError = require('../ServerError');

module.exports = {
  getUserLibrary: (spotifyID) => {
    return new Promise((resolve, reject) => {
      connection.query(
        'SELECT * FROM library JOIN UserLibrary ON library.song_id = UserLibrary.song_id WHERE library.song_id IN (SELECT song_id FROM UserLibrary WHERE user_id = $1) ORDER BY added_at DESC',
        [spotifyID],
        (err, data) => {
          if (err) console.log(err);
          if (err) return reject(new ServerError('UserLibrary - getUserLibrary failed'));
          data.rows.forEach((item) => {
            delete item.user_id;
          });

          // console.log('in lib controller, getuserlib', data[0], data.length);
          resolve(data);
        }
      );
    });
  },

  getUserLibraryByAnalytic: (spotifyID, filter) => {
    console.log('💁‍♂️', filter);
    return new Promise((resolve, reject) => {
      connection.query(
        `SELECT * FROM library JOIN UserLibrary ON library.song_id = UserLibrary.song_id WHERE library.song_id IN (SELECT song_id FROM UserLibrary WHERE user_id = $1) ORDER BY ${filter} DESC LIMIT 20`,
        [spotifyID],
        (err, data) => {
          if (err) reject(new ServerError('UserLibrary - getUserLibraryByAnalytic failed'));
          // data.forEach((item) => {
          //   delete item.user_id;
          // });

          // console.log('in lib controller, getuserlib', data[0], data.length);
          resolve(data);
        }
      );
    });
  },

  addSongsToUserLibrary: async (spotifyID, spotifyLib) => {
    // takes songs from Spotify response format
    // const insertArray = spotifyLib.map((song) => [spotifyID, song.track.id, song.added_at]);
    try {
      await Promise.all(
        spotifyLib.map((song) => {
          const {
            track: { id },
            added_at,
          } = song;
          return connection.query(
            'INSERT INTO UserLibrary (user_id, song_id, added_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;',
            [spotifyID, id, added_at]
          );
        })
      );
    } catch (e) {
      throw new ServerError('addSongsToUserLibrary');
    }
    // connection.query(
    //   'INSERT IGNORE INTO UserLibrary (user_id, song_id, added_at) VALUES ?',
    //   [insertArray],
    //   (err) => {
    //     if (err) throw new ServerError('UserLibrary - addSongsToUserLibrary failed');
    //   }
    // );
  },
};
