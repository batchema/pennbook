var accounts_db = require('../models/accounts.js');
var news_db = require('../models/articles.js');
const recommendationsModel = require('../models/recommendations');

var fetchNewsArticle = function(req, res) {
  // input: current month, day, year
  // output: news article
  // DB used: news_articles
};

var getNewsRecommendation = function(req, res) {
  // input: news category, current month, day, year
  // output: articles with that category on that date
  // DB used: news_articles
//   const username = req.query.username ? req.query.username : req.user.username;
//   recommendationsModel.getRecommendations(username, (err, data) => {
//     if (err) {
//       res.send(null);
//     } else {
//       res.send(data);
//     }
//   });
};

// Get news article search results for specific query and page
var newsSearch = function(req, res) {
  var searchTerms = req.body.queries;
  var page = req.body.page;
  var username = req.user.username;

  news_db.queryNewsArticles(searchTerms, page, function(err, data) {
    if (err) {
      console.log(err);
      res.status(403).json({ articles: null });
    } else {
      // Update last active timestamp
      accounts_db.lastActive(username, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ articles: null });
        } else {
          res.status(200).json({ articles: data });
        }
      });
    }
  });
};

// Load all items into articles_keyword table
var loadAllKeywords = function(req, res) {
  var username = req.user.username;
  news_db.scanAllArticles(function(err, data) {
    if (err) {
      console.log(err);
      res.status(403).json({ loaded: false });
    } else {
      news_db.createPutRequests(data, function(err1, data1) {
        if (err1) {
          console.log(err1);
          res.status(403).json({ loaded: false });
        } else {
          news_db.batchWrite(data1, function(err2, data2) {
            if (err2) {
              console.log(err2);
              res.status(403).json({ loaded: false });
            } else {
              accounts_db.lastActive(username, function(err) {
                if (err) {
                  console.log(err);
                  res.status(403).json({ articles: null });
                } else {
                  res.status(200).json({ loaded: true });
                }
              });
            }
          });
        }
      });
    }
  });
};

var routes = {
  get_newsarticle: fetchNewsArticle,
  get_newsrec: getNewsRecommendation,
  post_newssearch: newsSearch,
  get_loadallkeywords: loadAllKeywords
};

module.exports = routes;
