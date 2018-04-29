const debug = require('debug')(':database');
const isSubset = require('is-subset');

const cradle = require('cradle');
const db = new (cradle.Connection)('couchdb', 5984, {
    auth: {
        username: process.env.COUCHDB_USER,
        password: process.env.COUCHDB_PASSWORD
    }
}).database('tweets');

// Create the database
db.exists(function (err, exists) {
    if (err) {
        debug('error', err);
        process.exit(1);
    } else if (exists) {
        debug('tweets database not created as it already exists');
        doSetupDesignDocuments();
    } else {
        debug('tweets database does not exist, so creating it');
        db.create(function (err) {
            if (err) {
                debug('error', err);
                process.exit(1);
            }
            doSetupDesignDocuments();
        });
    }
});

// Helpers for setting up the design documents
const tweetsDesignDocName = 'tweets';
const tweetsDesignDocLocation = '_design/' + tweetsDesignDocName;
const tweetsDesignDoc = {
    views: {
        countDivisibleTen: {
            map: `function (doc) {
            if (doc.data % 10 === 0) {
                emit(doc._id, 1);
            }
        }`,
            reduce: '_count'
        }
    }
};
function doSetupDesignDocuments() {
    db.get(tweetsDesignDocLocation, function (err, doc) {
        if (err && err.error !== 'not_found') {
            debug('error', err);
            process.exit(1);
        } else if (err && err.headers.status === 404) {
            debug('tweets design document does not exist, so creating it');
            db.save(tweetsDesignDocLocation, tweetsDesignDoc, function (err) {
                if (err) {
                    debug('error', err);
                    process.exit(1);
                }
            });
        } else if (!isSubset(doc, tweetsDesignDoc)) {
            debug('tweets design document is old, so updating it');
            db.save(tweetsDesignDocLocation, tweetsDesignDoc, function (err) {
                if (err) {
                    debug('error', err);
                    process.exit(1);
                }
            });
        } else {
            debug('latest version of the tweets design document exists, ' +
                'so skipping creation');
        }
    });
}

// Functions to access the database
function countDivisibleByTen(callback) {
    db.view(tweetsDesignDocName + '/countDivisibleTen', function (err, res) {
        callback(err, res);
    });
}

module.exports = {
    countDivisibleByTen,
};
