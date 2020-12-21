import { useEffect, useState } from "react";
import { useHistory, Link } from 'react-router-dom';
import { Card, Button, Input } from "antd";
import { CaretRightOutlined, LikeOutlined, MessageOutlined, LikeTwoTone, MessageTwoTone } from "@ant-design/icons";

import Comment from './Comment';

import { epochToDate } from "../utils/utils.js";
import { useAuth } from "../contexts/auth";
import { API_ENDPOINT } from '../constants/ports';

import '../styles/Profile.css';

const Post = (props) => {

    const { setAuth } = useAuth();
    const history = useHistory();

    const [liked, setLiked] = useState(false);
    const [numLikes, setNumLikes] = useState(props.info.num_likes > 0 ? props.info.num_likes : 0);

    const [comment, setComment] = useState("");
    const [comments, setComments] = useState([]);
    const [commentsVisible, setCommentsVisible] = useState(false);    

    useEffect(() => {

        fetch(`http://${API_ENDPOINT}/isPostLiked?postID=${props.info.post_id}&postTimestamp=${props.info.timestamp}`, {
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
            var isLiked = JSON.parse(data);
            setLiked(isLiked.isLiked);
        });

        fetch(`http://${API_ENDPOINT}/commentsonpost?postID=${props.info.post_id}&postTimestamp=${props.info.timestamp}`, {
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
            var comments = JSON.parse(data);
            setComments(comments.success.Items);
        });

    }, []);


    const toggleComment = () => {
        setCommentsVisible(!commentsVisible);
    };

    const likePost = () => {

        var url = liked ? `http://${API_ENDPOINT}/unlikepost` : `http://${API_ENDPOINT}/likepost`;

        fetch(url, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                postID: props.info.post_id,
                postTimestamp: props.info.timestamp
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

        setLiked(!liked);

        if (liked) {
            setNumLikes(numLikes - 1);
        } else {
            setNumLikes(numLikes + 1);
        }

    };

    const onCommentChange = (e) => {
        setComment(e.target.value);
    }

    const writeComment = () => {

        var newComment = {
            timestamp: new Date().getTime(),
            commenter_username: props.currentUser.user,
            commenter_full_name: props.currentUser.fullname,
            content: comment
        };

        setComments(comments => comments.concat(newComment));
        console.log(comment);

        fetch(`http://${API_ENDPOINT}/comment`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                postID: props.info.post_id,
                postTimestamp: props.info.timestamp,
                content: comment
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

    return (
        <Card className="post">
            <div>
                {props.status ? 
                    <h3 style={{marginBottom: 0}}><Link className="name" href={`/profile/${props.info.poster}`}>{props.info.poster_full_name}</Link></h3>
                :
                    <h3 style={{marginBottom: 0}}><Link className="name" href={`/profile/${props.info.poster}`}>{props.info.poster_full_name}</Link> <CaretRightOutlined /> <Link className="name" href={`/profile/${props.info.postee}`}>{props.info.postee_full_name}</Link></h3>
                }
                <p style={{fontSize: '12px', color: '#8C8C8C'}}>{epochToDate(props.info.timestamp)}</p>
                <p>{props.info.content}</p>
                <Button style={{border: 0}} icon={liked ? <LikeTwoTone /> : <LikeOutlined />} onClick={likePost}></Button> {numLikes} {numLikes === 1 ? "Like" : "Likes"} 
                <Button style={{border: 0, marginLeft: '5px'}} icon={commentsVisible ? <MessageTwoTone/> : <MessageOutlined />} onClick={toggleComment}></Button> {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
                {commentsVisible ? 
                    <div className="comments">
                        <hr />
                        {comments.map((comment) => {
                            return <Comment post={props.info} info={comment}/>
                        })}
                        <div style={{ width: '100%', lineHeight: 1.1}}>
                            <Input style={{marginTop: '10px', width: '80%', border: 0, borderBottom: '1px solid lightgrey'}} placeholder="Add comment ..." onChange={onCommentChange}></Input>
                            <Button style={{ lineHeight: 1.1, width: '20%', border: 0}} onClick={writeComment}>Add</Button>
                        </div>
                    </div>
                :
                    <span></span>
                }
            </div>
        </Card>
    );
}

export default Post;
