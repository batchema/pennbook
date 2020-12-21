// comment likes database management functions

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

var db = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

//return number of likes on comment
var getNumLikes = function(
  post_id,
  post_timestamp,
  comment_timestamp,
  callback
) {
  //get comment id
  var id = post_id + ',' + post_timestamp;

  var number_likes = 0;
  var params1 = {
    TableName: 'comments',
    KeyConditionExpression: 'post_id = :post_id and #timestamp = :c_timestamp',
    ExpressionAttributeValues: {
      ':post_id': id,
      ':c_timestamp': comment_timestamp
    },
    ExpressionAttributeNames: {
      '#timestamp': 'timestamp'
    }
  };

  //return num likes
  docClient.query(params1, function(err, data) {
    if (err || data.Items.length == 0) {
      console.log(err);
      callback(err, null);
    } else {
      number_likes = parseInt(data.Items[0].number_of_likes);
      callback(err, { num: number_likes });
    }
  });
};

var likeCommentDB = function(
  post_id,
  post_timestamp,
  comment_timestamp,
  username,
  number_likes,
  callback
) {
  var id = post_id + ',' + post_timestamp;

  //update comment likes table
  var params = {
    TableName: 'comment_likes',
    Item: {
      comment_id: post_id + ',' + post_timestamp + ',' + comment_timestamp,
      username: username
    }
  };

  //put into table
  docClient.put(params, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('no error, added to comment likes');
    }
  });

  //update comments table
  var params = {
    TableName: 'comments',
    Key: {
      post_id: id,
      timestamp: comment_timestamp
    },
    UpdateExpression: 'set #n = :n',
    ExpressionAttributeNames: { '#n': 'number_of_likes' },
    ExpressionAttributeValues: {
      ':n': parseInt(number_likes) + 1
    }
  };

  //update table with number of likes
  docClient.update(params, function(err) {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      callback(null);
    }
  });
};

//username unlikes comment
var unlikeCommentDB = function(
  post_id,
  post_timestamp,
  comment_timestamp,
  username,
  number_likes,
  callback
) {
  var id = post_id + ',' + post_timestamp;

  var params = {
    TableName: 'comment_likes',
    Key: {
      comment_id: post_id + ',' + post_timestamp + ',' + comment_timestamp,
      username: username
    }
  };

  //delete from table
  docClient.delete(params, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('no error, deleted from comment likes');
    }
  });

  //update comments table with number of likes
  var params = {
    TableName: 'comments',
    Key: {
      post_id: id,
      timestamp: comment_timestamp
    },
    UpdateExpression: 'set #n = :n',
    ExpressionAttributeNames: { '#n': 'number_of_likes' },
    ExpressionAttributeValues: {
      ':n': parseInt(number_likes) - 1
    }
  };

  docClient.update(params, function(err) {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      callback(null);
    }
  });
};

//return whether comment is liked by username
var isLiked = function(
  post_id,
  post_timestamp,
  comment_timestamp,
  username,
  callback
) {
  var params1 = {
    TableName: 'comment_likes',
    KeyConditionExpression: 'comment_id = :comment_id and username = :user',
    ExpressionAttributeValues: {
      ':comment_id': post_id + ',' + post_timestamp + ',' + comment_timestamp,
      ':user': username
    }
  };

  //return isLiked bool
  docClient.query(params1, function(err, data) {
    if (err || data.Items.length == 0) {
      console.log(err);
      callback(err, { isLiked: false });
    } else {
      callback(null, { isLiked: true });
    }
  });
};

var database = {
  getNumLikes: getNumLikes,
  likeCommentDB: likeCommentDB,
  unlikeCommentDB: unlikeCommentDB,
  isLiked: isLiked
};

module.exports = database;
