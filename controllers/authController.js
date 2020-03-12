const connection = require('../db');
const ServerError = require('../ServerError');

module.exports = {
  getUserByID: (spotifyID) => {
    return new Promise((resolve, reject) => {
      connection.query('SELECT * FROM user_info WHERE user_id = $1', [spotifyID], (err, data) => {
        console.log('*******GETTING USER:', spotifyID);
        if (err) throw new ServerError('Auth - getUserByID', 500, err);
        console.log('GET USER RAW DATA', data.rows);
        if (data.rows.length === 0) resolve(false);
        if (data.rows.length > 1)
          reject(new ServerError(`Auth - getUserByID. Users found: ${data.rows.length}`));
        // console.log('GET USER returned data', data);
        resolve(data.rows[0]);
      });
    });
  },
  editUserInfo: ({
    spotifyID,
    displayName,
    imgURL,
    refreshToken,
    accessToken,
    accessTokenExpiration,
  }) => {
    connection.query(
      'UPDATE user_info SET display_name = $1, img_URL = $2, refresh_token = $3, access_token = $4, access_token_expiration = $5 WHERE user_id = $6',
      [displayName, imgURL, refreshToken, accessToken, accessTokenExpiration, spotifyID],
      (err, data) => {
        if (err) throw new ServerError('Auth - editUserInfo');
        console.log('EDIT USER INFO DATA:', data.rows);
      }
    );
  },
  createUser: ({
    spotifyID,
    displayName,
    imgURL,
    refreshToken,
    accessToken,
    accessTokenExpiration,
  }) => {
    connection.query(
      'INSERT INTO user_info (user_id, display_name, img_URL, refresh_token, access_token, access_token_expiration) VALUES ($1,$2,$3,$4,$5,$6)',
      [spotifyID, displayName, imgURL, refreshToken, accessToken, accessTokenExpiration],
      (err, data) => {
        if (err) throw new ServerError('Auth - createUser');
        console.log('CREATE USER INFO DATA:', data.rows);
      }
    );
  },
  deleteUser: (spotifyID) => {
    connection.query('DELETE FROM user_info WHERE user_id = $1', [spotifyID], (err, data) => {
      if (err) throw new ServerError('Auth - deleteUser');
      console.log('IN DELETE USER,', data.rows);
    });
  },
  editUserSongTotal: (spotifyID, newTotal) => {
    connection.query(
      'UPDATE user_info SET total_songs = $1 WHERE user_id = $2',
      [newTotal, spotifyID],
      (err, data) => {
        if (err) throw new ServerError('Auth - editUserSongTotal');
        console.log('in edit user song total', newTotal, data.rows);
      }
    );
  },
};
