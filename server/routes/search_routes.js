var accounts_db = require('../models/accounts.js');

// Get all user's full names for search feature
var showSearchSuggestions = function(req, res) {

    var prefix = req.query.prefix;
    var username = req.user.username;

    accounts_db.searchSuggestions(prefix, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({suggs: null});
        } else {
            //update last active timestamp
            accounts_db.lastActive(username, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({suggs: null});
                } else {
                    res.status(200).json({suggs: data});
                }
            });
        }
    });
};

var routes = { 
    get_searchsuggestions: showSearchSuggestions,
};
  
module.exports = routes;