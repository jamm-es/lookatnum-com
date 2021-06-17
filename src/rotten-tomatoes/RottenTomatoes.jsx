import React from 'react';
import Plot from 'react-plotly.js';
import Helmet from 'react-helmet';
import * as d3 from 'd3';
import rawData from './movies_formatted.csv';
import Menu from './Menu';
import Highlight from './Highlight';
import HoverCheckbox from './HoverCheckbox'
import ZoomCheckbox from './ZoomCheckbox';
import {layout, smallLayout} from '../FigTemplate';
import Fuse from 'fuse.js';

export default class RottenTomatoes extends React.Component {

  constructor(props) {
    super(props);
    this.data = [];
    this.state = {
      windowWidth: 0,
      initialMinCritic: 150,
      initialMinAudience: 10000,
      settings: {
        minCritic: 150,
        minAudience: 10000,
        minBoxOffice: 4
      },
      hideHover: false,
      allowZoom: false,
      filtered: [],
      search: [],
      widthMultiplier: 1
    };
    
    layout.xaxis.range = [0, 100];
    layout.xaxis.fixedrange = true;
    layout.xaxis.title.text = 'Critic Score';
    layout.yaxis.range = [0, 100];
    layout.yaxis.fixedrange = true;
    layout.yaxis.title.text = 'Audience Score';
    layout.showlegend = false;
    layout.hovermode = 'closest';

    smallLayout.xaxis.range = [0, 100];
    smallLayout.xaxis.fixedrange = true;
    smallLayout.xaxis.title.text = 'Critic Score';
    smallLayout.yaxis.range = [0, 100];
    smallLayout.yaxis.fixedrange = true;
    smallLayout.yaxis.title.text = 'Audience Score';
    smallLayout.showlegend = false;
    smallLayout.hovermode = 'closest';
  }

  updateWindowDimensions() {
    this.setState({ 
      windowWidth: window.innerWidth,
      widthMultiplier: window.innerWidth >= 1000 ? 1 : window.innerWidth / 1000
    });
  };
  
  componentDidMount() {
    d3.csv(rawData).then(data => {
      this.fuse = new Fuse(data, {
        keys: ['title', 'release_year', 'genre'],
        includeScore: true
      });
      this.data = data;
      this.handleMenuChange(this.state.settings);
    });
    window.addEventListener("resize", this.updateWindowDimensions.bind(this));
    this.updateWindowDimensions.bind(this)();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions.bind(this));
  }

  handleMenuChange(settings) {
    this.setState(() => ({
      filtered: this.data.filter(d => d['critic_number'] >= settings.minCritic && d['audience_number'] >= settings.minAudience),
      settings: settings
    }));
  }

  handleHighlightChange(query) {
    if(this.fuse == null) return;
    clearTimeout(this.performSearchDelay);
    this.performSearchDelay = setTimeout(() => {
      this.setState(() => ({
        search: this.fuse.search(query).filter(d => 
          d['score'] <= 0.1 && 
          d['item']['critic_number'] >= this.state.settings.minCritic && 
          d['item']['audience_number'] >= this.state.settings.minAudience
        ).map(d => d['item'])
      }));
    }, 250);
  }

  handleHoverCheckbox(state) {
    this.setState(() => ({
      hideHover: state
    }));
  }

  handleZoomCheckbox(state) {
    this.setState(() => ({
      allowZoom: state
    }));
  }

  render() {
    layout.xaxis.fixedrange = !this.state.allowZoom;
    smallLayout.xaxis.fixedrange = !this.state.allowZoom;
    layout.yaxis.fixedrange = !this.state.allowZoom;
    smallLayout.yaxis.fixedrange = !this.state.allowZoom;
    return (
      <div>
        <Helmet>
          <title>Rotten Tomatoes Critic vs. Audience Score</title>
        </Helmet>
        <h1>Rotten Tomatoes Critic vs. Audience Score</h1>
        <ul>
          <li>Colored based on score differential</li>
          <li>Size is approximately proportional to number of critic reviews</li>
          <li>Hover to see movie title and other information.</li>
        </ul>
        <Highlight handle={this.handleHighlightChange.bind(this)} />
        <HoverCheckbox handle={this.handleHoverCheckbox.bind(this)}/>
        <Plot
          data={[
            {
              x: this.state.filtered.map(d => d['critic_percent']),
              y: this.state.filtered.map(d => d['audience_percent']),
              type: 'scattergl',
              mode: 'markers',
              customdata: this.state.filtered,
              hoverinfo: this.state.hideHover ? 'skip' : '',
              hovertemplate: this.state.hideHover ? '' : 
                '<b>%{customdata.title}</b><br>' +
                'release year: %{customdata.release_year}<br>' + 
                'genre: %{customdata.genre}<br>' +
                'runtime: %{customdata.runtime}<br>' + 
                'critic score: %{x}%<br>' +
                'audience score: %{y}%<br>' + 
                '# of critic reviews: %{customdata.critic_number}<br>' + 
                '# of audience reviews: ~%{customdata.audience_number:,}<br><extra></extra>',
              marker: {
                color:  this.state.filtered.map(d => d['differential']),
                cmin: -50,
                cmax: 50,
                colorscale: [[0, '#3C93D6'], [0.5, '#FFFFFF'], [1, '#EBB252']],
                size: this.state.filtered.map(d => d['bubble_width'] * this.state.widthMultiplier),
                /*line: {
                  width: 0
                },*/
                line: {
                  color: this.state.filtered.map(d => d['differential']),
                  colorscale: [[0, '#337DB6'], [0.5, '#D9D9D9'], [1, '#C89746']],
                  width: 1.5,
                },
                //opacity: 0.3
                opacity: 0.5
              },
            },
            {
              x: this.state.search.map(d => d['critic_percent']),
              y: this.state.search.map(d => d['audience_percent']),
              type: 'scattergl',
              mode: 'markers',
              customdata: this.state.search,
              hovertemplate: '<b>%{customdata.title}</b><br>' +
              'release year: %{customdata.release_year}<br>' + 
              'genre: %{customdata.genre}<br>' +
              'runtime: %{customdata.runtime}<br>' + 
              'critic score: %{x}%<br>' +
              'audience score: %{y}%<br>' + 
              '# of critic reviews: %{customdata.critic_number}<br>' + 
              '# of audience reviews: ~%{customdata.audience_number:,}<br><extra></extra>',
              marker: {
                color: '#DB5B4F',
                size: this.state.search.map(d => d['bubble_width'] * this.state.widthMultiplier),
                line: {
                  color: '#af493f',
                  width: 2
                }
              }
            },
            /*{
              x: this.state.filtered.filter(d => d['title_filter'] != '').map(d => d['critic_percent']),
              y: this.state.filtered.filter(d => d['title_filter'] != '').map(d => d['audience_percent']),
              type: 'scatter',
              mode: 'markers+text',
              marker: {
                color:  this.state.filtered.filter(d => d['title_filter'] != '').map(d => d['differential']),
                cmin: -50,
                cmax: 50,
                colorscale: [[0, 'rgba(60, 147, 214, 0.7'], [0.5, 'rgba(255, 255, 255, 0.7)'], [1, 'rgba(235, 178, 82, 0.7)']],
                line: {
                  width: 2,
                  color: 'rgba(219, 91, 79, 1)'
                },
                opacity: 1,
                size: this.state.filtered.filter(d => d['title_filter'] != '').map(d => d['bubble_width'])
              },
              hoverinfo: 'skip',
              text: this.state.filtered.filter(d => d['title_filter'] != '').map(d => d['title_filter'])
            },*/
            {
              x: [0, 100],
              y: [0, 100],
              type: 'scattergl',
              mode: 'lines',
              hoverinfo: 'skip',
              line: {
                color: '#666666',
                width: 2,
                dash: 'dot'
              }
            }
          ]}
          layout={this.state.windowWidth > 800 ? layout : smallLayout}
          config={{displayModeBar: false}}
          useResizeHandler={true}
          style={{width: 'min(900px, min(90vmin, 100vw - 40px))', height: 'min(900px, min(90vmin, 100vw - 40px))', margin: '0 auto'}}
        />
        <ZoomCheckbox handle={this.handleZoomCheckbox.bind(this)}/>
        <br />
        <Menu 
          handle={this.handleMenuChange.bind(this)} 
          initialMinCritic={this.state.initialMinCritic}
          initialMinAudience={this.state.initialMinAudience}
        />
        <br />
        <p>Note that only about half of the movies in Rotten Tomatoes could be indexed. This data set is biased towards more recent films, so many older movies 
          might not show up in the search tool.
        </p>
      </div>
      )
  }
};