//Posts and status updates database management function

var AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

var docClient = new AWS.DynamoDB.DocumentClient();

// Make a new post
var createNewPost = function(
  poster,
  postee,
  timestamp,
  content,
  postee_full_name,
  poster_full_name,
  callback
) {
  var params = {
    TableName: 'posts',
    Item: {
      post_id: postee,
      postee: postee,
      timestamp: timestamp,
      content: content,
      poster: poster,
      num_likes: 0,
      num_comments: 0,
      postee_full_name: postee_full_name,
      poster_full_name: poster_full_name
    }
  };

  docClient.put(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      callback(null, 'success');
    }
  });
};

// Get all posts and status updates for a postee
var getAllPostsStatus = function(username, callback) {
  var params = {
    TableName: 'posts',
    KeyConditionExpression: '#p = :user',
    ExpressionAttributeNames: {
      '#p': 'post_id'
    },
    ExpressionAttributeValues: {
      ':user': username
    },
    ScanIndexForward: false
  };

  docClient.query(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
};

var database = {
  createNewPost: createNewPost,
  getAllPostsStatus: getAllPostsStatus
};

module.exports = database;
