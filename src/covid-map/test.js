const svg = d3.select(this.svgRef.current)
.attr('width', bodyWidth)
.attr('height', bodyWidth*3/4)
.attr('viewBox', [0, 0, bodyWidth, bodyWidth*3/4]);

const pathGen = d3.geoPath(projection);
const statesPaths = svg.selectAll('path')
.data(statesData)
.enter()
.append('svg:path')
  .attr('d', pathGen)
  .attr('fill', _ => d3.hsl(Math.random()*360, 0.6, 0.5).formatHex())

const t = d3.timer(elapsed => {
Engine.update(engine, 1000/60);
const bodies = Composite.allBodies(engine.world);

statesPaths.data(bodies)
  .attr('transform', d => `translate(${d.position.x}, ${d.position.y}) scale(${d.RAND_SCALE_FACTOR}) translate(${-d.position.x}, ${-d.position.y})`)

if(elapsed > 1000) t.stop();
});

var canvas = document.createElement('canvas'),
context = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

document.body.appendChild(canvas);

(function render() {
  var bodies = Composite.allBodies(engine.world);

  window.requestAnimationFrame(render);

  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.beginPath();

  for (var i = 0; i < bodies.length; i += 1) {
      var vertices = bodies[i].vertices;

      context.moveTo(vertices[0].x, vertices[0].y);

      for (var j = 1; j < vertices.length; j += 1) {
          context.lineTo(vertices[j].x, vertices[j].y);
      }

      context.lineTo(vertices[0].x, vertices[0].y);
  }

  context.lineWidth = 1;
  context.strokeStyle = '#999';
  context.stroke();
})();