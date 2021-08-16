import React from 'react';
import * as d3 from 'd3';
import {Engine, Bodies, Composite, Vertices, Bounds, Body} from 'matter-js';

import states from './states.geo.json';
import dataPath from './data.csv';

export default class CovidMap extends React.Component {

  constructor(props) {
    super(props);

    this.bodyRef = React.createRef();
    this.svgRef = React.createRef();
    this.scaleRef = React.createRef();

    this.state = {
      frameRate: 120,
      transitionTime: 30000,
      stopTime: 35000
    }
  }

  componentDidMount() {
    this.runSimulation();
  }

  async runSimulation() {

    const params = new URLSearchParams(window.location.search)
if(params.has('render')) {
    console.log('in render mode!');
    window.currentTime = 0;
    performance.now = () => window.currentTime;
}


    const covidData = await d3.csv(dataPath);
    const covidDataByFips = {};
    for(const data of covidData) {
      covidDataByFips[data.fips] = data;
    }
    const statesData = states.features.filter(feature => +feature.properties.STATE < 60 && +feature.properties.STATE !== 11);
    for(const feature of statesData) {
      feature.properties.INFO = covidDataByFips[+feature.properties.STATE]
    }

    const engine = Engine.create();
    engine.gravity.y = 0;
    
    const bodyWidth = 960;
    const realWidth = window.innerWidth >= 900 ? 900 : window.innerWidth;

    const physicsBodies = [];
    const projection = d3.geoAlbersUsa().fitSize([900, 900*3/4], states);

    this.svg = d3.select(this.svgRef.current)
      .attr('width', realWidth)
      .attr('height', realWidth*3/4)
      .attr('viewBox', [-bodyWidth*0.2, -bodyWidth*3/4*0.2, bodyWidth*1.4, bodyWidth*3/4*1.4])
      .html('');

    const pathGen = d3.geoPath(projection);

    const inputScalerToInterpolable = d3.scaleLinear().domain([5, 1, 0]).range([0, 0.5, 1]);
    const colorScale = t => d3.interpolateSpectral(inputScalerToInterpolable(t));
    
    const statesArea = this.svg.selectAll('g.state')
      .data(statesData)
      .enter()
      .append('svg:g')
        .attr('class', 'state')
        .append('svg:path')
          .attr('d', pathGen)
          .attr('class', 'area')
          .attr('fill', d => colorScale(d.properties.INFO.vs_overall))

    const statesOutline = this.svg.selectAll('g.state')
      .data(statesData)
      .append('svg:path')
        .attr('d', pathGen)
        .attr('fill-opacity', 0)
        .attr('stroke', d => d3.color(colorScale(d.properties.INFO.vs_overall)).darker().formatHex())
        .attr('stroke-dasharray', 4)
        .attr('stroke-width', 2);

    

    statesData.forEach((feature, i) => {

      let coordinates = [];

      if(feature.geometry.type === 'Polygon') {
        for(const latLong of feature.geometry.coordinates[0]) {
          const latLongConverted = projection(latLong);
          if(latLongConverted === null) continue;
          coordinates.push({x: latLongConverted[0], y: latLongConverted[1]});
        }
      }
      else { // is MultiPolygon
        let maxSize = 0;
        if(feature.properties.INFO.state === 'Michigan') {
          for(const polygon of feature.geometry.coordinates) {
  
            for(const latLong of polygon[0]) {
              const latLongConverted = projection(latLong);
              if(latLongConverted === null) continue;
              coordinates.push({x: latLongConverted[0], y: latLongConverted[1]});
            }
          }
        }
        else {
          for(const polygon of feature.geometry.coordinates) {
  
            const potentialCoordinates = [];
  
            for(const latLong of polygon[0]) {
              const latLongConverted = projection(latLong);
              if(latLongConverted === null) continue;
              potentialCoordinates.push({x: latLongConverted[0], y: latLongConverted[1]});
            }
  
            const polygonArea = Vertices.area(potentialCoordinates);
            if(polygonArea > maxSize) {
              maxSize = polygonArea;
              coordinates = potentialCoordinates;
            }
          }
        }
      }

      
      const bounds = Bounds.create(coordinates);       
      const body = Bodies.fromVertices(0, 0, [coordinates], {isStatic: false});
      
      Body.translate(body, {x: bounds.min.x-body.bounds.min.x, y: bounds.min.y-body.bounds.min.y});
      body.INFO = feature.properties;
      body.SCALE = 1;
      body.FRAME_SCALE_MULTIPLIER = Math.pow(body.INFO.INFO.vs_overall_sqrt, 1/(this.state.frameRate*this.state.transitionTime/1000));
      body.ORIG_X = body.position.x;
      body.ORIG_Y = body.position.y;
      Body.scale(body, body.SCALE, body.SCALE);

      physicsBodies.push(body);
    });

    Composite.add(engine.world, physicsBodies);

    const t = d3.interval(elapsed => {

      Engine.update(engine, 1000/this.state.frameRate);
      const bodies = Composite.allBodies(engine.world);

      this.svg.selectAll('g.state').data(bodies)
        .transition()
        .ease(d3.easeLinear)
        .duration(1000/this.state.frameRate)
        .attr('transform', d => {
          return `rotate(${d.angle/(2*Math.PI)*360}, ${d.position.x}, ${d.position.y}) 
            translate(${d.position.x}, ${d.position.y}) 
            scale(${d.SCALE}) 
            translate(${-d.position.x}, ${-d.position.y}) 
            translate(${d.position.x-d.ORIG_X}, ${d.position.y-d.ORIG_Y})`;
        });

      statesOutline.data(bodies)
        .transition()
        .ease(d3.easeLinear)
        .duration(1000/this.state.frameRate)
        .attr('transform', function(d) {
          const bounds = this.getBBox();
          return `
          translate(${bounds.x+bounds.width/2}, ${bounds.y+bounds.height/2})
          scale(${1/d.SCALE}) 
          translate(${-bounds.x-bounds.width/2}, ${-bounds.y-bounds.height/2})
          `
        });

      /*textGroup.selectAll('text')
        .data(bodies)
        .attr('x', d => d.position.x)
        .attr('y', d => d.position.y)*/

      if(elapsed > this.state.stopTime) t.stop();
      
      if(elapsed <= this.state.transitionTime) {     
        for(const body of bodies) {
          
          if(body.FRAME_SCALE_MULTIPLIER > 1) {
            Body.scale(body, body.FRAME_SCALE_MULTIPLIER, body.FRAME_SCALE_MULTIPLIER);
          }
          body.SCALE = body.SCALE * body.FRAME_SCALE_MULTIPLIER;
        }
      }
    }, 1000/this.state.frameRate);
  }

  updateValue(e) {
    this.setState({
      [e.target.name]: +e.target.value.replaceAll(/[^0-9]/g, '')
    })
  }

  render() {
    return <div>
      <div ref={this.bodyRef}>
        <svg ref={this.svgRef}/>
      </div>
    </div>
  }

}