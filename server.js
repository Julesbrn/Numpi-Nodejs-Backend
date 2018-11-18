// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const arangjs = require('./arang.js');
app.use(bodyParser.urlencoded({
    extended: true
}));

require('./app/routes')(app, arangjs.dbLogin());


const port = 8000;
app.listen(port, () => 
{
    console.log('We are live on ' + port);
});