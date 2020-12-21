//friends database management function

var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});

var db = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

var accounts_db = require('../models/accounts');

//add friend rows to db
var addFriendDB = function(usernameA, usernameB, friendA_full_name, friendB_full_name, callback) {

    //create rows for A to B and for B to A friendship with accepted = false 
    var params = {
        RequestItems: {
         "friends": [
             {
            PutRequest: {
                Item: {
                    "friendA": {S: usernameA}, 
                    "friendB": {S: usernameB}, 
                    "timestamp": {N: new Date().getTime().toString()},
                    "sender": {S: usernameA},
                    "accepted": {BOOL: false}, 
                    "friendA_full_name": {S: friendA_full_name},
                    "friendB_full_name": {S: friendB_full_name}
                }
            }
           }, 
             {
            PutRequest: {
                Item: {
                    "friendA": {S: usernameB}, 
                    "friendB": {S: usernameA}, 
                    "timestamp": {N: new Date().getTime().toString()},
                    "sender": {S: usernameA},
                    "accepted": {BOOL: false}, 
                    "friendA_full_name": {S: friendB_full_name},
                    "friendB_full_name": {S: friendA_full_name}
                }
           }, 
        },
          ]
        }
    };

	 //put into table
	 db.batchWriteItem(params, function (err) {
		if (err) {
			console.log(err);
			callback(err);
		} else {
			console.log("no error");
			callback(err);

		}
	});

}

//remove row A to B from table
var removeFriendDB = function(usernameA, usernameB, callback) {
    //create params 
    var params = {
        TableName : 'friends',
        Key: {
            'friendA': usernameA, 
            'friendB': usernameB,
        },
	};
    
    //delete from table
	docClient.delete(params, function(err, data) {
		if (err || data.Items == null) {
            console.log(err);
			callback(err, null);
	    } else {
	    	callback(err, data.Items[0]);
	    }
	});

}

//accept friend request 
 var updateAcceptFriend = function(userA, userB, callback){
    //change timestamp to be time when friend request is accepted 
    var params = {
      TableName: "friends",
      Key: {
        "friendA": userA, 
        "friendB": userB,
      },
      UpdateExpression: "set #tm = :time, accepted = :acc",
      ExpressionAttributeValues:{
        ":time": new Date().getTime(),
        ":acc": true,
      },
      KeyConditionExpression: "#tm = :timestamp",
      ExpressionAttributeNames:{
          "#tm": "timestamp"
      },
    };
  
    //update table with accepted = true and new timestamp
    docClient.update(params, function(err) {
      if (err){
        callback(err);
      } else {
        callback(null);
      }
    });
  }


//get current friends of userA
var getCurrentFriendsDB = function(userA, callback) {

    var params = {
        TableName : "friends",
        KeyConditionExpression: "#ua = :ua",
        ExpressionAttributeNames:{
            "#ua": "friendA"
        },
        ExpressionAttributeValues: {
            ":ua": userA,
        }
    };
    
    docClient.query(params, function(err, data) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, data);
        }
    });
}

//get friends of user A with accepted = false
var getPendingFriendsDB = function(userA, callback) {
    var params = {
        TableName : "friends",
        KeyConditionExpression: "#ua = :ua and accepted = false",
        ExpressionAttributeNames:{
            "#ua": "friendA"
        },
        ExpressionAttributeValues: {
            ":ua": userA
        }
    };
    
    docClient.query(params, function(err, data) {
        if (err) {
            callback(err, null);
        } else {
            console.log("Query succeeded.");
            data.Items.forEach(function(item) {
                console.log(" -", item.friendA + ": " + item.friendB);
            });
            callback(null, data);
        }
    });
}


// Get new friendships that were created with user in the past three days
var getNewFriendships = function(username, timestamp, callback) {
    var allFriends = [];
    var timeToGet = timestamp - 259200000;
    var params = {
        TableName: "friends",
        KeyConditionExpression: "#fa = :friendA",
        ExpressionAttributeNames: {
            "#fa": "friendA",
        },
        ExpressionAttributeValues: {
            ":friendA": username,
        }
    };

    docClient.query(params, function(err, data) {
        if (err) {
            callback(err, null);
        } else {
            data.Items.forEach(function(friendship) {
                if (friendship.accepted && friendship.timestamp >= timeToGet){
                    allFriends.push(friendship);
                }    
            });
            callback(null, allFriends);
        }
    });
}

// Get all friends of a user
var getAllFriends = function(username, callback) {
    var allFriends = [];
    var params = {
        TableName: "friends",
        KeyConditionExpression: "#fa = :friendA",
        ExpressionAttributeNames: {
            "#fa": "friendA",
        },
        ExpressionAttributeValues: {
            ":friendA": username,
        }
    };

  docClient.query(params, function(err, data) {
    if (err) {
        callback(err, null);
    } else {
        data.Items.forEach(function(friendship) {
            if (friendship.accepted){
                allFriends.push(friendship["friendB"]);
            }    
        });
        callback(null, allFriends);
    }
  });
}

// Get all online friends of a user
var getAllOnlineFriends = function(username, callback) {
    var onlineFriends = [];
    var friendsCounted = 0;

    getCurrentFriendsDB(username, function(err, data) {
        if (err){
            callback(err, null);
        } else {
            data.Items.forEach(function(friend) {
                accounts_db.getUserOnlineStatus(friend.friendB, function(err1, data1) {
                    if (err1){
                        callback(err, null);
                    } else {
                        friendsCounted++;
                        if (data1){
                            onlineFriends.push(friend);
                        }
                        if (friendsCounted === data.Items.length){
                            callback(null, onlineFriends);
                        }
                    }
                });

            });  
        }
    });

}

// Get status of a friendship (friends, incoming request, outgoing request, not friends/no request)
var getStatusOfFriendship = function(usernameA, usernameB, callback) {
    var params = {
        TableName: "friends",
        KeyConditionExpression: "#fa = :friendA and #fb = :friendB",
        ExpressionAttributeNames: {
            "#fa": "friendA",
            "#fb": "friendB"
        },
        ExpressionAttributeValues: {
            ":friendA": usernameA,
            ":friendB": usernameB
        }
    };

    docClient.query(params, function(err, data) {
        if (err){
            callback(err, null);
        } else if (data.Items.length != 0 && data.Items[0].sender === usernameA && !data.Items[0].accepted){
            callback(null, "outgoing request to B");
        } else if (data.Items.length != 0 && data.Items[0].sender === usernameB && !data.Items[0].accepted){
            callback(null, "incoming request from B");
        } else if (data.Items.length != 0 && data.Items[0].accepted){
            callback(null, "friends");
        } else {
            callback(null, "not friends");
        }
    });
}

var database = { 
    addFriendDB: addFriendDB,
    removeFriendDB: removeFriendDB,
    updateAcceptFriend: updateAcceptFriend,
    getCurrentFriendsDB: getCurrentFriendsDB,
    getPendingFriendsDB: getPendingFriendsDB,
    getNewFriendships: getNewFriendships,
    getAllFriends: getAllFriends,
    getAllOnlineFriends: getAllOnlineFriends,
    getStatusOfFriendship: getStatusOfFriendship,
};

module.exports = database;
