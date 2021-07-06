import React from 'react';
import Helmet from 'react-helmet';
import * as d3 from 'd3';
import {textwrap} from 'd3-textwrap';

import overTimePath from './over_time.csv';
import submissionsPath from './submissions.csv';
import scalePath from './YlGnBu.png';

export default class RAll extends React.Component {

  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
    this.state = {
      windowWidth: 1000,
      chartWidth: 960,
      chartHeight: 720
    }

    this.mountedComponents = false;
    this.startedAnimation = false;

    this.innerWidth = 1000;
    this.innerHeight = 1000;

    this.numRanks = 200;

    this.lockedInfoBox = false;

    this.isPaused = false;

    this.curIndex = 0;
  }

  updateWindowDimensions() {
    this.setState({ 
      windowWidth: window.innerWidth,
      widthMultiplier: window.innerWidth >= 1000 ? 1 : window.innerWidth / 1000,
      chartWidth: window.innerWidth > 800 ? Math.min(window.innerWidth-80, 900) : window.innerWidth-40,
      chartHeight: (window.innerWidth > 800 ? Math.min(window.innerWidth-80, 900) : window.innerWidth-40) /4*3,
      chartHeightMobile: (window.innerWidth > 800 ? Math.min(window.innerWidth-80, 900) : window.innerWidth-40) *2.5
    });
  };
  
  async componentDidMount() {

    const parseDate = d3.timeParse('%Y-%m-%d %H:%M:%S.%f');
    [this.overTime, this.submissions] = await Promise.all([
      d3.csv(overTimePath, d => {
        d.time = parseDate(d.time);
        return d;
      }),
      d3.csv(submissionsPath, d => {
        d.created = new Date(d.created_utc * 1000);
        return d;
      })
    ]);
    this.submissions = this.submissions.reduce((obj, item) => Object.assign(obj, {[item.id]: item}), {});

    this.fig = d3.select(this.svgRef.current)
      .attr('overflow', 'visible')
      .attr('class', 'seperate');

    this.scaleTitle = this.fig.append('svg:text')
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .text('Post age')
      .attr('y', -80);

    this.scaleLabels = this.fig.selectAll('.scale-labels')

    this.scale = this.fig.append('svg:image')
      .attr('href', scalePath)
      .attr('y', -70)
      .attr('preserveAspectRatio', 'none')
      .attr('height', 30);

    this.background = this.fig.append('svg:rect')
      .attr('fill', '#2b2b2b')

    this.chart = this.fig.append('svg:svg')
      .attr('viewBox', [0, 0, this.innerWidth, this.innerHeight]);

    this.nodes = [];

    this.simulation = d3.forceSimulation(this.nodes)
      .force('rank', d3.forceRadial(d => Math.sqrt(d.rank % 1000) * 31, 500, 500)) // mod 1000 ensures that nodes that are marked to move out eventually do not actually move
      .force('collide', d3.forceCollide(d => d.radius))
      .alphaDecay(0)
      .stop();

    this.dateLabel = this.fig.append('svg:text')
      .style('font-height', '20px')
      .attr('fill', '#FFFFFF')
      .attr('text-anchor', 'end');

    this.timeLabel = this.fig.append('svg:text')
      .style('font-height', '20px')
      .attr('fill', '#FFFFFF')
      .attr('text-anchor', 'end');

    this.buttonsGroup = this.fig.append('svg:g');

    const togglePause = () => {
      if(this.isPaused) {
        this.isPaused = false;
        this.runAnimation(this.curIndex);
        this.buttonsGroup.select('#pause-icon')
          .text('⏸');
      }
      else {
        this.isPaused = true;
        this.buttonsGroup.select('#pause-icon')
          .text('▶');
      }
    };

    this.pauseGroup = this.buttonsGroup.append('svg:g')
      .on('click', togglePause);

    this.pauseButton = this.pauseGroup.append('svg:rect')
      .attr('width', 30)
      .attr('height', 30)
      .attr('fill', '#666666')
      .attr('x', -70)

    this.pauseGroup.append('svg:text')
      .attr('id', 'pause-icon')
      .text('⏸')
      .style('font-height', 30)
      .attr('x', -55)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle');

    this.resetGroup = this.buttonsGroup.append('svg:g')
      .on('click', () => {
        this.isPaused = true;
        setTimeout(() => {
          this.curIndex = 0;
          togglePause();
        }, 250)
      });

    this.resetButton = this.resetGroup.append('svg:rect')
      .attr('width', 30)
      .attr('height', 30)
      .attr('fill', '#666666')
      .attr('x', -35);

    this.resetGroup.append('svg:text')
      .text('⏮')
      .style('font-height', 30)
      .attr('x', -20)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle');

    this.infoBox = this.fig.append('svg:g')
      .attr('display', 'none');

    window.addEventListener("resize", this.updateWindowDimensions.bind(this));
    this.updateWindowDimensions.bind(this)();

    this.mountedComponents = true;
    this.forceUpdate();

  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions.bind(this));
  }

  runAnimation(i) {
    this.curIndex = i;

    this.simulation.stop();

    const d = this.overTime[i]

    if(typeof d === 'undefined') return;

    const dateFormat = d3.timeFormat('%B %d, %Y');
    this.dateLabel.text(dateFormat(d.time));

    const timeFormat = d3.timeFormat('%H:%M EDT');
    this.timeLabel.text(timeFormat(d.time));
    
    for(let rank = 1; rank <= this.numRanks; ++rank) {
      
      const radius = Math.sqrt(d[`${rank}_score`])/5
      
      const origNode = this.nodes.find(e => e.id === d[rank])
      if(typeof origNode !== 'undefined') {
        Object.assign(origNode, {
          rank: rank,
          radius: radius,
          score: d[`${rank}_score`],
          simulationIndexToRemoveNodeAt: undefined,
          simulationIndexToTransitionNodeAt: undefined,
          fx: origNode.createdTick+9 <= i ? undefined : origNode.fx,
          fy: origNode.createdTick+9 <= i ? undefined : origNode.fy,
        });
      }
      else {
        const randomAngle = Math.random() * Math.PI * 2;
        this.nodes.push(Object.assign({
          rank: rank,
          radius: radius,
          score: d[`${rank}_score`],
          id: d[rank],
          fx: Math.cos(randomAngle)*1000+500,
          fy: Math.sin(randomAngle)*1000+500,
          createdTick: i,
          mousedOver: false
        }, this.submissions[d[rank]]));
      }

    }
    
    const newIDs = new Array(this.numRanks).fill(0).map((_, i) => d[i+1]);
    const unupdatedNodes = this.nodes.filter(e => !newIDs.includes(e.id));
    unupdatedNodes.forEach(node => {
      Object.assign(node, {
        rank: node.rank+1000 // marks that the node is technically out of the ranks, but prevents it from moving
      });
      if(typeof node.simulationIndexToRemoveNodeAt === 'undefined') {
        node.simulationIndexToTransitionNodeAt = i+5
        node.simulationIndexToRemoveNodeAt = i+15;
      }
      if(node.simulationIndexToTransitionNodeAt <= i) {
        node.rank = 750;
      }
      if(node.simulationIndexToRemoveNodeAt <= i) {
        this.nodes.splice(this.nodes.map(e => e.id).indexOf(node.id), 1);
      }
    });

    const colorScale = e => d3.interpolateYlGnBu(d3.scaleLinear()
      .domain([0, 12*60*60*1000])
      .range([1, 0])
      (e));

    /*const colorScale = d3.scaleLinear()
      .domain([0, 12*60*60*1000])
      .range(['#43CCA9', '#FFFFFF']);*/

    const darkenColorScale = e => d3.color(colorScale(e)).darker(1);

    this.bubbles = this.chart.selectAll('.bubble')
      .data(this.nodes, e => e.id)
      .join('svg:circle')
      .attr('class', 'bubble')
      .on('mouseover.infobox', ((_, e) => {
        if(!this.lockedInfoBox) this.renderInfoBox(e);
      }).bind(this))
      .on('mouseout.infobox', this.clearInfoBox.bind(this))
      .on('click', ((_, e) => {
        this.toggleLockedInfoBox(e);
      }).bind(this))
      .on('mouseover.color', function(_, e) {
        e.mousedOver = true;
        d3.select(this)
          .attr('fill', darkenColorScale(d.time.getTime() - e.created.getTime()))
      })
      .on('mouseout.color', function(_, e) {
        e.mousedOver = false;
        d3.select(this)
          .attr('fill', colorScale(d.time.getTime() - e.created.getTime()))
      })
      

    this.background
      .on('click', (() => this.toggleLockedInfoBox('unlock infobox')).bind(this)); // when you click on the background, unlocks the infobox

    this.updateInfoBox();

    this.simulation
      .nodes(this.nodes)
      .on('tick', () => {
        this.chart.selectAll('.bubble')
          .attr('r', e => e.radius)
          .attr('cx', e => e.x)
          .attr('cy', e => e.y)
          .attr('fill', e => e.mousedOver ? darkenColorScale(d.time.getTime() - e.created.getTime()) : colorScale(d.time.getTime() - e.created.getTime()))
      })
      .restart();

    if(!this.isPaused) {
      setTimeout(() => this.runAnimation(i+1), 50);
    }

  }

  renderInfoBox(node) {
    this.infoBox
      .attr('display', null);

    this.infoBoxID = node.id;

    if(this.lockedInfoBox) {
      this.bubbles.filter(d => d.id === this.infoBoxID)
        .attr('stroke', '#DB5B4F')
        .attr('stroke-width', 4);

      this.bubbles.filter(d => d.id !== this.infoBoxID)
        .attr('stroke', null)
        .attr('stroke-width', null);
    }

    const wrap = textwrap()
      .bounds({
        height: this.state.chartHeight, 
        width: this.state.chartWidth-this.state.chartHeight-10
      })
      .method('tspans');

    if(this.state.windowWidth <= 800) {
      wrap
        .bounds({
          height: this.state.chartHeightMobile-this.state.chartWidth,
          width: this.state.chartWidth-10
        })
    }

    const title = this.infoBox
      .html('')
      .append('svg:text')
        .style('font-height', '20px')
        .text(node.title)
        .call(wrap);

    const titleHeight = title.node().getBBox().height;

    const description = this.infoBox.append('svg:g');

    if(node.url.slice(0, 17) === 'https://i.redd.it') { 
      
      this.infoBox.append('svg:image')
        .attr('width', this.state.windowWidth <= 800 ? this.state.chartWidth-10 : this.state.chartWidth - this.state.chartHeight-10)
        .attr('height',this.state.windowWidth <= 800 ? this.state.chartHeightMobile-this.state.chartWidth-titleHeight-180 : this.state.chartWidth - this.state.chartHeight-10)
        .attr('y', this.state.windowWidth <= 800 ? titleHeight + 100 : titleHeight)
        .attr('preserveAspectRatio', 'xMidyMid meet')
        .attr('href', node.url);

      description
        .attr('transform', `translate(0, ${this.state.windowWidth <= 800 ? titleHeight + 20 : titleHeight + 20 + this.state.chartWidth - this.state.chartHeight})`);
    }
    else {
      this.infoBox.append('a')
        .attr('href', node.url)
        .attr('target', '_blank')
        .append('text')
          .style('font-size', '15px')
          .attr('y', this.state.windowWidth <= 800 ? titleHeight + 130 : titleHeight+40)
          .attr('text-decoration', 'underline')
          .text('Content Link')

      description
        .attr('transform', `translate(0, ${this.state.windowWidth <= 800 ? titleHeight + 40 : titleHeight + 20 + 60})`); 
    }

    this.voteInfoLabel = description.append('svg:text')
      .style('font-size', '15px')
      .attr('dy', '0');

    this.rankInfoLabel = description.append('svg:text')
      .style('font-size', '15px')
      .attr('dy', '1em');

    description.append('svg:text')
      .style('font-size', '15px')
      .attr('dy', '3em')
      .text(`${node.subreddit_name_prefixed}`);
    
    const timeFormat = d3.timeFormat('%d %b %Y - %H:%M:%S');
    description.append('svg:text')
      .style('font-size', '15px')
      .attr('dy', '4em')
      .text(timeFormat(node.created));

    this.updateInfoBox();
  }

  updateInfoBox() {
    if(typeof this.infoBoxID !== 'undefined') {
      const node = this.nodes.find(d => d.id === this.infoBoxID);

      if(typeof node !== 'undefined') {
        const voteFormat = d3.format('.3s');
        this.voteInfoLabel
          .text(`votes: ${voteFormat(node.score)}`);
    
        this.rankInfoLabel
          .text(`rank: ${node.rank <= 250 ? node.rank : '250+'}`);
      }
      else {
        this.rankInfoLabel
          .text(`rank: 250+`);
      }

    }

  }

  clearInfoBox() {
    if(!this.lockedInfoBox) {
      this.infoBox
        .attr('display', 'none');
      this.infoBoxID = undefined;
    }
  }

  toggleLockedInfoBox(node) {
    if(node === 'unlock infobox') {
      this.lockedInfoBox = false;
      this.clearInfoBox();
      this.bubbles 
        .attr('stroke-width', 0);
    }
    else if(this.lockedInfoBox) {
      if(node.id === this.infoBoxID) {
        this.lockedInfoBox = false;
        this.bubbles
          .attr('stroke-width', 0);
      }
      else {
        this.renderInfoBox(node);
      }
    }
    else {
      this.bubbles.filter(d => d.id === this.infoBoxID)
        .attr('stroke', '#DB5B4F')
        .attr('stroke-width', 4);
      this.lockedInfoBox = true;
    }
  }

  render() {

    if(this.mountedComponents) {

      this.scale
        .attr('width', this.state.chartWidth)
        .attr('transform', 'scale(-1, 1)')
        .attr('x', -this.state.chartWidth)

      this.scaleTitle
        .attr('x', this.state.chartWidth/2);
      
      if(this.state.windowWidth > 800) {
        
        this.chart
          .attr('width', this.state.chartHeight)
          .attr('height', this.state.chartHeight);
        
        this.fig
          .attr('width', '100%')
          .attr('height', this.state.chartHeight+120)
          .attr('viewBox', [0, -120, this.state.chartWidth, this.state.chartHeight+120]);
  
        this.background
          .attr('width', this.state.chartWidth)
          .attr('height', this.state.chartHeight);
  
        this.dateLabel
          .attr('x', this.state.chartWidth-10)
          .attr('y', this.state.chartHeight-10-35);
  
        this.timeLabel
          .attr('x', this.state.chartWidth-10)
          .attr('y', this.state.chartHeight-35-35);
  
        this.infoBox
          .attr('transform', `translate(${this.state.chartHeight+5}, 25)`);

        this.buttonsGroup
          .attr('transform', `translate(${this.state.chartWidth-5}, ${this.state.chartHeight-35})`) 
        
      }
      else {

        this.chart      
          .attr('width', this.state.chartWidth)
          .attr('height', this.state.chartWidth);

        this.fig
          .attr('width', '100%')
          .attr('height', this.state.chartHeightMobile+80)
          .attr('viewBox', [0, -80, this.state.chartWidth, this.state.chartHeightMobile+80]);
  
        this.background
          .attr('width', this.state.chartWidth)
          .attr('height', this.state.chartHeightMobile);
  
        this.dateLabel
          .attr('x', this.state.chartWidth-10)
          .attr('y', this.state.chartWidth+20)
  
        this.timeLabel
          .attr('x', this.state.chartWidth-10)
          .attr('y', this.state.chartWidth+40)
  
        this.infoBox
          .attr('transform', `translate(5, ${this.state.chartWidth+20+50})`);
        
        this.buttonsGroup
          .attr('transform', `translate(${80}, ${this.state.chartWidth+10})`) 

      }


      if(!this.startedAnimation) {

        this.scaleLabels
          .data(this.state.windowWidth > 800 ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1])
          .join('svg:text')
          .attr('text-anchor', d => d === 0 ? 'start' : d === 1 ? 'end' : 'middle')
          .text(d => `${12 * d} hours`)
          .attr('x', d => this.state.chartWidth * d)
          .attr('y', -20)
          .style('font-size', '15px')
          .attr('class', 'scale-labels');

        this.runAnimation(0);
        this.startedAnimation = true;
      }
    }

    return (
      <div>
        <Helmet>
          <title>24 Hours of r/all</title>
        </Helmet>
        <h1>24 Hours of r/all</h1>
        <ul>
          <li>Each bubble represents a post in the top 200 of r/all</li>
          <li>Size is proportional to number of upvotes</li>
          <li>Higher ranked posts are closer to the center</li>
          <li>Hover over a bubble to view post details</li>
          <li>Click on a bubble to lock your selection</li>
        </ul>
        <svg className='seperate' ref={this.svgRef}/>
      </div>
    )
  }
};