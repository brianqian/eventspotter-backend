const connection = require('../db');
const ServerError = require('../ServerError');

module.exports = {
  getSong: (songID) =>
    new Promise((resolve, reject) => {
      connection.query('SELECT * FROM library WHERE songID = ?', [songID], (err, data) => {
        if (err) reject(new ServerError('Library - getSong failed'));
        console.log(data);
        resolve(data);
      });
    }),

  setLibrary: (library, features) => {
    /**
     * library is an array of 50 or less songs from Spotify.
     * library = spotifyResp.items
     */

    const insertArray = library.map(({ track: { artists, name, id } }, i) => {
      artists = artists.reduce((acc, artist) => [...acc, artist.name], []).join(', ');
      return [
        id,
        name,
        artists,
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
    console.log('IN SET LIBRARY CONTROLLER');
    connection.query(
      'INSERT IGNORE INTO library (song_id, title, artist, acousticness, danceability, energy, instrumentalness, loudness, tempo, valence, speechiness, liveness) VALUES ?',
      [insertArray],
      (err, data) => {
        if (err) throw new ServerError('Library - getSong failed');
        console.log('RETURNING FROM SET LIBRARY CONTROLLER', data[0], data.length);
      }
    );
  },
  setLibraryAdvanced: (library) => {
    const insertArray = library.map(
      ({ acousticness, danceability, energy, instrumentalness, loudness, tempo, valence }) => [
        acousticness,
        danceability,
        energy,
        instrumentalness,
        loudness,
        tempo,
        valence,
      ]
    );
    connection.query(
      'INSERT INTO library (acousticness, danceability, energy, instrumentalness, loudness, tempo, valence) VALUES ?',
      [insertArray],
      (err, data) => {
        if (err) throw new ServerError('Library - setLibraryAdvanced failed');
        return data;
      }
    );
  },
};
