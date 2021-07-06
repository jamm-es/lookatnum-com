import React from 'react';

export default class Home extends React.Component {

  render() {
    return (
      <div>
        <h1><span className='logo'>look@num</span>'s projects</h1>
        <p>A compendium of various interactives and other gadgets for my reddit account</p>
        <br />

        <p>Projects:</p>
        <ul>
          <li><a href="/rotten-tomatoes">Rotten Tomatoes Critic vs. Audience Score</a></li>
          <li><a href='/reddit-account-age'>Reddit Account Ages Over Time</a></li>
          <li><a href='/r-all'>24 Hours of r/all</a></li>
        </ul>

        <br />
        <p>Links:</p>
        <ul>
          <li><a href="https://reddit.com/u/lookatnum">My reddit account</a></li>
          <li><a href="https://github.com/jamm-es">My github</a> </li>
          <li><a href="mailto:lookatnums@gmail.com">My email: lookatnums@gmail.com</a> </li>

        </ul>
      </div>
    );
  }

}

