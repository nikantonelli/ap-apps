import { arc, partition, select } from "d3";
import { min } from "lodash";
import { VIEW_TYPES } from "../utils/Client/Sdk";
import { getLabel, getTitle } from "../utils/Client/SdkSvg";
import APBoard from "./APBoard";
import App from "./App";

export class APSunburstView extends App {
    constructor(props) {
        super(props)

        this.mode = VIEW_TYPES.SUNBURST
       
    }

    doit = () => {
        var me = this;

        this.colourise = this.props.colourise || function () { return "#666666" }
        this.errorColour = this.props.errorColour || function () { return "#cc6666" }
        this.nodeClicked = this.props.onClick || null;
  
        //These two are used by the routines in Sdk.js and not here
        this.colouring = this.props.colouring
        this.sort = this.props.sort
       
        var svgEl = this.props.target;
        svgEl.replaceChildren()
        var svg = select(svgEl);

        partition()
            .size([2 * Math.PI, this.props.root.height + 1])
            (this.props.root);

        this.rootNode = this.props.root;
        var width = min(
            [
                this.props.size[0],
                this.props.size[1]
            ]
        )

        svg.attr("width", width)
        svg.attr("height", width)
        svg.attr('viewBox', [0, 0, width, width])

        const g = svg.append("g")
            .attr("transform", `translate(${(width / 2)},${this.props.size[1] / 2})`);

        var ringCount = _.min([(this.props.depth), 3]); //Max can be three rings including the root due to the text length
        var nArc = arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius((width / (2 * ringCount)) * 1.5)
            .innerRadius(d => d.y0 * (width / (2 * ringCount)))
            .outerRadius(d => Math.max(d.y0 * (width / (2 * ringCount)), d.y1 * (width / (2 * ringCount)) - 1))

        var eArc = arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius((width / (2 * ringCount)) * 1.5)
            .innerRadius(d => Math.max(d.y1 * (width / (2 * ringCount)) - 3, d.y0 * (width / (2 * ringCount))))
            .outerRadius(d => d.y1 * (width / (2 * ringCount)) - 1)

        var path = g.append("g")
            .selectAll("path")
            .data(this.props.root.descendants().slice(1))
            .join("path")
            .attr("fill", d => {
                return this.colourise(d);
            })
            .attr("fill-opacity", d => arcVisible(d) ? ((d.children && this.opacityDrop) ? APBoard.OPACITY_HIGH : APBoard.OPACITY_MEDIUM) : 0)
            .attr("pointer-events", d => arcVisible(d) ? "auto" : "none")

            .attr("d", d => nArc(d))
            .style("cursor", "pointer")
            .on("click", this.nodeClicked);

        path.append("title")
            .text(d => getTitle(me, d))
            ;

        var ePath = g.append("g")
            .selectAll("path")
            .data(this.props.root.descendants().slice(1))
            .join("path")
            .attr("fill", d => {
                var eColour = this.props.errorColour(d);
                return eColour.length ? eColour : this.colourise(d);
            })
            .attr("fill-opacity", d => arcVisible(d) ? ((d.children && this.opacityDrop) ? APBoard.OPACITY_HIGH : APBoard.OPACITY_MEDIUM) : 0)
            .attr("pointer-events", d => arcVisible(d) ? "auto" : "none")
            .attr("d", d => eArc(d))
            .append("title")
            .text(d => this.props.errorMessage(d))

        const label = g.append("g")
            .attr("pointer-events", "none")
            .style("user-select", "none")
            .selectAll("text")
            .data(this.props.root.descendants().slice(1))
            .join("text")
            .attr("dy", "0.35em")
            //					.attr("fill-opacity", 1)
            .attr("fill-opacity", d => +sbLabel(d, d))
            .attr("transform", d => labelTransform(d))

            .attr("text-anchor", d => labelAnchor(d))
            .text(d => getLabel(me, d));

        const parent = g.append("circle")
            .attr("class", "parentNode")
            .datum(this.rootNode)
            .attr("r", (width / (2 * ringCount)))
            .attr("fill", "#888")
            .attr("pointer-events", "all")
            .on("click", this.nodeClicked)

        const parentLabel = g.append("text")
            .attr("class", "parentLabel")
            .datum(this.rootNode)
            .text(d => getLabel(me, d))	//Need 'this' for props
            .attr("text-anchor", "middle");

        const parentTitle = g.append("title")
            .attr("class", "parentTitle")
            .datum(this.rootNode)
            .text(d => getTitle(me, d))

        function arcVisible(d) {
            return d.y1 <= ringCount && d.y0 >= 1 && d.x1 > d.x0;
        }

        function sbLabel(d, target) {
            return (
                d.depth < ringCount &&
                target.y1 <= (2 * ringCount) &&
                target.y0 >= 1 &&
                ((target.y1 - target.y0) * (target.x1 - target.x0)) > (0.06 / d.depth)
            );
        }

        function labelAnchor(d) {

            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            return (x < 180) ? "end" : "start"
        }
        function labelTransform(d) {
            // const x = d.x0  * 180 / Math.PI;
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;

            const y = (d.y1 * (width / (2 * ringCount))) - 5;
            // const y = (d.y0 + d.y1) / 2 * (width / ringCount);
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        }
    }

    render() {
        this.doit()
    }
}
