import React from 'react';
import Helmet from 'react-helmet';
import * as d3Module from 'd3';
import d3Tip from 'd3-tip';
import '../rsuite-modularized/slider.css';
import '../rsuite-modularized/tooltip.css';
import dataPath from './data_new.csv';
import {RangeSlider} from 'rsuite';
import '../d3-templates.css';

const d3 = {
  ...d3Module,
  tip: d3Tip
}

export default class RedditAccountAgeAnim extends React.Component {

  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
    this.state = {
      windowWidth: 0,
      widthMultiplier: 1,
      dateSlider: [2006, 2021]
    }

    this.chartWidth = 960;
    this.chartHeight = 720;

    this.gridColor = '#333333';
    this.axisColor = '#666666';
    this.labelColor = '#BBBBBB';
    this.backgroundColor = '#2b2b2b';

    this.startYear = 2005;
    this.endYear = 2021;

    this.millisecondsPerMonth = 300;
    this.easeFunc = d3.easeLinear;

    this.hoverTipHeight = 25;
    this.hoverTipGap = 10;
    this.hoverTipHorizontalGap = 20;
    this.hoverTipWidth = 210;

  }

  updateWindowDimensions() {
    this.setState({ 
      windowWidth: window.innerWidth,
    });
  };

  async componentDidMount() {


    const params = new URLSearchParams(window.location.search)
if(params.has('render')) {
    console.log('in render mode!');
    window.currentTime = 0;
    performance.now = () => window.currentTime;
}

    d3.select('body').style('background-color', '#333333')
    this.data = await d3.csv(dataPath, d => {
      d.comment_date = new Date(d.comment_year, d.comment_month-1);
      return d;
    });
    
    // setup

    const fig = d3.select(this.svgRef.current)
      .attr('id', 'fig')
      .attr('viewBox', [0, -this.chartHeight*0.05, this.chartWidth*1.1, this.chartHeight*1.05])
      .attr('overflow', 'visible')
  
    fig.append('svg:rect')
      .attr('width', this.chartHeight)
      .attr('height', this.chartHeight)
      .attr('x', this.chartWidth*0.1)
      .attr('fill', this.backgroundColor)

    fig.append('svg:text')
      .text('Date')
      .attr('text-anchor', 'middle')
      .attr('x', this.chartWidth*0.1+this.chartHeight*0.5)
      .attr('class', 'normal')
      .attr('y', this.chartHeight*1.07);

    fig.append('svg:text')
      .text('Estimated comments per second')
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(${this.chartWidth*0.03}, ${this.chartHeight*0.5}) rotate(-90)`)
      .attr('class', 'normal')

    const chart = d3.create('svg:svg')
      .attr('viewBox', [0, 0, this.chartHeight, this.chartHeight])
      .attr('width', this.chartHeight)
      .attr('height', this.chartHeight)
      .attr('x', this.chartWidth*0.1)
      .attr('y', 0);
      

    // scales

    this.x = d3.scaleTime()
      .domain([new Date(2006, 0), new Date(2006, 0, 2)])
      .range([0, this.chartHeight])

    this.y = d3.scaleLinear()
      .domain([d3.max(this.data.filter(d => d.comment_date >= new Date(2006, 0) && d.comment_date <= new Date(2006, 0, 2)), d => parseFloat(d.rate_rolling)), 0])
      .range([0, this.chartHeight])

    const color = d3.scaleLinear()
      .domain(d3.range(2005, 2021, (2021-2005)/7))
      .range(['#DB5B4F', '#EBB252', '#DFE66C', '#5CBD60', '#43CCA9', '#3C93D6', '#7C72CC', '#D270E6']);

    // x axis

    this.xAxis = d3.axisBottom(this.x)
      .tickSizeInner(-this.chartHeight)
      .tickSizeOuter(0)
      .tickPadding(7)
      .tickFormat(d3.timeFormat('%Y'))
      .ticks(d3.timeYear.every(1));

    this.xAxisG = fig.append('svg:g')
      .call(this.xAxis)
      .attr('transform', `translate(${this.chartWidth*0.1}, ${720})`)
      
    this.xAxisG.append('svg:line')
        .attr('x2', this.chartHeight)
        .attr('stroke', this.axisColor)
        .attr('stroke-width', 2);

    // y axis

    this.yAxis = d3.axisLeft(this.y)
      .tickSizeInner(-this.chartWidth)
      .tickSizeOuter(0)
      .tickPadding(7)

    this.yAxisG = fig.append('svg:g')
      .call(this.yAxis)
      .attr('transform', `translate(${this.chartWidth*0.1}, ${0})`);
      
    this.yAxisG.append('svg:line')
      .attr('y2', this.chartHeight)
      .attr('stroke', this.axisColor)
      .attr('stroke-width', 2);
    
    this.yAxisG.select('.tick:last-of-type line').remove() // remove grid line that intersects with x axis

    fig.append(() => chart.node()); // ensure that the chart is in front of the axis lines

    // setting up stacks

    const accountYearsCols = [];
    for(let i = 2005; i <= 2021; ++i) {
      accountYearsCols.push(i + '_prop');
    }

    const stackGen = d3.stack()
      .keys(accountYearsCols);

      
    this.areaGen = d3.area()
      .x(d => this.x(d.data.comment_date))
      .y0(d => this.y(d[0]))
      .y1(d => this.y(d[1]))
      
    const stackedData = stackGen(this.data);
      
    this.areas = chart.selectAll('.areas')
      .data(stackedData) 
      .join('svg:path')
      .attr('d', this.areaGen)
      .attr('fill', d => color(d.key.slice(0, 4)));

    // hovers

    const hoverSpillableSVG = fig.append('svg:svg')
      .attr('viewBox', [0, 0, this.chartWidth, this.chartHeight])
      .attr('width', this.chartWidth)
      .attr('height', this.chartHeight)
      .attr('x', this.chartWidth*0.1)
      .attr('y', 0)
      .attr('overflow', 'visible');

    const hoverInfo = hoverSpillableSVG.append('svg:g')
      .attr('transform', `translate(${this.chartHeight}, 0)`)
      //.attr('display', 'none')
    
    hoverInfo.append('svg:line')
      .attr('y2', this.chartHeight)
      .attr('stroke-width', 0)
      .attr('stroke', '#666666')

    const hoverDateLabel = hoverSpillableSVG.append('svg:text')
      .attr('x', this.chartHeight)
      .attr('y', this.chartHeight+40)

    const hoverRateLabel = hoverSpillableSVG.append('svg:text')
      .attr('x', this.chartHeight)
      .attr('y', this.chartHeight+65)
      ;

      const hoverRateLabel2 = hoverSpillableSVG.append('svg:text')
      .attr('x', this.chartHeight)
      .attr('y', this.chartHeight+90)
      ;
    
    const hoverGData = accountYearsCols.map(d => d.slice(0, 4));

    const hoverG = hoverInfo.selectAll('.hover-circle-g')
      .data(hoverGData)
      .enter()
      .append('svg:g')
      .attr('class', 'hover-circle-g');

    const hoverColorScale = d3.scaleLinear()
      .domain(color.domain())
      .range(color.range().map(d => d3.color(d).darker(2).toString()));

    hoverG.append('svg:circle')
      .attr('r', 6)
      .attr('fill', 'rgba(0, 0, 0, 0)')
      .attr('stroke',  d => hoverColorScale(d))
      .attr('stroke-width', 2);
    
    const hoverTips = hoverG.append('svg:g');

    const hoverTipsBackground = hoverTips.append('svg:rect')
      .attr('x', this.hoverTipHorizontalGap)
      .attr('y', -this.hoverTipHeight/2)
      .attr('width', this.hoverTipWidth)
      .attr('height', this.hoverTipHeight)
      .attr('fill',  d => hoverColorScale(d));

    const hoverTipsArrows = hoverG.append('svg:path')
      .attr('fill',  d => hoverColorScale(d));

    const hoverTipsLines = hoverG.append('svg:line')
      .attr('stroke', d => hoverColorScale(d))
      .attr('stroke-width', 2);

    const hoverTipsLabels = hoverTips.append('svg:text')
      .attr('class', 'text-label')
      .style('font-size', '18px')
      .attr('x', this.hoverTipHorizontalGap+5)
      .attr('dominant-baseline', 'middle')

    this.screenPosToDate = d3.scaleLinear()
      .domain([0, this.chartWidth])
      .range(this.x.domain());

    this.updateHovers = (equivDate, d) => {        
/*
      let equivDate = this.screenPosToDate(mouse[0]);
      equivDate = new Date(equivDate.setDate(equivDate.getDate() + 15)); // rounds to nearest month
      equivDate.setDate(1);
      equivDate.setHours(0);
      equivDate.setMinutes(0);
      equivDate.setSeconds(0);
      equivDate.setMilliseconds(0);*/

      const dataRow = this.data.find(d => d.comment_date.getTime() === equivDate.getTime());

      hoverInfo.transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).attr('transform', `translate(${this.x(equivDate)}, 0)`)

      hoverG.transition().duration(this.millisecondsPerMonth).ease(this.easeFunc)
        .attr('transform', f => `translate(0, ${this.y(dataRow[f + '_cumulative'])})`)
        .attr('opacity', f => f > equivDate.getFullYear() ? 0 : 1)

      let currentMax = this.chartHeight-5;
      hoverTipsArrows.nodes().forEach((node, i) => {
        if(hoverGData[i] > equivDate.getFullYear()) return;

        const yPos = this.y(dataRow[hoverGData[i] + '_cumulative']);
        if(currentMax < yPos) {
          d3.select(node).transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).attr('d', `M 0 0 
            ${this.hoverTipHorizontalGap} ${currentMax - yPos + this.hoverTipHeight/2} 
            ${this.hoverTipHorizontalGap+1} ${currentMax - yPos + this.hoverTipHeight/2}
            ${this.hoverTipHorizontalGap+1} ${currentMax - yPos - this.hoverTipHeight/2}
            ${this.hoverTipHorizontalGap} ${currentMax - yPos - this.hoverTipHeight/2} Z`);
          currentMax -= 35;
        }
        else {
          d3.select(node).transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).attr('d', `M 0 0 
            ${this.hoverTipHorizontalGap} ${this.hoverTipHeight/2} 
            ${this.hoverTipHorizontalGap+1} ${this.hoverTipHeight/2}
            ${this.hoverTipHorizontalGap+1} ${-this.hoverTipHeight/2}
            ${this.hoverTipHorizontalGap} ${-this.hoverTipHeight/2} Z`);
          currentMax = yPos - 35;
        }
      })

      currentMax = this.chartHeight-5;
      hoverTipsLines.transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).attr('x2', this.hoverTipHorizontalGap);
      hoverTipsLines.nodes().forEach((node, i) => {
        if(hoverGData[i] > equivDate.getFullYear()) return;

        const yPos = this.y(dataRow[hoverGData[i] + '_cumulative']);
        if(currentMax < yPos) {
          d3.select(node).transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).attr('y2', currentMax-yPos);
          currentMax -= 35;
        }
        else {
          d3.select(node).transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).attr('y2', 0);
          currentMax = yPos - 35;
        }
      })

      let prevDate = new Date(equivDate);
      prevDate = new Date(prevDate.setMonth(prevDate.getMonth()-1));
      const dataRowOld = this.data.find(d => d.comment_date.getTime() === prevDate.getTime())
      hoverTipsLabels
        .transition()
        .duration(this.millisecondsPerMonth)
        .ease(this.easeFunc)
        .tween('text', f => {
          const interp2 = d3.interpolateNumber(
            dataRowOld[f + '_prop'] / dataRowOld['rate_rolling'] * 100,
            dataRow[f + '_prop'] / dataRow['rate_rolling'] * 100
          );
          
          return function(t) {
            d3.select(this).html(`<tspan style='font-weight: bold'>${f}:</tspan> ${interp2(t).toFixed(2)}% of overall`
            );
          }
        })
      
      hoverDateLabel.transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).tween('text', () => {
        return function(t) {
          d3.select(this).text(d3.timeFormat('%b %Y')(d3.interpolateDate(prevDate, equivDate)(t)))
        }
      })

      hoverRateLabel.transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).tween('text', () => {
        return function(t) {
          d3.select(this).text(d3.interpolateNumber(dataRowOld.rate_rolling, dataRow.rate_rolling)(t).toFixed(3) + ' comments/s');
        }
      })

      hoverRateLabel2.transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).tween('text', () => {
        return function(t) {
          d3.select(this).text(d3.format('.3s')(d3.interpolateNumber(dataRowOld.rate_rolling, dataRow.rate_rolling)(t)*60*60*24*30.5) + ' comments/month');
        }
      })
      
      const hoverTipsLabelWidths = hoverTipsLabels.nodes().map(f => f.getBBox().width);
      hoverTipsBackground.transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).attr('width', (f, i) => Math.max(hoverTipsLabelWidths[i]+10, this.hoverTipWidth));

      currentMax = this.chartHeight-5;
      hoverTips.nodes().forEach((node, i) => {
        if(hoverGData[i] > equivDate.getFullYear()) return;
        const yPos = this.y(dataRow[hoverGData[i] + '_cumulative']);
        
        if(currentMax < yPos) {
          d3.select(node).transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).attr('transform', `translate(0, ${currentMax - yPos})`);
          currentMax -= 35;
        }
        else {
          d3.select(node).transition().duration(this.millisecondsPerMonth).ease(this.easeFunc).attr('transform', `translate(0, 0)`);
          currentMax = yPos - 35;
        }
      });

      if(true) {
        hoverTipsBackground
          .attr('transform', 'scale(1, 1)');

        hoverTipsArrows
          .attr('transform', 'scale(1, 1)');

        hoverTipsLines
          .attr('transform', 'scale(1, 1)')

        hoverTipsLabels
          .attr('text-anchor', 'start')
          .attr('x', this.hoverTipHorizontalGap+5)
      }
      else {
        hoverTipsBackground
          .attr('transform', 'scale(-1, 1)');

        hoverTipsArrows
          .attr('transform', 'scale(-1, 1)');

        hoverTipsLines
          .attr('transform', 'scale(-1, 1)')

        hoverTipsLabels
          .attr('text-anchor', 'end')
          .attr('x', -this.hoverTipHorizontalGap-5)
      }

    }

    this.transitionToNewDateRange(new Date(2006, 0), new Date(2006, 1));
  
    window.addEventListener("resize", this.updateWindowDimensions.bind(this));
    this.updateWindowDimensions.bind(this)();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions.bind(this));
  }

  transitionToNewDateRange(startDate, endDate) {
    if(endDate > new Date(2021, 4)) return;

    const curMax = d3.max(this.data.filter(d => d.comment_date >= startDate && d.comment_date <= endDate), d => parseFloat(d.rate_rolling))
    this.x.domain([startDate, endDate]);
    this.y.domain([curMax, 0]);
    this.screenPosToDate
      .range(this.x.domain())

    // use month + year ticks when date range is less than 4 years
    if(endDate.getTime() - startDate.getTime() < 0.5*365*24*60*60*1000) {
      this.xAxis
        .tickFormat(d3.timeFormat('%b %Y'))
        .ticks(d3.timeMonth.every(1)); // default value, use auto-spacing
    }
    else if(endDate.getTime() - startDate.getTime() < 1.5*365*24*60*60*1000) {
      this.xAxis
        .tickFormat(d3.timeFormat('%B %Y'))
        .ticks(d3.timeMonth.every(3)); // default value, use auto-spacing
    }
    else if(endDate.getTime() - startDate.getTime() < 3*365*24*60*60*1000) {
      this.xAxis
        .tickFormat(d3.timeFormat('%b %Y'))
        .ticks(10); // default value, use auto-spacing
    }
    else {
      this.xAxis
        .tickFormat(d3.timeFormat('%Y'))
        .ticks(d3.timeYear.every(1));
    }

    this.xAxisG.transition()
      .duration(this.millisecondsPerMonth)
      .ease(this.easeFunc)
      .call(this.xAxis);
    
    this.yAxisG.transition()
      .duration(this.millisecondsPerMonth)
      .ease(this.easeFunc)
      .call(this.yAxis)
      .on('end', () => {
        endDate = new Date((new Date(endDate)).setMonth(endDate.getMonth()+1));
        this.transitionToNewDateRange(startDate, endDate);
      });

    this.areas.transition()
      .duration(this.millisecondsPerMonth)
      .ease(this.easeFunc)
      .attr('d', this.areaGen);

    this.updateHovers(endDate);
  }

  handleDateRangeChange(value) {
    if((value[0] !== this.state.dateSlider[0] || value[1] !== this.state.dateSlider[1]) && value[0] !== value[1]) {
      this.transitionToNewDateRange(new Date(value[0], value[0] !== 2021 ? 0 : 4), new Date(value[1],  value[1] !== 2021 ? 0 : 4))
      this.setState(() => {
        this.state.dateSlider = value;
      });
      
    }
  }

  render() {
    return (
      <div>
        <Helmet>
          <title>Reddit Account Ages Over Time</title>
        </Helmet>
        <h1>Reddit Account Ages Over Time</h1>
        <svg ref={this.svgRef}>
        </svg>
      </div>
    );
  }

}