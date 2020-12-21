var accounts_db = require('../models/accounts.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { accessTokenSecret } = require('../utils/jwt.js');

var checkLogin = function(req, res) {
    // input: username, password
    // output: errorCode/okStatus
    // DB used: accounts
    var username = req.body.username;
    var password = req.body.password;

    //look up user's password in db
    accounts_db.userLookup(username, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({login: false});
        } else if (data) {
            //check to see if encrypted password hashes correctly to pw entered
            bcrypt.compare(password, data.password, function(err, result) {
                console.log(data.password);
                //if true
                if (result) {
                    //update last active timestamp
                    accounts_db.lastActive(username, function(err) {
                        if (err) {
                            console.log(err);
                            res.status(403).json({success: false});
                        } else {
                            //return user and access token
                            const accessToken = jwt.sign({ username: username, fullname: data.firstname + " " + data.lastname }, accessTokenSecret, {expiresIn: 60*60*4});
                            res.status(200).json({accessToken: accessToken, username: username, login: true});  

                        }
                    });
                } else {
                    res.status(200).json({login: false});
                }
            });

        } else {
            res.status(200).json({login: false});
        }
    });
    
};

var loggedInUser = function(req, res) {

    // input: N/A
    // output: username of logged in user, null otherwise
    var username = req.user.username;
    var fullname = req.user.fullname;

    //update last active timestamp
    accounts_db.lastActive(username, function(err) {
        if (err) {
            console.log(err);
            res.status(403).json({success: false});
        } else {
            res.status(200).json({user: username, fullname: fullname});
        }
    });

}
  
// input: username
// output: errorCode/okStatus
// DB used: accounts
var logout = function(req, res) {
    
    res.status(200).send();

};

  
var routes = { 
    post_checklogin: checkLogin,
    get_loggedinuser: loggedInUser,
    get_logout: logout
};

module.exports = routes;