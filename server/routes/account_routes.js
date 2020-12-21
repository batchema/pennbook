var accounts_db = require('../models/accounts.js');
var posts_db = require('../models/posts');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// input: username, password, email, dob, affiliation, interests, first name, last name
// output: errorCode/okStatus
// DB used: accounts
var createAccount = function(req, res) {

    var username = req.body.username;
    var password = req.body.password;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var dob = req.body.dob;
    var affiliation = req.body.affiliation;
    var interests = req.body.interests;

          //check if username does not already exist
          //look up combo in users table
          accounts_db.userLookup(username, function(err, data) {
            if (err) {
                console.log("err");
            }  else if (data == null) {
                //does not already exist 
                //call sign up function 
                console.log("Username does not already exist");
                //encrypt password
                bcrypt.genSalt(saltRounds, function(err, salt) {
                    bcrypt.hash(password, salt, function(err, hash) {
                        if (err) {
                            console.log("hash didn't work");
                        } else {
                            password = hash;
                            console.log("pw hashed to: " + password);

                            console.log(password);
                            accounts_db.userSignup(username, password, firstname, lastname, email, dob, affiliation, interests, function(err) {
                                 if (err) {
                                    console.log("error: " + err);
                                    res.status(400).send();
                                } else {
                                //signed up
                                    console.log("successfully added");

                                    accounts_db.userSearch(username, firstname, lastname, function(err) {
                                        if (err) {
                                            console.log(err);
                                            res.status(403).send();
                                        } else {
                                            accounts_db.lastActive(username, function(err) {
                                                if (err) {
                                                    console.log(err);
                                                    res.status(403).json({success: false});
                                                } else {
                                                    res.status(200).send({username: username});
                                                }
                                            });
                                        }
                                    });
                                }
                            });   
                        }
                    });
                });
                 
            } else {
                //username already exists 
                console.log("username already exists");
                res.status(200).send({username: null});
            }
        });
          
}; 

var accountDetails = function(req, res) {
    // input: username
    // output: username, password, email, dob, affiliation, interests, first name, last name
    // DB used: accounts

    var username = req.query.username ? req.query.username : req.user.username;

    accounts_db.userLookup(username, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({username: null});
        } else if (data) {
            accounts_db.lastActive(username, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({
                        username: username, 
                        email: data.email,
                        dob: data.dob,
                        affiliation: data.affiliation,
                        interests: data.interests,
                        firstname: data.firstname,
                        lastname: data.lastname
                    });                
                }
            });
            
        } else {
            accounts_db.lastActive(username, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({username: null});
                }
            });
        }
    });


}

// Change the affiliation of a user
var changeAffiliation = function(req, res) {
    var username = req.user.username;
    var affiliation = req.body.affiliation;

    accounts_db.updateUserAffiliation(username, affiliation, function(err, data) {
        if (err){
            console.log(err);
            res.status(403).json({changed: false});
        } else {
            // Update last active timestamp
            accounts_db.lastActive(username, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({changed: true});
                }
            });
        }
    });
};

// Change the email of a user
var changeEmail = function(req, res) {
    var username = req.user.username;
    var email = req.body.email;

    accounts_db.updateUserEmail(username, email, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({changed: false});
        } else {
            // Update last active timestamp
            accounts_db.lastActive(username, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({changed: true});
                }
            });
        }
    });
};

// Change the interests of a user
var changeInterests = function(req, res) {
    var username = req.user.username;
    var fullname = req.user.fullname;

    var oldInterests = req.body.oldInterests;
    var newInterests = req.body.newInterests;

    accounts_db.changeInterests(username, newInterests, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({changed: false});
        } else {
            // Post a status update for each new interest
            var diffInterests = newInterests.filter(interest => !oldInterests.includes(interest));
            var interestUpdated = 0;
            diffInterests.forEach(function(interest) {
                var content = `${fullname} is now interested in ${interest}`;
                posts_db.createNewPost(username, username, new Date().getTime(), content, fullname, fullname, function(err, data) {
                    if (err){
                        console.log(err);
                        res.status(403).json({changed: false});
                    } else {
                        interestUpdated++;
                        if (interestUpdated === diffInterests.length){
                            // Update last active timestamp
                            accounts_db.lastActive(username, function(err) {
                                if (err) {
                                    console.log(err);
                                    res.status(403).json({success: false});
                                } else {
                                    res.status(200).json({changed: true});
                                }
                            });
                        }
                    }
                });
            }); 
        }
    });
};

// Change the password of a user
var changePassword = function(req, res) {
    var username = req.user.username;
    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;

    // Check validity of old password
    accounts_db.passwordCheck(username, oldPassword, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({changed: false});
        } else if (data === 'incorrect password') {
            // Incorrect old password
            res.status(403).json({changed: false});
        } else {
            // Correct old password- set new password
            // Encrypt password
            bcrypt.genSalt(saltRounds, function(err, salt) {
                bcrypt.hash(newPassword, salt, function(err, hash) {
                    if (err) {
                        console.log("hash didn't work");
                    } else {
                        newPassword = hash;
                        console.log("pw hashed to: " + newPassword);
                        accounts_db.changePassword(username, newPassword, function(err, data) {
                            if (err) {
                                console.log(err);
                                res.status(403).json({changed: false});
                            } else {
                                // Update last active timestamp
                                accounts_db.lastActive(username, function(err) {
                                    if (err) {
                                        console.log(err);
                                        res.status(403).json({success: false});
                                    } else {
                                        res.status(200).json({changed: true});
                                    }
                                });
                            }
                        });
                    }
                });
            });

        }
    });
};

// Get the online status of a user
var getOnlineStatus = function(req, res) {
    var username = req.body.username;

    accounts_db.getUserOnlineStatus(username, function(err, data) {
        if (err) {
            console.log(err);
            res.status(403).json({status: null});
        } else {
            res.status(200).json({status: data});
        }
    });
};

// Change the online status of a user
var changeOnlineStatus = function(req, res) {
    var username = req.user.username;
    var status = req.body.status;

    accounts_db.changeUserOnlineStatus(username, status, function(err, data) {
        if (err){
            console.log(err);
            res.status(403).json({changed: false});
        } else {
            //update last active timestamp
            accounts_db.lastActive(username, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({changed: true});
                }
            });
        }
    });
};

// Get all usernames that exist
var getAllUsernames = function(req, res) {
    var username = req.user.username;

    accounts_db.getAllUsernames(function(err, data) {
        if (err){
            console.log(err);
            res.status(403).json({usernames: null});
        } else {
            //update last active timestamp
            accounts_db.lastActive(username, function(err) {
                if (err) {
                    console.log(err);
                    res.status(403).json({success: false});
                } else {
                    res.status(200).json({usernames: data});
                }
            });
        }
    });
}

var routes = { 
    post_createaccount: createAccount,
    post_accountdetails: accountDetails,
    post_changeaffiliation: changeAffiliation,
    post_changeinterests: changeInterests,
    post_changeemail: changeEmail,
    post_changepassword: changePassword,
    get_onlinestatus: getOnlineStatus,
    post_changeonlinestatus: changeOnlineStatus,
    get_allusernames: getAllUsernames
};
  
module.exports = routes;