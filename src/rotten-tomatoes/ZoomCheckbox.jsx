import React from 'react';
import PropTypes from 'prop-types';
import equal from 'fast-deep-equal/react';

export default class Menu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      allowZoom: false,
      completedInitialUpdate: false
    };
  }

  // notifies chart if menu states have updated
  componentDidUpdate(prevProps, prevState) {
    if(!equal(prevState, this.state) || !this.state.completedInitialUpdate) {
      this.props.handle(this.state.allowZoom);
      this.setState(() => ({completedInitialUpdate: true}));
    }
  }

  render() {
    return (
        <p>Allow zooming and scrolling of axes: 
          <input type='checkbox' onChange={e => this.setState(() => ({allowZoom: !this.state.allowZoom}))}/>
        </p>
        
        
    )
  }
}

Menu.propTypes = {
  handle: PropTypes.func.isRequired,
}