import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Provider } from "mobx-react"
import AppRouter from './routes';
import RootStore from './stores/rootStore';

const render = (Component) =>
  ReactDOM.render(
    <AppContainer>
      <Provider store = {RootStore} >
          <MuiThemeProvider>
          <Component />
        </MuiThemeProvider>
      </Provider>
    </AppContainer>,
    document.getElementById('app')
  );

render(AppRouter);

if (module.hot) {
  module.hot.accept('./routes', () => {
    require('./routes');
    render(AppRouter);
  });
}
