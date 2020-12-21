import { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';

import { Row, Col, Input, Card, Empty, message, Button } from "antd";
import { LoadingOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import socketClient from "socket.io-client";

import HomeNavBar from "./HomeNavBar.js";
import NewsArticle from "./NewsArticle.js";

import { useAuth } from "../contexts/auth";
import { API_ENDPOINT } from '../constants/ports';

import '../styles/NewsFeed.css';

const { Search } = Input;

const socket = socketClient(`http://${API_ENDPOINT}`);

const NewsFeed = () => {

    const { setAuth } = useAuth();
    const history = useHistory();

    const [loading, setLoading] = useState(false);
    const [articles, setArticles] = useState([]);
    const [page, setPage] = useState(0);
    const [searchTerms, setSearchTerms] = useState([]);

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
    
    const onNewsSearch = (e) => {

        if (e.trim() === "") {
            return;
        }

        var searchTerms = e.trim().split(/\s+/);

        setArticles([]);
        setSearchTerms(searchTerms);
        setLoading(true);

        fetch(`http://${API_ENDPOINT}/newssearch`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                queries: searchTerms,
                page: 0
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
            var articles = JSON.parse(data);

            setLoading(false);
            setArticles(articles.articles);

            console.log(articles.articles);
        });

    };

    const nextPage = () => {
        setPage(page => page + 1);

        setArticles([]);
        setLoading(true);

        fetch(`http://${API_ENDPOINT}/newssearch`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                queries: searchTerms,
                page: page + 1
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
            var articles = JSON.parse(data);

            setLoading(false);
            setArticles(articles.articles);
        });
    };

    const prevPage = () => {
        setPage(page => page - 1);

        setArticles([]);
        setLoading(true);

        fetch(`http://${API_ENDPOINT}/newssearch`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
            },
            body: JSON.stringify({
                queries: searchTerms,
                page: page - 1
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
            var articles = JSON.parse(data);

            setLoading(false);
            setArticles(articles.articles);
        });
    };

    return (
        <div className="background">
            <Row>
                <HomeNavBar/>
            </Row>
            <Row style={{marginTop: '50px'}}>  
                <Col span={6}></Col>
                <Col span={12}>
                    <Search className="news-search" size="large" placeholder="Find news articles ..." enterButton onSearch={onNewsSearch} />
                    {loading ? 
                        <Row style={{marginTop: '30px'}}>
                            <LoadingOutlined style={{ fontSize: '30px', color: 'white', margin: 'auto'}} />
                        </Row> 
                    : 
                        <span></span>
                    }
                    {articles.length > 0 ? 
                        <div>
                            {articles.map((article) => {
                                return <NewsArticle info={article} />
                            })}
                            <Row>
                                <div style={{margin: 'auto'}}>
                                    <Button style={{margin: '5px'}} icon={<LeftOutlined/>} onClick={prevPage} disabled={page === 0}/>
                                    <Button style={{margin: '5px'}} icon={<RightOutlined/>} onClick={nextPage} disabled={articles.length < 10}/>
                                </div>
                            </Row>
                        </div>
                    : loading ?
                        <span></span>
                    :
                        <Card className="post">
                            <Empty 
                                image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                                description={"Search For Articles"}
                            />
                        </Card>

                    }
                </Col>
                <Col span={6}></Col>
            </Row>
        </div>
    );
}

export default NewsFeed;
