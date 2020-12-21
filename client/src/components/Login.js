import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Row, Col, Card, Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

import MainNavBar from "./MainNavBar.js";

import { useAuth } from "../contexts/auth";
import { API_ENDPOINT } from '../constants/ports';

import '../styles/Login.css';

const Login = () => {

    const { setAuth } = useAuth();

    const [input, setInput] = useState({
        username: "",
        password: ""
    });

    const onInputChange = (name, e) => {
        input[name] = e.target.value;
        setInput(input);
    };

    const history = useHistory();

    const onSubmit = () => {

        if (input["username"] === "" || input["password"] === "") {
            message.error("Please fill in all fields.");
        } else {

            fetch(`http://${API_ENDPOINT}/checklogin`, {
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'content-type': 'application/json',
                }, 
                body: JSON.stringify({
                    username: input["username"],
                    password: input["password"]
                })
            })
            .then((response) => response.text())
            .then((data) => {
                var response = JSON.parse(data);
                if (response.login) {
                    setAuth(response.accessToken);
                    history.push(`/home`);
                } else {
                    message.error("Invalid username and password.");
                }
            });
        }

    };

    return (
        <div className="background">
            <Row>
                <MainNavBar/>
            </Row>
            <Row style={{marginTop: "50px"}}>  
                <Col span={14}>


                </Col>
                <Col span={10}>
                    <Card className="form-card">
                        <Form layout="vertical">
                            <Form.Item
                                label={<b>Username</b>}
                                rules={[{ required: true }]}
                            >
                                <Input prefix={<UserOutlined />} onChange={(e) => {onInputChange("username", e)}} name="username" />
                            </Form.Item>
                            <Form.Item
                                label={<b>Password</b>}
                                rules={[{ required: true }]}
                            >
                                <Input.Password prefix={<LockOutlined />} onChange={(e) => {onInputChange("password", e)}} name="password" />
                            </Form.Item>
                            <Form.Item>
                                <Button onClick={onSubmit} type="primary" htmlType="submit">
                                    Submit
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Login;
