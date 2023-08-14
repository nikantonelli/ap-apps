import React from "react";
import APBoard from "./APBoard";
import { getLabel, getTitle } from "../utils/Client/SdkSvg";
import { selectAll, partition, arc } from "d3";

export class APSunburstView extends React.Component {
    constructor(props) {
        super(props)
    }

    doit = () => {
        var nodes = selectAll(".node")
            .data(this.rootNode.descendants().slice(1))
            .enter()

        partition()
            .size([2 * Math.PI, this.rootNode.height + 1])
            (this.rootNode);
        var width = _.min([window.innerWidth / 2, (window.innerHeight / 2) - (document.getElementById("header-box").getBoundingClientRect().height / 2) - 2])

        svg.attr("width", window.innerWidth)
        svg.attr("height", width * 2)
        svg.attr('viewBox', [0, 0, window.innerWidth, width * 2])
        svg.attr("height", width * 2)
        const g = svg.append("g")
            .attr("transform", `translate(${width + ((window.innerWidth - (width * 2)) / 2)},${width})`);

        var ringCount = _.min([(this.state.depth), 5]); //Max can be four rings including the root due to the text length
        var arc = arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius((width / ringCount) * 1.5)
            .innerRadius(d => d.y0 * (width / ringCount))
            .outerRadius(d => Math.max(d.y0 * (width / ringCount), d.y1 * (width / ringCount) - 1))

        var eArc = arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius((width / ringCount) * 1.5)
            .innerRadius(d => Math.max(d.y1 * (width / ringCount) - 3, d.y0 * (width / ringCount)))
            .outerRadius(d => d.y1 * (width / ringCount) - 1)

        var path = g.append("g")
            .selectAll("path")
            .data(this.rootNode.descendants().slice(1))
            .join("path")
            .attr("fill", d => {
                return me.props.colourise(d);
            })
            .attr("fill-opacity", d => arcVisible(d) ? ((d.children && me.opacityDrop) ? APBoard.OPACITY_HIGH : APBoard.OPACITY_MEDIUM) : 0)
            .attr("pointer-events", d => arcVisible(d) ? "auto" : "none")

            .attr("d", d => arc(d))
            .style("cursor", "pointer")
            .on("click", me.nodeClicked);

        path.append("title")
            .text(d => getTitle(d))
            ;

        var ePath = g.append("g")
            .selectAll("path")
            .data(this.rootNode.descendants().slice(1))
            .join("path")
            .attr("fill", d => {
                var eColour = me.getErrorColour(d);
                return eColour.length ? eColour : me.props.colourise(d);
            })
            .attr("fill-opacity", d => arcVisible(d) ? ((d.children && me.opacityDrop) ? APBoard.OPACITY_HIGH : APBoard.OPACITY_MEDIUM) : 0)
            .attr("pointer-events", d => arcVisible(d) ? "auto" : "none")
            .attr("d", d => eArc(d))
            .append("title")
            .text(d => me.getErrorMessage(d))

        const label = g.append("g")
            .attr("pointer-events", "none")
            .style("user-select", "none")
            .selectAll("text")
            .data(this.rootNode.descendants().slice(1))
            .join("text")
            .attr("dy", "0.35em")
            //					.attr("fill-opacity", 1)
            .attr("fill-opacity", d => +sbLabel(d, d))
            .attr("transform", d => labelTransform(d))

            .attr("text-anchor", d => labelAnchor(d))
            .text(d => getLabel(d));

        const parent = g.append("circle")
            .attr("class", "parentNode")
            .datum(this.rootNode)
            .attr("r", (width / ringCount))
            .attr("fill", "#888")
            .attr("pointer-events", "all")
            .on("click", me.nodeClicked)

        const parentLabel = g.append("text")
            .attr("class", "parentLabel")
            .datum(this.rootNode)
            .text(d =(d))
            .attr("text-anchor", "middle");

        const parentTitle = g.append("title")
            .attr("class", "parentTitle")
            .datum(this.rootNode)
            .text(d => getTitle(d))

        function arcVisible(d) {
            return d.y1 <= ringCount && d.y0 >= 1 && d.x1 > d.x0;
        }

        function sbLabel(d, target) {
            return (
                target.y1 <= ringCount &&
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

            const y = (d.y1 * (width / ringCount)) - 5;
            // const y = (d.y0 + d.y1) / 2 * (width / ringCount);
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        }
    }

    render() {
        this.doit()
    }
}
