import React from 'react';
import './footer.css';

export default class Footer extends React.Component {

  render() {
    return (
      <footer>
        <p><a href='/'>Homepage</a></p>
        <p>Email me: <a href="mailto:lookatnums@gmail.com">lookatnums@gmail.com</a></p> 
      </footer>
    )
  }
}