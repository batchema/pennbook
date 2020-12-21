import { useEffect, useState } from "react";
import { Button, Menu, Input, Select, AutoComplete } from "antd";
import { DeploymentUnitOutlined, HomeOutlined, MenuOutlined, UserOutlined, CommentOutlined, SearchOutlined } from "@ant-design/icons";
import { Link, useHistory, withRouter } from "react-router-dom";

import { useAuth } from "../contexts/auth";
import { API_ENDPOINT } from '../constants/ports';

import '../styles/HomeNavBar.css';

const { Option } = AutoComplete;

const HomeNavBar = () => {

    const history = useHistory();

    const { setAuth } = useAuth();

    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [searchVal, setSearchVal] = useState("");

    const onLogout = () => {

        fetch(`http://${API_ENDPOINT}/logout`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then((response) => response.text())
        .then((data) => {
            setAuth("");
            history.push(`/`);
        });
    };

    const onChange = (e) => {
        
        var search = e.toLowerCase();

        if (search && search !== "") {
            fetch(`http://${API_ENDPOINT}/getsearchsuggs?prefix=${search}`, {
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
                var searchSuggestions = JSON.parse(data);
                console.log(searchSuggestions);

                setSearchSuggestions(searchSuggestions.suggs);
            });
        } else {
            setSearchSuggestions([]);
        }

    };

    const onSelect = (e) => {
        setSearchVal(e);
    };

    const onDeselect = (e) => {
        setSearchVal("");
        setSearchSuggestions([]);
    };

    const search = () => {

        if (searchVal && searchVal !== "") {
            history.push(`/profile/${searchVal}`);
            setSearchVal("");
        }
   
    }

    return (
        <Menu style={{width: '100%', height: '50px'}} mode="horizontal">
            <Menu.Item className="no-pointer">
                <h1>
                    <Link to="/home">PennBook</Link>
                </h1>
            </Menu.Item>
            <Menu.Item className="no-pointer" disabled>
                <Select 
                    filterOption={false}
                    mode="multiple" 
                    placeholder="Find users ..."
                    onSearch={onChange}
                    onSelect={onSelect}
                    onDeselect={onDeselect}
                    removeIcon={<span></span>}
                    style={{marginBottom: "20px", width: "400px"}}
                    maxTagCount={1}
                >
                    {searchSuggestions.map((sugg) => (
                        <Option 
                            key={sugg.username} 
                            value={sugg.username}
                            disabled={searchVal !== "" && searchVal !== sugg.username}
                        >
                            {sugg.fullname}
                        </Option>
                    ))}
                </Select>
                <Button onClick={search} type="primary">Search</Button>
            </Menu.Item>
            <Menu.Item style={{float: 'right'}} className="no-pointer" disabled>
                <Button
                    type="primary"
                    onClick={onLogout}
                >
                    Logout
                </Button>
            </Menu.Item>
            <Menu.Item style={{float: 'right'}}>
                <Link to="/profile">
                    <UserOutlined />
                    My Profile
                </Link>
            </Menu.Item>
            <Menu.Item style={{float: 'right'}}>
                <Link to="/messages">
                    <CommentOutlined />
                    Messages
                </Link>
            </Menu.Item>
            <Menu.Item style={{float: 'right'}}>
                <Link to="/visualizer">
                    <DeploymentUnitOutlined />
                    Visualizer
                </Link>
            </Menu.Item>
            <Menu.Item style={{float: 'right'}}>
                <Link to="/newsfeed">
                    <MenuOutlined />
                    News Feed
                </Link>
            </Menu.Item>
            <Menu.Item style={{float: 'right'}}>
                <Link to="/home">
                    <HomeOutlined />
                    Home
                </Link>
            </Menu.Item>
        </Menu>
    );
}

export default withRouter(HomeNavBar);
