import { useState, useEffect } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import { Row, Col, Card, Input, Button, Modal, Select, message } from "antd";
import { UserAddOutlined, UserDeleteOutlined, SendOutlined, FormOutlined, UsergroupAddOutlined, InfoCircleOutlined, InfoCircleTwoTone } from "@ant-design/icons";
import socketClient from "socket.io-client";

import HomeNavBar from "./HomeNavBar";

import { useAuth } from "../contexts/auth";
import { membersToTitle, epochToDate, friendsNotInChat, getNewChatOptions, reorderChats, readChat } from "../utils/utils.js";
import { API_ENDPOINT } from '../constants/ports';

import '../styles/Messages.css';

const { Option } = Select;

const socket = socketClient(`http://${API_ENDPOINT}`);

const Messages = () => {

    const { setAuth } = useAuth();

    const { chatid } = useParams();
    const history = useHistory();
    const location = useLocation();

    const [incomingMessage, setIncomingMessage] = useState({});
    const [messageContent, setMessageContent] = useState("");
    const [currentChat, setCurrentChat] = useState("");

    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentFriends, setCurrentFriends] = useState([]);

    const [addVisible, setAddVisible] = useState(false);
    const [userToAdd, setUserToAdd] = useState("");
    const [addOptions, setAddOptions] = useState([]);

    const [removeVisible, setRemoveVisible] = useState(false);
    const [userToRemove, setUserToRemove] = useState("");

    const [showInfo, setShowInfo] = useState(true);
    const [newChatVisible, setNewChatVisible] = useState(false);
    const [newGroupChatVisible, setNewGroupChatVisible] = useState(false);
    const [newChatOptions, setNewChatOptions] = useState([]);
    const [newChatUser, setNewChatUser] = useState("");
    const [newGroupChatMembers, setNewGroupChatMembers] = useState([]);

    const [currentUser, setCurrentUser] = useState({});

    useEffect(() => {

        socket.on('connect', () => {
            socket.emit('userConnect', 'im connected');

            fetch(`http://${API_ENDPOINT}/loggedin`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
                }
            })
            .then((response) => {
                if (!response.ok) {
                    setAuth("");
                    history.push(`/`);
                }
                return response;
            })
            .then((response) => response.text())
            .then((data) => {            
                var user = JSON.parse(data);
                setCurrentUser(user);
                    
                fetch(`http://${API_ENDPOINT}/getchats`, {
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
                    }
                })
                .then((response) => {
                    if (!response.ok) {
                        setAuth("");
                        history.push(`/`);
                    }
                    return response;
                })
                .then((response) => response.text())
                .then((data) => {            
                    var chats = JSON.parse(data);
                    setChats(chats.chats);

                    socket.emit('joinRooms', {
                        username: user.user,
                        chats: chats.chats
                    });
                        
                });
            });
        });

        socket.on('message', (message) => {  
            setIncomingMessage(message);
        });

    }, []);

    useEffect(() => {

        fetch(`http://${API_ENDPOINT}/loggedin`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            }
        })
        .then((response) => {
            if (!response.ok) {
                setAuth("");
                history.push(`/`);
            }
            return response;
        })
        .then((response) => response.text())
        .then((data) => {            
            var user = JSON.parse(data);
            setCurrentUser(user);
        });

        fetch(`http://${API_ENDPOINT}/getchats`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            }
        })
        .then((response) => {
            if (!response.ok) {
                setAuth("");
                history.push(`/`);
            }
            return response;
        })
        .then((response) => response.text())
        .then((data) => {            
            var chats = JSON.parse(data);
            setChats(chats.chats);                        
        });

        fetch(`http://${API_ENDPOINT}/getcurrentfriends`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            }
        })
        .then((response) => response.text())
        .then((data) => {            
            var friends = JSON.parse(data);
            setCurrentFriends(friends.status);
        });

    }, [location]);

    useEffect(() => {

        if (chatid !== "" && incomingMessage._id === chatid) {
            setMessages(oldMessages => oldMessages.concat(incomingMessage));   
            var reorderedChats1 = reorderChats(chats, incomingMessage._id, true);
            setChats(reorderedChats1); 
        } else {
            var reorderedChats2 = reorderChats(chats, incomingMessage._id, false);
            setChats(reorderedChats2);
        }

    }, [chatid, incomingMessage]);

    useEffect(() => {

        if (chatid) {
            
            console.log('here!');
            console.log(chatid);

            var readChats = readChat(chats, chatid);
            setChats(readChats);
            
            setMessages([]);
            setMessageContent("");

            fetch(`http://${API_ENDPOINT}/getchat?_id=${chatid}`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
                }
            })
            .then((response) => {
                if (!response.ok) {
                    setAuth("");
                    history.push(`/`);
                }
                return response;
            })
            .then((response) => response.text())
            .then((data) => {            
                var chat = JSON.parse(data);
                setCurrentChat(chat.chat);
            });

            fetch(`http://${API_ENDPOINT}/getmessages?_id=${chatid}`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
                }
            })
            .then((response) => response.text())
            .then((data) => {            
                var messages = JSON.parse(data);
                setMessages(messages.messages);
            });

            fetch(`http://${API_ENDPOINT}/readchat`, {
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
                },
                body: JSON.stringify({
                    _id: chatid,
                })
            })
            .then((response) => {
                if (!response.ok) {
                    setAuth("");
                    history.push(`/`);
                }
                return response;
            })
            .then((response) => response.text())
            .then((data) => {            
                console.log(data);
            });
        }

    }, [chatid])

    const selectChat = (e) => {

        var selectedChat = JSON.parse(e.currentTarget.value);

        history.push(`/messages/${selectedChat._id}`);
    };

    const sendMessage = () => {

        console.log(messageContent);
        setMessageContent("");

        socket.emit('message', {
            sender: currentUser.user, 
            sender_full_name: currentUser.fullname,
            content: messageContent, 
            _id: chatid,
            timestamp: new Date().getTime()
        });

        fetch(`http://${API_ENDPOINT}/sendmessage`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                _id: currentChat._id,
                content: messageContent,
                members: currentChat.members
            })
        })
        .then((response) => {
            if (!response.ok) {
                setAuth("");
                history.push(`/`);
            }
            return response;
        })
        .then((response) => response.text())
        .then((data) => {            
            console.log(data);
        });

    };

    const onMessageChange = (e) => {
        setMessageContent(e.target.value);
    };

    const toggleInfo = () => {
        setShowInfo(!showInfo);
    };

    const onAddOk = () => {

        if (userToAdd === undefined || userToAdd === "") {
            setUserToAdd("");
            setAddVisible(false);
            return;
        }

        var m = JSON.parse(userToAdd);

        fetch(`http://${API_ENDPOINT}/adduser`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                _id: currentChat._id,
                members: currentChat.members,
                username: m.username,
                fullname: m.fullname
            })
        })
        .then((response) => {
            if (!response.ok) {
                setAuth("");
                history.push(`/`);
            }
            return response;
        })
        .then((response) => response.text())
        .then((data) => {            
            console.log(data);
        });

        setUserToAdd("");
        setAddVisible(false);
    };

    const onAddCancel = () => {
        setAddVisible(false);
    };

    const onAddChange = (e) => {
        setUserToAdd(e);
    };

    const addUser = () => {

        var opts = friendsNotInChat(currentFriends, currentChat.members);
        setAddOptions(opts);
        setAddVisible(true);

    };

    const onRemoveOk = () => {

        if (userToRemove === undefined || userToRemove === "") {
            setUserToRemove("");
            setRemoveVisible(false);
            return;
        }

        var m = JSON.parse(userToRemove);

        fetch(`http://${API_ENDPOINT}/removeuser`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                _id: currentChat._id,
                members: currentChat.members,
                username: m.username,
                fullname: m.fullname
            })
        })
        .then((response) => {
            if (!response.ok) {
                setAuth("");
                history.push(`/`);
            }
            return response;
        })
        .then((response) => response.text())
        .then((data) => {            
            console.log(data);
        });

        setUserToRemove("");
        setRemoveVisible(false);
    };

    const onRemoveCancel = () => {
        setRemoveVisible(false);
    };

    const onRemoveChange = (e) => {
        setUserToRemove(e);
    };

    const removeUser = () => {
        setRemoveVisible(true);
    };

    const newChat = () => {

        var opts = getNewChatOptions(currentFriends, chats, currentUser.user);
        setNewChatOptions(opts);
        setNewChatVisible(true);

    };

    const onNewChatOk = () => {

        if (newChatUser === undefined || newChatUser === "") {
            setNewChatUser("");
            setNewChatVisible(false);
            return;
        }

        var m = {
            "username": currentUser.user,
            "fullname": currentUser.fullname
        };

        fetch(`http://${API_ENDPOINT}/newchat`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                members: [JSON.stringify(m), newChatUser]
            })
        })
        .then((response) => {
            if (!response.ok) {
                setAuth("");
                history.push(`/`);
            }
            return response;
        })
        .then((response) => response.text())
        .then((data) => {            
            console.log(data);
        });

        setNewChatUser("");
        setNewChatVisible(false);

    };

    const onNewChatCancel = () => {
        setNewChatVisible(false);
    };

    const onNewChatChange = (e) => {
        setNewChatUser(e);
    };

    const newGroupChat = () => {
        setNewGroupChatVisible(true);
    };

    const onNewGroupChatOk = () => {

        if (newGroupChatMembers === undefined || newGroupChatMembers === []) {
            setNewGroupChatMembers([]);
            setNewGroupChatVisible(false);
            return;
        }

        if (newGroupChatMembers.length < 2) {
            message.error("You must select at least two users.");
            return;
        }

        var m = {
            "username": currentUser.user,
            "fullname": currentUser.fullname
        };

        fetch(`http://${API_ENDPOINT}/newchat`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                members: newGroupChatMembers.concat(JSON.stringify(m))
            })
        })
        .then((response) => {
            if (!response.ok) {
                setAuth("");
                history.push(`/`);
            }
            return response;
        })
        .then((response) => response.text())
        .then((data) => {            
            console.log(data);
        });

        setNewGroupChatMembers([]);
        setNewGroupChatVisible(false);
    };

    const onNewGroupChatCancel = () => {
        setNewGroupChatVisible(false);
    };

    const onNewGroupChatChange = (e) => {

        console.log(e);
        setNewGroupChatMembers(e);
    };

    return (
        <div className="background">
            <Modal
                title="New Chat"
                visible={newChatVisible}
                onOk={onNewChatOk}
                onCancel={onNewChatCancel}
                >
                    <Select
                        showSearch={false}
                        allowClear={true}
                        onChange={onNewChatChange}
                        style={{width: '100%'}}
                    >              
                        {newChatOptions.map((opt) => {
                            var o = JSON.parse(opt);
                            return <Option value={opt}>{o.fullname}</Option>
                        })}                           
                    </Select>
            </Modal>
            <Modal
                title="New Group Chat"
                visible={newGroupChatVisible}
                onOk={onNewGroupChatOk}
                onCancel={onNewGroupChatCancel}
                >
                    <Select
                        mode="multiple"
                        showSearch={false}
                        allowClear={true}
                        onChange={onNewGroupChatChange}
                        style={{width: '100%'}}
                    >
                        {currentFriends.map((friend) => {
                            return <Option value={JSON.stringify({"username": friend.friendB, "fullname": friend.friendB_full_name})}>{friend.friendB_full_name}</Option> 
                        })}
                    </Select>
            </Modal>
            <Modal
                title="Add User to Chat"
                visible={addVisible}
                onOk={onAddOk}
                onCancel={onAddCancel}
                >
                    <Select
                        showSearch={false}
                        allowClear={true}
                        onChange={onAddChange}
                        style={{width: '100%'}}
                    >
                            {addOptions.map((opt) => {
                                var o = JSON.parse(opt);
                                return <Option value={opt}>{o.fullname}</Option>
                            })}
                            
                    </Select>
            </Modal>
            <Modal
                title="Remove User from Chat"
                visible={removeVisible}
                onOk={onRemoveOk}
                onCancel={onRemoveCancel}
                >
                    <Select
                        showSearch={false}
                        allowClear={true}
                        onChange={onRemoveChange}
                        style={{width: '100%'}}
                    >
                        {currentChat.members ? currentChat.members.map((member) => {
                            var m = JSON.parse(member);
                            return  <Option value={member}>{m.fullname}</Option>
                        }) : <span></span>}
                    </Select>
            </Modal>
            <Row>
                <HomeNavBar/>
            </Row>
            <Row style={{height: 'calc(100vh - 50px)', overflowY: 'hidden'}}>
                <Col style={{backgroundColor: 'white', overflow: 'scroll', height: '100vh', borderRight: '1px solid #F0F0F0'}} span={6}>
                    <Card style={{height: '75px'}}>
                        <h2 style={{display: 'inline-block', width: '70%'}}>Chats</h2>
                        <Button style={{borderRadius: '50%', position: 'absolute', right: 60}} onClick={newChat} icon={<FormOutlined />}></Button>
                        <Button style={{borderRadius: '50%', position: 'absolute', right: 20}} onClick={newGroupChat} icon={<UsergroupAddOutlined />}></Button>
                    </Card>
                    {chats.map((chat) => {
                        return (
                        <Card style={{height: '75px', border: 0}}>
                            {chat.last_modified > chat.last_read ?
                                <div style={{width: '100%'}}>
                                    <Button style={{fontWeight: 'bold', border: 0, width: '50%', textAlign: 'left', padding: 0}} value={JSON.stringify(chat)} onClick={selectChat}>{membersToTitle(chat.members, currentUser.user, currentUser.fullname)}</Button>
                                    <span style={{fontWeight: 'bold', position: 'absolute', right: 20, fontSize: '10px', color: '#8C8C8C', marginTop: '7.5px'}}>{epochToDate(chat.last_modified)}</span>
                                </div>
                            :
                                <div style={{width: '100%'}}>
                                    <Button style={{border: 0, width: '50%', textAlign: 'left', padding: 0}} value={JSON.stringify(chat)} onClick={selectChat}>{membersToTitle(chat.members, currentUser.user, currentUser.fullname)}</Button>
                                    <span style={{position: 'absolute', right: 20, fontSize: '10px', color: '#8C8C8C', marginTop: '7.5px'}}>{epochToDate(chat.last_modified)}</span>
                                </div>
                            }
                            
                        </Card>
                        );
                    })}
                </Col>
                <Col span={18}>
                    {chatid === "" || !chatid || !currentChat ? 
                        <span></span>
                    :
                    <div>
                        <Row>
                            <Card id="messageTitle" style={{width: '100%', height: '75px'}}>
                                {membersToTitle(currentChat.members, currentUser.user, currentUser.fullname)}
                                <Button style={{position: 'absolute', right: 20, border: 0}} icon={showInfo ? <InfoCircleTwoTone style={{fontSize: '18px'}} /> : <InfoCircleOutlined style={{color: '#8C8C8C', fontSize: '18px'}}/>} onClick={toggleInfo} />
                            </Card>
                        </Row>
                        <Row>
                            <Col span={showInfo ? 18 : 24}>
                                <Row style={{backgroundColor: 'white', height: 'calc(100vh - 170px)', overflowY: 'scroll'}}>
                                    <div className="message-container">
                                        {messages.map((message) => {
                                            if (message.sender === currentUser.user) {
                                                return (
                                                    <div className="message2-bubble">
                                                        <span className="message2">{message.content}</span><span className="message2-time">{epochToDate(message.timestamp)}</span>
                                                    </div>
                                                )
                                            } else {
                                                return (
                                                    <div className="message1-bubble">
                                                        {currentChat.is_group ? <p style={{marginTop: '5px'}} className="message1-sender">{message.sender_full_name}</p> : <span></span>}
                                                        <span style={currentChat.is_group ? {marginTop: 0} : {}} className="message1">{message.content}</span><span className="message1-time">{epochToDate(message.timestamp)}</span>
                                                    </div>
                                                )
                                            }
                                        })}
                                    </div>
                                </Row>
                                <Row style={{backgroundColor: 'white', height: '80px', marginBottom: '10px'}}>
                                    <Col style={{height: '80px'}} span={22}>
                                        <Input style={{width: '100%', margin: '0 0 0 15px', borderRadius: '20px', height: '35px'}} value={messageContent} onChange={onMessageChange} placeholder="Type a message ..." />
                                    </Col>
                                    <Col span={2}>
                                        <Button style={{position: 'absolute', left: 20, height: '35px', border: 0}} onClick={sendMessage} icon={<SendOutlined />}></Button>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={6} style={{borderLeft: '1px solid #F0F0F0'}}>
                                {chatid === "" || !chatid || !currentChat || !showInfo ? 
                                    <span></span>
                                :
                                    <div style={{backgroundColor: 'white', overflow: 'hidden', height: '100vh', borderRight: '1px solid black', textAlign: 'center'}} >
                                        <h3 style={{margin: '25px'}}>Members</h3>
                                        {currentChat.members.map((member) => {
                                            var m = JSON.parse(member);
                                            return <p style={{margin: 0}}>{m.fullname}</p>
                                        })}
                                        <Button style={{marginTop: '20px', marginBottom: '5px', width: '150px'}} icon={<UserAddOutlined />} onClick={addUser}>Add User</Button>
                                        <br />
                                        {currentChat.is_group && currentChat.members.length > 1 ? 
                                            <Button style={{margin: 0, width: '150px'}} icon={<UserDeleteOutlined />} onClick={removeUser}>Remove User</Button>
                                        :
                                            <span></span>
                                        }
                                    </div>
                                }
                            </Col>
                        </Row>
                    </div>
                    }
                </Col>
                
            </Row>
        </div>
    );
}

export default Messages;
