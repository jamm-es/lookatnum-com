import React from 'react';
import ReactDOM from 'react-dom';
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

// import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <main>
        <Switch>
          <Route exact path='/' component={Home} />
          <Route exact path='/rotten-tomatoes' component={RottenTomatoes}/>
          <Route exact path='/notfound' component={NotFound} />
          <Redirect to='/notfound'/>
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
