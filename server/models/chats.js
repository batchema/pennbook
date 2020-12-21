// Chats database management functions
var { v4: uuidv4 } = require('uuid');

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

var db = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

var compareMembers = function(memberA, memberB) {
  if (memberA['username'] < memberB['username']) {
    return -1;
  } else if (memberA['username'] > memberB['username']) {
    return 1;
  } else {
    return 0;
  }
};

var getChats = function(username, callback) {
  var params = {
    TableName: 'user_chat',
    KeyConditionExpression: 'username = :u',
    ExpressionAttributeValues: {
      ':u': username
    }
  };

  docClient.query(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
};

var getMessages = function(_id, callback) {
  var params = {
    TableName: 'chat',
    KeyConditionExpression: '#i = :c',
    ExpressionAttributeNames: {
      '#i': '_id'
    },
    ExpressionAttributeValues: {
      ':c': _id
    }
  };

  docClient.query(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
};

var sendMessage = function(
  _id,
  sender,
  content,
  timestamp,
  sender_full_name,
  callback
) {
  var params = {
    TableName: 'chat',
    Item: {
      _id: _id,
      timestamp: timestamp,
      sender: sender,
      content: content,
      sender_full_name: sender_full_name
    }
  };

  docClient.put(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      callback(null, 'success');
    }
  });
};

var setLastModified = function(_id, sender, timestamp, members) {
  members.forEach((member) => {
    var m = JSON.parse(member);

    var memParams;

    if (m.username === sender) {
      memParams = {
        TableName: 'user_chat',
        Key: {
          username: m.username,
          _id: _id
        },
        UpdateExpression: 'set #lm = :time, #lr = :time',
        ExpressionAttributeValues: {
          ':time': timestamp
        },
        ExpressionAttributeNames: {
          '#lm': 'last_modified',
          '#lr': 'last_read'
        }
      };
    } else {
      memParams = {
        TableName: 'user_chat',
        Key: {
          username: m.username,
          _id: _id
        },
        UpdateExpression: 'set #lm = :time',
        ExpressionAttributeValues: {
          ':time': timestamp
        },
        ExpressionAttributeNames: {
          '#lm': 'last_modified'
        }
      };
    }

    docClient.update(memParams, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log('success');
      }
    });
  });
};

var newChat = function(_id, members, timestamp, is_group, callback) {
  var requests = members.map((member) => {
    var m = JSON.parse(member);

    return {
      PutRequest: {
        Item: {
          username: { S: m.username },
          _id: { S: _id },
          last_modified: { N: timestamp },
          members: { SS: members },
          is_group: { BOOL: is_group },
          last_read: { N: timestamp }
        }
      }
    };
  });

  var params = {
    RequestItems: {
      user_chat: requests
    }
  };

  db.batchWriteItem(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      callback(null, 'success');
    }
  });
};

var addUser = function(_id, username, fullname, members, timestamp, callback) {
  var newUser = {
    username: username,
    fullname: fullname
  };

  var newMembers = [ ...members ];
  newMembers.push(JSON.stringify(newUser));
  newMembers.sort(compareMembers);

  if (members.length > 2) {
    members.forEach((member) => {
      var m = JSON.parse(member);

      var memParams = {
        TableName: 'user_chat',
        Key: {
          username: m.username,
          _id: _id
        },
        UpdateExpression: 'set #mem = :newmems',
        ExpressionAttributeValues: {
          ':newmems': newMembers
        },
        ExpressionAttributeNames: {
          '#mem': 'members'
        }
      };

      docClient.update(memParams, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log(null);
        }
      });
    });

    var params = {
      TableName: 'user_chat',
      Item: {
        username: username,
        _id: _id,
        last_modified: timestamp,
        members: newMembers,
        is_group: true,
        last_read: timestamp
      }
    };

    docClient.put(params, function(err, data) {
      if (err) {
        console.log(err);
        callback(err, null);
      } else {
        callback(null, 'success');
      }
    });
  } else {
    newChat(uuidv4(), newMembers, timestamp.toString(), true, callback);
  }
};

var removeUser = function(_id, username, fullname, members, callback) {
  var newUser = {
    username: username,
    fullname: fullname
  };

  var newMembers = [ ...members ];
  const i = newMembers.indexOf(JSON.stringify(newUser));
  newMembers.splice(i, 1);

  console.log(newMembers);
  console.log(_id);
  console.log(username);
  console.log(fullname);

  members.forEach((member) => {
    var m = JSON.parse(member);

    if (m.username !== username) {
      var memParams = {
        TableName: 'user_chat',
        Key: {
          username: m.username,
          _id: _id
        },
        UpdateExpression: 'set #mem = :newmems',
        ExpressionAttributeValues: {
          ':newmems': newMembers
        },
        ExpressionAttributeNames: {
          '#mem': 'members'
        }
      };

      docClient.update(memParams, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log(null);
        }
      });
    }
  });

  var params = {
    TableName: 'user_chat',
    Key: {
      username: username,
      _id: _id
    }
  };

  docClient.delete(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      callback(null, 'success');
    }
  });
};

var readChat = function(_id, username, timestamp, callback) {
  var params = {
    TableName: 'user_chat',
    Key: {
      username: username,
      _id: _id
    },
    UpdateExpression: 'set #lr = :time',
    ExpressionAttributeValues: {
      ':time': timestamp
    },
    ExpressionAttributeNames: {
      '#lr': 'last_read'
    }
  };

  docClient.update(params, function(err) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      callback(null, 'success');
    }
  });
};

var getChat = function(_id, username, callback) {
  var params = {
    TableName: 'user_chat',
    KeyConditionExpression: 'username = :u and #i = :id',
    ExpressionAttributeNames: {
      '#i': '_id'
    },
    ExpressionAttributeValues: {
      ':u': username,
      ':id': _id
    }
  };

  docClient.query(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
};

var database = {
  getChats: getChats,
  getMessages: getMessages,
  sendMessage: sendMessage,
  setLastModified: setLastModified,
  newChat: newChat,
  addUser: addUser,
  removeUser: removeUser,
  readChat: readChat,
  getChat: getChat
};

module.exports = database;
