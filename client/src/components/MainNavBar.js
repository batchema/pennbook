
import { Button, Menu } from "antd";
import { Link } from "react-router-dom";

import '../styles/MainNavBar.css';

const MainNavBar = () => {

    return (
        <Menu style={{width: '100%', height: '50px'}} mode="horizontal">
            <Menu.Item className="no-pointer" disabled>
                <h1>
                    PennBook
                </h1>
            </Menu.Item>
            <Menu.Item className="no-pointer" style={{float: 'right'}}>
                <Button
                    style={{ marginRight: "8px"}}
                >
                    <Link to='/signup'>Sign Up</Link>
                </Button>
                <Button
                    type="primary"
                >
                    <Link to='/'>Login</Link>
                </Button>
            </Menu.Item>
        </Menu>
    );
}

export default MainNavBar;
