import { useEffect, useState } from "react";
import { useHistory, useLocation, Link } from "react-router-dom";
import { Row, Col, Card, Input, Button, Empty, message } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone, CommentOutlined } from "@ant-design/icons";
import socketClient from "socket.io-client";

import HomeNavBar from "./HomeNavBar.js";
import Post from "./Post.js";
import NewsArticle from "./NewsArticle.js";

import '../styles/Home.css';

import { useAuth } from "../contexts/auth";
import { cleanArticles } from "../utils/utils.js";
import { API_ENDPOINT } from '../constants/ports';

const { TextArea } = Input;

const socket = socketClient(`http://${API_ENDPOINT}`);

const Home = () => {

    const location = useLocation();
    const history = useHistory();

    const { setAuth } = useAuth();

    const [friendRequests, setFriendRequests] = useState([]);
    const [newFriends, setNewFriends] = useState([]);
    const [posts, setPosts] = useState([]);
    const [postContent, setPostContent] = useState("");
    const [currentUser, setCurrentUser] = useState({});
    const [onlineFriends, setOnlineFriends] = useState([]);

    const [recs, setRecs] = useState([]);

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

        fetch(`http://${API_ENDPOINT}/getnewfriendships`, {
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
            var newFriendships = JSON.parse(data);
            console.log(data);
            setNewFriends(newFriendships.friends);
        });

        fetch(`http://${API_ENDPOINT}/getallpostsandstatushome`, {
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

        fetch(`http://${API_ENDPOINT}/getpendingrequests`, {
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
            var allRequests = JSON.parse(data);
            setFriendRequests(allRequests.status);
            
        });

        fetch(`http://${API_ENDPOINT}/getallonlinefriends`, {
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
            var onlineFriends = JSON.parse(data);
            setOnlineFriends(onlineFriends.onlineFriends);
            
        });

        fetch(`http://${API_ENDPOINT}/get-recommendations`, {
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
            console.log(data);
            var articles = JSON.parse(data);
            var twoArticles = cleanArticles(articles.recs);
            setRecs(twoArticles);
        });

    }, [location]);

    const onPostChange = (e) => {
        setPostContent(e.target.value);
    };

    const makePost = () => {

        setPostContent("");

        var newPost = [{
            poster: currentUser.user,
            postee: currentUser.user,
            poster_full_name: currentUser.fullname,
            postee_full_name: currentUser.fullname,
            content: postContent,
            num_likes: 0,
            num_comments: 0,
            timestamp: new Date().getTime()
        }];

        var newPosts = newPost.concat(posts);
        setPosts(newPosts);

        fetch(`http://${API_ENDPOINT}/makenewpost`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                content: postContent
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

    const acceptFriend = (e) => {

        console.log(e.currentTarget.value);

        var friend = JSON.parse(e.currentTarget.value);

        fetch(`http://${API_ENDPOINT}/acceptfriend`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                usernameB: friend.friendB,
                userB_full_name: friend.friendB_full_name,
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

    const rejectFriend = (e) => {
        
        console.log(e.currentTarget.value);

        fetch(`http://${API_ENDPOINT}/rejectfriend`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                usernameB: e.currentTarget.value
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

    const newChat = (e) => {

        var friend = JSON.parse(e.currentTarget.value)

        var m = {
            "username": currentUser.user,
            "fullname": currentUser.fullname
        };

        var f = {
            "username": friend.friendB,
            "fullname": friend.friendB_full_name
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
                members: [JSON.stringify(m), JSON.stringify(f)]
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
            var _id = JSON.parse(data)._id;
            message.success("New chat created!");
            history.push(`/messages/${_id}`);
        });

    };

    return (
        <div className="background">
            <Row>
                <HomeNavBar/>
            </Row>
            <Row style={{marginTop: '50px'}}>  
                <Col span={1}></Col>
                <Col span={5}>
                    <Card style={{marginBottom: '20px'}}>
                        <h2 style={{textAlign: 'center'}}>Welcome, {currentUser.fullname}!</h2>
                    </Card>
                    <Card style={{textAlign: 'center'}}>
                        <h2>New Friends</h2>
                        {newFriends.map((f) => {
                            return (<Link href={`/profile/${f.friendB}`} style={{margin: 0, color: '#000000', display: 'block'}}>{f.friendB_full_name}</Link>);
                        })}
                    </Card>
                </Col>
                <Col span={1}></Col>
                <Col span={10}>
                    <Card className="home-profile-post">
                        <TextArea placeholder="What's on your mind?" showCount maxLength={500} value={postContent} onChange={onPostChange} />
                        <Button type="primary" onClick={makePost}>
                            Post
                        </Button>
                    </Card>
                    {recs.map((rec) => {
                        return <NewsArticle info={rec} />
                    })}
                    {posts.length > 0 ? 
                    posts.map((post) => {
                        if (post.postee === post.poster) {
                            return <Post info={post} currentUser={currentUser} status={true}/>;
                        } else {
                            return <Post info={post} currentUser={currentUser} status={false}/>;
                        }
                    }) : 
                    <Card className="post">
                        <Empty 
                            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                            description={"No Posts"}
                        />
                    </Card>}
                </Col>
                <Col span={1}></Col>
                <Col span={5}>
                    <Card className="friends-online" style={{marginBottom: '20px'}}>
                        <h2 style={{textAlign: 'center'}}>Online Now</h2>
                        <div>
                            {onlineFriends.map((onlineFriend) => {
                                return (
                                    <div>
                                        <span className="friend-name" style={{margin: 0}}><span className="dot"></span>{onlineFriend.friendB_full_name}</span>
                                        <Button style={{border: 0}} value={JSON.stringify(onlineFriend)} onClick={newChat} icon={<CommentOutlined />}/>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                    <Card style={{textAlign: 'center'}}>
                        <h2>Friend Requests</h2>
                        {friendRequests.map((friend) => {
                            return (
                                <p style={{margin: 0}}>{friend.friendB_full_name}
                                    <Button style={{border: 0, width: '15px', margin: '0 2.5px 0 5px'}} value={JSON.stringify(friend)} onClick={acceptFriend} icon={<CheckCircleTwoTone twoToneColor="#52C41A"/>} /> 
                                    <Button style={{border: 0, width: '15px', margin: '0 5px 0 2.5px'}} value={JSON.stringify(friend)} onClick={rejectFriend} icon={<CloseCircleTwoTone twoToneColor="#F5222D"/>} />
                                </p>
                            )
                        })}
                        </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Home;
