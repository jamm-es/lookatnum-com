import React from 'react';
import Plot from 'react-plotly.js';
import * as d3 from 'd3';
import rawData from './movies_formatted.csv';
import Menu from './Menu';
import {layout} from '../FigTemplate';

export default class RottenTomatoes extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      data: {},
      initialMinCritic: 250,
      initialMinAudience: 50000,
      initialMinBoxOffice: 4
    };
    
    layout.xaxis.range = [0, 100];
    layout.yaxis.range = [0, 100];
    layout.xaxis.fixedrange = true;
    layout.yaxis.fixedrange = true;

    layout.title.text = '<b>Rotten Tomatoes Critic vs Audience Score</b>';
    layout.xaxis.title.text = 'Critic Score';
    layout.yaxis.title.text = 'Audience Score';
  }
  
  componentDidMount() {
    d3.csv(rawData).then(data => {
      this.setState(() => ({data: data}));
    });
  }



  handleMenuChange(settings) {
    console.log(this.state.data);
    console.log(settings);
    const data = this.state.data.filter(d => d['critic_number'] >= settings.minCritic && d['audience_number'] >= settings.minAudience);
    console.log(data);
    this.setState(() => ({
      x: data.map(d => d['critic_percent']),
      y: data.map(d => d['audience_percent']),
      color: data.map(d => d['differential'])
    }));
  }

  render() {
    return (
      <div>
        <Plot
          data={[
            {
              x: this.state.x,
              y: this.state.y,
              type: 'scatter',
              mode: 'markers',
              marker: {
                color: this.state.color,
                cmin: -50,
                cmax: 50,
                colorscale: [[0, '#3C93D6'], [0.5, '#FFFFFF'], [1, '#EBB252']]
              }
            }
          ]}
          layout={layout}
          config={{displayModeBar: false}}
          useResizeHandler={true}
          style={{width: 'min(90vh, min(1100px, 90vw))', height: 'min(90vh, min(1100px, 90vw))', margin: '0 auto'}}
        />
        <Menu 
          handle={this.handleMenuChange.bind(this)} 
          initialMinCritic={this.state.initialMinCritic}
          initialMinAudience={this.state.initialMinAudience}
          initialMinBoxOffice={this.state.initialMinBoxOffice}
        />
      </div>
      )
  }
}