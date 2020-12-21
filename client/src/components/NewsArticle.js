import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Card, Tag, Button } from "antd";
import { LikeOutlined, LikeTwoTone } from "@ant-design/icons";

import { formatDate, titleCase, formatDatePlus } from "../utils/utils.js";
import { useAuth } from "../contexts/auth";
import { API_ENDPOINT } from '../constants/ports';

import '../styles/NewsFeed.css';

const NewsArticle = (props) => {

    const { setAuth } = useAuth();
    const history = useHistory();

    const [liked, setLiked] = useState(false);
    const [numLikes, setNumLikes] = useState(0);

    useEffect(() => {

        var correct_article_id = props.info.article_id.S ? props.info.article_id.S : props.info.article_id;

        fetch(`http://${API_ENDPOINT}/isArticleLiked?article_id=${correct_article_id}`, {
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

        fetch(`http://${API_ENDPOINT}/numlikesarticle?article_id=${correct_article_id}`, {
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
            var likes = JSON.parse(data);
            setNumLikes(likes.num_likes);
        });

    
    });

    const likeArticle = () => {

        var url = liked ? `http://${API_ENDPOINT}/unlikearticle` : `http://${API_ENDPOINT}/likearticle`;
        var correct_article_id = props.info.article_id.S ? props.info.article_id.S : props.info.article_id;

        fetch(url, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                article_id: correct_article_id
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
        <Card className="news-article">
            <div>
                <h3 style={{marginBottom: 0 }}>{props.info.headline.S ? props.info.headline.S : props.info.headline}</h3>
                <p style={{fontStyle: "italic"}}>{props.info.authors.S ? props.info.authors.S : props.info.authors}</p>
                
                <p>{props.info.short_description.S ? props.info.short_description.S : props.info.short_description}</p>

                <a target="_blank" rel="noopener noreferrer" href={props.info.url ? props.info.url : props.info.link.S ? props.info.link.S : props.info.link}>Read Full Article</a>
                <span style={{float: "right"}}>{props.info.date.S ?
                    formatDatePlus(props.info.date.S) : 
                    formatDate(props.info.date)
                }
                </span>
                <Tag color="blue" style={{float: "right"}}>{titleCase(props.info.category.S ? props.info.category.S : props.info.category)}</Tag>
                <Button style={{border: 0}} icon={liked ? <LikeTwoTone /> : <LikeOutlined />} onClick={likeArticle}></Button> {numLikes} {numLikes === 1 ? "Like" : "Likes"} 
            </div>
        </Card>
    );
}

export default NewsArticle;
