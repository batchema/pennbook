var friends_db = require('../models/friends.js');
var accounts_db = require('../models/accounts.js');

var getNewUsersToVisualize = function(req, res) {
    var affiliation = req.query.affiliation;
    var clickedUser = req.query.clickedUser;
    var userCount = 0;
    var newUsers = [];
    var username = req.user.username;

    // Get all friends of clicked user
    friends_db.getCurrentFriendsDB(clickedUser, function(err, data) {
        if (err){
            res.status(403).json({users: null});
        } else {
            // Get all users of this friend set that have affiliation
            data.Items.forEach((friend) => {
                accounts_db.getUserAffiliation(friend.friendB, function(err1, data1) {
                    if (err1){
                        res.status(403).json({users: null});
                    } else {
                        userCount++;
                        if (data1 === affiliation){
                            newUsers.push(friend);
                        }
                        if (userCount === data.Items.length){
                            accounts_db.lastActive(username, function(err) {
                                if (err) {
                                    console.log(err);
                                    res.status(403).json({articles: null});
                                } else {
                                    res.status(200).json({users: newUsers});
                                }
                            });
                        }
                    }
                });
            });
        }
    });
};

var routes = { 
    get_newuserstovisualize: getNewUsersToVisualize,
};
  
module.exports = routes;