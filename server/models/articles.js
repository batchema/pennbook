// articles database management functions

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

var docClient = new AWS.DynamoDB.DocumentClient();
var stemmer = require('stemmer');

// Get all articles in news_articles table
var scanAllArticles = function(callback) {
  var params = {
    TableName: 'news_articles'
  };
  params.ConsistentRead = true;
  var allArticlesData = [];
  docClient.scan(params, cb);

  function cb(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      for (let i = 0; i < data.Items.length; i++) {
        allArticlesData.push(data.Items[i]);
      }
      // If more items remain, set LastEvaluatedKey to keep scanning
      if (typeof data.LastEvaluatedKey !== 'undefined') {
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        docClient.scan(params, cb);
      } else {
        callback(err, allArticlesData);
      }
    }
  }
};

// create Put Requests out of each keyword
var createPutRequests = function(allArticles, callback) {
  var putRequests = [];

  // Iterate through every article
  for (var i = 0; i < allArticles.length; i++) {
    // Extract attributes about article
    var article = allArticles[i];
    var keywordsAdded = new Set();
    var article_id = article['article_id'];
    var link = article['link'];
    var headline = article['headline'];
    var date = article['date'];
    var authors = article['authors'];
    var short_description = article['short_description'];
    var category = article['category'];
    var headlineKeywords = headline.split(' ');
    var validKeywords = [];
    // Iterate through keywords in headline
    headlineKeywords.forEach(function(keyword) {
      var currkeyword = keyword.toLowerCase();
      // Only keep valid alphanumeric words and non-stop words
      if (isValidWord(currkeyword) && !isStopWord(currkeyword)) {
        validKeywords.push(currkeyword);
      }
    });
    // Apply stemmer to each keyword
    var stemmedWords = [];
    validKeywords.forEach(function(validWord) {
      stemmedWords.push(stemmer(validWord));
    });
    // Create put request out of new keyword of article
    stemmedWords.forEach(function(stemmedWord) {
      // Check if item for this keyword and article doesn't exist
      if (!keywordsAdded.has(stemmedWord)) {
        putRequests.push({
          PutRequest: {
            Item: {
              keyword: stemmedWord,
              article_id: article_id,
              headline: headline,
              url: link,
              date: date,
              authors: authors,
              short_description: short_description,
              category: category
            }
          }
        });
        keywordsAdded.add(stemmedWord);
      }
    });
    keywordsAdded.clear();
  }
  callback(null, putRequests);
};

// Batch write groups of 25 keyword items to articles_keyword table
async function batchWrite(allKeywords, callback) {
  var err, resp;
  var itemsWritten = 0;
  var counter = 0;
  var itemWriteRequests = [];
  var totalCount = allKeywords.length;

  await asyncForEach(allKeywords, async (keyword) => {
    itemWriteRequests.push(keyword);
    counter++;
    itemsWritten++;

    if (counter % 25 === 0 || itemsWritten === totalCount) {
      [ err, resp ] = await to(batchWrite25(itemWriteRequests));
      if (err) {
        callback(err, 'loading failed');
      } else {
        counter = 0;
        itemWriteRequests = [];
      }
    }
  });
  callback(null, 'loading complete');
}

// Create params to batch write group of 25 keywords
async function batchWrite25(articles25) {
  var err, resp;
  var params = {
    RequestItems: {
      articles_keyword: articles25
    }
  };

  [ err, resp ] = await to(docClient.batchWrite(params).promise());
}

async function asyncForEach(array, callback) {
  for (var index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

// Extract data result from promise
function to(promise) {
  return promise
    .then((data) => {
      return [ null, data ];
    })
    .catch((err) => [ err ]);
}

// Returns true if word is valid (only letters and numbers)
var isValidWord = function(word) {
  var letters = /^[a-z]+$/;
  if (word.match(letters)) {
    return true;
  } else {
    return false;
  }
};

// Returns true if word is a stop word
var isStopWord = function(word) {
  if (
    word === 'a' ||
    word === 'all' ||
    word === 'any' ||
    word === 'but' ||
    word === 'the'
  ) {
    return true;
  } else {
    return false;
  }
};

// Sort news search result articles
var articleSorter = function(articleOne, articleTwo) {
  // Compare number of keywords an article matched on
  if (articleOne[1].length < articleTwo[1].length) {
    return 1;
  } else if (articleOne[1].length > articleTwo[1].length) {
    return -1;
  } else {
    // If number of matching keywords match, sort by reverse date order
    var date1 = Date.parse(articleOne[1][0]['date']);
    var date2 = Date.parse(articleTwo[1][0]['date']);
    if (date1 < date2) {
      return 1;
    } else if (date1 > date2) {
      return -1;
    } else {
      return 0;
    }
  }
};

// Find a set of news articles for a particular search query and page
function queryNewsArticles(queries, page, callback) {
  var articleResults = [];
  var cleanQueries = [];
  // Iterate through all query words and filter out invalid/stop words
  queries.forEach((query) => {
    query = query.toLowerCase();
    if (isValidWord(query) && !isStopWord(query)) {
      cleanQueries.push(stemmer(query));
    }
  });

  // Create sorted string of clean search queries
  cleanQueries.sort();
  var sortedQueries = cleanQueries.join(' ');

  // Check if sortedQueries is in cache table
  var cacheParams = {
    TableName: 'search_cache',
    KeyConditionExpression: '#q = :qu',
    ExpressionAttributeNames: {
      '#q': 'query'
    },
    ExpressionAttributeValues: {
      ':qu': sortedQueries
    }
  };
  docClient.query(cacheParams, function(err, data) {
    if (err) {
      callback(err, null);
    } else if (data.Items.length === 0) {
      // query not already in cache
      var queryCount = 0;
      var totalQueries = cleanQueries.length;
      // For each keyword, create params to query articles_keyword with
      cleanQueries.forEach((queryWord) => {
        var params = {
          TableName: 'articles_keyword',
          KeyConditionExpression: '#k = :key',
          ExpressionAttributeNames: {
            '#k': 'keyword'
          },
          ExpressionAttributeValues: {
            ':key': queryWord
          }
        };
        docClient.query(params, function(err, data) {
          if (err) {
            callback(err, null);
          } else {
            queryCount++;
            data.Items.forEach((item) => {
              articleResults.push(item);
            });
            if (queryCount === totalQueries) {
              var frequencyMap = new Map(); // article id -> list of articles
              // Add article to frequency map
              articleResults.forEach((article) => {
                if (frequencyMap.has(article['article_id'])) {
                  var array = frequencyMap.get(article['article_id']);
                  array.push(article);
                  frequencyMap.set(article['article_id'], array);
                } else {
                  frequencyMap.set(article['article_id'], [ article ]);
                }
              });
              var frequencyMapArray = [];
              for (var entry of frequencyMap) {
                frequencyMapArray.push(entry);
              }
              // Sort articles result by number of matches, then date
              frequencyMapArray.sort(articleSorter);
              frequencyMap = new Map(frequencyMapArray);
              articleResults = [];
              for (var entry of frequencyMap.values()) {
                articleResults.push(entry[0]);
              }

              var articleIds = [];
              articleResults.forEach((article) =>
                articleIds.push([ article['article_id'], article['date'] ])
              );

              // Add articleIds to cache
              var addCacheParams = {
                TableName: 'search_cache',
                Item: {
                  query: sortedQueries,
                  articles: articleIds
                }
              };
              docClient.put(addCacheParams, function(err1, data1) {
                if (err1) {
                  console.log(err1);
                  callback(err1, null);
                } else {
                  // Added results to cache
                  // Add four years to each date
                  articleResults.forEach((article) => {
                    var year = parseInt(article['date'].substring(0, 4)) + 4;
                    var newDate = year + '' + article['date'].substring(4);
                    article['date'] = newDate;
                  });
                  // Filter out article results <= current date
                  var currDate = new Date().getTime();
                  var filteredDateResults = articleResults.filter(
                    (article) => Date.parse(article['date']) <= currDate
                  );
                  // Index by page number
                  var pagedResults = filteredDateResults.slice(
                    page * 10,
                    page * 10 + 10
                  );
                  callback(null, pagedResults);
                }
              });
            }
          }
        });
      });
    } else {
      // Search result already in cache
      var cachedResults = data.Items[0].articles;

      // Add four years to each date
      cachedResults.forEach((article) => {
        var year = parseInt(article[1].substring(0, 4)) + 4;
        var newDate = year + '' + article[1].substring(4);
        article[1] = newDate;
      });

      // Filter out article results <= current date
      var currDate = new Date().getTime();
      var filteredDateResults = cachedResults.filter(
        (article) => Date.parse(article[1]) <= currDate
      );

      // Index by page number
      var pagedResults = filteredDateResults.slice(page * 10, page * 10 + 10);

      getCachedArticles(pagedResults, function(err, data) {
        if (err) {
          console.log(err);
          callback(err, null);
        } else {
          // Add four years to each date
          data.forEach((article) => {
            var year = parseInt(article['date'].substring(0, 4)) + 4;
            var newDate = year + '' + article['date'].substring(4);
            article['date'] = newDate;
          });
          callback(null, data);
        }
      });
    }
  });
}

async function getCachedArticles(articleIds, callback) {
  var cachedArticles = [];
  for (var i = 0; i < articleIds.length; i++) {
    try {
      var params = {
        TableName: 'news_articles',
        KeyConditionExpression: '#id = :id',
        ExpressionAttributeNames: {
          '#id': 'article_id'
        },
        ExpressionAttributeValues: {
          ':id': articleIds[i][0]
        }
      };
      await docClient
        .query(params)
        .promise()
        .then((data) => cachedArticles.push(data.Items[0]));
    } catch (err) {
      callback(err, null);
    }
  }
  callback(null, cachedArticles);
}

var database = {
  scanAllArticles: scanAllArticles,
  createPutRequests: createPutRequests,
  batchWrite: batchWrite,
  queryNewsArticles: queryNewsArticles
};

module.exports = database;
