const router = require('express').Router();
const { getEventsByArtists, getEventsByOneArtist } = require('../services/seatgeekService');
const { catchAsyncError } = require('./middleware/errorMiddleware');

router.get(
  '/generate_events',
  catchAsyncError(async (req, res) => {
    const artists = req.query || null;
    if (!artists) return res.json({ data: [] });
    const result = await getEventsByArtists(Object.values(artists));
    let data = result.reduce((acc, events, i) => {
      if (result.length) acc.push({ name: artists[i], events });
      return acc;
    }, []);
    data = data.sort((a, b) => (a.events.length > b.events.length ? -1 : 1));
    console.log('GENERATE events', data);
    res.json({ data });
  })
);

router.get(
  '/artist/:artist',
  catchAsyncError(async (req, res) => {
    const { artist } = req.params || null;
    if (!artist) return res.json({ data: [] });
    const data = await getEventsByOneArtist(artist);
    res.json({ data });
  })
);

module.exports = router;
