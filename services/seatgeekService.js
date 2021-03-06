const fetch = require('isomorphic-unfetch');
const btoa = require('btoa');
const format = require('../utils/format');
const ServerError = require('../ServerError');

const seatGeekFetch = async (endpoint) => {
  const encodedClient = btoa(
    `${process.env.SEATGEEK_CLIENT_ID}:${process.env.SEATGEEK_CLIENT_SECRET}`
  );
  const resp = await fetch(endpoint, {
    headers: {
      Authorization: `Basic ${encodedClient}`,
    },
  });
  if (resp.status !== 200) throw new ServerError('seatgeek, fetch', resp.status, resp.statusText);
  const data = await resp.json();
  return data;
};
const getEventsByOneArtist = async (artist) => {
  const resp = await seatGeekFetch(
    `https://api.seatgeek.com/2/events?performers.slug=${encodeURIComponent(artist)}`
  );
  return resp.events.map((event) => format.parseSeatGeekEvents(event));
};
const getEventsByArtists = async (artistArray) => {
  if (artistArray.length === 1) return getEventsByOneArtist(artistArray[0]);
  // receives artistArray as an array of artist strings.
  const promiseArr = [];
  artistArray.forEach((artist) => {
    promiseArr.push(
      seatGeekFetch(
        `https://api.seatgeek.com/2/events?performers.slug=${encodeURIComponent(artist)}`
      )
    );
  });
  let result = await Promise.all(promiseArr);
  console.log('🚀', result);
  result = result.map((artist) => {
    if (artist.meta.total === 0) return [];
    return artist.events.map((event) => format.parseSeatGeekEvents(event));
  });
  return result;
};

module.exports = {
  seatGeekFetch,
  getEventsByArtists,
  getEventsByOneArtist,
};
