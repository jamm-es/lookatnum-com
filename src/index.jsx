import React from 'react';
import ReactDOM from 'react-dom';
import Helmet from 'react-helmet';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from 'react-router-dom';

import './index.css';

import {Home, Footer, NotFound} from './main';
import {RottenTomatoes} from './rotten-tomatoes';
import {RedditAccountAge} from './reddit-account-age';
import {RAll} from './r-all';
import {CovidMap} from './covid-map';;

ReactDOM.render(
  <React.StrictMode>
    <Helmet
      titleTemplate='%s | look@num'
      defaultTitle='look@num'
    >
    </Helmet>
    <Router>
      <main>
        <Switch>
          <Route exact path='/' component={Home} />
          <Route exact path='/rotten-tomatoes' component={RottenTomatoes} />
          <Route exact path='/reddit-account-age' component={RedditAccountAge}/>
          <Route exact path='/r-all' component={RAll}/>
          <Route exact path='/covid-map' component={CovidMap}/>
          <Route component={NotFound} />
        </Switch>
      </main>

      {/* footer only shows up on pages that are not the home page*/}
      <Route exact path='/:any'>
        <Footer />
      </Route>

    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);  