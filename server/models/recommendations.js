const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10', region: 'us-east-1' });

/**
 * 
 * @param {String} username 
 * @param {function} callback 
 * @description get news article recommendations for a 
 * particular user
 */
function getRecommendations(username, callback) {
  const recIdParams = {
    TableName: 'recommendations',
    Key: {
      username: { S: username }
    }
  };
  ddb.getItem(recIdParams, (err, data) => {
    console.log(data);
    if (err) {
      callback(err, null);
    } else {
      console.log(data);
      let articleIDs = data.Item.article_ids.SS;
      let recItemsParams = {
        TableName: 'news_articles',
        Key: {
          article_id: { S: null }
        }
      };
      let articleItems = [];
      let errorHappened = false;
      let requestSent = 0;
      // console.log(articleIDs);
      articleIDs.forEach((a) => {
        recItemsParams.Key.article_id.S = a;
        ddb.getItem(recItemsParams, (err, data) => {
          requestSent++;
          if (err) {
            errorHappened = true;
          } else {
            articleItems.push(data.Item);
            if (requestSent === articleIDs.length) {
              // console.log(articleItems);
              if (articleItems.length == 0 && errorHappened) {
                callback(err, null);
              } else {
                callback(null, articleItems);
              }
            }
          }
        });
      });
    }
  });
}

module.exports = {
  getRecommendations
};
