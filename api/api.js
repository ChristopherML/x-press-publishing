const express = require('express');
const apiRouter = express.Router();
const artistsRouter = require('./artists');
const seriesRouter = require('./series');

//ARTISTS ROUTER '/api/artists/*'
apiRouter.use('/artists', artistsRouter);
//SERIES ROUTER '/api/series/*'
apiRouter.use('/series', seriesRouter);


module.exports = apiRouter;