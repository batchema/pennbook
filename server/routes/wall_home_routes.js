var posts_db = require('../models/posts.js');
var friends_db = require('../models/friends.js');
var accounts_db = require('../models/accounts.js');

// Post a status update- poster and postee are the same
var postStatusUpdate = function(req, res) {
    var posterUsername = req.user.username;
    var posteeUsername = req.user.username;
    var timestamp = new Date().getTime();
    var fullname = req.body.fullname;
    console.log("TIME: " + timestamp);
    var content = req.body.content;

    posts_db.createNewPost(posterUsername, posteeUsername, timestamp, content, fullname,  function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({posted: false});
        } else {
            // Update the last active timestamp
            accounts_db.lastActive(posterUsername, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({posted: true});
                }
            });
        }
    });
};

// Sort posts/status updates by reverse chronological order
var comparePostsAndUpdates = function(postOne, postTwo) {
    if (postOne["timestamp"] < postTwo["timestamp"]){
        return 1;
    } else if (postOne["timestamp"] > postTwo["timestamp"]){
        return -1;
    } else {
        return 0;
    }
};

// Get all posts and status updates for displaying on home page
var getAllPostsAndStatusHome = function(req, res) {
    var username = req.user.username;

    var allPostsAndStatus = [];
    var friendCounted = 0;

    friends_db.getAllFriends(username, function(err, data) {
        if (err){
            console.log(err);
            res.status(403).json({content: null});
        } else {
            // Add your name to friends list - want your own posts/status updates too
            data.push(username);
            data.forEach(function(friend) {
                posts_db.getAllPostsStatus(friend, function(err, data1) {
                    if (err) {
                        console.log(err);
                        res.status(403).json({content: null});
                    } else {
                        friendCounted++;
                        data1.Items.forEach(function(post) {
                            allPostsAndStatus.push(post);
                        });
                        if (friendCounted === data.length){
                            allPostsAndStatus.sort(comparePostsAndUpdates);
                            // Update the last active timestamp
                            accounts_db.lastActive(username, function(err) {
                                if (err) {
                                    console.log(err);
                                    res.status(403).json({success: false});
                                } else {
                                    res.status(200).json({content: allPostsAndStatus});
                                }
                            });
                        }
                    }
                });
            });
        }
    });
};

// Get all posts and status updates for displaying on wall
var getAllPostsAndStatusWall = function(req, res) {

    var username = req.query.username ? req.query.username : req.user.username;

    var allPostsAndStatus = [];

    posts_db.getAllPostsStatus(username, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({content: null});
        } else {
            allPostsAndStatus = data.Items;
            allPostsAndStatus.sort(comparePostsAndUpdates);
            // Update the last active timestamp
            accounts_db.lastActive(username, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({content: allPostsAndStatus});
                }
            });
        }
    });
};

// Get all new friendships/recently accepted friend requests
var getNewFriendships = function(req, res) {
    var username = req.user.username;
    var timestamp = new Date().getTime();

    friends_db.getNewFriendships(username, timestamp, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({friends: null});
        } else {
            // Update the last active timestamp
            accounts_db.lastActive(username, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({friends: data});
                }
            });
        }
    });
};

// Create a new post
var makeNewPost = function(req, res) {

    var posterUsername = req.user.username;
    var posteeUsername = req.body.postee ? req.body.postee : req.user.username;

    var poster_full_name = req.user.fullname;
    var postee_full_name = req.body.postee_full_name ? req.body.postee_full_name : req.user.fullname;

    var timestamp = new Date().getTime();
    var content = req.body.content;

    posts_db.createNewPost(posterUsername, posteeUsername, timestamp, content, postee_full_name, poster_full_name, function(err, data) {
        if (err){
            console.log(err);
            res.status(403).json({posted: false});
        } else {
            // Update last active timestamp
            accounts_db.lastActive(posterUsername, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({posted: true});
                }
            });
        }
    });
};

// Get all currently online friends
var getAllOnlineFriends = function(req, res) {
    var username = req.user.username;

    friends_db.getAllOnlineFriends(username, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({onlineFriends: null});
        } else {
            res.status(200).json({onlineFriends: data});
        }
    });
};

// Get all friends of a user
var getFriends = function(req, res) {
    var username = req.body.username;
    friends_db.getAllFriends(username, function(err, data) {
        if (err){
            console.log(err);
            res.status(403).json({friends: null});
        } else {
            // Update the last active timestamp
            accounts_db.lastActive(username, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({friends: data});
                }
            });
        }
    });
}

var routes = { 
    post_statusupdate: postStatusUpdate,
    get_postsandstatushome: getAllPostsAndStatusHome,
    get_postsandstatuswall: getAllPostsAndStatusWall,
    get_newfriendships: getNewFriendships,
    post_makepost: makeNewPost,
    get_allonlinefriends: getAllOnlineFriends,
    get_friends: getFriends
};

module.exports = routes;