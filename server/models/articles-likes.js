// articles likes database management functions

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

var db = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

var getNumLikes = function(article_id, callback) {
  console.log('testing ' + article_id);
  //get number of likes
  var number_likes = 0;
  var params1 = {
    TableName: 'news_articles',
    KeyConditionExpression: 'article_id = :id',
    ExpressionAttributeValues: {
      ':id': article_id
    }
  };

  //query table for article id and pull num likes
  docClient.query(params1, function(err, data) {
    if (err || data.Items.length == 0) {
      console.log('_------------------');
      console.log(params1);

      console.log('error: ' + err);
      console.log('_------------------');
      callback(err, null);
    } else {
      if (data.Items[0].num_likes == undefined) {
        number_likes = 0;
      } else {
        number_likes = parseInt(data.Items[0].num_likes);
      }
      callback(null, { num: number_likes });
    }
  });
};

var likeArticleDB = function(article_id, username, number_likes, callback) {
  //update article_likes table
  var params = {
    TableName: 'article_likes_by_username',
    Item: {
      article_id: article_id,
      username: username
    }
  };

  //put into table
  docClient.put(params, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('no error, added to articles likes by username');
    }
  });

  //update article_likes table
  var params = {
    TableName: 'article_likes_by_article_id',
    Item: {
      article_id: article_id,
      username: username
    }
  };

  //put into table
  docClient.put(params, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('no error, added to articles likes by article id');
    }
  });

  //update articles table
  var params = {
    TableName: 'news_articles',
    Key: {
      article_id: article_id
    },
    UpdateExpression: 'set #n = :n',
    ExpressionAttributeNames: { '#n': 'num_likes' },
    ExpressionAttributeValues: {
      ':n': parseInt(number_likes + 1)
    }
  };

  docClient.update(params, function(err) {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      console.log('updated articles table');
      callback(null);
    }
  });
};

var unlikeArticleDB = function(article_id, username, number_likes, callback) {
  //update article_likes table
  var params = {
    TableName: 'article_likes_by_username',
    Key: {
      article_id: article_id,
      username: username
    }
  };

  //put into table
  docClient.delete(params, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('no error, added to articles likes by username');
    }
  });

  //update article_likes table
  var params = {
    TableName: 'article_likes_by_article_id',
    Key: {
      article_id: article_id,
      username: username
    }
  };

  //put into table
  docClient.delete(params, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('no error, added to articles likes by article id');
    }
  });

  //update articles table with num likes
  var params = {
    TableName: 'news_articles',
    Key: {
      article_id: article_id
    },
    UpdateExpression: 'set #n = :n',
    ExpressionAttributeNames: { '#n': 'num_likes' },
    ExpressionAttributeValues: {
      ':n': parseInt(number_likes - 1)
    }
  };

  docClient.update(params, function(err) {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      console.log('updated articles table');
      callback(null);
    }
  });
};

//return whether article id is liked by user or not
var isLiked = function(article_id, username, callback) {
  var params1 = {
    TableName: 'article_likes_by_username',
    KeyConditionExpression: 'article_id = :article_id and username = :user',
    ExpressionAttributeValues: {
      ':article_id': article_id,
      ':user': username
    }
  };

  //if found, return true
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
  likeArticleDB: likeArticleDB,
  unlikeArticleDB: unlikeArticleDB,
  isLiked: isLiked
};

module.exports = database;
