import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Button } from "antd";
import { LikeOutlined, LikeTwoTone } from "@ant-design/icons";

import { useAuth } from "../contexts/auth";
import { epochToDate } from "../utils/utils.js";
import { API_ENDPOINT } from '../constants/ports';

const Comment = (props) => {

    const history = useHistory();

    const { setAuth } = useAuth();

    const [liked, setLiked] = useState(false);
    const [numLikes, setNumLikes] = useState(props.info.number_of_likes > 0 ? props.info.number_of_likes : 0);

    useEffect(() => {

        fetch(`http://${API_ENDPOINT}/isCommentLiked?postID=${props.post.post_id}&postTimestamp=${props.post.timestamp}&commentTimestamp=${props.info.timestamp}`, {
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

    }, []);

    const likeComment = () => {

        var url = liked ? `http://${API_ENDPOINT}/unlikecomment` : `http://${API_ENDPOINT}/likecomment`;

        fetch(url, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                postID: props.post.post_id,
                postTimestamp: props.post.timestamp,
                commentTimestamp: props.info.timestamp
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

    return (
        <div>
            <h4 style={{display: "inline", marginRight: "10px"}}>{props.info.commenter_full_name}</h4>
            <p style={{display: "inline"}}>{props.info.content}</p>
            <span style={{position: 'absolute', right: '7.5%'}}>
                <span style={{display: "inline", fontSize: '10px', color: '#8C8C8C'}}>{epochToDate(props.info.timestamp)}</span>
                <Button style={{border: 0, padding: 0, lineHeight: '12px', width: '15px', marginLeft: '5px'}} icon={liked ? <LikeTwoTone style={{fontSize: '12px'}}/> : <LikeOutlined style={{fontSize: '12px'}}/>} onClick={likeComment}></Button>
                <span style={{fontSize: '12px'}}>{numLikes}</span>
            </span>
             
        </div>
    );
}

export default Comment;
