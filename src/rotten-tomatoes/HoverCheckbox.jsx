import React from 'react';
import PropTypes from 'prop-types';
import equal from 'fast-deep-equal/react';

export default class Menu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hideHover: false,
      completedInitialUpdate: false
    };
  }

  // notifies chart if menu states have updated
  componentDidUpdate(prevProps, prevState) {
    if(!equal(prevState, this.state) || !this.state.completedInitialUpdate) {
      this.props.handle(this.state.hideHover);
      this.setState(() => ({completedInitialUpdate: true}));
    }
  }

  render() {
    return (
        <p>Hide hover labels for non-search results (helps if other movies are obscuring your searches): 
          <input type='checkbox' onChange={e => this.setState(() => ({hideHover: !this.state.hideHover}))}/>
        </p>
        
        
    )
  }
}

Menu.propTypes = {
  handle: PropTypes.func.isRequired,
}