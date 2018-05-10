const debug = require('debug')(':database');
const isSubset = require('is-subset');

const cradle = require('cradle');
const db = new (cradle.Connection)('couchdb', 5984, {
    auth: {
        username: process.env.COUCHDB_USER,
        password: process.env.COUCHDB_PASSWORD
    },
    request: {
        timeout: 120000
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

// Used for calculating the average when reducing through MapReduce
// Source for calculating the average:
//      http://tobyho.com/2009/10/07/taking-an-average-in-couchdb/
const averageReduceFunction = `function (keys, values, rereduce) {
    if (!rereduce) {
        var length = values.length;
        return [sum(values) / length, length];
    } else {
        var length = sum(values.map(function (v) {
            return v[1];
        }));
        var avg = sum(values.map(function (v) {
            return v[0] * (v[1] / length);
        }));
        return [avg, length];
    }
}`;

const tweetsDesignDoc = {
    views: {
        politicalRatioBySuburb: {
            map: `function (doc) {
                if (doc.region && (doc.region === 'Greater Melbourne' ||
                        doc.region === 'Greater Sydney')) {
                    if (doc.politicalHashtag) {
                        emit([doc.region, doc.suburb], 1);
                    } else {
                        emit([doc.region, doc.suburb], 0);
                    }
                }
            }`,
            reduce: averageReduceFunction
        },
        sentimentBySuburb: {
            map: `function (doc) {
                if (doc.sentiment && doc.region &&
                    (doc.region === 'Greater Melbourne' ||
                        doc.region === 'Greater Sydney')) {
                    emit([doc.region, doc.suburb], doc.sentiment);
                }
            }`,
            reduce: averageReduceFunction
        },
        appleOrAndroidDeviceBySuburb: {
            map: `function (doc) {
                if (doc.source && doc.region &&
                    (doc.region === 'Greater Melbourne' ||
                        doc.region === 'Greater Sydney')) {
                    if (doc.source === 'Twitter for iPhone') {
                        emit([doc.region, doc.suburb, doc.source], 1);
                    } else if (doc.source === 'Twitter for Android') {
                        emit([doc.region, doc.suburb, doc.source], 0);
                    }
                }
            }`,
            reduce: averageReduceFunction
        },
        junkFoodRatioBySuburb: {
            map: `function (doc) {
                if (doc.region && (doc.region === 'Greater Melbourne' ||
                        doc.region === 'Greater Sydney')) {
                    if (doc.junkFoodList) {
                        emit([doc.region, doc.suburb], 1);
                    } else {
                        emit([doc.region, doc.suburb], 0);
                    }
                }
            }`,
            reduce: averageReduceFunction
        },
        correctSpellingRatioBySuburb: {
            map: `function (doc) {
                if (doc.spelling !== undefined && doc.region &&
                    (doc.region === 'Greater Melbourne' ||
                        doc.region === 'Greater Sydney')) {
                    if (doc.spelling) {
                        emit([doc.region, doc.suburb], 1);
                    } else {
                        emit([doc.region, doc.suburb], 0);
                    }
                }
            }`,
            reduce: averageReduceFunction
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

// Used to collate results from the database in the form of:
//     [region, suburb]: [average, total_items]
function mergeRegionSuburbAverageResults(err, res, callback) {
    if (!err) {
        const results = {};
        for (let subResponse of res) {
            const region = subResponse['key'][0];
            const suburb = subResponse['key'][1];
            const avg = subResponse['value'][0];

            results[region] = results[region] || {};
            results[region][suburb] = avg;
        }
        callback(err, results);
    } else {
        callback(err, res);
    }
}

// Functions to access the database
function politicalTweetRatioBySuburb(callback) {
    db.view(tweetsDesignDocName + '/politicalRatioBySuburb', {group: true},
        function (err, res) {
            mergeRegionSuburbAverageResults(err, res, callback)
        });
}

function sentimentBySuburb(callback) {
    db.view(tweetsDesignDocName + '/sentimentBySuburb', {group: true},
        function (err, res) {
            mergeRegionSuburbAverageResults(err, res, callback)
        });
}

function appleOrAndroidDeviceBySuburb(callback) {
    db.view(tweetsDesignDocName + '/appleOrAndroidDeviceBySuburb',
        {group: true}, function (err, res) {
            mergeRegionSuburbAverageResults(err, res, callback)
        });
}

function junkFoodTweetRatioBySuburb(callback) {
    db.view(tweetsDesignDocName + '/junkFoodRatioBySuburb', {group: true},
        function (err, res) {
            mergeRegionSuburbAverageResults(err, res, callback)
        });
}

function correctSpellingRatioBySuburb(callback) {
    db.view(tweetsDesignDocName + '/correctSpellingRatioBySuburb',
        {group: true}, function (err, res) {
            mergeRegionSuburbAverageResults(err, res, callback)
        });
}

module.exports = {
    politicalTweetRatioBySuburb,
    sentimentBySuburb,
    mostPopularDeviceBySuburb,
    junkFoodTweetRatioBySuburb,
    correctSpellingRatioBySuburb,
};
