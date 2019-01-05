import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

const mapping = (store) => ({
  user: store.user
})

class Channels extends Component {
    render(){
      return (<div>{this.props.user}<h1>123</h1></div>)
    }
}

export default inject(mapping)(Channels)
