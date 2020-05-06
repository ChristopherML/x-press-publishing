const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');
const morgan = require('morgan');
const apiRouter = require('./api/api');

//SERVER
const app = express();
const PORT = (process.env.PORT || 4000)
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

//MIDDLEWARE
app.use(bodyParser.json(), cors(), morgan('dev'));

//DEVELOMENT MIDDLEWARE
const devMode = true;
devMode && app.use(errorhandler());

//API ROUTER
app.use('/api', apiRouter);

//EXPORTS
module.exports = app;
