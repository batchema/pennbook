var friends_db = require('../models/friends.js');
var posts_db = require('../models/posts');
var accounts_db = require('../models/accounts.js');

var addFriend = function(req, res) {
    // input: username A, username B, timestamp
    // output: errorCode/okStatus
    // DB used: friends
    var userA = req.user.username;
    var userB = req.body.usernameB;

    var friendA_full_name = req.user.fullname;
    var friendB_full_name = req.body.userB_full_name;

    //add friend rows to db
    friends_db.addFriendDB(userA, userB, friendA_full_name, friendB_full_name, function(err) {
        if (err) {
            console.log(err);
            res.status(403).json({success: false});
        } else {
            console.log("added friend");
            //update last active timestamp
            accounts_db.lastActive(userA, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({success: true});
                }
            });
        }
    });
};

var removeFriend = function(req, res) {
    // input: username A, username B
    // output: errorCode/okStatus
    // DB used: friends

    var userA = req.user.username;
    var userB = req.body.usernameB;

    //remove friend from db from A to B
    friends_db.removeFriendDB(userA, userB, function(err) {
        if (err) {
            console.log(err);
            res.status(403).json({success: false});
        } else {
            //remove friend from db from B to A
            friends_db.removeFriendDB(userB, userA, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    //update last active timestamp of userA
                    accounts_db.lastActive(userA, function(err) {
                        if (err) {
                            console.log(err);
                            res.status(403).json({success: false});
                        } else {
                            res.status(200).json({success: true});
                        }
                    });
                }
            });
        }
    });
};

var getCurrentFriends = function(req, res) {
    // input: username
    // output: set of friends of user
    // DB used: friends
    var user = req.query.username ? req.query.username : req.user.username;

    //get friend A where accepted = true 
    friends_db.getCurrentFriendsDB(user, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({status: null});
        } else {
            //filter list of friends to accepted requests
            data = data.Items.filter(f => f.accepted === true);
            //update last active timestamp
            accounts_db.lastActive(user, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({status: data});
                }
            });
        }
    });

};

var acceptFriend = function(req, res) {
    // input: username A, username B
    // output: errorCode/okStatus
    // DB used: friends

    //update timestamp
    var userA = req.user.username;
    var userB = req.body.usernameB;

    var userA_full_name = req.user.fullname;
    var userB_full_name = req.body.userB_full_name;

    //change accepted to true from A to B
    friends_db.updateAcceptFriend(userA, userB, function(err) {
        if (err) {
            console.log(err);
            res.status(403).json({success: false});
        } else {
            //change accepted to true from B to A
            friends_db.updateAcceptFriend(userB, userA, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    // Create two status updates about new friendship
                    var contentOne = `${userA_full_name} is now friends with ${userB_full_name}`;
                    posts_db.createNewPost(userA, userA, new Date().getTime(), contentOne, userA_full_name, userA_full_name, function(err1, data1) {
                        if (err1){
                            res.status(403).json({success: false});
                            console.log(err1);
                        } else {
                            var contentTwo = `${userB_full_name} is now friends with ${userA_full_name}`;
                            posts_db.createNewPost(userB, userB, new Date().getTime(), contentTwo, userB_full_name, userB_full_name, function(err2, data2) {
                                if (err2){
                                    console.log(err2);
                                    res.status(403).json({success: false});
                                } else {
                                    //update last active timestamp
                                    accounts_db.lastActive(userA, function(err) {
                                        if (err) {
                                            console.log(err);
                                            res.status(403).json({success: false});
                                        } else {
                                            res.status(200).json({success: true});
                                        }
                                    });
                                }
                            });
                        }
                    });   
                }
            });
        }
    });
 };
  
 var rejectFriend = function(req, res) {
    // input: username A, username B
    // output: errorCode/okStatus
    // DB used: friends
    var userA = req.user.username;
    var userB = req.body.usernameB;

    //delete friend rows
    friends_db.removeFriendDB(userA, userB, function(err) {
        if (err) {
            console.log(err);
            res.status(403).json({success: false});
        } else {
            //delete friend row in other direction
            friends_db.removeFriendDB(userB, userA, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    //update last active timestamp
                    accounts_db.lastActive(userA, function(err) {
                        if (err) {
                            console.log(err);
                            res.status(403).json({success: false});
                        } else {
                            res.status(200).json({success: true});
                        }
                    });
                }
            });
        }
    });
 };
  
 var getPendingRequests = function(req, res) {
    // input: username A, username B
    // output: errorCode/okStatus
    // DB used: friends

    var user = req.user.username;

    //get friend A where accepted = false
    friends_db.getCurrentFriendsDB(user, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({status: null});
        } else {
            //filter to rows where accepted is false
            data = data.Items.filter(f => f.accepted === false && f.sender !== user);
            //update last active timestamp
            accounts_db.lastActive(user, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({status: data});
                }
            });
        }
    });
 };

 // Get the friendship status of two users (pending request, friends, not friends)
 var getFriendshipStatus = function(req, res) {
    var usernameA = req.user.username;
    var usernameB = req.query.usernameB;

    //get friendship status between usernameA and usernameB
    friends_db.getStatusOfFriendship(usernameA, usernameB, function(err, data) {
        if (err){
            console.log(err);
            res.status(403).json({status: null});
        } else {
            //update last active timestamp
            accounts_db.lastActive(usernameA, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({status: data});
                }
            });
        }
    });
 };

var routes = { 
    post_addfriend: addFriend,
    post_removefriend: removeFriend,
    get_currentfriends: getCurrentFriends,
    post_acceptfriend: acceptFriend,
    post_rejectfriend: rejectFriend,
    get_pendingrequests: getPendingRequests,
    get_friendshipstatus: getFriendshipStatus,
};
  
module.exports = routes;