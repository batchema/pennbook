import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Row, Col, Card, Form, Input, Button, DatePicker, Select, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, HomeOutlined, ContactsOutlined } from "@ant-design/icons";

import MainNavBar from "./MainNavBar.js";
import { interests } from "../constants/newsConstants.js";
import { titleCase } from "../utils/utils.js";
import { API_ENDPOINT } from '../constants/ports';

import '../styles/Signup.css';

const { Option } = Select;

const Signup = () => {
    
    const [input, setInput] = useState({
        username: "",
        password: "",
        firstname: "",
        lastname: "",
        email: "",
        dob: "",
        interests: [],
        affiliation: ""
    });

    const history = useHistory();

    const onInputChange = (name, e) => {

        if (name === "interests") {
            input[name] = e;
        } else if (name === "dob") {
            input[name] = e._d.toLocaleString().split(",")[0];
        } else {
            input[name] = e.target.value;
        }
        
        setInput(input);
    };

    const onSubmit = () => {

        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (input['username'] === "" || 
            input['password'] === "" || 
            input['firstname'] === "" || 
            input['lastname'] === "" || 
            input['email'] === "" || 
            input['dob'] === "" || 
            input['affiliation'] === "") {

            message.error("Please fill in all fields.");
        } else if (input['interests'].length < 2) {
            message.error("Please select at least 2 interests.");
        } else if (!emailRegex.test(input['email'])) {
            message.error("Please enter a valid email!");
        } else {

            fetch(`http://${API_ENDPOINT}/createaccount`, {
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }, 
                body: JSON.stringify({
                    username: input["username"],
                    password: input["password"],
                    firstname: input["firstname"],
                    lastname: input["lastname"],
                    email: input["email"],
                    dob: input["dob"],
                    affiliation: input["affiliation"],
                    interests: input["interests"]
                })
            })
            .then((response) => response.text())
            .then((data) => {            
                var user = JSON.parse(data);

                if (user.username === null) {
                    message.error('Username already exists.');
                } else {
                    message.success('Successfully created an account!');
                    history.push('/login');
                }
                    
            });

        }
    };

    return (
        <div className="background">
            <Row>
                <MainNavBar/>
            </Row>
            <Row style={{marginTop: '50px'}}>  
                <Col span={14}>


                </Col>
                <Col span={10}>
                    <Card className="form-card">
                        <Form layout="vertical">
                            <Form.Item
                                label={<b>Username</b>}
                                rules={[{ required: true }]}
                                style={{
                                    display: "inline-block",
                                    padding: "0 8px 0 0",
                                    width: "50%",
                                  }}
                            >
                                <Input prefix={<UserOutlined />} onChange={(e) => {onInputChange("username", e)}} name="username" />
                            </Form.Item>
                            <Form.Item
                                label={<b>Password</b>}
                                rules={[{ required: true }]}
                                style={{
                                    display: "inline-block",
                                    padding: "0 8px 0 0",
                                    width: "50%",
                                  }}
                            >
                                <Input.Password prefix={<LockOutlined />} onChange={(e) => {onInputChange("password", e)}} name="password" />
                            </Form.Item>
                            <Form.Item
                                label={<b>First Name</b>}
                                rules={[{ required: true }]}
                                style={{
                                    display: "inline-block",
                                    padding: "0 8px 0 0",
                                    width: "50%",
                                  }}
                            >
                                <Input prefix={<ContactsOutlined />} onChange={(e) => {onInputChange("firstname", e)}} name="firstname" />
                            </Form.Item>
                            <Form.Item
                                label={<b>Last Name</b>}
                                rules={[{ required: true }]}
                                style={{
                                    display: "inline-block",
                                    padding: "0 8px 0 0",
                                    width: "50%",
                                  }}
                            >
                                <Input prefix={<ContactsOutlined />} onChange={(e) => {onInputChange("lastname", e)}} name="lastname" />
                            </Form.Item>
                            <Form.Item
                                label={<b>Email</b>}
                                rules={[{ required: true }]}
                                style={{
                                    display: "inline-block",
                                    padding: "0 8px 0 0",
                                    width: "50%",
                                  }}
                            >
                                <Input prefix={<MailOutlined />} onChange={(e) => {onInputChange("email", e)}} name="email" />
                            </Form.Item>
                            <Form.Item
                                label={<b>Date of Birth</b>}
                                rules={[{ required: true }]}
                                style={{
                                    display: "inline-block",
                                    padding: "0 8px 0 0",
                                    width: "50%",
                                  }}
                            >
                                <DatePicker placeholder="" format="MM/DD/YYYY" onChange={(e) => {onInputChange("dob", e)}} style={{width: "100%"}} name="dob" />
                            </Form.Item>
                            <Form.Item
                                label={<b>Affiliation</b>}
                                rules={[{ required: true }]}
                            >
                                <Input prefix={<HomeOutlined />} onChange={(e) => {onInputChange("affiliation", e)}} name="affiliation" />
                            </Form.Item>
                            <Form.Item
                                label={<b>Interests</b>}
                                rules={[{ required: true }]}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Select Interests"
                                    showSearch={false}
                                    allowClear={true}
                                    onChange={(e) => {onInputChange("interests", e)}}
                                    >
                                        {interests.map((interest) => (
                                            <Option value={interest}>{titleCase(interest)}</Option>
                                        ))}
                                </Select>
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

export default Signup;
