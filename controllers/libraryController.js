const connection = require('../db');
const ServerError = require('../ServerError');

module.exports = {
  // getSong: (songID) =>
  //   new Promise((resolve, reject) => {
  //     console.log(songID);
  //     connection.query('SELECT * FROM library WHERE song_id IN (?)', [songID], (err, data) => {
  //       if (err) {
  //         console.error('err', err);
  //         reject(new ServerError('Library - getSong failed', 500, err));
  //       }
  //       console.log(data[0], data.length);
  //       resolve(data);
  //     });
  //   }),

  setLibrary: async (library, features) => {
    /**
     * library is an array of 50 or less songs from Spotify.
     * library = spotifyResp.items
     */
    const insertArray = library.map(({ track: { artists, name, id, album } }, i) => {
      artists = artists.reduce((acc, artist) => [...acc, artist.name], []).join(', ');
      return [
        id,
        name,
        artists,
        album.images[1].url,
        features[i].acousticness,
        features[i].danceability,
        features[i].energy,
        features[i].instrumentalness,
        features[i].loudness,
        features[i].tempo,
        features[i].valence,
        features[i].speechiness,
        features[i].liveness,
      ];
    });
    const query = Array(13)
      .fill(1)
      .map((item, i) => `$${i + 1}`)
      .join(', ');

    // insert array is 50 songs long
    // each song is an array of values
    console.log('IN SET LIBRARY CONTROLLER');
    try {
      await Promise.all(
        insertArray.map((song) => {
          return connection.query(
            `INSERT INTO library (song_id, title, artist, album_img, acousticness, danceability, energy, instrumentalness, loudness, tempo, valence, speechiness, liveness) VALUES (${query}) ON CONFLICT (song_id) DO NOTHING;`,
            song
          );
        })
      );
    } catch (e) {
      if (e) throw new ServerError('setLibrary error');
    }

    //   connection.query(
    //     `INSERT INTO library (song_id, title, artist, album_img, acousticness, danceability, energy, instrumentalness, loudness, tempo, valence, speechiness, liveness) VALUES (${query}) ON CONFLICT (song_id) DO NOTHING;`,
    //     [insertArray],
    //     (err, data) => {
    //       if (err) throw new ServerError('Library - setLibrary failed', 500, err);
    //       console.log('RETURNING FROM SET LIBRARY CONTROLLER', data.rows[0], data.rows.length);
    //     }
    //   );
  },
};
