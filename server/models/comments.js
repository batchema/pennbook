// comments database management functions

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

var db = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

//add a comment to the table
var addCommentDB = function(
  post_id,
  post_timestamp,
  username,
  content,
  commenter_full_name,
  callback
) {
  //create params
  var time = new Date().getTime();

  var params = {
    TableName: 'comments',
    Item: {
      post_id: post_id + ',' + post_timestamp,
      timestamp: time,
      content: content,
      commenter_username: username,
      number_of_likes: 0,
      commenter_full_name: commenter_full_name
    }
  };

  //put into table
  docClient.put(params, function(err) {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      console.log('no error');
      callback(err);
    }
  });
};

//get comments
var getComments = function(post_id, post_timestamp, callback) {
  console.log(post_id + ',' + post_timestamp);
  var params = {
    TableName: 'comments',
    KeyConditionExpression: '#p = :id',
    ExpressionAttributeNames: {
      '#p': 'post_id'
    },
    ExpressionAttributeValues: {
      ':id': post_id + ',' + post_timestamp
    }
  };

  //get comments for the post
  docClient.query(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      console.log(data.Items);
      callback(null, data);
    }
  });
};

var database = {
  addCommentDB: addCommentDB,
  getComments: getComments
};

module.exports = database;
