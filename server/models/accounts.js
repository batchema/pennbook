// Accounts database management functions
var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});

var db = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

const bcrypt = require('bcrypt');
const saltRounds = 10;

// trigger recommendations update job 
const recRoutes = require('../routes/recommendations_routes');

// User Lookup
var userLookup = function(username, callback) {
        
	//search for a specific username
	var params = {
        TableName : 'accounts',
        KeyConditionExpression: "username = :v_username",
        ExpressionAttributeValues: {
            ":v_username": username
        }
	};
  
	docClient.query(params, function(err, data) {
		if (err || data.Items.length == 0) {
            console.log(err);
			callback(err, null);
	    } else {
	    	callback(err, data.Items[0]);
	    }
	});
};

var userSignup = function(username, password, firstname, lastname, email, dob, affiliation, interests, callback) {
	//create params 
	var params = {
		TableName: "accounts",
		Item: {
			"username": username, 
			"password": password, 
			"firstname": firstname,
			"lastname": lastname,
			"email": email, 
			"dob": dob, 
			"affiliation": affiliation,
			"interests": interests,
		}
	};

	 //add user into table
	 docClient.put(params, function (err) {
		if (err) {
			console.log(err);
			callback(err);
		} else {
			console.log("no error");
			callback(err);

		}
	});

}

// Change Affiliation
var updateUserAffiliation = function(username, affiliation, callback){
  var params = {
    TableName: "accounts",
    Key: {
      "username": username
    },
    UpdateExpression: "set #a = :aff",
    ExpressionAttributeNames: {'#a' : 'affiliation'},
    ExpressionAttributeValues:{
      ":aff": affiliation
    }
  };

  docClient.update(params, function(err, data) {
    if (err){
      callback(err, null);
    } else {
      callback(null, "success");
    }
  });
}

// Change Email
var updateUserEmail = function(username, email, callback) {
  var params = {
    TableName: "accounts",
    Key: {
      "username": username
    },
    UpdateExpression: "set #e = :em",
    ExpressionAttributeNames: {'#e' : 'email'},
    ExpressionAttributeValues:{
      ":em": email
    }
  };

  docClient.update(params, function(err, data) {
    if (err){
      callback(err, null);
    } else {
      callback(null, "success");
    }
  });
}

// Change Interests
var changeInterests = function(username, newInterests, callback) {
  var params = {
    TableName: "accounts",
    Key: {
      "username": username
    },
    UpdateExpression: "set #i = :im",
    ExpressionAttributeNames: {'#i' : 'interests'},
    ExpressionAttributeValues: {
      ":im": newInterests
    }
  };

  docClient.update(params, function(err, data) {
    if (err){
      callback(err, null);
    } else {
      recRoutes.update_recommendations(null, null, function(err) {});
      callback(null, "success");
    }
  });
}

// Password Check
var passwordCheck = function(username, password, callback) { 
  var params = {
    TableName: "accounts",
    KeyConditionExpression: "username = :user",
    ExpressionAttributeValues: {
        ":user": username
    }
  };

  docClient.query(params, function(err, data) {
    if (err || data.Items.length === 0){
      callback(err, null);
    } else {
        // check validity of old password
        bcrypt.compare(password, data.Items[0].password, function(err, result) {
          if (result) {
            callback(null, "correct password");
          } else {
            callback(null, "incorrect password");
          }
        });
    }
});
}

// Change Password
var changePassword = function(username, password, callback) {
  var params = {
    TableName: "accounts",
    Key: {
      "username": username
    },
    UpdateExpression: "set #p = :pass",
    ExpressionAttributeNames: {'#p' : 'password'},
    ExpressionAttributeValues:{
      ":pass": password
    }
  };

  //update password in table
  docClient.update(params, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, "success");
    }
  });
}

// Get Online Status
var getUserOnlineStatus = function(username, callback) {
  var params = {
    TableName: "accounts",
    Key: {
      "username": username
    }
  };

  //check past ten minutes 
  var timeToGet = new Date().getTime() - 600000;

  docClient.get(params, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      //if last active is within ten min, return true
      if (data.Item.last_active >= timeToGet) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  });
}

// Change Online Status
var changeUserOnlineStatus = function(username, status, callback) {
  var params = {
    TableName: "accounts",
    Key: {
      "username": username
    },
    UpdateExpression: "set #o = :on",
    ExpressionAttributeNames: {'#o' : 'online'},
    ExpressionAttributeValues:{
      ":on": status
    }
  };

  //update online status in table
  docClient.update(params, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, "success");
    }
  });
}

// Get All Users' Full Names
var getAllUsersFullNames = function(callback) {
  var firstLastNames = [];
  var params = {
    TableName: "accounts"
  };

  docClient.scan(params, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      //return full names
      data.Items.forEach(function(user) {
        firstLastNames.push(user.firstname + " " + user.lastname);
      });
      callback(null, firstLastNames);
    }
  });
}

// Get All Users' Usernames
var getAllUsernames = function(callback) {
  var usernames = [];
  var params = {
    TableName: "accounts"
  };

  //return list of usernames
  docClient.scan(params, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      data.Items.forEach(function(user) {
        usernames.push(user.username);
      });
      callback(null, usernames);
    }
  });
}

var lastActive = function(username, callback) {
  //store time under last_active in accounts table

  var queryParams = {
    TableName: "accounts",
    KeyConditionExpression: "username = :user",
    ExpressionAttributeValues: {
        ":user": username
    }
  };

  docClient.query(queryParams, function(err, data) {
    if (err) {
      console.log(err);
    } else if (data.Items.length === 0) {
      callback(err, null);
    } else {
      var params = {
        TableName: "accounts",
        Key: {
          "username": username
        },
        UpdateExpression: "set #la = :la",
        ExpressionAttributeNames: {'#la' : 'last_active'},
        ExpressionAttributeValues:{
          ":la": new Date().getTime(),
        }
      };
    
      //update last_active in table
      docClient.update(params, function(err, data) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, "success");
        }
      });
    }
  });

}

// Get a user's affiliation
var getUserAffiliation = function(username, callback){
    var params = {
      TableName : 'accounts',
      KeyConditionExpression: "username = :v_username",
      ExpressionAttributeValues: {
        ":v_username": username
      }
    };

    //return user's affiliation
    docClient.query(params, function(err, data) {
      if (err){
        console.log(err);
        callback(err, null);
      } else {
        callback(null, data.Items[0].affiliation);
      }
    });
};

var userSearch = function(username, firstname, lastname, callback) {

  var requests = [];
  var fullname = firstname + " " + lastname;

  for (var i = 1; i <= fullname.length; i++) {

    var prefix = fullname.substring(0, i).toLowerCase();

    var r = {
      PutRequest: {
          Item: {
              "prefix": {S: prefix},
              "username": {S: username}, 
              "fullname": {S: fullname}
          }
      }
    };

    requests.push(r);

  }
  
  var params = {
      RequestItems: {
          "user_search": requests
      }
  };

  db.batchWriteItem(params, function(err, data) {
      if (err) {
          console.log(err);
          callback(err, null);
      } else {
          callback(null, "success");
      }
  });

};

var searchSuggestions = function(prefix, callback) {
  var params = {
    TableName : 'user_search',
    KeyConditionExpression: "prefix = :v_pre",
    ExpressionAttributeValues: {
        ":v_pre": prefix
    }
  };

  docClient.query(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      callback(err, data.Items);
    }
  });
}


var database = { 
    userLookup: userLookup,
    updateUserAffiliation: updateUserAffiliation,
    updateUserEmail: updateUserEmail,
    changePassword: changePassword,
    passwordCheck: passwordCheck,
    changePassword: changePassword,
    changeInterests: changeInterests,
    getUserOnlineStatus: getUserOnlineStatus,
    changeUserOnlineStatus: changeUserOnlineStatus,
    userSignup: userSignup,
    getAllUsersFullNames: getAllUsersFullNames,
    getAllUsernames: getAllUsernames, 
    lastActive: lastActive,
    getUserAffiliation: getUserAffiliation,
    userSearch: userSearch,
    searchSuggestions: searchSuggestions
};

  
module.exports = database;
