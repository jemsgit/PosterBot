import React, { Component } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { inject, observer } from 'mobx-react';

const mapping = (stores) => {
    console.log(stores);
    return {
      user: stores.store.userStore
    }
}

class PrivateRoute extends Component {

    render() {
        let { component: Comp, ...rest } = this.props
        return (
          <Route {...rest} render={() => (
            this.props.user.isAuth === true
              ? <Comp />
              : <Redirect to='/login' />
          )} />
        )
    }

}

export default inject(mapping)(PrivateRoute);
