import React from 'react';
import PropTypes from 'prop-types';
import equal from 'fast-deep-equal/react';

export default class Highlight extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      searchQuery: '',
      completedInitialUpdate: false
    };
  }

  // notifies chart if menu states have updated
  componentDidUpdate(prevProps, prevState) {
    if(!equal(prevState, this.state) || !this.state.completedInitialUpdate) {
      this.props.handle(this.state.searchQuery);
      this.setState(() => ({completedInitialUpdate: true}));
    }
  }

  render() {
    return (
      <div className='seperate'>
        <label>
          Search for a movie title or genre:
          <input type='text' value={this.state.searchQuery} onChange={e => this.setState(() => ({searchQuery: e.target.value}))}></input>
        </label>
        
      </div>
    )
  }
}

Highlight.propTypes = {
  handle: PropTypes.func.isRequired,
}