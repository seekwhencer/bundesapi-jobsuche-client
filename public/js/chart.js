import "./assets/d3.min.js";

export default class Chart {
    constructor(page) {
        this.element = document.querySelector('#detail');
        this.page = page;
        this.listing = this.page.listing;

        this.listing.on('filtered', () => this.render(this.page.jobNameFilter.data));
    }

    render(data) {
        this.element.innerHTML = '';
        const svg = this.renderBubbleChart(data);
        svg ? this.element.append(svg) : null;
        const circles = svg.querySelectorAll('circle');
        circles.forEach(c => c.onclick = () => {
            const title = c.parentNode.querySelector('title').textContent;
            const jobName = title.split('\n')[0];
            this.page.listing.filterQuery.jobTitle = jobName;
        });
    }

    renderPieChart(data) {
        this.data = data;

        if (!this.data)
            return;

        // Specify the chart’s dimensions.
        const width = 928;
        const height = Math.min(width, 500);

        // Create the color scale.
        const color = d3.scaleOrdinal()
            .domain(this.data.map(d => d.name))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), this.data.length).reverse())

        // Create the pie layout and arc generator.
        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(width, height) / 2 - 1);

        const labelRadius = arc.outerRadius()() * 0.8;

        // A separate arc generator for labels.
        const arcLabel = d3.arc()
            .innerRadius(labelRadius)
            .outerRadius(labelRadius);

        const arcs = pie(this.data);

        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        // Add a sector path for each value.
        svg.append("g")
            .attr("stroke", "white")
            .selectAll()
            .data(arcs)
            .join("path")
            .attr("fill", d => color(d.data.name))
            .attr("d", arc)
            .append("title")
            .text(d => `${d.data.name}: ${d.data.value.toLocaleString("en-US")}`);

        // Create a new arc generator to place a label close to the edge.
        // The label shows the value if there is enough room.
        svg.append("g")
            .attr("text-anchor", "middle")
            .selectAll()
            .data(arcs)
            .join("text")
            .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
            .call(text => text.append("tspan")
                .attr("y", "-0.4em")
                .attr("font-weight", "bold")
                .text(d => d.data.name))
            .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
                .attr("x", 0)
                .attr("y", "0.7em")
                .attr("fill-opacity", 0.7)
                .text(d => d.data.value.toLocaleString("en-US")));

        return svg.node();
    }

    renderBubbleChart(data) {
        {
            // Specify the dimensions of the chart.
            const width = 928;
            const height = width;
            const margin = 1; // to avoid clipping the root circle stroke
            const name = d => d.id.split(".").pop(); // "Strings" of "flare.util.Strings"
            //const group = d => d.id.split(".")[1]; // "util" of "flare.util.Strings"
            const names = d => name(d).split(/(?=[A-Z][a-z])|\s+/g); // ["Legend", "Item"] of "flare.vis.legend.LegendItems"

            const clamp = d => {
                if (data.length > 40) {
                    return d.data.value !== 1;
                } else {
                    return true;
                }
            }

            // Specify the number format for values.
            const format = d3.format(",d");

            // Beispiel: Start- und Endfarbe definieren
            const startColor = getComputedStyle(document.documentElement).getPropertyValue('--color-secondary'); // grün
            const endColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');

            // Min/Max der Werte bestimmen
            const valueExtent = d3.extent(data, d => d.value);

            // Farbskala anlegen (linearer Verlauf)
            const color = d3.scaleLinear()
                .domain(valueExtent)
                .range([startColor, endColor]);

            // Create the pack layout.
            const pack = d3.pack()
                .size([width - margin * 2, height - margin * 2])
                .padding(3);

            // Compute the hierarchy from the (flat) data; expose the values
            // for each node; lastly apply the pack layout.
            const root = pack(d3.hierarchy({children: data})
                .sum(d => d.value));

            // Create the SVG container.
            const svg = d3.create("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [-margin, -margin, width, height])
                .attr("style", "max-width: 100%; height: auto;")
                .attr("text-anchor", "middle");

            // Place each (leaf) node according to the layout’s x and y values.
            const node = svg.append("g")
                .selectAll()
                .data(root.leaves())
                .join("g")
                .attr("transform", d => `translate(${d.x},${d.y})`);

            // Add a title.
            node.append("title")
                .text(d => `${d.data.id}\n${format(d.value)}`);

            // Add a filled circle.
            node.append("circle")
                .attr("fill", d => color(d.value))
                .attr("r", d => d.r)
                .attr("fill-opacity", d => clamp(d) ? 1 : 0.5);

            // Add a label.
            const text = node.append("text")
                .attr("clip-path", d => `circle(${d.r})`);


            // Add a tspan for each CamelCase-separated word.
            text.selectAll()
                .data(d => d)
                .join("tspan")
                .attr("x", 0)
                .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
                .text(d => clamp(d) ? d.data.id : '');

            // Add a tspan for the node’s value.
            text.append("tspan")
                .attr("x", 0)
                //.attr("y", d => `${names(d.data).length / 2 + 0.35}em`)
                .attr("y", d => clamp(d) ? `9px` : '-9px')
                .text(d => clamp(d) ? format(d.data.value) : '');

            return Object.assign(svg.node(), {scales: {color}});
        }
    }
}