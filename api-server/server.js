const debug = require('debug')(':server');

const db = require('./database/database');

const express = require('express');
const app = express();

app.get('/count-divisible-ten', function (req, res) {
    db.countDivisibleByTen(function(err, response) {
        if (err) {
            debug('error', err);
            res.sendStatus(500);
        } else {
            let count;
            if (response.length > 0) {
                count = response[0].value;
            } else {
                count = 0;
            }
            res.status(200).send({'count': count});
        }
    });
});

const server = app.listen(3000, function () {
    const port = server.address().port;
    debug('API server listening at port %s', port);
});
