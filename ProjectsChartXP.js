const svg = d3.select("#barChartSvg");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 20, right: 20, bottom: 60, left: 150 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const xValue = (d) => d.xp;
const yValue = (d) => d.task;

function render(data) {
    const { xScale, yScale } = createScales(data);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    renderAxes(g, xScale, yScale);
    renderBars(g, data, xScale, yScale);

    g.append("text")
        .attr("class", "chartLabel")
        .attr("y", 40)
        .attr("x", -60)
        .attr("dy", ".75em")
        .attr("transform", `translate(${innerWidth / 2},${innerHeight})`)
        .text("XP gained")
        .transition()
        .delay(800)
        .style("opacity", 1);
}

function createScales(data) {
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, xValue)])
        .range([0, innerWidth]);

    const yScale = d3.scaleBand()
        .domain(data.map(yValue))
        .range([0, innerHeight])
        .padding(0.21);

    return { xScale, yScale };
}

function renderAxes(g, xScale, yScale) {
    const xAxisGroup = g.append("g")
        .attr("transform", `translate(0,${innerHeight})`);

    const yAxisGroup = g.append("g");

    xAxisGroup.transition()
        .duration(800)
        .call(d3.axisBottom(xScale));

    yAxisGroup.transition()
        .duration(800)
        .call(d3.axisLeft(yScale));
}

function renderBars(g, data, xScale, yScale) {
    g.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("y", d => yScale(yValue(d)))
        .attr("height", yScale.bandwidth())
        .attr("x", 0)
        .attr("width", 0)
        .transition()
        .duration(800)
        .attr("width", d => xScale(xValue(d)));
}



async function extractProjectsWithXP(transactions) {
    return transactions
        .filter(elem => elem.type == "xp" && !elem.path.includes("piscine"))
        .map(elem => ({
            task: elem.path.split("/").pop(),
            xp: elem.amount
        }));
}

export async function makeGraph(transactions) {
    const elements = await extractProjectsWithXP(transactions);
    const tasksGraphContainer = document.getElementById("tasksGraph");
    if (!tasksGraphContainer.querySelector("h1")) {
        const graphTitle = document.createElement("h1");
        graphTitle.textContent = "Completed projects with XP gained";
        tasksGraphContainer.insertBefore(graphTitle, tasksGraphContainer.firstChild);
    }
    render(elements);
}
