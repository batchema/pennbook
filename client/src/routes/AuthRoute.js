import React from 'react';
import { Route, Redirect } from 'react-router-dom';

import { useAuth } from "../contexts/auth";


const AuthRoute = ({ component: Component, ...rest }) => {
    
    const { auth } = useAuth();

    return(
        <Route
            {...rest}
            render={props =>
                auth ? (<Component {...props} />) : (<Redirect to="/" />)
            }
        />
    );

}

export default AuthRoute;