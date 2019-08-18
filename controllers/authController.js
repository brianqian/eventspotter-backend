const connection = require('../db');
const ServerError = require('../ServerError');

module.exports = {
  getUserByID: spotifyID => {
    return new Promise((resolve, reject) => {
      connection.query('SELECT * FROM user_info WHERE user_id = ?', [spotifyID], (err, data) => {
        console.log('*******GETTING USER:', spotifyID);
        if (err) throw err;
        console.log('GET USER RAW DATA', data);
        if (data.length === 0) resolve(false);
        if (data.length > 1)
          reject(new ServerError('Auth - getUserByID', 500, `Users found: ${data.length}`));
        // console.log('GET USER returned data', data);
        resolve(data[0]);
      });
    });
  },
  editUserInfo: ({
    spotifyID,
    displayName,
    imgURL,
    refreshToken,
    accessToken,
    accessTokenExpiration
  }) => {
    connection.query(
      'UPDATE user_info SET display_name = ?, img_URL = ?, refresh_token = ?, access_token = ?, access_token_expiration = ? WHERE user_id = ?',
      [displayName, imgURL, refreshToken, accessToken, accessTokenExpiration, spotifyID],
      (err, data) => {
        if (err) throw new ServerError('Auth - editUserInfo', 500);
        console.log('EDIT USER INFO DATA:', data);
      }
    );
  },
  createUser: ({
    spotifyID,
    displayName,
    imgURL,
    refreshToken,
    accessToken,
    accessTokenExpiration
  }) => {
    connection.query(
      'INSERT INTO user_info (user_id, display_name, img_URL, refresh_token, access_token, access_token_expiration) VALUES (?,?,?,?,?,?)',
      [spotifyID, displayName, imgURL, refreshToken, accessToken, accessTokenExpiration],
      (err, data) => {
        if (err) throw new ServerError('Auth - createUser', 500);
        console.log('CREATE USER INFO DATA:', data);
      }
    );
  },
  deleteUser: spotifyID => {
    connection.query('DELETE FROM user_info WHERE user_id = ?', [spotifyID], (err, data) => {
      if (err) throw new ServerError('Auth - deleteUser', 500);
      console.log('IN DELETE USER,', data);
    });
  },
  editUserSongTotal: (spotifyID, newTotal) => {
    connection.query(
      'UPDATE user_info SET total_songs = ? WHERE user_id = ?',
      [newTotal, spotifyID],
      (err, data) => {
        if (err) throw new ServerError('Auth - editUserSongTotal', 500);
        console.log('in edit user song total', newTotal, data);
      }
    );
  }
};
