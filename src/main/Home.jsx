import React from 'react';

export default class Home extends React.Component {

  render() {
    return (
      <div>
        <h1><span className='logo'>look@num</span>'s projects</h1>
        <p>A compendium of various interactives and other gadgets for my reddit account</p>
        <p>Right now, I only have one project hosted here, but I plan to add more in the future</p>
        <p>Links:</p>
        <p><a href="https://reddit.com/u/lookatnum">My reddit account</a></p>
        <p><a href="/rotten-tomatoes">Rotten Tomatoes</a></p>
        <p><a href="mailto:lookatnums@gmail.com">My email (lookatnums at gmail dot com)</a></p>
      </div>
    );
  }

}

