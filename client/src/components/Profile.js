import { useEffect, useState } from "react";
import { useParams, Link, useLocation, useHistory } from "react-router-dom";
import { Affix, Row, Col, Card, Avatar, Input, Button, Modal, Tag, Select, Empty, message } from "antd";
import { UserOutlined, EditOutlined, LockOutlined, UserAddOutlined, UserDeleteOutlined, SendOutlined } from "@ant-design/icons";
import socketClient from "socket.io-client";

import HomeNavBar from "./HomeNavBar.js";
import Post from "./Post.js";

import { interests } from "../constants/newsConstants.js";
import { titleCase } from "../utils/utils.js";
import { useAuth } from "../contexts/auth";
import { API_ENDPOINT } from '../constants/ports';

import '../styles/Profile.css';

const { TextArea } = Input;
const { Option } = Select;

const socket = socketClient(`http://${API_ENDPOINT}`);

const Profile = () => {

    const { setAuth } = useAuth();
    const { username } = useParams();
    const location = useLocation();
    const history = useHistory();

    const [currentUser, setCurrentUser] = useState({});

    const [affiliationVisible, setAffiliationVisible] = useState(false);
    const [emailVisible, setEmailVisible] = useState(false);
    const [interestsVisible, setInterestsVisible] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const [input, setInput] = useState({
        newAffiliation: "",
        newEmail: "",
        oldPassword: "",
        newPassword: "",
        newInterests: []
    });

    const [postContent, setPostContent] = useState("");
    const [oldInterests, setOldInterests] = useState([]);

    const [friendStatus, setFriendStatus] = useState(0);
    const [posts, setPosts] = useState([]);
    const [friends, setFriends] = useState([]);
    const [accountDetails, setAccountDetails] = useState({
        username: "", 
        email: "",
        dob: "",
        affiliation: "",
        interests: [],
        firstname: "",
        lastname: ""
    });

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

                    socket.emit('joinRooms', {
                        username: user.user,
                        chats: chats.chats
                    });
                        
                });
            });
        });

        socket.on('message', (m) => {  
            message.info(<span>{m.sender} sent you a message</span>);
        });

    }, []);

    useEffect(() => {
        var accountUrl = username ? `http://${API_ENDPOINT}/accountdetails?username=${username}` : `http://${API_ENDPOINT}/accountdetails`;

        fetch(accountUrl, {
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
            var accountDetails = JSON.parse(data);

            if (accountDetails.username === null) {
                history.push('/profile');
                message.error("User does not exist.");
            } else {
                setAccountDetails(accountDetails);
                setOldInterests(accountDetails.interests);
            }
            

        });

        var postsUrl = username ? `http://${API_ENDPOINT}/getallpostsandstatuswall?username=${username}` : `http://${API_ENDPOINT}/getallpostsandstatuswall`;

        fetch(postsUrl, {
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
            var homePosts = JSON.parse(data);
            setPosts(homePosts.content);
        });

        var friendsUrl = username ? `http://${API_ENDPOINT}/getcurrentfriends?username=${username}` : `http://${API_ENDPOINT}/getcurrentfriends`;

        fetch(friendsUrl, {
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
            var allFriends = JSON.parse(data);
            setFriends(allFriends.status);
        });

        if (username) {
            fetch(`http://${API_ENDPOINT}/getfriendshipstatus?usernameB=${username}`, {
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
                var friendship = JSON.parse(data);
                if (friendship.status === "outgoing request to B") {
                    setFriendStatus(3);
                } else if (friendship.status === "incoming request from B") {
                    setFriendStatus(2);
                } else if (friendship.status === "friends") {
                    setFriendStatus(1);
                } else if (friendship.status === "not friends") {
                    setFriendStatus(0);
                }
            });
        }
        
    }, [location]);

    const onInputChange = (name, e) => {

        if (name === "newInterests") {
            input[name] = e;
        } else {
            input[name] = e.target.value;
        }

        setInput(input);
    };

    const onPostChange = (e) => {
        setPostContent(e.target.value);
    };

    const changeAffiliation = () => {
        setAffiliationVisible(true);
    };

    const changeEmail = () => {
        setEmailVisible(true);
    };

    const changeInterests = () => {
        setInterestsVisible(true);
    };

    const changePassword = () => {
        setPasswordVisible(true);
    };

    const onAffiliationOk = () => {
        setAffiliationVisible(false);

        fetch(`http://${API_ENDPOINT}/changeaffiliation`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                affiliation: input["newAffiliation"]
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

        var a = accountDetails;
        a.affiliation = input["newAffiliation"];
        setAccountDetails(a);

    };

    const onEmailOk = () => {
        setEmailVisible(false);

        fetch(`http://${API_ENDPOINT}/changeemail`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                email: input["newEmail"]
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

        var a = accountDetails;
        a.email = input["newEmail"];
        setAccountDetails(a);

    };

    const onInterestsOk = () => {
        setInterestsVisible(false);
        

        fetch(`http://${API_ENDPOINT}/changeinterests`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                oldInterests: oldInterests,
                newInterests: input["newInterests"]
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

        var a = accountDetails;
        a.interests = input["newInterests"];            
        setAccountDetails(a);

    };

    const onPasswordOk = () => {
        setPasswordVisible(false);

        fetch(`http://${API_ENDPOINT}/changepassword`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                oldPassword: input["oldPassword"],
                newPassword: input["newPassword"]
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

    const onAffiliationCancel = () => {
        setAffiliationVisible(false);
    };

    const onEmailCancel = () => {
        setEmailVisible(false);
    };

    const onInterestsCancel = () => {
        setInterestsVisible(false);
    };

    const onPasswordCancel = () => {
        setPasswordVisible(false);
    };

    const makePost = () => {
        setPostContent("");

        console.log(currentUser);

        var newPost = [{
            poster: currentUser.user,
            postee: username ? username : currentUser.user,
            poster_full_name: currentUser.fullname,
            postee_full_name: username ? accountDetails.firstname + " " + accountDetails.lastname : currentUser.fullname,
            content: postContent,
            num_likes: 0,
            num_comments: 0,
            timestamp: new Date().getTime()
        }];

        var newPosts = newPost.concat(posts);
        setPosts(newPosts);

        var postBody = username ? {
            postee: username,
            postee_full_name: accountDetails.firstname + " " + accountDetails.lastname,
            content: postContent
        } : {
            content: postContent
        };

        fetch(`http://${API_ENDPOINT}/makenewpost`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify(postBody)
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

    const addFriend = () => {

        fetch(`http://${API_ENDPOINT}/addfriend`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                usernameB: username,
                userB_full_name: accountDetails.firstname + " " + accountDetails.lastname
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
            setFriendStatus(3);
        });

    };

    const acceptFriend = () => {

        fetch(`http://${API_ENDPOINT}/acceptfriend`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                usernameB: username,
                userB_full_name: accountDetails.firstname + " " + accountDetails.lastname
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
            setFriendStatus(1);
        });

    };

    const rejectFriend = () => {
        
        fetch(`http://${API_ENDPOINT}/rejectfriend`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                usernameB: username
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
            setFriendStatus(0);
        });

    };

    const removeFriend = () => {

        fetch(`http://${API_ENDPOINT}/removefriend`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                usernameB: username
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
            setFriendStatus(0);
        });

    };

    return (
        <div className="background">
            <Modal
                title="Change Affiliation"
                visible={affiliationVisible}
                onOk={onAffiliationOk}
                onCancel={onAffiliationCancel}
                >
                <Input placeholder="New Affiliation" onChange={(e) => {onInputChange("newAffiliation", e)}} />
            </Modal>
            <Modal
                title="Change Email"
                visible={emailVisible}
                onOk={onEmailOk}
                onCancel={onEmailCancel}
                >
                <Input placeholder="New Email" onChange={(e) => {onInputChange("newEmail", e)}} />
            </Modal>
            <Modal
                title="Change Interests"
                visible={interestsVisible}
                onOk={onInterestsOk}
                onCancel={onInterestsCancel}
                >
                    <Select
                        mode="multiple"
                        showSearch={false}
                        allowClear={true}
                        onChange={(e) => {onInputChange("newInterests", e)}}
                        style={{width: '100%'}}
                        defaultValue={accountDetails.interests}
                        >
                            {interests.map((interest) => (
                                <Option value={interest}>{titleCase(interest)}</Option>
                            ))}
                    </Select>
            </Modal>
            <Modal
                title="Change Password"
                visible={passwordVisible}
                onOk={onPasswordOk}
                onCancel={onPasswordCancel}
                >
                <Input placeholder="Old Password" onChange={(e) => {onInputChange("oldPassword", e)}} />
                <Input placeholder="New Password" onChange={(e) => {onInputChange("newPassword", e)}} />
            </Modal>
            <Row>
                <HomeNavBar/>
            </Row>
            <Row style={{marginTop: '50px'}}>  
                <Col span={2}></Col>
                <Col span={7}>
                    <Affix offsetTop={20}>
                        <Card className="profile-card">
                            <Avatar style={{display: 'block', margin: 'auto'}} size={80} icon={<UserOutlined/>} />
                            {username ? 
                                <div className="profile-info">
                                    <h1>{accountDetails.firstname + " " + accountDetails.lastname}</h1>
                                    <p>{accountDetails.affiliation}</p>
                                    <p>{accountDetails.email}</p> 
                                    <div>
                                        {accountDetails.interests.map((tag) => {
                                            return <Tag color="blue">{titleCase(tag)}</Tag>
                                        })}
                                    </div>
                                    <br />
                                    {friendStatus === 0 ? <Button icon={<UserAddOutlined />} onClick={addFriend} type="primary">Add Friend</Button> : 
                                     friendStatus === 1 ? <Button style={{width: '200px', backgroundColor: '#52C41A', color: 'white', border: 0}} icon={<UserOutlined />} type="primary">Friends</Button> :
                                     friendStatus === 2 ? <Button style={{width: '200px'}} icon={<UserAddOutlined />} onClick={acceptFriend} type="primary">Accept Friend Request</Button> :
                                     friendStatus === 3 ? <Button icon={<SendOutlined />} type="primary" disabled>Friend Request Sent</Button> :
                                     <span></span>
                                    }
                                    <br />
                                    {friendStatus === 2 ? <Button style={{width: '200px', marginTop: '5px'}} icon={<UserDeleteOutlined />} onClick={rejectFriend} type="primary" danger>Reject Friend Request</Button> :
                                    <span></span>}
                                    {friendStatus === 1 ? <Button style={{width: '200px', marginTop: '5px'}} icon={<UserDeleteOutlined />} onClick={removeFriend} type="primary" danger>Remove Friend</Button> :
                                    <span></span>}
                                </div>
                            : 
                                <div className="profile-info">
                                    <h1>{accountDetails.firstname + " " + accountDetails.lastname}</h1>
                                    <p>{accountDetails.affiliation} <Button style={{border: '0px'}} icon={<EditOutlined />} onClick={changeAffiliation}></Button></p>
                                    <p>{accountDetails.email} <Button style={{border: '0px'}} icon={<EditOutlined />} onClick={changeEmail}></Button></p> 
                                    <div>
                                        {accountDetails.interests.map((tag) => {
                                            return <Tag color="blue">{titleCase(tag)}</Tag>
                                        })}
                                    </div>
                                    <Button style={{border: '0px'}} icon={<EditOutlined />} onClick={changeInterests}></Button>
                                    <br />
                                    <Button icon={<LockOutlined />} onClick={changePassword}>Change Password</Button>
                                </div>
                            }
                            
                        </Card>
                        <Card style={{textAlign: 'center'}} className="profile-card">
                            <h2>Friends</h2>
                            {friends.map((friend) => {
                                return <Link to={`/profile/${friend.friendB}`} style={{margin: 0, display: 'block'}}>{friend.friendB_full_name}</Link>
                            })}
                        </Card>
                    </Affix>
                </Col>
                <Col span={1}></Col>
                <Col span={11}>
                    <Card className="profile-post">
                        <TextArea placeholder="What's on your mind?" showCount maxLength={500} value={postContent} onChange={onPostChange} />
                        <Button type="primary" onClick={makePost}>
                            Post
                        </Button>
                    </Card>
                    {posts.length > 0 ? 
                    posts.map((post) => {
                        if (post.postee === post.poster) {
                            return <Post info={post} status={true}/>;
                        } else {
                            return <Post info={post} status={false}/>;
                        }
                    }) : 
                    <Card className="profile-post">
                        <Empty 
                            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                            description={"No Posts"}
                        />
                    </Card>
                    }
                </Col>
                <Col span={4}></Col>
            </Row>
        </div>
    );
}

export default Profile;
