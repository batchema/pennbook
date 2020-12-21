var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var http = require('http');
var socketIO = require('socket.io');
var cors = require('cors');

var path = require('path');


const recRoute = require('./routes/recommendations_routes');
const aws_config = require('./models/utils/aws_config');
const { authenticateJWT } = require('./utils/jwt.js');

/** initialize AWS */
aws_config.initAWS();

// ROUTES
var login_routes = require('./routes/login_routes.js');
var account_routes = require('./routes/account_routes.js');
var wall_home_routes = require('./routes/wall_home_routes.js');
var comments_likes_routes = require('./routes/comments_likes_routes.js');
var search_routes = require('./routes/search_routes.js');
var friends_routes = require('./routes/friends_routes.js');
var visualizer_routes = require('./routes/visualizer_routes.js');
var news_feed_routes = require('./routes/news_feed_routes.js');
var chat_routes = require('./routes/chat_routes.js');
const { AppConfig } = require('aws-sdk');

// SOCKET IO SETUP
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: [ 'GET', 'POST' ],
    credentials: true
  }
});

io.on('connection', function(socket) {
  socket.on('joinRooms', (message) => {
    //        console.log(message);
    message.chats.forEach((chat) => {
      // console.log(chat);
      socket.join(chat._id);
    });

    console.log(message.username);
    console.log(socket.rooms);
  });

  socket.on('message', (message) => {
    io.to(message._id).emit('message', message);
  });
});

//SESSIONS
app.use(
  session({
    secret: 'nets212pennbookG03',
    resave: true,
    saveUninitialized: true
  })
);

app.use(bodyParser.json());

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(
  cors({
    origin: [ '*', 'http://localhost:3000' ],
    methods: [ 'GET', 'POST' ],
    credentials: true // enable set cookie
  })
);

//session
app.use(
  session({
    secret: 'test',
    resave: true,
    saveUninitialized: true
  })
);

app.use(express.static(path.join(__dirname, 'build')))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// LOGIN
app.post('/checklogin', login_routes.post_checklogin);
app.get('/loggedin', authenticateJWT, login_routes.get_loggedinuser);
app.get('/logout', login_routes.get_logout);

// ACCOUNT CHANGES
app.post('/createaccount', account_routes.post_createaccount);
app.get('/accountdetails', authenticateJWT, account_routes.post_accountdetails);
app.post(
  '/changeaffiliation',
  authenticateJWT,
  account_routes.post_changeaffiliation
);
app.post(
  '/changeinterests',
  authenticateJWT,
  account_routes.post_changeinterests
);
app.post('/changeemail', authenticateJWT, account_routes.post_changeemail);
app.post(
  '/changepassword',
  authenticateJWT,
  account_routes.post_changepassword
);
app.get('/getonlinestatus', authenticateJWT, account_routes.get_onlinestatus);
app.post(
  '/changeonlinestatus',
  authenticateJWT,
  account_routes.post_changeonlinestatus
);
app.get('/getallusernames', authenticateJWT, account_routes.get_allusernames);

// WALL AND HOME PAGE
app.post('/poststatusupdate', wall_home_routes.post_statusupdate);
app.get(
  '/getallpostsandstatushome',
  authenticateJWT,
  wall_home_routes.get_postsandstatushome
);
app.get(
  '/getallpostsandstatuswall',
  authenticateJWT,
  wall_home_routes.get_postsandstatuswall
);
app.get(
  '/getnewfriendships',
  authenticateJWT,
  wall_home_routes.get_newfriendships
);
app.post('/makenewpost', authenticateJWT, wall_home_routes.post_makepost);
app.get(
  '/getallonlinefriends',
  authenticateJWT,
  wall_home_routes.get_allonlinefriends
);

// COMMENTS AND LIKES
app.post('/comment', authenticateJWT, comments_likes_routes.post_commentonpost);
app.post('/likepost', authenticateJWT, comments_likes_routes.post_likepost);
app.post('/unlikepost', authenticateJWT, comments_likes_routes.post_unlikepost);
app.post(
  '/likecomment',
  authenticateJWT,
  comments_likes_routes.post_likecomment
);
app.post(
  '/unlikecomment',
  authenticateJWT,
  comments_likes_routes.post_unlikecomment
);
app.post(
  '/likearticle',
  authenticateJWT,
  comments_likes_routes.post_likearticle
);
app.post(
  '/unlikearticle',
  authenticateJWT,
  comments_likes_routes.post_unlikearticle
);
app.get(
  '/commentsonpost',
  authenticateJWT,
  comments_likes_routes.get_commentsonpost
);
app.get('/isPostLiked', authenticateJWT, comments_likes_routes.get_ispostliked);
app.get(
  '/isCommentLiked',
  authenticateJWT,
  comments_likes_routes.get_iscommentliked
);
app.get(
  '/isArticleLiked',
  authenticateJWT,
  comments_likes_routes.get_isarticleliked
);
app.get(
  '/numlikesarticle',
  authenticateJWT,
  comments_likes_routes.get_numlikesonarticle
);

// SEARCH
app.get("/getsearchsuggs", authenticateJWT, search_routes.get_searchsuggestions);

// FRIENDS
app.post('/addfriend', authenticateJWT, friends_routes.post_addfriend);
app.post('/removefriend', authenticateJWT, friends_routes.post_removefriend);
app.get(
  '/getcurrentfriends',
  authenticateJWT,
  friends_routes.get_currentfriends
);
app.post('/acceptfriend', authenticateJWT, friends_routes.post_acceptfriend);
app.post('/rejectfriend', authenticateJWT, friends_routes.post_rejectfriend);
app.get(
  '/getpendingrequests',
  authenticateJWT,
  friends_routes.get_pendingrequests
);
app.get(
  '/getfriendshipstatus',
  authenticateJWT,
  friends_routes.get_friendshipstatus
);

// VISUALIZER
app.get(
  '/getnewuserstovisualize',
  authenticateJWT,
  visualizer_routes.get_newuserstovisualize
);

// NEWS FEEDS
app.get('/getnewsarticle', authenticateJWT, news_feed_routes.get_newsarticle);
app.get('/getsnewsrec', authenticateJWT, news_feed_routes.get_newsrec);
app.post('/newssearch', authenticateJWT, news_feed_routes.post_newssearch);
app.get(
  '/getloadallkeywords',
  authenticateJWT,
  news_feed_routes.get_loadallkeywords
);

// News Recommendations System

// get recommendations
app.get('/get-recommendations', authenticateJWT, recRoute.get_recommendations);

// update recommendations
app.post('/update-recommendations', authenticateJWT, (req, res) => {
  recRoute.update_recommendations(req, res, (allWentWell) => {
    if (allWentWell)
    console.log(`On demand recommendations update finished WITHOUT issues at ${Date.now()}`);
    else 
    console.log(`On demand recommendations update finished WITH issues at ${Date.now()}`);
  });
});

// Update recommendations every 1h
(function updateRecommendations() {
  console.log('***Executing a new scheduled adsorption job***');
  recRoute.update_recommendations(null, null, (err, stderr, stdout) => {
    if (err) console.log(`err at ${Date.now()}: ${err}`);
    if (stderr) console.log(`stderr at ${Date.now()}: ${stderr}`);
    console.log(`Everything went right at ${Date.now()}: ${stdout}`);
  });
  console.log('***Finished scheduled adsorption job***');
  setTimeout(updateRecommendations, 60 * 60 * 1000);
})();


// CHAT
app.get('/getchats', authenticateJWT, chat_routes.get_chats);
app.get('/getmessages', authenticateJWT, chat_routes.get_messages);
app.post('/sendmessage', authenticateJWT, chat_routes.post_sendmessage);
app.post('/newchat', authenticateJWT, chat_routes.post_newchat);
app.post('/adduser', authenticateJWT, chat_routes.post_adduser);
app.post('/removeuser', authenticateJWT, chat_routes.post_removeuser);
app.post('/readchat', authenticateJWT, chat_routes.post_readchat);
app.get('/getchat', authenticateJWT, chat_routes.get_chat);

server.listen(process.env.SERVER_PORT);
console.log(`Server running on port ${process.env.SERVER_PORT}.`);

/*********************************************************************/
module.exports = app;
