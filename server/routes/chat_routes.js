var accounts_db = require('../models/accounts.js');
var chats_db = require('../models/chats.js');
var { v4: uuidv4 } = require('uuid');

var compareChats = function(chatA, chatB) {
  if (chatA['last_modified'] < chatB['last_modified']) {
    return 1;
  } else if (chatA['last_modified'] > chatB['last_modified']) {
    return -1;
  } else {
    return 0;
  }
};

var compareMessages = function(messageA, messageB) {
  if (messageA['timestamp'] < messageB['timestamp']) {
    return -1;
  } else if (messageA['timestamp'] > messageB['timestamp']) {
    return 1;
  } else {
    return 0;
  }
};

var compareMembers = function(memberA, memberB) {
  var mA = JSON.parse(memberA);
  var mB = JSON.parse(memberB);

  if (mA['username'] < mB['username']) {
    return -1;
  } else if (mA['username'] > mB['username']) {
    return 1;
  } else {
    return 0;
  }
};

var getChats = function(req, res) {
  var username = req.user.username;

  chats_db.getChats(username, function(err, data) {
    if (err) {
      console.log(err);
      res.status(403).json({ received: false });
    } else {
      var chats = data.Items;
      chats.sort(compareChats);

      accounts_db.lastActive(username, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ received: false });
        } else {
          res.status(200).json({ chats: chats });
        }
      });
    }
  });
};

var getMessages = function(req, res) {
  var _id = req.query._id;
  var username = req.user.username;

  chats_db.getMessages(_id, function(err, data) {
    if (err) {
      console.log(err);
      res.status(403).json({ received: false });
    } else {
      var messages = data.Items;

      console.log(messages);
      messages.sort(compareMessages);

      accounts_db.lastActive(username, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ received: false });
        } else {
          res.status(200).json({ messages: messages });
        }
      });
    }
  });
  // input: chat_id
  // output: list of messages in reverse order
  // DB used: chat
};

var sendMessage = function(req, res) {
  var sender = req.user.username;
  var sender_full_name = req.user.fullname;

  var _id = req.body._id;
  var content = req.body.content;
  var members = req.body.members;
  var timestamp = new Date().getTime();

  chats_db.sendMessage(
    _id,
    sender,
    content,
    timestamp,
    sender_full_name,
    function(err, data) {
      if (err) {
        console.log(err);
        res.status(403).json({ sent: false });
      } else {
        chats_db.setLastModified(_id, sender, timestamp, members);

        accounts_db.lastActive(sender, function(err) {
          if (err) {
            console.log(err);
            res.status(403).json({ sent: false });
          } else {
            res.status(200).json({ sent: true });
          }
        });
      }
    }
  );
};

var newChat = function(req, res) {
  var username = req.user.username;

  var members = req.body.members;
  var is_group = members.length > 2;

  if (members.length < 2) {
    return;
  }

  members.sort(compareMembers);

  var _id = uuidv4();
  var timestamp = new Date().getTime().toString();

  chats_db.newChat(_id, members, timestamp, is_group, function(err, data) {
    if (err) {
      console.log(err);
      res.status(403).json({ created: false });
    } else {
      accounts_db.lastActive(username, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ created: false });
        } else {
          res.status(200).json({ created: true, _id: _id });
        }
      });
    }
  });
};

var addUserToChat = function(req, res) {
  var user = req.user.username;

  var _id = req.body._id;

  var username = req.body.username;
  var fullname = req.body.fullname;

  var members = req.body.members;

  var timestamp = new Date().getTime();

  console.log(members);

  chats_db.addUser(_id, username, fullname, members, timestamp, function(
    err,
    data
  ) {
    if (err) {
      console.log(err);
      res.status(403).json({ added: false });
    } else {
      accounts_db.lastActive(user, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ added: false });
        } else {
          res.status(200).json({ added: true });
        }
      });
    }
  });
};

var removeUserFromChat = function(req, res) {
  var user = req.user.username;

  var _id = req.body._id;

  var username = req.body.username;
  var fullname = req.body.fullname;

  var members = req.body.members;

  chats_db.removeUser(_id, username, fullname, members, function(err, data) {
    if (err) {
      console.log(err);
      res.status(403).json({ removed: false });
    } else {
      accounts_db.lastActive(user, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ removed: false });
        } else {
          res.status(200).json({ removed: true });
        }
      });
    }
  });
};

var readChat = function(req, res) {
  var _id = req.body._id;
  var username = req.user.username;
  var timestamp = new Date().getTime();

  chats_db.readChat(_id, username, timestamp, function(err, data) {
    if (err) {
      console.log(err);
      res.status(403).json({ read: false });
    } else {
      accounts_db.lastActive(username, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ read: false });
        } else {
          res.status(200).json({ read: true });
        }
      });
    }
  });
};

var getChat = function(req, res) {
  var _id = req.query._id;
  var username = req.user.username;

  chats_db.getChat(_id, username, function(err, data) {
    if (err) {
      res.status(403).json({ exist: false });
    } else {
      accounts_db.lastActive(username, function(err) {
        if (err) {
          console.log(err);
          res.status(403).json({ exists: false });
        } else {
          res.status(200).json({ exists: true, chat: data.Items[0] });
        }
      });
    }
  });
};

var routes = {
  get_chats: getChats,
  get_messages: getMessages,
  post_sendmessage: sendMessage,
  post_newchat: newChat,
  post_adduser: addUserToChat,
  post_removeuser: removeUserFromChat,
  post_readchat: readChat,
  get_chat: getChat
};

module.exports = routes;
