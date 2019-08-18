const router = require('express').Router();
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const { getTokens, spotifyFetch } = require('../services/spotifyService');
const ServerError = require('../ServerError');
const { catchAsyncError } = require('./middleware/errorMiddleware');

const cache = require('../../cache');
const format = require('../../utils/format');

const HOSTNAME =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://eventspotter-react.qianbrian.now.sh';

router.get('/login', (req, res) => {
  const redirectURI = encodeURIComponent(`${HOSTNAME}/api/auth/spotifyLogin`);
  const scopes = encodeURIComponent(
    'user-read-private user-read-email user-library-read user-top-read'
  );
  res.redirect(
    `https://accounts.spotify.com/authorize?response_type=code&client_id=${
      process.env.SPOTIFY_CLIENT_ID
    }&scope=${scopes}&redirect_uri=${redirectURI}`
  );
});

router.get(
  '/spotifyLogin',
  catchAsyncError(async (req, res) => {
    /** *********************************
     * ACQUIRE AUTH CODE FROM SPOTIFY
     **********************************
     */
    console.log('***************NOW IN /spotifyLogin ROUTE');
    const redirectURI = `${HOSTNAME}/api/auth/spotifyLogin`;
    const code = req.query.code || null;
    const params = {
      code,
      redirect_uri: redirectURI,
      grant_type: 'authorization_code'
    };
    const userTokens = await getTokens(params);
    //* TODO: total songs info needs to be retrieved from database
    // FETCH TOKENS AND PROFILE DATA FROM SPOTIFY************

    const { refresh_token: refreshToken, access_token: accessToken } = userTokens;
    console.log('TOKENS: ', accessToken && refreshToken && 'tokens found');
    const profile = await spotifyFetch('https://api.spotify.com/v1/me', accessToken);
    // FORMATTING DATA FOR USER TOKEN*****************
    const userInfo = {
      spotifyID: profile.id,
      displayName: profile.display_name,
      imgURL: profile.images[0].url
    };

    // SAVE ENCODED TOKEN TO COOKIE ***********
    const encodedToken = await jwt.sign({ userInfo }, process.env.JWT_SECRET_KEY, {
      expiresIn: '999d'
    });
    res.cookie('userInfo', encodedToken, { maxAge: 1000 * 60 * 60 * 24 * 365 });
    // FORMATTING DATA FOR DB ENTRY/CACHE***********
    userInfo.accessToken = accessToken;
    userInfo.refreshToken = refreshToken;
    userInfo.accessTokenExpiration = Date.now() + 1000 * 60 * 55;
    // CREATE NEW USER OR UPDATE EXISTING USER********

    const user = format.dbProfileToCache(await authController.getUserByID(profile.id));
    console.log('USER RETURNED FROM GETUSER:', user);
    if (!user) {
      console.log('Creating new user: ', userInfo);
      authController.createUser(userInfo);
      cache.set(profile.id, userInfo);
    } else {
      console.log('EDITING EXISTINg user', userInfo);
      authController.editUserInfo(userInfo);
    }

    console.log('REDIRECTING TO LIBRARY FROM AUTH');
    res.redirect(`${HOSTNAME}/library`);
  })
);

router.get('/', (req, res) => {
  const { spotifyID = null } = res.locals;
  if (!spotifyID) return res.json({ spotifyID: '', displayName: '', imgURL: '' });
  const cachedUser = cache.get(spotifyID);
  const { displayName, imgURL } = cachedUser;
  res.json({
    spotifyID,
    displayName,
    imgURL
  });
});

router.route('/test').get((req, res) => {
  throw new ServerError(req.path, 500, 'test route');
});

module.exports = router;
