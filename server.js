const express = require('express');
const routes = require('./routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cacheMiddleware = require('./routes/middleware/cacheMiddleware');
const { logAndHandleError } = require('./routes/middleware/errorMiddleware');
const { validateCookie, updateSpotifyToken } = require('./routes/middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(morgan('dev'));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(validateCookie);
app.use(cacheMiddleware);
app.use(updateSpotifyToken);

app.use('/api', routes);

app.use(logAndHandleError);

app.listen(PORT, () => {
  console.log(`Backend ready on port: ${PORT}`);
});
