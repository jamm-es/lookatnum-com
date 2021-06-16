import { autoType } from "d3-dsv";

export const layout = {
  paper_bgcolor: '#333333',
  plot_bgcolor: '#2b2b2b',
  font: {
    family: `'Neue Helvetica Medium', 'Helvetica Neue Medium', 'Helvetica Neue', 'Neue Helvetica', 'Helvetica', sans-serif`
  },
  legend: {
    font: {
      color: '#bbbbbb'
    }
  },
  xaxis: {
    gridcolor: '#333333',
    gridwidth: 2,
    linecolor: '#666666',
    linewidth: 2,
    tickfont: {
      color: '#bbbbbb',
      size: 15
    },
    color: '#ffffff',
    title: {
      font: {
        size: 20
      },
      standoff: 40
    },
    zeroline: false,
  },
  yaxis: {
    gridcolor: '#333333',
    gridwidth: 2,
    linewidth: 2,
    linecolor: '#666666',
    tickfont: {
      color: '#bbbbbb',
      size: 15
    },
    color: '#ffffff',
    title: {
      font: {
        size: 20
      },
      standoff: 0
    },
    zeroline: false,
  },
  margin: {
    t: 60,
    l: 60,
    r: 60,
    b: 60,
  }
};

const small = JSON.parse(JSON.stringify(layout));

small.xaxis.tickfont.size = 12;
small.yaxis.tickfont.size = 12;

small.xaxis.title.font.size = 16;
small.yaxis.title.font.size = 16;

small.xaxis.standoff = 20;
small.yaxis.standoff = 20;

small.margin = {
  t: 40,
  l: 40,
  r: 40,
  b: 40
}

export const smallLayout = small;