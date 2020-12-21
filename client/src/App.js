import { useState } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import Messages from './components/Messages';
import Home from './components/Home';
import NewsFeed from './components/NewsFeed';
import Visualizer from './components/Visualizer';

import AuthRoute from './routes/AuthRoute';

import { AuthContext } from "./contexts/auth";

import './App.css';
import "antd/dist/antd.css";

function App() {

  const tokens = JSON.parse(localStorage.getItem("accessToken"));
  const [auth, setAuth] = useState(tokens);

  const setTokens = (data) => {
    localStorage.setItem("accessToken", JSON.stringify(data));
    setAuth(data);
  }

  return (
    <AuthContext.Provider value={{ auth: auth, setAuth: setTokens }}>
      <Router>
        <div className="App">
        </div>

        <Switch>
          <AuthRoute path="/home" component={Home} />
          <AuthRoute path="/messages/:chatid" component={Messages} />
          <AuthRoute path="/messages" component={Messages} />
          <AuthRoute path="/profile/:username" component={Profile} />
          <AuthRoute path="/profile" component={Profile} />
          <AuthRoute path="/newsfeed" component={NewsFeed} />
          <AuthRoute path="/visualizer" component={Visualizer} />
          <Route path="/signup" component={Signup} />
          <Route path="/login" component={Login} />
          <Route path="/">
            {auth ? <Redirect to="/home" /> : <Redirect to="/login" />}
          </Route> 
        </Switch>

      </Router>
    </AuthContext.Provider>
  );

}

export default App;
