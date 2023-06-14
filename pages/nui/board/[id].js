import { Autocomplete, Button, Chip, Drawer, FormControl, Grid, InputLabel, Menu, MenuItem, Select, Stack, TextField, Tooltip } from "@mui/material";
import * as d3 from 'd3';
import _, { forEach } from "lodash";
import BoardService from "../../../services/BoardService";
import DataProvider from "../../../utils/Server/DataProvider";

import { HighlightOff, OpenInNew, Settings } from "@mui/icons-material";
import React from "react";
import { doRequest, getCardChildren } from "../../../utils/Client/Sdk";
import { APcard } from "../../../Components/APcard";

export class Board extends React.Component {

	static DEFAULT_TREE_DEPTH = 4;

	constructor(props) {
		super(props)

		var stateDepth = this.props.depth || 3;	//If not depth given, assume 3
		if (stateDepth < 0) stateDepth = 99;	//If -1 passed it, then do as much as anyone stupid would want.
		this.state = {
			tileType: this.props.mode || 'sunburst',
			anchorEl: null,
			rootNode: {},
			allData: null,
			drawerOpen: false,
			menuOpen: false,
			board: this.props.board,
			fetchActive: true,
			active: props.active,
			drawerWidth: 400,
			depth: stateDepth,
			pending: 0,
			total: 0,
			topLevelList: [],
			popUp: null,
			tileType: this.props.mode || 'tree',
			sortType: this.props.sort || ((this.props.mode === 'partition') ? 'count' : 'size'),
			sortDirection: this.props.dir || 'ascending',
			clickCount: 0,
			colouring: this.props.colour || 'cool',

		}
		this.setColouring({ type: this.state.colouring })

	}

	popUp = null
	portals = [];
	root = {
		id: 'root',
		children: []
	};
	assignedUserList = [];
	createdUserList = [];
	contextList = [];

	/**
	 * Two stage colour fetching:
	 * 1. Optional: Set up a function to convert a value to a colour
	 * 2. Call a function (that could call that previous function) with the 'd' parameter
	 * 	that converts d to a value.
	 * 
	 * You could, of course, only have one function that converts 'd' to a colour
	 */
	opacityDrop = true;
	colourFnc = null;
	colour = null;

	tempColouring = (d) => {
		this.opacityDrop = true;
		var mine = this.searchTree(this.root, d.data.id)
		while (mine.parent && mine.parent.id != 'root') mine = mine.parent;
		return this.colourFnc((mine ? mine.colour : 1) + 1);
	}

	typeColouring = (d) => {
		this.opacityDrop = false;
		if (d.data) return d.data.type.cardColor
		else return "#ccc"
	}

	//Get first assigned user only
	aUserColouring = (d) => {
		this.opacityDrop = false;
		var user = null;
		//Assinged users is always returned and empty if there are none
		if (d.data.assignedUsers.length) {
			user = d.data.assignedUsers[0];
			var index = _.findIndex(this.assignedUserList, function (assignee) {
				return user.id === assignee.id;
			})
			if (index > 0) return this.colourFnc(index);
		}
		return this.colourFnc(0);
	}

	contextColouring = (d) => {
		this.opacityDrop = false;
		var boardid = d.data.board.id
		var index = _.findIndex(this.contextList, function (context) {
			return boardid === context;
		})
		if (index > 0) return this.colourFnc(index);

		return this.colourFnc(0);
	}


	/**
	 * 
	 * @param {
	 * 	type: string
	 * 	method: function
	 * 	config: object
	 * 
	 * } params 
	 */
	setColouring = (params) => {
		switch (params.type) {
			case 'cool': {
				this.colourFnc = d3.scaleOrdinal(d3.quantize(d3.interpolateCool, (this.root.children && this.root.children.length) ? this.root.children.length : 1))
				this.colour = this.tempColouring;
				break;
			}
			case 'warm': {
				this.colourFnc = d3.scaleOrdinal(d3.quantize(d3.interpolateWarm, (this.root.children && this.root.children.length) ? this.root.children.length : 1))
				this.colour = this.tempColouring;
				break;
			}
			case 'context': {
				this.colourFnc = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.contextList.length))
				this.colour = this.contextColouring;
				break;
			}
			case 'type': {
				this.colour = this.typeColouring;
				break;
			}
			case 'a_user': {
				this.colourFnc = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.assignedUserList.length))
				this.colour = this.aUserColouring;
				break;
			}
			default: {
				this.colourFnc = d3.scaleOrdinal(d3.quantize(d3.interpolateCool, 2))
			}
		}

	}

	closePopUp = () => {
		this.popUp = null
		this.setState({ popUp: null })
	}

	calcTreeData = (rootNode) => {
		var me = this;
		//Do some stuff for the app to work
		rootNode
			.sum(d => {
				switch (me.state.sortType) {

					default:
					case 'count': {
						return 1;
					}
					case 'size': {
						return Boolean(d.size) ? d.size : 1
					}
				}
			})
			.sort((a, b) => {
				var dirFnc = me.state.sortDirection === "ascending" ? d3.ascending : d3.descending
				switch (me.state.sortType) {
					case 'title': {
						return dirFnc(a.data.title, b.data.title)
					}
					case 'count': {
						return dirFnc(a.value, b.value)
					}

					case 'score': {
						return dirFnc(a.data.scoring.scoreTotal, b.data.scoring.scoreTotal)
					}
					case 'id': {
						return dirFnc(Number(a.data.id), Number(b.data.id))
					}
					case 'context': {
						return dirFnc(Number(a.data.board.id), Number(b.data.board.id))
					}

					default: {
						return dirFnc(a.data.size, b.data.size)
					}
				}
			})
		//Do some other stuff for stats on the hierarchy to show to user

		rootNode.eachAfter((d) => {
			//If we are the leaves, then check if our dates are outside the parent's
			if (d.parent && (d.parent.id !== "root")) {

				//Compare dates
				var pPF = d.parent.data.plannedFinish ? new Date(d.parent.data.plannedFinish).getTime() : null;
				var pPS = d.parent.data.plannedStart ? new Date(d.parent.data.plannedStart).getTime() : null;
				var pf = d.data.plannedFinish ? new Date(d.data.plannedFinish).getTime() : null;
				var ps = d.data.plannedStart ? new Date(d.data.plannedStart).getTime() : null;

				var latest = _.max([pPF, pPS, pf, ps, d.parent.latest])
				var earliest = _.min([pPF, pPS, pf, ps, d.parent.earliest])

				if ((pf == null) || (ps == null)) {
					d.dateIncomplete = true;
				}

				if ((pf > pPF) || (ps >= pPF)) {
					d.dateError = true;
				}

				if (ps < pPS) {
					d.dateWarning = true;
				}

				d.parent.earliest = earliest;
				d.parent.latest = latest;

				//Cascade up the tree
				if (d.dateError) d.parent.dateError = true;
				if (d.dateWarning) d.parent.dateWarning = true;
				if (d.dateIncomplete) d.parent.dateIncomplete = true;
			}
		})

		rootNode.each((d) => {
			if (d.data.assignedUsers && d.data.assignedUsers.length) {
				_.forEach(d.data.assignedUsers, (user) => {
					this.assignedUserList = _.unionWith(this.assignedUserList, [user], function (a, b) { return b.id === a.id })
				})
			}
			if (d.data.createdBy) {
				this.assignedUserList = _.unionWith(this.createdUserList, [d.data.createdBy], function (a, b) { return b.is === a.id })
			}
			if (d.data.id != 'root') this.contextList = _.union(this.contextList, [d.data.board.id])
		})
	};

	addPortals = (me, nodes) => {
		nodes.each(function (d, idx) {
			var parents = d.parent && (d.parent.depth > 0) ? [d.parent.data] : null
			var children = []

			//Get child data ready to pass to APCard
			if (Boolean(d.children)) {
				d.children.forEach((child) => {
					children.push(child.data)

				})
			}

			//Placeholder for future developments. Might pass extra data to card view
			var analysisData = {
				calculatedSize: d.value
			}

			//Create a load of popups to show card details
			me.portals.push(
				<Drawer
					onClose={me.closePopUp}
					key={idx}
					open={me.popUp === d.data.id}
				>
					<div>
						<APcard
							analysis={analysisData}
							descendants={children}
							parents={parents}
							cardProps={{ maxWidth: 700 }}
							loadSource={d.depth < 2 ? 'board' : 'card'}
							host={me.props.host} card={d.data}
							context={me.state.context}
							onClose={me.closePopUp}
							readOnly
						/>
					</div>
				</Drawer>

			)
		})
	}


	childCount = (levelWidth, level, n) => {
		var me = this;
		if (n.children && n.children.length > 0) {
			if (levelWidth.length <= level + 1) levelWidth.push(0);
			levelWidth[level + 1] += n.children.length;
			n.children.forEach(function (d) {
				me.childCount(levelWidth, level + 1, d);
			});
		}
	}

	getSchedulingError = (d) => {

		var txt = "Scheduling:\n";
		if (d.earliest < (new Date(d.data.plannedStart).getTime())) {
			txt += "   Child starts ealier\n"
		}
		if (d.latest > (new Date(d.data.plannedFinish).getTime())) {
			txt += "   Child starts later\n"
		}
		if (d.dateIncomplete) {
			txt += "   Imcomplete schedule information in hierarchy\n"
		}
		return txt;
	}

	getSchedulingWarning = (d) => {

		var txt = "Scheduling:\n";
		if (d.earliest < (new Date(d.data.plannedStart).getTime())) {
			txt += "   Child starts ealier\n"
		}
		if (d.latest > (new Date(d.data.plannedFinish).getTime())) {
			txt += "   Child starts later\n"
		}
		if (d.dateIncomplete) {
			txt += "   Imcomplete schedule information in this item\n"
		}
		return txt;
	}

	update = () => {
		this.portals = [];
		var svgEl = document.getElementById("svg_" + this.state.board.id)
		if (!Boolean(svgEl)) return;
		var svg = d3.select(svgEl);
		svgEl.replaceChildren()

		var me = this;

		var levelWidth = [1];

		var rowHeight = 30;
		this.childCount(levelWidth, 0, this.state.rootNode);
		var treeBoxHeight = d3.max(levelWidth) * rowHeight;
		treeBoxHeight = _.max([(window.innerHeight - document.getElementById("header-box").getBoundingClientRect().height), treeBoxHeight])
		this.calcTreeData(this.state.rootNode)

		switch (this.state.tileType) {
			case 'table': {
				break;
			}
			case 'partition': {

				var me = this;
				var viewBox = [window.innerWidth, treeBoxHeight]

				d3.partition()
					.size([viewBox[1], viewBox[0]])
					(this.state.rootNode)

				var nodes = d3.selectAll(".node")
					.data(this.state.rootNode.descendants())
					.enter()

				this.addPortals(me, nodes);


				svg.attr("width", viewBox[0])
				svg.attr("height", viewBox[1])
				svg.attr('viewBox', [0, 0, viewBox[0], viewBox[1]])
				svg.attr('class', 'rootSurface')

				const cell = svg
					.selectAll("g")
					.data(this.state.rootNode.descendants().slice(1))
					.join("g")
					.attr("transform", d => `translate(${d.y0},${d.x0})`);

				const rect = cell.append("rect")
					.attr("id", (d, idx) => "rect_" + idx)
					.attr("width", d => d.y1 - d.y0 - 4)
					.attr("height", d => rectHeight(d))
					.attr("fill-opacity", d => ((d.children && me.opacityDrop) ? 1 : 0.6))
					.attr("fill", d => {
						return me.colour(d);
					})
					// .attr("class", d => {
					// 	return d.data.lane.cardStatus === 'finished'? "card-status card-finished" :
					// 		d.data.lane.cardStatus === 'started'? "card-status card-started" :
					// 			"card-status card-not-started"
					// })
					.style("cursor", "pointer")
					.on("click", me.nodeClicked)

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
					.attr("fill", d => d.dateError ? "red" : d.dateWarning ? "orange" : "none")
					.append("title").text(d => d.dateError ? me.getSchedulingError(d) : d.dateWarning ? me.getSchedulingWarning(d) : "No Error")

				cell.append("clipPath")
					.attr("id", function (d, idx) { return "clip_" + d.parent.data.id + "_" + d.data.id + '_' + idx })
					.append("rect").attr("id", function (d) { return "rect_" + d.parent.data.id + '_' + d.data.id })
					.attr("width", d => d.y1 - d.y0 - 5)
					.attr("height", d => rectHeight(d))

				const text = cell.append("text")
					.attr("clip-path", function (d, idx) { return "url(#clip_" + d.parent.data.id + "_" + d.data.id + '_' + idx + ")" })
					.style("user-select", "none")
					.attr("pointer-events", "none")
					.attr("x", 4)
					.attr("y", 12)
					.attr("fill-opacity", d => +partlabel(d));

				text.append("tspan")
					.text(d => me.getLabel(d))


				cell.append("title")
					.text(d => me.getTitle(d));


				function rectHeight(d) {
					return d.x1 - d.x0 - Math.min(4, (d.x1 - d.x0) / 2);
				}

				function partlabel(d) {
					return d.y1 <= window.innerWidth && d.y0 >= 0 && d.x1 - d.x0 > 16;
				}
				break;
			}


			case 'timeline': {
				break;
			}
			case 'sunburst': {

				var nodes = d3.selectAll(".node")
					.data(this.state.rootNode.descendants().slice(1))
					.enter()

				this.addPortals(me, nodes);

				d3.partition()
					.size([2 * Math.PI, this.state.rootNode.height + 1])
					(this.state.rootNode);

				this.state.rootNode.each(d => d.current = d);



				var width = _.min([window.innerWidth / 2, (window.innerHeight - document.getElementById("header-box").getBoundingClientRect().height) / 2])

				svg.attr("width", width * 2)
				svg.attr("height", width * 2)
				svg.attr('viewBox', [0, 0, width * 2, width * 2])
				svg.attr("height", width * 2)
				svg.attr('class', 'rootSurface')
				const g = svg.append("g")
					.attr("transform", `translate(${width},${width})`);

				var ringCount = _.min([(this.state.depth + 1), 6]); //Max can be five rings outside the root
				var arc = d3.arc()
					.startAngle(d => d.x0)
					.endAngle(d => d.x1)
					.padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
					.padRadius((width / ringCount) * 1.5)
					.innerRadius(d => d.y0 * (width / ringCount))
					.outerRadius(d => Math.max(d.y0 * (width / ringCount), d.y1 * (width / ringCount) - 1))
				var path = g.append("g")
					.selectAll("path")
					.data(this.state.rootNode.descendants().slice(1))
					.join("path")
					.attr("fill", d => {
						return me.colour(d);
					})
					.attr("fill-opacity", d => arcVisible(d.current) ? ((d.children && me.opacityDrop) ? 1 : 0.6) : 0)
					.attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")

					.attr("d", d => arc(d.current))
					.style("cursor", "pointer")
					.on("click", me.nodeClicked);

				path.append("title")
					.text(d => me.getTitle(d))
					;

				const label = g.append("g")
					.attr("pointer-events", "none")
					.style("user-select", "none")
					.selectAll("text")
					.data(this.state.rootNode.descendants().slice(1))
					.join("text")
					.attr("dy", "0.35em")
					//					.attr("fill-opacity", 1)
					.attr("fill-opacity", d => +sbLabel(d, d.current))
					.attr("transform", d => labelTransform(d.current))

					.attr("text-anchor", d => labelAnchor(d.current))
					.text(d => me.getLabel(d));

				const parent = g.append("circle")
					.attr("class", "parentNode")
					.datum(this.state.rootNode)
					.attr("r", (width / ringCount))
					.attr("fill", "#888")
					.attr("pointer-events", "all")
					.on("click", me.nodeClicked)

				const parentLabel = g.append("text")
					.attr("class", "parentLabel")
					.datum(this.state.rootNode)
					.text(d => me.getLabel(d))
					.attr("text-anchor", "middle");

				const parentTitle = g.append("title")
					.attr("class", "parentTitle")
					.datum(this.state.rootNode)
					.text(d => me.getTitle(d))

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
				break;
			}
			case 'tree':
			default: {


				var rootEl = document.getElementById("surface_" + this.state.board.id)

				var viewBoxSize = [rootEl.getBoundingClientRect().width, treeBoxHeight]
				var colWidth = (viewBoxSize[0] / (this.state.rootNode.height || 1))


				svg.attr('width', viewBoxSize[0])
				svg.attr("height", viewBoxSize[1])
				//Text size is too big, so offset by a few.....
				svg.attr('viewBox', (colWidth - 4) + ' -4 ' + (viewBoxSize[0]) + ' ' + viewBoxSize[1])
				rootEl.setAttribute('width', viewBoxSize[0]);
				rootEl.setAttribute('height', viewBoxSize[1]);
				svg.attr('preserveAspectRatio', 'none');
				svg.attr('class', 'rootSurface')
				var tree = d3.tree()
					.size([viewBoxSize[1] - 8, viewBoxSize[0] - 8])
					.separation(function (a, b) {
						return (a.parent === b.parent ? 1 : 1); //All leaves equi-distant
					}
					);

				tree(this.state.rootNode);

				var nodes = svg.selectAll("g")
					.data(this.state.rootNode.descendants().slice(1))
					.join("g")

				var me = this;

				nodes.each(function (d) {
					d.colMargin = 80;
					d.colWidth = colWidth - d.colMargin;
					d.rowHeight = rowHeight;


				})

				this.addPortals(me, nodes);

				nodes.append("clipPath")
					.attr("id", function (d, idx) { return "clip_" + idx })
					.append("rect").attr("id", function (d) { return "rect_" + d.parent.data.id + '_' + d.data.id })
					.attr("y", function (d) { return d.x - (d.rowHeight / 2) })
					.attr("x", function (d) { return d.y })
					.attr("width", function (d) { return d.colWidth })
					.attr("height", d => d.rowHeight)

				nodes.append("text")
					.attr("clip-path", function (d, idx) { return "url(#clip_" + idx + ")" })
					.text(d => me.getLabel(d))
					.on('click', me.nodeClicked)
					.attr("height", rowHeight - 12)
					.attr("id", function (d) {
						return "text_" + d.data.id
					})
					.style("text-anchor", "start")
					.attr("x", function (d) { return d.y + (d.rowHeight / 16) })
					.attr("y", function (d) { return d.x + (d.rowHeight / 8) })
					.style('cursor', 'pointer')

				nodes.append("title")
					.text(d => me.getTitle(d));

				this.paths(svg, nodes)
				break;
			}
		}


	}
	getLabel = (d) => {
		switch (this.state.tileType) {
			case 'sunburst': {
				return d.data.id === "root" ? "" : d.data.id + ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : "")
			}

			default:
			case 'tree':
			case 'partition': {
				return d.data.id === "root" ? "" : d.data.title + ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : "")
			}
		}
	}

	getTitle = (d) => {
		switch (this.state.tileType) {
			default: {
				return d.data.id === "root" ? "" : d.data.title + ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : " (" + d.data.size + "/" + d.value + ")")
			}
		}
	}

	paths = (svg, nodes) => {
		var me = this;
		nodes.each(node => {
			var links = svg.selectAll(".link")
				.data(node)
				.enter()
			links.append("line")
				.attr("id", function (d) { return "line_" + d.parent.data.id + '_' + d.data.id })
				.attr("stroke-width", d => d.rowHeight / 2)
				.attr("stroke", d => me.colour(d))
				.attr("opacity", 0.3)
				//.attr("class", function (d) { return ((d.parent.data.id == 'root') && !d.children) ? "invisible--link" : "local--link" })

				.attr("x1", function (d) {
					return d.y
				})
				.attr("y1", function (d) {
					return d.x
				})
				.attr("x2", function (d) {
					var rEl = document.getElementById("rect_" + d.parent.data.id + '_' + d.data.id)
					var tEl = document.getElementById("text_" + d.data.id)

					var width = (navigator.userAgent.indexOf("Firefox") >= 0) ?
						d3.min([tEl.attributes["width"], rEl.attributes["width"]]) :
						d3.min([tEl.getClientRects()[0].width, rEl.getClientRects()[0].width])

					return (d.y + (d.children ? (d.colWidth) : width))
				})
				.attr("y2", function (d) {
					return d.x
				})

			function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
				var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

				return {
					x: centerX + (radius * Math.cos(angleInRadians)),
					y: centerY + (radius * Math.sin(angleInRadians))
				};
			}

			function describeArc(x, y, radius, startAngle, endAngle) {

				var start = polarToCartesian(x, y, radius, endAngle);
				var end = polarToCartesian(x, y, radius, startAngle);

				var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

				var d = [
					"M", start.x, start.y,
					"A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
				].join(" ");
				return d;
			}
			links.append("path")
				.attr("d", function (d) {
					return describeArc(d.y
						, d.x, d.rowHeight / 4, 180, 0)

				})
				.attr("opacity", 0.3)
				.attr("fill", d => me.colour(d))

			links.append("path")
				.attr("d", function (d) {
					var rEl = document.getElementById("rect_" + d.parent.data.id + '_' + d.data.id)
					var tEl = document.getElementById("text_" + d.data.id)

					var width = (navigator.userAgent.indexOf("Firefox") >= 0) ?
						d3.min([tEl.attributes["width"], rEl.attributes["width"]]) :
						d3.min([tEl.getClientRects()[0].width, rEl.getClientRects()[0].width])

					var endpoint = (d.y + (d.children ? (d.colWidth) : width))
					return describeArc(endpoint, d.x, d.rowHeight / 4, 0, 180)

				})
				.attr("opacity", 0.3)
				.attr("fill", d => me.colour(d))

			if (node.parent.data.id == "root") return;

			links.append("path")
				.attr("id", function (d) { return "path_" + d.parent.data.id + '_' + d.data.id })
				.attr("class", function (d) { return "local--link"; })
				.attr("d", function (d) {
					var tEl = document.getElementById("rect_" + d.parent.data.id + '_' + d.data.id)
					var width = (navigator.userAgent.indexOf("Firefox") >= 0) ?
						tEl.attributes["width"] :
						tEl.getClientRects()[0].width
					var startPointH = d.parent.y + width + (d.rowHeight / 4);
					var startApex = (d.y - (d.parent.y + width)) / 2
					var startPointV = d.parent.x;
					var endPointH = d.y - (d.rowHeight / 4);
					var endPointV = d.x;

					var string = "M" + startPointH + "," + startPointV +
						"C" + (startPointH + (startApex)) + "," + (startPointV) + " " +
						(endPointH - (startApex)) + "," + endPointV + " " +
						endPointH + "," + endPointV;
					return string
				});

		})
	}

	modeChange = (e) => {
		var newMode = e.target.value;
		this.setState((prev) => {
			if ((prev.sortType === "title") && (newMode === 'sunburst')) {
				return { tileType: newMode, sortType: 'count' }
			}
			else if ((prev.sortType === "count") && (newMode === 'tree')) {
				return { tileType: newMode, sortType: 'size' }
			}
			return { tileType: newMode }
		});
	}
	sortChange = (e) => {
		this.setState({ sortType: e.target.value });
	}

	sortDirChange = (e) => {
		this.setState({ sortDirection: e.target.value });
	}

	colourChange = (e) => {
		this.setColouring({ type: e.target.value })
		this.setState({ colouring: e.target.value });
	}

	render() {
		if (!this.state.fetchActive) {
			this.update()
			return (
				<Stack id="portalContainer" sx={{ width: '100%' }}>
					{this.portals}
					<Grid id="header-box" container direction={'row'}>
						<Grid xs={10} item>
							<Grid container sx={{ alignItems: 'center' }} direction={'row'}>
								<Grid item>
									<Settings sx={{ margin: "0px 10px 0px 10px" }} onClick={this.openDrawer} />
								</Grid>
								<Grid item>
									<TextField
										variant="standard"
										sx={{ m: 1, minWidth: 400 }}
										size="small"
										defaultValue={this.state.board.title}
										label="Context"
										InputProps={{ readOnly: true }} />
								</Grid>

							</Grid>
						</Grid>
						<Grid item xs={2} sx={{ alignItems: 'center' }}>
							<Grid container style={{ justifyContent: 'flex-end' }} >
								{this.state.pending ?
									<Chip color="warning" label={"Queued: " + this.state.pending} />
									: <Chip label={"Total loaded: " + this.state.total}></Chip>}
							</Grid>
						</Grid>
					</Grid>
					<Menu
						open={Boolean(this.state.anchorEl)}
						anchorEl={this.state.anchorEl}
						onClose={this.closeMenu}
						anchorOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
					>

						<MenuItem value='expand' onClick={this.closeMenu}>Restore All</MenuItem>
						{(this.state.active && this.state.active.length) ?
							<MenuItem value='reloadAll' onClick={this.closeMenu}>Reload All</MenuItem>
							: null}
					</Menu>

					<div id={"surface_" + this.state.board.id}>
						<svg id={"svg_" + this.state.board.id} />
					</div>

					<Drawer
						variant='persistent'
						open={Boolean(this.state.drawerOpen)}
						anchor='left'
						sx={{
							width: this.state.drawerWidth,
							flexShrink: 0,
							[`& .MuiDrawer-paper`]: { width: this.state.drawerWidth, boxSizing: 'border-box' },
						}}
					>
						<Grid container direction="column">
							<Grid item>
								<Grid container direction="row">
									<Grid xs={6} item>
										<Button
											aria-label="Open As New Tab"
											onClick={this.openAsActive}
											endIcon={<OpenInNew />}
										>
											Open In new Tab
										</Button>
									</Grid>
									<Grid xs={6} item>
										<Grid sx={{ justifyContent: 'flex-end' }} container>

											<Tooltip title='Close Settings'>
												<HighlightOff onClick={this.closeDrawer} />
											</Tooltip>
										</Grid>
									</Grid>
								</Grid>
							</Grid>
							<Grid item>
								{this.topLevelList()}
							</Grid>
							<Grid item>
								<Grid container>
									<Grid item>
										<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
											<InputLabel>Mode</InputLabel>
											<Select
												value={this.state.tileType}
												onChange={this.modeChange}
												label="Mode"
											>
												<MenuItem value="tree">Tree</MenuItem>
												<MenuItem value="sunburst">Sunburst</MenuItem>
												<MenuItem value="partition">Partition</MenuItem>
											</Select>
										</FormControl>
									</Grid>
									<Grid item>
										<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
											<InputLabel>Sort By</InputLabel>
											<Select
												value={this.state.sortType}
												onChange={this.sortChange}
												label="Sort By"
											>
												<MenuItem value="size">Size</MenuItem>
												{this.state.tileType === 'sunburst' ? null : <MenuItem value="title">Title</MenuItem>}
												<MenuItem value="score">Score Total</MenuItem>
												{this.state.tileType === 'tree' ? null : <MenuItem value="count">Card Count</MenuItem>}

												<MenuItem value="id">ID#</MenuItem>
											</Select>
										</FormControl>
									</Grid>
									<Grid item >
										<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
											<InputLabel>Sort Direction</InputLabel>
											<Select
												value={this.state.sortDirection}
												onChange={this.sortDirChange}
												label="Sort Direction"
											>
												<MenuItem value="ascending">Ascending</MenuItem>
												<MenuItem value="descending">Descending</MenuItem>
											</Select>
										</FormControl>
									</Grid>
									<Grid item>
										<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
											<InputLabel>Colours</InputLabel>
											<Select
												value={this.state.colouring}
												onChange={this.colourChange}
												label="Colours"
											>
												<MenuItem value="cool">Cool</MenuItem>
												<MenuItem value="warm">Warm</MenuItem>
												<MenuItem value="type">Card Type</MenuItem>
												<MenuItem value="a_user">First Assignee</MenuItem>
												<MenuItem value="context">Context</MenuItem>
											</Select>
										</FormControl>
									</Grid>
								</Grid>
							</Grid>

						</Grid>
					</Drawer>
				</Stack >
			)
		}
		else return <div>loading</div>;
	}

	getTopLevel = async () => {

		var params = {
			host: this.props.host,
			mode: "POST",
			url: "/card/list",
			type: "application/json",
			body: JSON.stringify({
				"board": this.state.board.id, "only": ["id"],
				"lane_class_types": ["active", "backlog"]
			})
		}

		try {
			var response = await doRequest(params)
			var result = await response.json()
			var cards = result.cards

			//Filter out the ones we don't want
			if (this.state.active && !this.reloadInProgress) {
				var activeCards = this.state.active.split(',')
				cards = _.filter(cards, function (child) {
					var result = (_.filter(activeCards, function (value) {
						var eqv = value === child.id;
						return eqv
					}))
					return (result.length > 0)
				})
			}

			//Collect the ids and get the 'real' versions of the cards
			if (cards && cards.length) {
				cards.forEach(async (card) => {

					var cParams = {
						host: this.props.host,
						mode: "GET",
						url: "/card/" + card.id
					}
					var cResponse = await doRequest(cParams)
					var cResult = await cResponse.json()
					cResult.parent = this.root.id;
					this.root.children.push(cResult)

					if (this.state.depth > 0) this.childrenOf(params.host, [cResult], 1)
					else {
						this.setDatat();
					}
				})
			}
		} catch (error) {
			console.log("Caught error: ", error)
		}
		return null;
	}

	childrenOf = (host, cards, depth) => {

		forEach(cards, (card) => {
			this.setState((prev) => { return { pending: prev.pending + 1, total: prev.total + 1 } })
			getCardChildren(host, card).then(async (result) => {
				this.setState((prev) => { return { pending: prev.pending - 1 } })
				var children = await result.json()
				if (children) {
					card.children = children.cards
					forEach(card.children, (cd) => {
						//Remove from top list if they are a child of something
						this.root.children = _.reject(this.root.children, function (rootChild) {
							return rootChild.id === cd.id
						})
						cd.parent = card.id
					})
					if (depth < this.state.depth) this.childrenOf(host, card.children, depth + 1)
				}
				this.setData()
			}, this)
		})
		this.setData()
	}

	setData = () => {
		function setChildIdx(item) {
			item.children && item.children.forEach((child, idx) => {
				child.parent = item;
				child.colour = idx;
				setChildIdx(child);
			})
		}
		if (this.root) {
			setChildIdx(this.root)
		}
		//If colouring is set to cool, we need to provide a length
		this.setColouring({ type: this.state.colouring })
		this.setState({ rootNode: d3.hierarchy(this.root) })
	}


	componentDidMount = () => {
		if (this.state.fetchActive) {
			this.getTopLevel();
			this.setState({ fetchActive: false })
		}
	}

	searchTree = (element, id) => {
		if (element.id === id) {
			return element;
		}
		else if (Boolean(element.children)) {
			var i;
			var result = null;
			for (i = 0; result == null && i < element.children.length; i++) {
				result = this.searchTree(element.children[i], id);
			}
			return result;
		}
		return null;
	}

	nodeClicked = (ev, p) => {
		if (ev.ctrlKey) {
			if (p.data.children && p.data.children.length) {
				p.data.savedChildren = _.union(p.data.children, p.data.savedChildren)
				p.data.children = [];
			}
			else if (p.data.savedChildren && p.data.savedChildren.length) {
				p.data.children = p.data.savedChildren;
				p.data.savedChildren = [];
			}
			this.setState((prev) => {
				return { rootNode: d3.hierarchy(this.root) }
			})
		}
		else if (ev.altKey) {
			document.open("/nui/card/" + p.data.id, "", "noopener=true")
		}
		else if (ev.shiftKey) {

			var me = this;


			if (p.data.id != 'root') {
				var newRoot = this.searchTree(me.root, p.data.id);
				var parent = this.searchTree(me.root, newRoot.parent.id);
				if (me.focus === p.data.id) {
					if (parent && (parent.id !== 'root')) {
						me.focus = parent.id;
						me.setState({
							rootNode: d3.hierarchy(
								{
									id: 'root',
									children: [parent]
								}
							)
						});
					} else {
						me.focus = null;
						me.setState({
							rootNode: d3.hierarchy(
								{
									id: 'root',
									children: me.root.children
								}
							)
						})
					}

				} else {
					me.focus = newRoot.id;
					me.setState({
						rootNode: d3.hierarchy(
							{
								id: 'root',
								children: [newRoot]
							}
						)
					})
				}
			} else {
				me.focus = null;
				me.setState({
					rootNode: d3.hierarchy(
						{
							id: 'root',
							children: me.root.children
						}
					)
				})
			}

			d3.select(".parentLabel").datum(p).text(d =>
				(d.data.id === "root" ? "" : d.data.id));
			d3.select(".parentTitle").datum(p).text(d => {
				return d.data.title + " : " + d.data.size;
			})

			d3.select(".parentNode").datum(p || me.state.rootNode);

		}
		else {
			this.popUp = p.data.id
			this.setState({ popUp: p.data.id })
		}
	}

	resetChildren = (node) => {
		node.children = _.union(node.children || [], node.savedChildren || [])
		node.savedChildren = [];
		node.children.forEach((child) => {
			this.resetChildren(child)
		})
	}

	enableMenu = (e) => {
		this.setState({ anchorEl: e.currentTarget })
	}

	closeMenu = async (e) => {
		var command = e.target.getAttribute('value');

		switch (command) {
			case 'expand': {
				var data = this.state.rootNode && this.state.rootNode.children
				if (data) data.forEach((item) => { this.resetChildren(item) })
				break;
			}
			case 'tree':
			case 'partition':
			case 'sunburst': {
				//Force a redraw as well
				this.setState({ tileType: e.target.getAttribute('value') })
				break;
			}
			case 'reloadAll': {
				this.reloadInProgress = true;
				this.load();
				break;
			}

			case 'savePDF': {
				// 	var doc = new jsPDF(
				// 		{
				// 			orientation: "l",
				// 			unit: 'px',
				// 			format: "a4",
				// 			hotfixes: ["px_scaling"]
				// 		}
				// 	);
				// 	var svg = document.getElementById("svg_" + this.state.board.id);
				// 	var svgAsXml = new XMLSerializer().serializeToString(svg)
				// 	await doc.addSvgAsImage(svgAsXml, 0, 0, svg.getBoundingClientRect().width, svg.getBoundingClientRect().height)
				// 	doc.save(this.state.board.id + ".pdf")
				break;
			}
		}

		this.setState({ anchorEl: null })
	}

	openDrawer = () => {
		this.setState({ drawerOpen: true })
	}

	closeDrawer = () => {
		this.setState({ drawerOpen: false })
	}

	openAsActive = () => {
		var activeList = this.state.topLevelList;
		var as = ""

		if (activeList.length) {
			as += "?active="
			activeList.forEach((item, idx) => {
				as += item.id;
				if (idx < (activeList.length - 1)) {
					as += ","
				}
			})
			as += "&"
		}
		else {
			as += "?"
		}
		as += "sort=" + this.state.sortType
		as += "&mode=" + this.state.tileType
		as += "&dir=" + this.state.sortDirection
		as += "&colour=" + this.state.colouring
		as += "&depth=" + this.state.depth

		document.open("/nui/board/" + this.state.board.id + as, "", "noopener=true")
	}
	handleChangeMultiple = (evt, valueList) => {
		var root = { ...this.root };
		var allChildren = root.children
		if (root.savedChildren && (root.savedChildren.length > 0)) allChildren = _.union(allChildren, root.savedChildren)
		if (valueList.length > 0) {
			root.children = _.filter(allChildren, function (child) {
				var result = (
					_.filter(valueList, function (value) {
						var eqv = value.id === child.id;
						return eqv
					}))
				return (result.length > 0)
			})
			root.savedChildren = _.reject(allChildren, function (child) {
				var result = (
					_.filter(valueList, function (value) {
						var eqv = value.id === child.id;
						return eqv
					})
				)
				return (result.length > 0)
			})
		} else {
			root.children = allChildren
			root.savedChildren = null;
		}
		this.setState({ rootNode: d3.hierarchy(root), topLevelList: valueList })
	}

	topLevelList = () => {
		//Top level list is the children of root

		var cardList = this.root.children
		return (cardList && cardList.length) ? (
			<Autocomplete
				freeSolo
				multiple
				clearOnEscape
				id="root-child-selector"
				disableClearable
				onChange={this.handleChangeMultiple}
				options={cardList}
				getOptionLabel={(option) => option.title}
				renderOption={(props, option) => {
					return (
						<li {...props} key={option.id}>
							{option.title}
						</li>
					);
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						label="Click here to search cards"
						InputProps={{
							...params.InputProps,
							type: 'search',
						}}
					/>
				)}
			/>

		) : null
	}

	saveLowerChildren = (cnt, depth, node) => {
		if (cnt < depth) {
			forEach(node.children, (child) => this.saveLowerChildren(cnt + 1, depth, child))
		} else {
			node.hiddenChildren = _.union(node.savedChildren, node.children)
			node.children = null;
			node.savedChildren = null;
		}

	}
}


export async function getServerSideProps({ req, params, query }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}
	var bs = new BoardService(req.headers.host);
	var board = await bs.get(params.id)
	if (board) {
		var active = null;
		if (query.active) {
			active = query.active;
		}
		var depth = null;
		if (query.depth) {
			depth = query.depth;
		}
		else depth = Board.DEFAULT_TREE_DEPTH	//Limit the exponential explosion of fetches as you go down the tree

		var mode = null;
		if (query.mode) {
			mode = query.mode;
		}
		var colour = null;
		if (query.colour) {
			colour = query.colour;
		}
		var sort = null;
		if (query.sort) {
			sort = query.sort;
		}
		var dir = null;
		if (query.dir) {
			dir = query.dir;
		}
		return { props: { board: board, active: active, depth: depth, colour: colour, mode: mode, sort: sort, dir: dir, host: req.headers.host } }
	}
	return { props: { board: null, active: null, depth: null, colour: null, mode: null, sort: null, dir: null, host: req.headers.host } }
}
export default Board