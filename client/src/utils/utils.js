const compareMembers = (memberA, memberB) => {
    if (memberA["username"] < memberB["username"]) {
       return -1;
    } else if (memberA["username"] > memberB["username"]) {
       return 1;
    } else {
       return 0;
    }
 };

const titleCase = (word) => {

    return word.replace(/\w\S*/g, function(w) {
        return w.charAt(0).toUpperCase() + w.substr(1).toLowerCase();
    });

};

const epochToDate = (epoch) => {

    var d = new Date(0);
    d.setUTCMilliseconds(epoch);

    var h = d.getHours();
    var m = d.getMinutes();

    var hours = h > 12 ? h % 12 : 
                h === 0 ? 12 :
                h;

    var mins = (m < 10) ? "0" + m : m;
    var amPm = (h >= 12 && h < 24) ? "pm" : "am";
    

    var s = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + hours + ":" + mins + amPm;

    return s;
};

const formatDate = (dateString) => {

    var arr = dateString.split('-');
    var d = new Date(parseInt(arr[0]), parseInt(arr[1]) - 1, parseInt(arr[2]));

    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var s = monthNames[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();

    return s; 
};

const formatDatePlus = (dateString) => {

    var arr = dateString.split('-');
    var d = new Date(parseInt(arr[0]), parseInt(arr[1]) - 1, parseInt(arr[2]));

    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var s = monthNames[d.getMonth()] + " " + d.getDate() + ", " + (d.getFullYear() + 4);

    return s; 
};

const membersToTitle = (members, username, fullname) => {

    var user = {
        "username": username,
        "fullname": fullname
    };

    const m = [...members];
    const i = m.indexOf(JSON.stringify(user));
    m.splice(i, 1);

    var title = m.map((mem) => {

        var parseMem = JSON.parse(mem);
        return parseMem.fullname;

    });

    const titleName = title.join(', ');

    return titleName;

};

const friendsNotInChat = (friends, members) => {

    var friendStrings = friends.map((friend) => {
        return JSON.stringify({
            "username": friend.friendB,
            "fullname": friend.friendB_full_name
        });
    });

    var friendSet = new Set(friendStrings);
    var memberSet = new Set(members);
    
    var difference = new Set([...friendSet].filter(x => !memberSet.has(x)));
    var diffArray = Array.from(difference);
    diffArray.sort(compareMembers);

    return diffArray;

};

const getNewChatOptions = (friends, chats, username, fullname) => {

    var user = {
        "username": username,
        "fullname": fullname
    };

    var friendStrings = friends.map((friend) => {
        return JSON.stringify({
            "username": friend.friendB,
            "fullname": friend.friendB_full_name
        });
    });

    var chatStrings = chats.map((chat) => {
        if (!chat.is_group) {

            const m = [...chat.members];
            const i = m.indexOf(JSON.stringify(user));
            m.splice(i, 1);

            return m[0];
        }
    });

    var friendSet = new Set(friendStrings);
    var chatSet = new Set(chatStrings);
    
    var difference = new Set([...friendSet].filter(x => !chatSet.has(x)));
    var diffArray = Array.from(difference);
    diffArray.sort(compareMembers);

    return diffArray;

};

var reorderChats = (chats, _id, isCurrent) => {

    var index = -1;
    var unreadChat = null;

    for (var i = 0; i < chats.length; i++) {
        if (chats[i]._id === _id) {
            index = i;
            unreadChat = chats[i];
            break;
        }
    }

    var c = [...chats];

    if (index !== -1) {
        c.splice(index, 1);
        unreadChat.last_modified = new Date().getTime();

        if (isCurrent) {
            unreadChat.last_read = new Date().getTime();
        }

        var c1 = [unreadChat].concat(c);
        
        return c1;
    }
    
    return c;

};

var readChat = (chats, _id) => {

    var c = [...chats];

    for (var i = 0; i < c.length; i++) {
        if (c[i]._id === _id) {
            c[i].last_read = new Date().getTime();
            break;
        }
    }

    return c;

};

var cleanArticles = (recs) => {

    const today = "2016-12-16";

    var filtered = recs.filter((r) => {
        return (r.date.S < today);
    });

    return filtered.splice(0, 2);


};


export { titleCase, epochToDate, formatDatePlus, formatDate, membersToTitle, friendsNotInChat, getNewChatOptions, reorderChats, readChat, cleanArticles };