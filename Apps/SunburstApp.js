import { arc, partition, select } from "d3";
import { min } from "lodash";
import APBoard from "../Components/APBoard";
import { VIEW_TYPES } from "../utils/Client/Sdk";
import { getLabel, getTitle } from "../utils/Client/SdkSvg";
import { NiksApp } from "./App";

export class APSunburstView extends NiksApp {
    constructor(props) {
        super(props)

        this.mode = VIEW_TYPES.SUNBURST

    }

    doit = () => {
        var me = this;

        this.colourise = this.props.colourise || function () { return "#666666" }
        this.errorColour = this.props.errorColour || function () { return "#cc6666" }
        this.nodeClicked = this.props.onSvgClick || null;
        this.errorData = this.props.errorData || function () { return { msg: "", colour: "" } }

        //These two are used by the routines in Sdk.js and not here
        this.colouring = this.props.colouring
        this.sort = this.props.sort
        var svg = select(this.props.target);
        if (!Boolean(svg)) throw new Error("No valid svg given to SunburstApp")

        var levels = (this.props.depth ?
                min([parseInt(this.props.depth), this.props.root.height]) :
                min([NiksApp.DEFAULT_SUNBURST_DEPTH, this.props.root.height])
            ) //Number of rings plus the centre

        partition()
            .size([2 * Math.PI,levels]) 
            (this.props.root);

        var width = min(
            [
                this.props.size[0],
                this.props.size[1]
            ]
        )

        var ringRadius = (width / (levels * 2)) *1.2

        svg.attr("width", width)
        svg.attr("height", width)
        svg.attr('viewBox', [0, 0, width, width])

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${width / 2})`);

        //var ringCount = _.min([(this.props.root.height - this.props.root.depth), 3]); //Max can be three rings including the root due to the text length
        var nArc = arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0), 0.005))
            .innerRadius(d => d.y0 * ringRadius)
            .outerRadius(d => Math.max(
                d.y0 * ringRadius,
                d.y1 * ringRadius
            ))

        var eArc = arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0), 0.005))
            .innerRadius(d => Math.max(
                (d.y1 * ringRadius) - 4,  //Make the errorBar 4 pixels wide
                d.y0 * ringRadius)
            )
            .outerRadius(d => (d.y1  * ringRadius) - 1)

        var path = g.append("g")
            .attr("id", "arc_g")
            .selectAll("path")
            .data(this.props.root.descendants().slice(1))
            .join("path")
            .attr("fill", d => {
                return this.colourise(d);
            })
            .attr("fill-opacity", d => arcVisible(me, d) ? ((d.children && this.props.opacityDrop) ? NiksApp.OPACITY_HIGH : NiksApp.OPACITY_MEDIUM) : 0)
            .attr("pointer-events", d => arcVisible(me, d) ? "auto" : "none")

            .attr("d", d => nArc(d))
            .style("cursor", "pointer")
            .on("click", this.nodeClicked);

        path.append("title")
            .text(d => getTitle(me, d))
            ;

        var ePath = g.append("g")
            .selectAll("path")
            .attr("id", "epath_g")
            .data(this.props.root.descendants().slice(1))
            .join("path")
            .attr("id", d => "epath_" + d.data.id)
            .attr("fill", d => {
                var eColour = me.props.errorData(d).colour;
                return eColour.length ? eColour : this.colourise(d);
            })
            .attr("fill-opacity", d => arcVisible(me, d) ? ((d.children && this.props.opacityDrop) ? NiksApp.OPACITY_HIGH : NiksApp.OPACITY_MEDIUM) : 0)
            .attr("pointer-events", d => arcVisible(me, d) ? "auto" : "none")
            .attr("d", d => eArc(d))
            .append("title")
            .text(d => this.props.errorData(d).msg)

        const label = g.append("g")
            .attr("pointer-events", "none")
            .style("user-select", "none")
            .selectAll("text")
            .data(this.props.root.descendants().slice(1))
            .join("text")
            .attr("dy", "0.35em")
            //					.attr("fill-opacity", 1)
            .attr("fill-opacity", d => +sbLabel(d))
            .attr("transform", d => labelTransform(d))
            .style("font-size", (2.8 / (levels+1)).toString() + "em")
            .style("pointer-events", "none")
            .attr("text-anchor", d => labelAnchor(d))
            .text(d => getLabel(me, d));

        const parent = g.append("circle")
            .attr("class", "parentNode")
            .datum(this.props.root)
            .attr("r", d => d.y1 * ringRadius)
            .attr("fill", "#ccc")
            .on("click", this.nodeClicked)

        const parentLabel = g.append("text")
            .attr("class", "parentLabel")
            .datum(this.props.root)
            .attr("class", "nodeLabel")
            .text(d => getLabel(me, d))	//Need 'this' for props
            .attr("text-anchor", "middle")
            .style("pointer-events", "none")
            .style("font-size", (2.8 / (levels+1)).toString() + "em");

        const parentTitle = g.append("title")
            .attr("class", "parentTitle")
            .datum(this.props.root)
            .text(d => getTitle(me, d))

        function arcVisible(me, d) {
            return (d.y1 < levels) && d.y0 >= 0 && d.x1 > d.x0;
        }

        function sbLabel(d) {
            return (
                // d.depth < (ringCount-1) &&
                (d.y1 < levels) &&
                //d.y0 >= 0 &&
                ((d.y1 - d.y0) * (d.x1 - d.x0)) > (0.06 / (d.depth))
            );
        }

        function labelAnchor(d) {

            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            return (x < 180) ? "end" : "start"
        }
        function labelTransform(d) {
            // const x = d.x0  * 180 / Math.PI;
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;

            const y = (d.y1 * (ringRadius)) - 5; //Subtract a bit to allow space for the error bar
            // const y = (d.y0 + d.y1) / 2 * (width / (2*ringCount));
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        }
    }

    render() {
        this.doit()
    }
}
