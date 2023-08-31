import { arc, partition, select } from "d3";
import { min } from "lodash";
import { VIEW_TYPES, visitTree } from "../utils/Client/Sdk";
import { getLabel, getTitle } from "../utils/Client/SdkSvg";
import APBoard from "./APBoard";
import App from "./App";

export class APPartitionView extends App {

    static ROW_HEIGHT = 30;
    constructor(props) {
        super(props)

        this.mode = VIEW_TYPES.PARTITION

    }

    doit = () => {
        var me = this;

        this.colourise = this.props.colourise || function () { return "#666666" }
        this.errorColour = this.props.errorColour || function () { return "#cc6666" }
        this.errorData = this.props.errorData || function () { return { msg: "", colour: "" } }
        this.nodeClicked = this.props.onClick || null;

        //These two are used by the routines in Sdk.js and not here
        this.colouring = this.props.colouring
        this.sort = this.props.sort
        var svg = select(this.props.target);
        if (!Boolean(svg)) throw new Error("No valid svg given to PartitionApp")

        var columnCount = this.props.depth ?
            min([parseInt(this.props.depth), this.props.root.height]) :
            min([APBoard.DEFAULT_TREE_DEPTH, this.props.root.height])

        function sizeIt(d, prevSize) {
            switch (me.sort) {
                case 'size': {
                    return prevSize + ((d.data && d.data.size) ? d.data.size : 0)
                }
                default:
                case 'count': {
                    return prevSize + APPartitionView.ROW_HEIGHT;
                }
                case 'r_size':
                    return prevSize + d.value
            }
        }
        
        var sizing = visitTree(this.props.root, sizeIt, 0)

        partition()
            .size([sizing, this.props.size[0]])
            (this.props.root)

        svg.attr("width", this.props.size[0])
        svg.attr("height", sizing)
        svg.attr('viewBox', [0, 0, this.props.size[0], sizing])

        const cell = svg
            .selectAll("g")
            .data(this.props.root.descendants().slice(1))
            .join("g")
            .attr("transform", d => `translate(${d.y0},${d.x0})`);

        const rect = cell.append("rect")
            .attr("id", (d, idx) => "rect_" + idx)
            .attr("width", d => d.y1 - d.y0 - 4)
            .attr("height", d => rectHeight(d))
            .attr("fill-opacity", d => ((d.children && me.opacityDrop) ? APBoard.OPACITY_HIGH : APBoard.OPACITY_MEDIUM))
            .attr("fill", d => {
                return this.colourise(d);
            })
            .style("cursor", "pointer")
            .on("click", (evt, d) => me.nodeClicked ? me.nodeClicked(evt, d) : null)

        cell.join("g")
            .append("path")
            .attr("d", d => {
                var height = _.min([d.x1 - d.x0, d.y1 - d.y0, 15])
                var ax = d.y1 - d.y0;  //a == far corner
                var ay = d.x1 - d.x0;
                var bx = ax;			//b is up from a
                var by = ay - height;
                var cx = ax - height;	//c is over to the left from a
                var cy = ay;
                //The '- 4' is due to the margin in the css
                return `M ${ax - 4} ${ay - 4} L ${bx - 4} ${by} L ${cx} ${cy - 4} z`
            })
            .attr("fill", d => {
                var eColour = this.errorData(d).colour
                return eColour.length ? eColour : this.colourise(d)
            })
            .append("title").text(d => me.errorData(d).msg)

        cell.append("clipPath")
            .attr("id", function (d, idx) { return "clip_" + d.depth + "_" + d.data.id + '_' + idx })
            .append("rect").attr("id", function (d) { return "rect_" + d.depth + '_' + d.data.id })
            .attr("width", d => d.y1 - d.y0 - 5)
            .attr("height", d => rectHeight(d))

        const text = cell.append("text")
            .attr("clip-path", function (d, idx) { return "url(#clip_" + d.depth + "_" + d.data.id + '_' + idx + ")" })
            .style("user-select", "none")
            .attr("pointer-events", "none")
            .attr("x", 4)
            .attr("y", 14)  //Linked to font size
            .attr("fill-opacity", d => +partlabel(d));

        text.append("tspan")
            .text(d => getLabel(me, d))


        cell.append("title")
            .text(d => getTitle(me, d));


        function rectHeight(d) {
            return d.x1 - d.x0 - Math.min(4, (d.x1 - d.x0) / 2);
        }

        function partlabel(d) {
            return d.y1 <= window.innerWidth && d.y0 >= 0 && d.x1 - d.x0 > 16;
        }
    }

    render() {
        this.doit()
    }
}
