import React, {Component} from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { Redirect } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import cn from 'cn-decorator';

const mapper = (stores) => {
  return {
    user: stores.store.userStore
  }
}

@cn('login')
class Login extends Component {
  render() {
    return(

      <form className={ cn('1223') }>
        <div>{this.props.user.login}</div>
        <div>
        <TextField
          name='login'
          label='Login'
          placeholder="Login"
          />
        </div>
        <div>
          <TextField
            name='password'
            label='Password'
            type='password'
            />
        </div>
        <div>4564545</div>
        <div>
          <Button
            variant="raised"
            component="span"
            onClick={this.props.user.authenticateUser}
          >
          Login
        </Button>
        </div>
      </form>)
  }
}

export default inject(mapper)(Login)
