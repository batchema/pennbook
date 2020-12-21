var comments_db = require('../models/comments.js');
var post_likes_db = require('../models/posts_likes.js');
var comment_likes_db = require('../models/comments-likes.js');
var article_likes_db = require('../models/articles-likes.js');
var accounts_db = require('../models/accounts.js');

var commentOnPost = function(req, res) {
  // input: post_id, post timestamp, commenter_username, timestamp, content
  // output: errorCode/okStatus
  // DB used: posts/status updates, comments

  var post_id = req.body.postID;
  var post_timestamp = req.body.postTimestamp;

  var commenter_username = req.user.username;
  var commenter_full_name = req.user.fullname;

  var content = req.body.content;

  //Add a comment
  comments_db.addCommentDB(
    post_id,
    post_timestamp,
    commenter_username,
    content,
    commenter_full_name,
    function(err) {
      if (err) {
        console.log(err);
        res.status(403).json({ success: false });
      } else {
        console.log('added comment: ' + content);
        //User last active timestamp
        accounts_db.lastActive(commenter_username, function(err) {
          if (err) {
            console.log(err);
            res.status(403).json({ success: false });
          } else {
            res.status(200).json({ success: true });
          }
        });
      }
    }
  );
};

var likeAPost = function(req, res) {
  // input: liker username, post_id
  // output: errorCode/okStatus
  // DB used: posts/status updates, post_likes

  var post_id = req.body.postID;
  var post_timestamp = req.body.postTimestamp;

  var username = req.user.username;

  //Get the number of likes
  post_likes_db.getNumLikes(post_id, post_timestamp, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      //use number of likes to update number of likes and add like to table
      post_likes_db.updateNumLikes(
        post_id,
        post_timestamp,
        username,
        data.num,
        function(err) {
          if (err) {
            console.log(err);
            res.status(403).json({ success: false });
          } else {
            console.log('added like');
            //update last active timestamp
            accounts_db.lastActive(username, function(err) {
              if (err) {
                console.log(err);
                res.status(403).json({ success: false });
              } else {
                res.status(200).json({ success: true });
              }
            });
          }
        }
      );
    }
  });
};

var unlikeAPost = function(req, res) {
  // input: liker username, post_id
  // output: errorCode/okStatus
  // DB used: posts/status updates, post_likes

  var post_id = req.body.postID;
  var post_timestamp = req.body.postTimestamp;
  var username = req.user.username;

  //get num likes on post
  post_likes_db.getNumLikes(post_id, post_timestamp, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      //delete like from tables and update num likes
      post_likes_db.deleteLike(
        post_id,
        post_timestamp,
        username,
        data.num,
        function(err) {
          if (err) {
            console.log(err);
            res.status(403).json({ success: false });
          } else {
            console.log('deleted like');
            //update last active timestamp
            accounts_db.lastActive(username, function(err) {
              if (err) {
                console.log(err);
                res.status(403).json({ success: false });
              } else {
                res.status(200).json({ success: true });
              }
            });
          }
        }
      );
    }
  });
};

var likeAComment = function(req, res) {
  // input: liker username, comment_id
  // output: errorCode/okStatus
  // DB used: comments, comments_likes
  var post_id = req.body.postID;
  var post_timestamp = req.body.postTimestamp;
  var comment_timestamp = req.body.commentTimestamp;
  var username = req.user.username;

  //get number of likes on comment
  comment_likes_db.getNumLikes(
    post_id,
    post_timestamp,
    comment_timestamp,
    function(err, data) {
      if (err) {
        console.log(err);
      } else {
        //use num likes to update num likes and add like to comment_likes table
        comment_likes_db.likeCommentDB(
          post_id,
          post_timestamp,
          comment_timestamp,
          username,
          data.num,
          function(err) {
            if (err) {
              console.log(err);
              res.status(403).json({ success: false });
            } else {
              console.log('added like to comment');
              //update last active timestamp
              accounts_db.lastActive(username, function(err) {
                if (err) {
                  console.log(err);
                  res.status(403).json({ success: false });
                } else {
                  res.status(200).json({ success: true });
                }
              });
            }
          }
        );
      }
    }
  );
};

var unlikeAComment = function(req, res) {
  // input: liker username, comment_id
  // output: errorCode/okStatus
  // DB used: comments, comments_likes
  var post_id = req.body.postID;
  var post_timestamp = req.body.postTimestamp;
  var comment_timestamp = req.body.commentTimestamp;
  var username = req.user.username;

  //get number of likes
  comment_likes_db.getNumLikes(
    post_id,
    post_timestamp,
    comment_timestamp,
    function(err, data) {
      if (err) {
        console.log(err);
      } else {
        //delete like from comment_likes table and update num likes
        comment_likes_db.unlikeCommentDB(
          post_id,
          post_timestamp,
          comment_timestamp,
          username,
          data.num,
          function(err) {
            if (err) {
              console.log(err);
              res.status(403).json({ success: false });
            } else {
              console.log('unliked comment');
              //update last active timestamp
              accounts_db.lastActive(username, function(err) {
                if (err) {
                  console.log(err);
                  res.status(403).json({ success: false });
                } else {
                  res.status(200).json({ success: true });
                }
              });
            }
          }
        );
      }
    }
  );
};

var likeAnArticle = function(req, res) {
  // input: liker username, article_id (headline, author, date)
  // output: errorCode/okStatus
  // DB used: article_likes_by_username, article_likes_by_article_id

  var article_id = req.body.article_id;
  var username = req.user.username;

  //get num likes
  article_likes_db.getNumLikes(article_id, function(err, data) {
    if (err) {
      console.log('err: ' + err);
    } else {
      //add like to tables
      article_likes_db.likeArticleDB(article_id, username, data.num, function(
        err
      ) {
        if (err) {
          console.log(err);
          res.status(403).json({ success: false });
        } else {
          console.log('liked article');
          //update last active timestamp
          accounts_db.lastActive(username, function(err) {
            if (err) {
              console.log(err);
              res.status(403).json({ success: false });
            } else {
              res.status(200).json({ success: true });
            }
          });
        }
      });
    }
  });
};

var unlikeAnArticle = function(req, res) {
  // input: liker username, article_id (headline, author, date)
  // output: errorCode/okStatus
  // DB used: article_likes_by_username, article_likes_by_article_id

  var article_id = req.body.article_id;
  var username = req.user.username;

  //get num likes
  article_likes_db.getNumLikes(article_id, function(err, data) {
    if (err) {
      console.log('err: ' + err);
    } else {
      //delete like from tables
      article_likes_db.unlikeArticleDB(article_id, username, data.num, function(
        err
      ) {
        if (err) {
          console.log(err);
          res.status(403).json({ success: false });
        } else {
          console.log('liked article');
          //update last active timestamp
          accounts_db.lastActive(username, function(err) {
            if (err) {
              console.log(err);
              res.status(403).json({ success: false });
            } else {
              res.status(200).json({ success: true });
            }
          });
        }
      });
    }
  });
};

var getCommentsOnPost = function(req, res) {
  var post_id = req.query.postID;
  var post_timestamp = req.query.postTimestamp;
  var username = req.user.username;

  //get comments from a post id and timestamp
  comments_db.getComments(post_id, post_timestamp, function(err, data) {
    if (err) {
      console.log(err);
      res.status(403).json({ success: false });
    } else {
      //update last active timestamp
      accounts_db.lastActive(username, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ success: false });
        } else {
          res.status(200).json({ success: data });
        }
      });
    }
  });
};

var isPostLiked = function(req, res) {
  var post_id = req.query.postID;
  var post_timestamp = req.query.postTimestamp;
  var username = req.user.username;

  //check if post is liked
  post_likes_db.isLiked(post_id, post_timestamp, username, function(err, data) {
    if (err) {
      console.log(err);
      res.status(403).json({ success: false });
    } else {
      //update last active timestamp
      accounts_db.lastActive(username, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ success: false });
        } else {
          //return isLiked
          res.status(200).json({ success: true, isLiked: data.isLiked });
        }
      });
    }
  });
};

var isArticleLiked = function(req, res) {
  var article_id = req.query.article_id;
  var username = req.user.username;

  //check if article is liked by user
  article_likes_db.isLiked(article_id, username, function(err, data) {
    if (err) {
      console.log(err);
      res.status(403).json({ success: false });
    } else {
      //update last active timestamp
      accounts_db.lastActive(username, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ success: false });
        } else {
          res.status(200).json({ success: true, isLiked: data.isLiked });
        }
      });
    }
  });
};

var isCommentLiked = function(req, res) {
  var post_id = req.query.postID;
  var post_timestamp = req.query.postTimestamp;
  var comment_timestamp = req.query.commentTimestamp;
  var username = req.user.username;

  //check if comment is liked by user
  comment_likes_db.isLiked(
    post_id,
    post_timestamp,
    comment_timestamp,
    username,
    function(err, data) {
      if (err) {
        console.log(err);
        res.status(403).json({ success: false });
      } else {
        //update last active timestamp
        accounts_db.lastActive(username, function(err) {
          if (err) {
            console.log(err);
            res.status(403).json({ success: false });
          } else {
            res.status(200).json({ success: true, isLiked: data.isLiked });
          }
        });
      }
    }
  );
};

var numLikesOnArticle = function(req, res) {
  var article_id = req.query.article_id;
  var username = req.user.username;

  //get num likes on article
  article_likes_db.getNumLikes(article_id, function(err, data) {
    if (err || data === null) {
      console.log(err);
      res.status(403).json({ success: false });
    } else {
      //update last active timestamp
      accounts_db.lastActive(username, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ success: false });
        } else {
          res.status(200).json({ success: true, num_likes: data.num });
        }
      });
    }
  });
};

var routes = {
  post_commentonpost: commentOnPost,
  post_likepost: likeAPost,
  post_unlikepost: unlikeAPost,
  post_likecomment: likeAComment,
  post_unlikecomment: unlikeAComment,
  post_likearticle: likeAnArticle,
  post_unlikearticle: unlikeAnArticle,
  get_commentsonpost: getCommentsOnPost,
  get_ispostliked: isPostLiked,
  get_isarticleliked: isArticleLiked,
  get_iscommentliked: isCommentLiked,
  get_numlikesonarticle: numLikesOnArticle
};

module.exports = routes;
