const jwt = require('jsonwebtoken');

const JSONToURL = object => {
  return Object.keys(object)
    .map(key => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(object[key])}`;
    })
    .join('&');
};

const dbProfileToCache = dbObject => {
  if (!dbObject) return false;
  const result = {
    spotifyID: dbObject.user_id,
    displayName: dbObject.display_name,
    imgURL: dbObject.img_URL,
    refreshToken: dbObject.refresh_token,
    accessToken: dbObject.access_token,
    accessTokenExpiration: dbObject.access_token_expiration,
    totalSongs: dbObject.total_songs
  };
  return result;
};

const spotifyLibraryToCache = spotifyResp => {
  console.log('FORMATTING LIB FOR CACHE', spotifyResp[0].track.name, spotifyResp.length);
  return spotifyResp.map(song => ({
    id: song.track.id,
    dateAdded: song.added_at,
    title: song.track.name,
    artist: song.track.artists.reduce((acc, artist) => [...acc, artist.name], []).join(', ')
  }));
};

const dbLibraryToCache = library => {
  return library.map(song => ({
    id: song.song_id,
    dateAdded: song.date_added,
    title: song.title,
    artist: song.artist,
    acousticness: song.acousticness,
    danceability: song.danceability,
    energy: song.energy,
    instrumentalness: song.instrumentalness,
    loudness: song.loudness,
    tempo: song.tempo,
    valence: song.valence
  }));
};

const cookieToString = (cookie, cookieName) => {
  if (!cookie || !cookie.includes(cookieName)) return null;
  const startIndex = cookie.indexOf(cookieName);
  const endIndex = cookie.indexOf(';', startIndex);
  let result = cookie.substring(startIndex, endIndex >= 0 ? endIndex : cookie.length + 1);
  result = result.substring(result.indexOf('=') + 1);
  return result;
};

const decodeCookie = async cookie => {
  if (!cookie) return null;

  // console.log('IN DECODE COOKIE************. DECODING', cookie);
  const encodedToken =
    typeof cookie === 'string' ? cookieToString(cookie, 'userInfo') : cookie.userInfo;
  if (!encodedToken) return null;
  const result = await jwt.verify(encodedToken, process.env.JWT_SECRET_KEY);
  if (!result) return null;
  // console.log('***********END DECODE COOKIE: ', userInfo);

  return result.userInfo;
};

const formatArtistsToArray = (data, filterBy) => {
  if (!data.length) return [];
  let formattedArtists;
  if (filterBy === 'top_artists') {
    formattedArtists = data.map(({ name }) => name);
  } else {
    formattedArtists = [];
    data.forEach(({ track }) => {
      track.artists.forEach(artist => {
        formattedArtists.push(artist.name);
      });
    });
  }

  return formattedArtists;
};

const parseSeatGeekEvents = event => {
  return {
    id: event.id,
    title: event.title,
    shortTitle: event.short_title,
    url: event.url,
    lowPrice: event.stats.lowest_price,
    averagePrice: event.stats.average_price,
    date: event.datetime_local,
    dateUTC: event.datetime_utc,
    score: event.score,
    location: {
      city: event.venue.city,
      state: event.venue.state,
      zipcode: event.venue.postal_code,
      coordinates: {
        lat: event.venue.location.lat,
        lon: event.venue.location.lon
      }
    }
  };
};

const format = {
  JSONToURL,
  dbProfileToCache,
  spotifyLibraryToCache,
  dbLibraryToCache,
  cookieToString,
  decodeCookie,
  parseSeatGeekEvents,
  formatArtistsToArray
};

module.exports = format;
