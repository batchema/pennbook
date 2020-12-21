import { useState, useEffect } from "react";
import { useLocation, useHistory, Link } from "react-router-dom";
import { Row, message } from "antd";
import Graph from "react-graph-vis";
import { uuid } from "uuidv4";
import socketClient from "socket.io-client";

import HomeNavBar from "./HomeNavBar.js";

import { useAuth } from "../contexts/auth";
import { API_ENDPOINT } from '../constants/ports';

const socket = socketClient(`http://${API_ENDPOINT}`);

const Visualizer = () => {

    const { setAuth } = useAuth();

    const history = useHistory();
    const location = useLocation();
    
    // Maintain states for user's affiliation and graph structure
    const [affiliation, setAffiliation] = useState("");
    const [graph, setGraph] = useState({nodes: [], edges: []});

    useEffect(() => {

        console.log('hi');

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

                // Fetch the current friends of user
                fetch(`http://${API_ENDPOINT}/getcurrentfriends`, {
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
                    // Initialize graph structure: nodes and edges to each friend        
                    var allFriends = JSON.parse(data).status;
                    var friendNodes = [];
                    var friendEdges = [];

                    // Add the logged-in user's node to the graph
                    friendNodes.push( { 
                        id: 0, 
                        label: user.fullname, 
                        color: "#ff9c6e",
                        font: '12px Helvetica black',
                        borderWidth: 0,
                        shape: 'circle',
                        user: user.user 
                    } );
                    // Iterate through each friend and create a new node and add to graph
                    allFriends.forEach((friend, index) => {
                        friendNodes.push( { 
                            id: index+1, 
                            label: friend.friendB_full_name, 
                            color: "#9254de",
                            font: '12px Helvetica white',
                            borderWidth: 0,
                            shape: 'circle',
                            user: friend.friendB
                        } );
                    });
                    // Add an edge from logged-in user's node to each friend node
                    allFriends.forEach((friend, index) => {
                        friendEdges.push( { from: 0, to: index+1} );
                    });
                    // Render the graph with these set of nodes and edges
                    setGraph({nodes: friendNodes, edges: friendEdges });
                });
            });
        });

        socket.on('message', (m) => {  
            message.info(<span>{m.sender} sent you a message</span>);
        });

    }, []);

    useEffect(() => {

        console.log('hi2');

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

            // Fetch the current friends of user
            fetch(`http://${API_ENDPOINT}/getcurrentfriends`, {
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
                // Initialize graph structure: nodes and edges to each friend        
                var allFriends = JSON.parse(data).status;
                var friendNodes = [];
                var friendEdges = [];

                // Add the logged-in user's node to the graph
                friendNodes.push( { 
                    id: 0, 
                    label: user.fullname, 
                    color: "#ff9c6e",
                    font: '12px Helvetica black',
                    borderWidth: 0,
                    shape: 'circle',
                    user: user.user 
                } );
                // Iterate through each friend and create a new node and add to graph
                allFriends.forEach((friend, index) => {
                    friendNodes.push( { 
                        id: index+1, 
                        label: friend.friendB_full_name, 
                        color: "#9254de",
                        font: '12px Helvetica white',
                        borderWidth: 0,
                        shape: 'circle',
                        user: friend.friendB
                    } );
                });
                // Add an edge from logged-in user's node to each friend node
                allFriends.forEach((friend, index) => {
                    friendEdges.push( { from: 0, to: index+1} );
                });
                // Render the graph with these set of nodes and edges
                setGraph({nodes: friendNodes, edges: friendEdges });
            });
        });

        // Fetch user's account details and retrieve affiliation
        fetch(`http://${API_ENDPOINT}/accountdetails`, {
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
            setAffiliation(accountDetails.affiliation);
        });

    }, [location])

    // Set the styling options for the graph (color and size)
    const options = {
        layout: {
          hierarchical: true
        },
        edges: {
          color: "#000000"
        },
        height: "600px",
        width: "1000px"
    };

    const events = {
        select: function(event) {

            // Extract the username of the clicked-on user
            var allNodes = graph.nodes;
            var allEdges = graph.edges;
            var { nodes } = event;
            var clickedNode = nodes[0];
            var c = graph.nodes[clickedNode];

            if (c) {
                var clickedUser = graph.nodes[clickedNode].user;

                console.log("Clicked user: " + clickedUser);

                // Fetch the friends of the clicked user who have the same affiliation
                fetch(`http://${API_ENDPOINT}/getnewuserstovisualize?affiliation=${affiliation}&clickedUser=${clickedUser}`, {
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
                    // Iterate through friends list and check if node already present in graph    
                    JSON.parse(data).users.forEach((userToAdd) => {
                        if (!graph.nodes.some(user => user.user === userToAdd.friendB)){
                            // For a new user, create a new node and new edge from clicked user to this user
                            var nodeToAdd = { 
                                id: allNodes.length, 
                                label: userToAdd.friendB_full_name, 
                                user: userToAdd.friendB,
                                color: "#9254de",
                                font: '12px Helvetica white',
                                borderWidth: 0,
                                shape: 'circle'
                            };
                            var edgeToAdd = { from: clickedNode, to: nodeToAdd.id };
                            allNodes.push(nodeToAdd);
                            allEdges.push(edgeToAdd);
                        }
                    });

                    // Render the graph with these new additional nodes and edges
                    setGraph({nodes: allNodes, edges: allEdges });
                });  
            }          
        }
    };
    return (
        <div className="background">
            <Row>
                <HomeNavBar/>
            </Row>
            <Graph style={{width: '1000px', margin: 'auto'}} key={uuid()} graph={graph} options={options} events={events}/>
        </div>
    );
    
}

export default Visualizer;