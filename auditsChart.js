import {formatXP} from "/index.js";

export function renderDonutChart(auditDone, auditReceived) {
    const data = [{name: "Audits Done", value: auditDone}, {name: "Audits Received", value: auditReceived}];
    const width = 450, height = 350, margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    const chartContainer = d3.select("#donutChartContainer");
    chartContainer.html('');

    chartContainer.append("div")
        .attr("class", "chart-title")
        .text("Audits Chart");

    const xpInfo = chartContainer.append("div")
        .attr("class", "xp-info");

    xpInfo.append("p").text("Received audit XP: " + formatXP(auditReceived, 2));
    xpInfo.append("p").text("Done audit XP: " + formatXP(auditDone, 2));

    const svg = chartContainer.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.name))
        .range(["#ffa4d9", "#98caff"]);

    const pie = d3.pie()
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.8);


    const arcHover = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.9);

    const slices = svg.selectAll("path")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.name))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    slices.on("mouseover", (event, d) => {
        const [centroidX, centroidY] = arc.centroid(d);
        const svgRect = svg.node().getBoundingClientRect();

        const centroidAbsX = svgRect.left + window.scrollX + centroidX;
        const centroidAbsY = svgRect.top + window.scrollY + centroidY;
        const isLeftSide = centroidX < 0;


        tooltip.transition()
            .duration(200)
            .style("opacity", 1);
        tooltip.html(d.data.name + ": " + formatXP(d.data.value, 2));

        let leftPos = centroidAbsX + (isLeftSide ? -tooltip.node().offsetWidth - -160 : 20);
        tooltip.style("left", leftPos + "px");

        let topPos = centroidAbsY - tooltip.node().offsetHeight / 2;
        tooltip.style("top", topPos + "px");

        d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("d", arcHover);
    })
        .on("mouseout", (event, d) => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);

            d3.select(event.currentTarget)
                .transition()
                .duration(200)
                .attr("d", arc);
        });
}