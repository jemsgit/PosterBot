import React from 'react';

import { Switch } from 'react-router-dom'
import { BrowserRouter as Router, Route, IndexRoute } from 'react-router-dom'
import createBrowserHistory from 'history/createBrowserHistory'

import PrivateRoute from './components/privateRoute/privateRoute'
import Channels from './components/channels/channels';
import Home from './components/home/home';
import Login from './components/login/login';
import {test} from './utils/utils';

const history = createBrowserHistory();

export default () => (
  <Router history={history}>
    <Switch>
      <Route exact path='/login' component={Login} />
      <PrivateRoute path='/channels' comonent={Channels} />
    </Switch>

  </Router>
);
