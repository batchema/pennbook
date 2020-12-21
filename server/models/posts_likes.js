//posts likes database management function

var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});

var db = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

var isLiked = function(post_id, post_timestamp, username, callback) {
  var id = post_id + ',' + post_timestamp;
  var params1 = {
      TableName : 'post_likes',
      KeyConditionExpression: "post_id = :post_id and username = :user",
      ExpressionAttributeValues: {
          ":post_id": id, 
          ":user": username
      }
  }

  //return num likes
  docClient.query(params1, function(err, data) {
    if (err || data.Items.length == 0) {
          console.log(err);
          callback(err, {isLiked: false});
    } else {
          callback(null,  {isLiked: true});
    }
  });
}

var getNumLikes = function(post_id, post_timestamp, callback) {
    //create params 
        
    var number_likes = 0;
    var params1 = {
        TableName : 'posts',
        KeyConditionExpression: "post_id = :post_id and #timestamp = :post_timestamp",
        ExpressionAttributeValues: {
            ":post_id": post_id, 
            ":post_timestamp": post_timestamp
        }, 
        ExpressionAttributeNames: {
          "#timestamp": "timestamp"
        }
    }

    //return num likes
    docClient.query(params1, function(err, data) {
		if (err || data.Items.length == 0) {
            console.log(err);
            callback(err, null);
	    } else {
            number_likes = parseInt(data.Items[0].num_likes);
            callback(err, {num: number_likes});
	    }
    });

}

var updateNumLikes = function(post_id, post_timestamp, username, number_likes, callback) {

    //update post_likes table
    var params = {
		TableName: "post_likes",
		Item: {
			'post_id': post_id + ',' + post_timestamp,
			'username': username,
		}
    };
    
	 //put into table
	 docClient.put(params, function (err) {
		if (err) {
			console.log(err);
		} else {
			console.log("no error, added to post likes");
		}
  });
  
  console.log('test 2');

  //update posts table
  var params = {
    TableName: "posts",
    Key: {
      'post_id': post_id,
      'timestamp': post_timestamp
    },
    UpdateExpression: "set #n = :n",
    ExpressionAttributeNames: {'#n' : 'num_likes'},
    ExpressionAttributeValues:{
      ":n": parseInt(number_likes) + 1,
    }
  };
  
  docClient.update(params, function(err) {
    if (err){
      console.log(err);
      callback(err);
    } else {
      console.log("updated posts table, num likes: " + number_likes);
      callback(null);
    }
  });
}

var deleteLike = function(post_id, post_timestamp, username, number_likes, callback) {

    //update post_likes table
    var params = {
		TableName: "post_likes",
        Key: {
            'post_id': post_id + ',' + post_timestamp, 
            'username': username,
        },
    };
    
	 //put into table
	 docClient.delete(params, function (err) {
		if (err) {
			console.log(err);
		} else {
			console.log("no error, deleted from post likes");
		}
	});

   //update posts table
   var params = {
    TableName: "posts",
    Key: {
      'post_id': post_id,
      'timestamp': post_timestamp
    },
    UpdateExpression: "set #n = :n",
    ExpressionAttributeNames: {'#n' : 'num_likes'},
    ExpressionAttributeValues:{
      ":n": parseInt(number_likes) - 1,
    }
  };

  docClient.update(params, function(err) {
    if (err){
      console.log(err);
      callback(err);
    } else {
      console.log("updated posts table, num likes: " + number_likes);
      callback(null);
    }
  });
}

var database = { 
    getNumLikes: getNumLikes,
    updateNumLikes: updateNumLikes,
    deleteLike: deleteLike,
    isLiked: isLiked
};

module.exports = database;
