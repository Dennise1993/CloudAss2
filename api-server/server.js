const debug = require('debug')(':server');

const db = require('./database/database');

const express = require('express');
const app = express();

function genericRequestHandler(req, res, getResponse) {
    getResponse(function (err, response) {
        if (err) {
            debug('error', err);
            res.sendStatus(500);
        } else {
            res.status(200).send(response);
        }
    });
}

app.get('/political-ratio-suburb', function (req, res) {
    req.setTimeout(0);
    genericRequestHandler(req, res, db.politicalTweetRatioBySuburb);
});
app.get('/sentiment-suburb', function (req, res) {
    req.setTimeout(0);
    genericRequestHandler(req, res, db.sentimentBySuburb);
});
app.get('/popular-device-suburb', function (req, res) {
    req.setTimeout(0);
    genericRequestHandler(req, res, db.mostPopularDeviceBySuburb);
});
app.get('/junk-food-ratio-suburb', function (req, res) {
    req.setTimeout(0);
    genericRequestHandler(req, res, db.junkFoodTweetRatioBySuburb);
});
app.get('/correct-spelling-ratio-suburb', function (req, res) {
    req.setTimeout(0);
    genericRequestHandler(req, res, db.correctSpellingRatioBySuburb);
});

const server = app.listen(3000, function () {
    const port = server.address().port;
    debug('API server listening at port %s', port);
});
