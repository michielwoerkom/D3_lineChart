let time =0;
const t = function(){ return d3.transition().duration(1000); }

const margin = {top:50,right:100,bottom:100, left:80},
  width = 800 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// Make SVG
const svg = d3.select("#chart-area")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const g = svg.append("g")
  .attr("transform", "translate("+ margin.left +","+ margin.top +")");

let parseTime = d3.timeParse("%d/%m/%Y");

// Make Labels
const x_label = g.append("text")
  .attr("y", height + 50)
  .attr("x", width /2)
  .attr("text-anchor", "middle")
  .attr("font-size", "20px")
  .text("Time");

const y_label = g.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", -40)
  .attr("x", -(height/2))
  .attr("text-anchor", "middle")
  .attr("font-size", "20px")
  .text("Products");

const line_production = {line_class:"line_production", colour:"blue"};
const line_ok = {line_class:"line_ok", colour:"green"};
const line_nok = {line_class:"line_nok", colour:"red"};

function path(a) {
const path = g.append("path")
  .attr("class", a.line_class)
  .attr("fill", "none")
  .attr("stroke", a.colour)
  .attr("stroke-width", "1px");
};

path(line_production);
path(line_ok);
path(line_nok);

const x = d3.scaleUtc()
  .range([0, width]);
const y = d3.scaleLinear()
  .range([height, 0]);

// get the data
d3.json("data/data.json").then(data => {
  let ti = [], ok = 0, nok = 0, y_max = 0;

  const formattedData = data.map(d => {
    y_max++;
    d.Time = new Date(d.Time);
    ti.push(new Date(d.Time));
    d.State === "OK" ? ok++ : nok++;
    d.Ok = ok;
    d.Nok = nok;
    d.Count = y_max;
    return d;
  });

  const min_time = new Date(ti.reduce((prev, current) => Math.min(prev,current)));
  const max_time = new Date(ti.reduce((prev, current) => Math.max(prev,current)));

  x.domain([min_time, max_time]);
  y.domain([0, y_max]);

  // Set Axis
  const x_axis = d3.axisBottom(x)
    .ticks(7);
    g.append("g")
      .attr("class", "x_as")
      .attr("transform", "translate(0,"+height+")")
      .call(x_axis);

  const y_axis = d3.axisLeft(y)
    g.append("g")
      .attr("class", "y_as")
      .call(y_axis);

  const guide_y = d3.axisLeft(y)
    .ticks(7)
    g.append("g")
      .attr("class", "grid")
      .call(guide_y
        .tickSize(-width)
        .tickFormat("")
      );

  const guide_x = d3.axisBottom(x)
    .ticks(7)
    g.append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + height + ")")
      .call(guide_x
        .tickSize(-height)
        .tickFormat("")
      );

  let lineproduction = d3.line().x(d => x(d.Time)).y(d => y(d.Count));
  let lineok = d3.line().x(d => x(d.Time)).y(d => y(d.Ok));
  let linenok = d3.line().x(d => x(d.Time)).y(d => y(d.Nok));

  g.select(".line_production").transition(t).attr("d", lineproduction(data));
  g.select(".line_ok").transition(t).attr("d", lineok(data));
  g.select(".line_nok").transition(t).attr("d", linenok(data));

  let circles_a = [];
  let hours = [...new Set(data.map(d => d.Time.getHours()))];

  // interpolate between 2 data points and calc x from y for circles
  bisectLeft = d3.bisector(d => d.Time).left;
  for (let value of hours) {
    let date = min_time.setHours(min_time.getHours() + 1);
    if (new Date(date) <= max_time) {
      let x0 = new Date(date), i = bisectLeft(data, x0, 1),
      d0 = data[i - 1], d1 = data[i];
      if (x0.getTime() != d1.Time.getTime()) {
        a = "count";
        switch (a) {
          case "ok": {
            console.log("ok")
            let calc = d1.Ok - d0.Ok;
            let calc_0 = d0.Ok;
            break;
          }
          case "nok": {
            console.log("nok")
            let calc = d1.Nok - d0.Nok;
            let calc_0 = d0.Nok;
            break;
          }
          case "count": {
            console.log("count")
            let calc = d1.Count - d0.Count;
            let calc_0 = d0.Count;
            break;
          }
        }
        let td = d1.Time-d0.Time, cd = calc,
        n = cd/td,tin = x0-d0.Time,r = tin * n,cx = x0;
        cy = calc_0 + r;
        circles_a.push({cy, cx});
      }
      else {
        let d = x0 - d0.Time > d1.Time - x0 ? d1 : d0;
        let cy = calc_0, cx = d.Time;
        circles_a.push({cy, cx});
      };
    }
  };

  const circles_production = g.selectAll("circle")
	 .data(circles_a);
  circles_production.enter()
		.append("circle")
      .attr("class", "enter")
      .attr("fill", "blue")
      .merge(circles_production)
			.attr("cy", d => y(d.cy))
			.attr("cx", d => x(d.cx))
			.attr("r", 3);

    console.log(circles_production.enter());

    const circles = g.selectAll("circle")
  	 .data(circles_a);
    circles.enter()
  		.append("circle")
        .attr("class", "enter")
        .attr("fill", "red")
        .merge(circles)
  			.attr("cy", d => y(d.cy))
  			.attr("cx", d => x(d.cx))
  			.attr("r", 3);

    console.log(circles.enter());
});
