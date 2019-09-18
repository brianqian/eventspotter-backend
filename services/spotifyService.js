const fetch = require('isomorphic-unfetch');
const btoa = require('btoa');
const ServerError = require('../ServerError');
const { JSONToURL } = require('../utils/format');

const spotifyFetch = async (endpoint, authToken) => {
  let resp = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  if (resp.status !== 200) throw new ServerError('spotifyFetch', resp.status, resp.statusText);
  resp = await resp.json();
  return resp;
};

const getSongs = async (accessToken, pages, offset = 0) => {
  // return new Promise(async (resolve, reject) => {
  const SONGS_PER_REQUEST = 50;
  const firstFetch = await spotifyFetch(
    `https://api.spotify.com/v1/me/tracks?offset=${offset}&limit=50`,
    accessToken
  );
  const promiseArr = [];
  const numOfRequests = pages || firstFetch.total / SONGS_PER_REQUEST;
  for (let i = 1; i < numOfRequests; i += 1) {
    const newOffset = 50 * i + offset;
    promiseArr.push(
      spotifyFetch(
        `https://api.spotify.com/v1/me/tracks?offset=${newOffset}&limit=${SONGS_PER_REQUEST}`,
        accessToken
      )
    );
  }
  const result = await Promise.all(promiseArr);
  const library = result.reduce((acc, resp) => [...acc, ...resp.items], [...firstFetch.items]);
  return { library, total: firstFetch.total };
};

const getTokens = async (params) => {
  const formattedParams = JSONToURL(params);
  console.log('***IN GET TOKENS**********', formattedParams);
  const encodedIDAndSecret = btoa(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  );
  let resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encodedIDAndSecret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formattedParams,
  });

  if (resp.status !== 200) {
    throw new ServerError('spotify, getTokens', resp.status, resp.statusText);
  }
  resp = await resp.json();
  if (resp.error) {
    throw new ServerError('spotify, SpotifySite', resp.error.status, resp.error.message);
  }
  return resp;
};

const updateAccessToken = async (refreshToken) => {
  const params = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  };
  const { access_token: accessToken } = await getTokens(params);
  return {
    accessToken,
    accessTokenExpiration: Date.now() + 1000 * 60 * 55,
  };
};

const getTopArtists = async (accessToken, range = 'long') => {
  // short_term = 4 weeks
  // medium_term = 6 months
  // long_term = years
  const term = `${range}_term`;
  const topArtists = await spotifyFetch(
    `https://api.spotify.com/v1/me/top/artists?time_range=${term}`,
    accessToken
  );
  return topArtists;
};
const getTopTracks = async (accessToken, artistID) => {
  // console.log('🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸🐸', artistID, accessToken);
  const topTracks = await spotifyFetch(
    `https://api.spotify.com/v1/artists/${artistID}/top-tracks?country=from_token`,
    accessToken
  );
  return topTracks;
};
const getSongFeatures = async (accessToken, songLibrary) => {
  // Endpoint: https://api.spotify.com/v1/audio-features?ids={songID},{songId}
  if (!songLibrary.length) return [];
  const numOfRequests = Math.ceil(songLibrary.length / 100);
  const promiseArray = [];

  for (let i = 0; i < numOfRequests; i++) {
    const endpoint = 'https://api.spotify.com/v1/audio-features?ids=';
    const query = songLibrary
      .slice(i * 100, (i + 1) * 100)
      .map(({ track }) => track.id)
      .join(',');
    promiseArray.push(spotifyFetch(endpoint + query, accessToken));
  }

  const resp = await Promise.all(promiseArray);
  return resp.reduce((acc, analysis) => [...acc, ...analysis.audio_features], []);

  // const dataShape = {
  //   danceability: 0.808,
  //   energy: 0.626,
  //   key: 7,
  //   loudness: -12.733,
  //   mode: 1,
  //   speechiness: 0.168,
  //   acousticness: 0.00187,
  //   instrumentalness: 0.159,
  //   liveness: 0.376,
  //   valence: 0.369,
  //   tempo: 123.99,
  //   type: 'audio_features',
  //   id: '4JpKVNYnVcJ8tuMKjAj50A',
  //   uri: 'spotify:track:4JpKVNYnVcJ8tuMKjAj50A',
  //   track_href: 'https://api.spotify.com/v1/tracks/4JpKVNYnVcJ8tuMKjAj50A',
  //   analysis_url:
  //     'http://echonest-analysis.s3.amazonaws.com/TR/WhpYUARk1kNJ_qP0AdKGcDDFKOQTTgsOoINrqyPQjkUnbteuuBiyj_u94iFCSGzdxGiwqQ6d77f4QLL_8=/3/full.json?AWSAccessKeyId=AKIAJRDFEY23UEVW42BQ&Expires=1458063189&Signature=JRE8SDZStpNOdUsPN/PoS49FMtQ%3D',
  //   duration_ms: 535223,
  //   time_signature: 4,
  // };
  // check for existing song in songLibrary
};

module.exports = {
  getSongs,
  getTokens,
  updateAccessToken,
  spotifyFetch,
  getTopArtists,
  getSongFeatures,
  getTopTracks,
};
