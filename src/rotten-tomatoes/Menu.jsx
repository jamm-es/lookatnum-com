import React from 'react';
import PropTypes from 'prop-types';
import equal from 'fast-deep-equal/react';

export default class Menu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      minCritic: props.initialMinCritic,
      minAudience: props.initialMinAudience,
      completedInitialUpdate: false
    };
  }

  // notifies chart if menu states have updated
  componentDidUpdate(prevProps, prevState) {
    if(!equal(prevState, this.state) || !this.state.completedInitialUpdate) {
      this.props.handle(this.state);
      this.setState(() => ({completedInitialUpdate: true}));
    }
  }

  render() {
    return (
      <div className='seperate'>
        <p>Filters:</p>
        <p>
          <label>
            Minimum critic reviews:
            <select value={this.state.minCritic} onChange={e => this.setState(() => ({minCritic: parseInt(e.target.value)}))}>
              <option value={1}>All</option>
              <option value={10}>10+</option>
              <option value={25}>25+</option>
              <option value={50}>50+</option>
              <option value={100}>100+</option>
              <option value={150}>150+</option>
              <option value={200}>200+</option>
              <option value={250}>250+</option>
              <option value={500}>500+</option>
            </select>
          </label>
        </p>
        <p>
          <label>
            Minimum audience reviews:
            <select value={this.state.minAudience} onChange={e => this.setState(() => ({minAudience: parseInt(e.target.value)}))}>
              <option value={1}>All</option>
              <option value={50}>50+</option>
              <option value={100}>100+</option>
              <option value={250}>250+</option>
              <option value={500}>500+</option>
              <option value={1000}>1,000+</option>
              <option value={2500}>2,500+</option>
              <option value={5000}>5,000+</option>
              <option value={10000}>10,000+</option>
              <option value={25000}>25,000+</option>
              <option value={50000}>50,000+</option>
              <option value={100000}>100,000+</option>
              <option value={250000}>250,000+</option>
            </select>
          </label>
        </p>
        
      </div>
    )
  }
}

Menu.propTypes = {
  handle: PropTypes.func.isRequired,
  initialMinCritic: PropTypes.number.isRequired,
  initialMinAudience: PropTypes.number.isRequired,
}