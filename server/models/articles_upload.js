const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10', region: 'us-east-1' });

function _sanitizeArticleKey(key) {
  const ret = (' ' + key).slice(1);
  return ret.replace(/[\W_]+/g, '');
}

// callsback with success status
function uploadArticle(
  category,
  headline,
  authors,
  link,
  short_description,
  date,
  callback
) {
  if (!headline) {
    callback('empty headline', null);
    return;
  }
  if (!authors) {
    callback('empty authors', null);
    return;
  }
  if (!date) {
    callback('empty date', null);
    return;
  }
  if (!link) {
    callback('empty link', null);
    return;
  }

  const params = {
    TableName: 'news_articles',
    Item: {
      article_id: {
        S:
          _sanitizeArticleKey(headline) +
          _sanitizeArticleKey(authors) +
          _sanitizeArticleKey(date)
      },
      date: { S: date },
      category: { S: category },
      headline: { S: headline },
      authors: { S: authors },
      link: { S: link },
      short_description: { S: short_description }
    }
  };
  // console.log(params.Item.article_id);

  ddb.putItem(params, (err, data) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
}

function likeArticle(_id, username) {
  // Put (_id, username) in article_likes by _id table
  // Put (_id, username) in article_likes by username table
}

function unlikeArticle(_id, username) {
  // remove (_id, username) in article_likes by _id table
  // remove (_id, username) in article_likes by username table
}

// callsback with article data
function getArticle(articleId, callback) {}

// get Articles for user
function querUserArticles(userID, callback) {}

module.exports = {
  uploadArticle: uploadArticle
};
