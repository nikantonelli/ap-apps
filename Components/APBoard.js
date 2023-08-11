import { Autocomplete, Box, Button, Chip, Drawer, FormControl, Grid, InputLabel, Menu, MenuItem, Select, Stack, TextField, Tooltip } from "@mui/material";
import * as d3 from 'd3';
import _, { forEach } from "lodash";

import { HighlightOff, OpenInNew, Settings } from "@mui/icons-material";

import React from "react";

import { APcard } from "../Components/APcard";
import { TimeLineApp } from "../Components/TimeLineApp";
import { shortDate } from "../utils/Client/Helpers";
import { doRequest, getCardHierarchy } from "../utils/Client/Sdk";

import NikApp from "../Components/NikApp";

export class APBoard extends NikApp {

	static DEFAULT_TREE_DEPTH = 4;
	static OPACITY_HIGH = 1.0;
	static OPACITY_MEDIUM = 0.7;
	static OPACITY_LOW = 0.3;
	static OPACITY_VERY_LOW = 0.1;

	constructor(props) {
		super(props)

		var stateDepth = 4
		if (stateDepth < 0) stateDepth = 99;	//If -1 passed in, then do as much as anyone stupid would want.
		this.state = {
			...this.state,
			mode: this.props.mode || 'sunburst',
			anchorEl: null,
			rootNode: null,
			drawerOpen: false,
			menuOpen: false,
			board: this.props.board,
			fetchActive: true,
			active: props.active,
			drawerWidth: this.props.drawerWidth || 400,
			depth: stateDepth,
			pending: 0,
			total: 0,
			topLevelList: props.topLevelList || [],
			popUp: null,
			sortType: this.props.sort || 'none',
			sortDir: this.props.dir || 'ascending',
			clickCount: 0,
			colouring: this.props.colour || 'type',
			grouping: this.props.group || 'level',
			showErrors: this.props.eb || 'off',
			colourise: null,
		}
	}

	popUp = null
	portals = [];
	root = {
		id: 'root',
		children: this.props.cards || []
	};
	assignedUserList = [];
	createdUserList = [];
	updatedUserList = [];
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
		//Assigned users is always returned and empty if there are none
		if (d.data.assignedUsers.length) {
			user = d.data.assignedUsers[0];
			var index = _.findIndex(this.assignedUserList, function (assignee) {
				return user.id === assignee.id;
			})
			if (index >= 0) return this.colourFnc(index);
		}
		return this.colourFnc(0);
	}

	lUserColouring = (d) => {
		this.opacityDrop = false;
		var user = null;
		//last update users is always returned and empty if there are none
		if (d.data.updatedBy) {
			user = d.data.updatedBy;
			var index = _.findIndex(this.updatedUserList, function (assignee) {
				return user.id === assignee.id;
			})
			if (index >= 0) return this.colourFnc(index);
		}
		return this.colourFnc(0);
	}

	cUserColouring = (d) => {
		this.opacityDrop = false;
		var index = -1;
		//creator users is always returned and empty if there are none
		if (d.data.createdBy) {
			index = _.findIndex(this.createdUserList, function (user) {
				return d.data.createdBy.id === user.id;
			})
		}
		var colour = this.colourFnc((index >= 0) ? index : 0);
		return colour
	}

	contextColouring = (d) => {
		this.opacityDrop = false;
		var boardid = d.data.board.id
		var index = _.findIndex(this.contextList, function (context) {
			return boardid === context;
		})
		if (index >= 0) return this.colourFnc(index);

		return this.colourFnc(0);
	}

	stateColouring = (d) => {
		this.opacityDrop = false;
		switch (d.data.lane.cardStatus) {
			case 'notStarted': return '#4989e4';
			case 'started': return '#27a444';
			case 'finished': return '#444444'
		}
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
		switch (params.colouring) {
			case 'cool': {
				this.colourFnc = d3.scaleOrdinal(d3.quantize(d3.interpolateCool, (this.root.children && this.root.children.length) ? this.root.children.length + 1 : 2))
				this.setState({ colourise: this.tempColouring });
				break;
			}
			case 'warm': {
				this.colourFnc = d3.scaleOrdinal(d3.quantize(d3.interpolateWarm, (this.root.children && this.root.children.length) ? this.root.children.length + 1 : 2))
				this.setState({ colourise: this.tempColouring });
				break;
			}
			case 'context': {
				this.colourFnc = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.contextList.length ? this.contextList.length + 1 : 2))
				this.setState({ colourise: this.contextColouring });
				break;
			}
			case 'type': {
				this.setState({ colourise: this.typeColouring });
				break;
			}
			case 'state': {
				this.setState({ colourise: this.stateColouring });
				break;
			}
			case 'a_user': {
				this.colourFnc = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.assignedUserList.length ? this.assignedUserList.length + 1 : 2))
				this.setState({ colourise: this.aUserColouring });
				break;
			}
			case 'l_user': {
				this.colourFnc = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.updatedUserList.length ? this.updatedUserList.length + 1 : 2))
				this.setState({ colourise: this.lUserColouring });
				break;
			}
			case 'c_user': {
				this.colourFnc = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.createdUserList.length ? this.createdUserList.length + 1 : 2))
				this.setState({ colourise: this.cUserColouring });
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
					case 'r_size': {
						return d.size ? d.size : 1;
					}
				}
			})
			.sort((a, b) => {
				var dirFnc = me.state.sortDir === "ascending" ? d3.ascending : d3.descending
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
					//Dates need to be backwards to be more useful: ascending means from now until later
					case 'plannedStart': {
						return dirFnc(new Date(b.data.plannedStart), new Date(a.data.plannedStart))
					}
					case 'plannedFinish': {
						return dirFnc(new Date(b.data.plannedFinish), new Date(a.data.plannedFinish))
					}
					case 'id': {
						return dirFnc(Number(a.data.id), Number(b.data.id))
					}
					case 'context': {
						return dirFnc(Number(a.data.board.id), Number(b.data.board.id))
					}
					case 'size': {
						return dirFnc(a.data.size, b.data.size)
					}
					case 'r_size': {
						return dirFnc(a.value, b.value)
					}

					default: {
						//Sort so the 'latest' (i.e biggest id number) is at top
						return dirFnc(b.data.id, a.data.id)
					}
				}
			})
		//Do some other stuff for stats on the hierarchy to show to user
		rootNode.eachAfter((d) => {
			//If we are the leaves, then check if our dates are outside the parent's
			if (d.parent && (d.parent.data.id !== "root")) {

				var pPF = d.parent.data.plannedFinish ? new Date(d.parent.data.plannedFinish).getTime() : null;
				var pPS = d.parent.data.plannedStart ? new Date(d.parent.data.plannedStart).getTime() : null;
				var pf = d.data.plannedFinish ? new Date(d.data.plannedFinish).getTime() : null;
				var ps = d.data.plannedStart ? new Date(d.data.plannedStart).getTime() : null;

				var aPF = d.parent.data.actualFinish ? new Date(d.parent.data.actualFinish).getTime() : null;
				var aPS = d.parent.data.actualStart ? new Date(d.parent.data.actualStart).getTime() : null;
				var af = d.data.actualFinish ? new Date(d.data.actualFinish).getTime() : null;
				var as = d.data.actualStart ? new Date(d.data.actualStart).getTime() : null;

				rootNode.latest = _.max([pPF, pPS, pf, ps, aPF, aPS, af, as, rootNode.latest])
				rootNode.earliest = _.min([pPF, pPS, pf, ps, aPF, aPS, af, as, rootNode.earliest])
			}
		})

		rootNode.each((d) => {
			if (d.data.assignedUsers && d.data.assignedUsers.length) {
				_.forEach(d.data.assignedUsers, (user) => {
					this.assignedUserList = _.unionWith(this.assignedUserList, [user], function (a, b) { return b.id === a.id })
				})
			}
			if (d.data.createdBy) {
				this.createdUserList = _.unionWith(this.createdUserList, [d.data.createdBy], function (a, b) { return b.id === a.id })
			}
			if (d.data.updatedBy) {
				this.updatedUserList = _.unionWith(this.updatedUserList, [d.data.updatedBy], function (a, b) { return b.id === a.id })
			}
			if (d.data.id != 'root') {
				this.contextList = _.union(this.contextList, [d.data.board.id])
				//Ensure that the colouring function is called in a consistent order. You can end up with different colour if you don't
				d.colour = this.state.colourise(d);
			}
		})
	};

	addPortals = (me, nodes) => {
		var allNodes = [...nodes];
		var finder = function (array, id) {
			for (var i = 0; i < array.length; i++) {
				if (array[i].__data__.data.id === id) return i;
			}
			return null;
		}

		nodes.each(function (d, idx) {
			if (!d.parent) return;
			var parents = []
			if ((d.data.parentCards && d.data.parentCards.length)) {
				_.each(d.data.parentCards, (card) => {
					var index = finder(allNodes, card.cardId);
					if (index) parents.push(allNodes[index].__data__.data)
				})
			}
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
					<Box>
						<APcard
							descendants={children}
							parents={parents}
							cardProps={{ maxWidth: 700, flexGrow: 1 }}
							loadSource={d.depth < 2 ? 'board' : 'card'}
							host={me.props.host} card={d.data}
							context={me.state.context}
							onClose={me.closePopUp}
							readOnly
						/>
					</Box>
				</Drawer>

			)
		})
	}

	getErrorColour = (d) => {
		var colour = ""

		if (this.state.showErrors === 'on') {
			//Compare dates
			var pPF = d.parent.data.plannedFinish ? new Date(d.parent.data.plannedFinish).getTime() : null;
			var pPS = d.parent.data.plannedStart ? new Date(d.parent.data.plannedStart).getTime() : null;
			var pf = d.data.plannedFinish ? new Date(d.data.plannedFinish).getTime() : null;
			var ps = d.data.plannedStart ? new Date(d.data.plannedStart).getTime() : null;

			if ((pf == null) || (ps == null)) {
				colour = "red"
				d.opacity = 0.7
			} else {
				if ((pf > pPF) || (ps >= pPF)) {
					colour = "red"
					d.opacity = 0.7
				}
				else if (ps < pPS) {
					colour = "#e69500"
					d.opacity = 0.7
				}
				else {
					d.opacity = 1.0
				}
			}
		}
		return colour;
	}

	getErrorMessage = (d) => {
		var msg = "";
		//Compare dates
		var pPF = d.parent.data.plannedFinish ? new Date(d.parent.data.plannedFinish).getTime() : null;
		var pPS = d.parent.data.plannedStart ? new Date(d.parent.data.plannedStart).getTime() : null;
		var pf = d.data.plannedFinish ? new Date(d.data.plannedFinish).getTime() : null;
		var ps = d.data.plannedStart ? new Date(d.data.plannedStart).getTime() : null;

		var latest = _.max([pPF, pPS, pf, ps, d.parent.latest])
		var earliest = _.min([pPF, pPS, pf, ps, d.parent.earliest])

		if ((pf == null) || (ps == null)) {
			msg += "Incomplete schedule information in hierarchy\n"
		}
		else {
			if ((pf > pPF) || (ps >= pPF)) {
				msg += "This child starts later\n"
			}
			if (ps < pPS) {
				msg += "This child starts ealier\n"
			}
		}

		d.parent.earliest = earliest;
		d.parent.latest = latest;


		return msg;
	}

	setPartitionView = (rowHeight) => {

		var treeBoxHeight = this.state.rootNode.value * rowHeight;
		var hEl = document.getElementById("header-box")
		treeBoxHeight = _.max([treeBoxHeight, window.innerHeight - hEl.getBoundingClientRect().height])
		var rootEl = document.getElementById("surface_" + this.state.board.id)
		return [rootEl.getBoundingClientRect().width, treeBoxHeight]
	}

	update = () => {
		this.portals = [];
		/**
		 * If a network error has occurred that is unrecoverable, then we may still come here but without a board
		 */
		if (!this.state.board || !this.state.rootNode) return;

		var svgEl = document.getElementById("svg_" + this.state.board.id)
		if (!Boolean(svgEl)) return;
		var svg = d3.select(svgEl);
		svg.attr('class', 'rootSurface')
		svgEl.replaceChildren()
		var me = this;
		var rowHeight = 30;

		this.calcTreeData(this.state.rootNode)

		switch (this.state.mode) {
			case 'table': {
				break;
			}
			case 'partition': {

				var me = this;
				var viewBox = this.setPartitionView(rowHeight)

				d3.partition()
					.size([viewBox[1], viewBox[0]])
					(this.state.rootNode)

				var nodes = d3.selectAll(".node")
					.data(this.state.rootNode.descendants().slice(1))
					.enter()

				this.addPortals(me, nodes);

				svg.attr("width", viewBox[0])
				svg.attr("height", viewBox[1])
				svg.attr('viewBox', [0, 0, viewBox[0], viewBox[1]])

				const cell = svg
					.selectAll("g")
					.data(this.state.rootNode.descendants().slice(1))
					.join("g")
					.attr("transform", d => `translate(${d.y0},${d.x0})`);

				const rect = cell.append("rect")
					.attr("id", (d, idx) => "rect_" + idx)
					.attr("width", d => d.y1 - d.y0 - 4)
					.attr("height", d => rectHeight(d))
					.attr("fill-opacity", d => ((d.children && me.opacityDrop) ? APBoard.OPACITY_HIGH : APBoard.OPACITY_MEDIUM))
					.attr("fill", d => {
						return me.state.colourise(d);
					})
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
					.attr("fill", d => {
						var eColour = me.getErrorColour(d)
						return eColour.length ? eColour : me.state.colourise(d)
					})
					.append("title").text(d => me.getErrorMessage(d))

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

				this.dateRangeStart = new Date().getTime() - (1000 * 60 * 60 * 24 * 14)	//14 days ago
				this.dateRangeEnd = new Date().getTime() + (1000 * 60 * 60 * 24 * 14)	//14 days in future

				if (this.state.rootNode.earliest) {
					this.dateRangeStart = this.state.rootNode.earliest;
					if (!this.state.rootNode.latest) {
						this.dateRangeEnd = this.dateRangeStart + (1000 * 60 * 60 * 24 * 28)	//Go for 28 days onwards
					}
					else {
						this.dateRangeEnd = this.state.rootNode.latest
					}

				}

				var nodes = d3.selectAll(".node")
					.data(this.state.rootNode.descendants().slice(1))
					.enter()

				this.addPortals(me, nodes);

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
				var width = _.min([window.innerWidth / 2, (window.innerHeight / 2) - (document.getElementById("header-box").getBoundingClientRect().height / 2) - 2])

				svg.attr("width", window.innerWidth)
				svg.attr("height", width * 2)
				svg.attr('viewBox', [0, 0, window.innerWidth, width * 2])
				svg.attr("height", width * 2)
				const g = svg.append("g")
					.attr("transform", `translate(${width + ((window.innerWidth - (width * 2)) / 2)},${width})`);

				var ringCount = _.min([(this.state.depth), 5]); //Max can be four rings including the root due to the text length
				var arc = d3.arc()
					.startAngle(d => d.x0)
					.endAngle(d => d.x1)
					.padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
					.padRadius((width / ringCount) * 1.5)
					.innerRadius(d => d.y0 * (width / ringCount))
					.outerRadius(d => Math.max(d.y0 * (width / ringCount), d.y1 * (width / ringCount) - 1))

				var eArc = d3.arc()
					.startAngle(d => d.x0)
					.endAngle(d => d.x1)
					.padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
					.padRadius((width / ringCount) * 1.5)
					.innerRadius(d => Math.max(d.y1 * (width / ringCount) - 3, d.y0 * (width / ringCount)))
					.outerRadius(d => d.y1 * (width / ringCount) - 1)

				var path = g.append("g")
					.selectAll("path")
					.data(this.state.rootNode.descendants().slice(1))
					.join("path")
					.attr("fill", d => {
						return me.state.colourise(d);
					})
					.attr("fill-opacity", d => arcVisible(d) ? ((d.children && me.opacityDrop) ? APBoard.OPACITY_HIGH : APBoard.OPACITY_MEDIUM) : 0)
					.attr("pointer-events", d => arcVisible(d) ? "auto" : "none")

					.attr("d", d => arc(d))
					.style("cursor", "pointer")
					.on("click", me.nodeClicked);

				path.append("title")
					.text(d => me.getTitle(d))
					;

				var ePath = g.append("g")
					.selectAll("path")
					.data(this.state.rootNode.descendants().slice(1))
					.join("path")
					.attr("fill", d => {
						var eColour = me.getErrorColour(d);
						return eColour.length ? eColour : me.state.colourise(d);
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
					.data(this.state.rootNode.descendants().slice(1))
					.join("text")
					.attr("dy", "0.35em")
					//					.attr("fill-opacity", 1)
					.attr("fill-opacity", d => +sbLabel(d, d))
					.attr("transform", d => labelTransform(d))

					.attr("text-anchor", d => labelAnchor(d))
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


				var rootEl = document.getElementById("surface_" + this.state.board.id);
				var viewWidth = rootEl.getBoundingClientRect().width;
				var colWidth = (viewWidth / (this.state.rootNode.height || 1))
				var colMargin = 100

				var tree = d3.tree()
					.nodeSize([rowHeight, colWidth])
					.separation(function (a, b) {
						return (a.parent === b.parent ? 1 : 1);
					}
					);

				tree(this.state.rootNode);

				var smallestY = 0;
				var biggestY = 0;
				this.state.rootNode.descendants().slice(1).forEach((d) => {
					if (d.x < smallestY) smallestY = d.x
					if (d.x > biggestY) biggestY = d.x
				})
				var viewBox = [viewWidth, (biggestY - smallestY) + rowHeight]
				svg.attr('width', viewBox[0] + (rowHeight / 2))
				svg.attr("height", viewBox[1] + rowHeight)
				svg.attr('viewBox', (colWidth - (rowHeight / 2)).toString() + ' ' + (smallestY - rowHeight) + ' ' + viewBox[0] + ' ' + (viewBox[1] + rowHeight))
				rootEl.setAttribute('width', viewBox[0]);
				rootEl.setAttribute('height', viewBox[1]);
				svg.attr('preserveAspectRatio', 'none');

				var nodes = svg.selectAll("g")
					.data(this.state.rootNode.descendants().slice(1))
					.enter()

				var me = this;

				nodes.each(function (d) {
					d.colMargin = colMargin;
					d.colWidth = colWidth - colMargin;
					d.rowHeight = rowHeight;
				})

				this.addPortals(me, nodes);

				nodes.append("clipPath")
					.attr("id", function (d, idx) { d.idx = idx; return "clip_" + idx })
					.append("rect").attr("id", function (d) { return "rect_" + d.depth + '_' + d.data.id })
					.attr("x", function (d) { return d.y })
					.attr("y", function (d) { return d.x - (d.rowHeight / 2) })
					.attr("width", function (d) { return d.colWidth })
					.attr("height", rowHeight)

				//Draw the first time so that we can get the sizes of things.
				//THe paths routine needs this info, but the side effect is that the bar that is
				//drawn obliterates the text. We redraw below......
				nodes.append("text")
					.attr("clip-path", function (d, idx) { return "url(#clip_" + idx + ")" })
					.text(d => me.getLabel(d))
					.attr("height", rowHeight)
					.attr("id", function (d) {
						return "text_" + d.depth + '_' + d.data.id
					})
					.attr("x", function (d) { return d.y + (d.rowHeight / 16) })
					.attr("y", function (d) { return d.x + (d.rowHeight / 8) })

				this.bars(nodes)
				this.paths(nodes)


				//Draw it twice so we can put it on top of the line
				nodes.selectAll("text").remove()
				nodes.each(function (p, idx, nodeArray) {
					var node = d3.select(this);
					node.append("text")
						.attr("clip-path", function (d) { return "url(#clip_" + d.idx + ")" })
						.text(d => me.getLabel(d))
						.attr("height", rowHeight - 12)
						.attr("id", function (d) {
							return "text_" + d.depth + '_' + d.data.id
						})
						.on('click', me.nodeClicked)
						.style("text-anchor", "start")
						.attr("x", function (d) { return d.y + (d.rowHeight / 16) })
						.attr("y", function (d) { return d.x + (d.rowHeight / 8) })
						.style('cursor', 'pointer')
						.append("title")
						.text(d => me.getTitle(d));
				})
				break;
			}
		}


	}
	getLabel = (d) => {
		switch (this.state.mode) {
			case 'sunburst': {
				return d.data.id === "root" ? "" : ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : "") + d.data.id
			}

			default:
			case 'tree':
			case 'timeline':
			case 'partition': {
				return d.data.id === "root" ? "" : ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : "") + d.data.title
			}
		}
	}

	getTitle = (d) => {
		switch (this.state.sortType) {
			case 'plannedStart': {
				return d.data.id === "root" ? "" : (d.data.title + " (" + shortDate(d.data.plannedStart) + ")")
			}
			case 'plannedStart': {
				return d.data.id === "root" ? "" : (d.data.title + " (" + shortDate(d.data.plannedFinish) + ")")
			}
			case 'score': {
				return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.scoring.scoreTotal + ")")
			}
			case 'context': {
				return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.board.title + ")")
			}
			case 'a_user': {
				return d.data.id === "root" ? "" : (d.data.title + " (" + (d.data.assignedUsers && d.data.assignedUsers.length ? d.data.assignedUsers[0].fullName : "No User") + ")")
			}
			case 'r_size':
			case 'size': {
				return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.size + "/" + d.value + ")")
			}
			default: {
				//Fall out and try something else - usally if set to 'none'
			}
		}

		/** If we don't get it on the sortType, use the colouring type next. Usually means sortType is 'size' */
		switch (this.state.colouring) {
			case 'state': {
				return (d.data.id === "root") ? "" :
					(d.data.lane.cardStatus === 'finished') ? ('Finished ' + shortDate(d.data.actualFinish)) :
						(d.data.lane.cardStatus === 'started') ? ('Started ' + shortDate(d.data.actualStart)) :
							"Not Started"
			}
			case 'context': {
				return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.board.title + ")")
			}
			case 'type': {
				return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.type.title + ")")
			}
			case 'l_user': {
				return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.updatedBy.fullName + ")")
			}
			case 'c_user': {
				return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.createdBy.fullName + ")")
			}
		}
		return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.size + "/" + d.value + ")")
	}

	bars = (nodes) => {
		var me = this;


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

		nodes.each(function (d, idx, nodeArray) {
			var node = d3.select(this);
			var opacity = me.opacityDrop ? APBoard.OPACITY_HIGH : APBoard.OPACITY_MEDIUM;
			var colour = me.state.colourise(d);
			var rEl = document.getElementById("rect_" + d.depth + '_' + d.data.id)
			var tEl = document.getElementById("text_" + d.depth + '_' + d.data.id)

			var myWidth = (navigator.userAgent.indexOf("Firefox") >= 0) ?
				d3.min([d.colWidth, Number(rEl.attributes["width"].value)]) :
				d3.min([tEl.getClientRects()[0].width, rEl.getClientRects()[0].width])

			var eColour = me.getErrorColour(d);

			var g = node.append("g")

			g.append("line")
				.attr("id", function (d) { return "line_" + d.parent.data.id + '_' + d.data.id })
				.attr("stroke-width", d => d.rowHeight - 2)
				.attr("stroke", colour)
				.attr("opacity", function (d) { return opacity * d.opacity })

				.on('click', me.nodeClicked)
				.attr("x1", function (d) {
					return d.y
				})
				.attr("y1", function (d) {
					return d.x
				})
				.attr("x2", function (d) {
					return (d.y + (d.children ? (d.colWidth) : myWidth))
				})
				.attr("y2", function (d) {
					return d.x
				})

			if (eColour.length) {
				g.append("line")
					.attr("stroke-width", 3)
					.attr("stroke", eColour)
					.attr("opacity", opacity)

					.on('click', me.nodeClicked)
					.attr("x1", function (d) {
						return d.y
					})
					.attr("y1", function (d) {
						return d.x + (d.rowHeight / 2)
					})
					.attr("x2", function (d) {
						return (d.y + (d.children ? (d.colWidth) : myWidth))
					})
					.attr("y2", function (d) {
						return d.x + (d.rowHeight / 2)
					})
					.append("title").text(d => me.getErrorMessage(d))
			}

			//Start semi-circle
			g.append("path")
				.attr("d", function (d) {
					return describeArc(d.y
						, d.x, (d.rowHeight - 2) / 2, 180, 0)

				})
				.attr("opacity", function (d) { return opacity * d.opacity })
				.attr("fill", colour)

			//End semi-circle

			g.append("path")
				.attr("d", function (d) {
					var endpoint = (d.y + (d.children ? (d.colWidth) : myWidth))
					return describeArc(endpoint, d.x, (d.rowHeight - 2) / 2, 0, 180)

				})
				.attr("opacity", function (d) { return opacity * d.opacity })
				.attr("fill", colour)
				.append("title").text(d => me.getErrorMessage(d))
		})
	}

	paths = (nodes) => {
		nodes.each(function (d, idx, nodeArray) {
			var node = d3.select(this);
			var pWidth = 0;

			var pEl = document.getElementById("rect_" + d.parent.depth + '_' + d.parent.data.id);
			if (Boolean(pEl)) pWidth = (navigator.userAgent.indexOf("Firefox") >= 0) ?
				Number(pEl.attributes["width"].value) :
				pEl.getClientRects()[0].width

			node.append("path")
				.attr("id", function (d) { return "path_" + d.parent.data.id + '_' + d.data.id })
				.attr("class", function (d) { return "local--link"; })
				.attr("d", function (d) {
					var startPointH = d.parent.y + pWidth + (d.rowHeight / 2);
					var startApex = (d.y - (d.parent.y + pWidth)) / 2
					var startPointV = d.parent.x;
					var endPointH = d.y - (d.rowHeight / 2);
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
			if (newMode === 'timeline') {
				return { mode: newMode, sortType: 'count' }
			}
			if ((prev.sortType === "title") && (newMode === 'sunburst')) {
				return { mode: newMode, sortType: 'count' }
			}
			else if ((prev.sortType === "count") && (newMode === 'tree')) {
				return { mode: newMode, sortType: 'size' }
			}
			return { mode: newMode }
		});
		if (this.props.modeChange) this.props.modeChange(newMode);
	}

	sortChange = (e) => {
		var value = e.target.value;
		this.setState({ sortType: value });
		if (this.props.sortChange) this.props.sortChange(value);

	}

	sortDirChange = (e) => {
		var value = e.target.value;
		this.setState({ sortDir: value });
		if (this.props.sortDirChange) this.props.sortDirChange(value);
	}

	errorChange = (e) => {
		var value = e.target.value;
		this.setState({ showErrors: value });
		if (this.props.errorChange) this.props.errorChange(value);
	}

	groupChange = (e) => {
		var value = e.target.value;
		this.setState({ grouping: value });
		if (this.props.groupChange) this.props.groupChange(value);
	}

	colourChange = (e) => {
		var value = e.target.value;
		this.setColouring({ colouring: value })
		this.setState({ colouring: value });
		if (this.props.colourChange) this.props.colourChange(value);
	}

	render() {
		if (!this.state.fetchActive) {
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
						{this.state.mode === 'timeline' ?
							<TimeLineApp
								data={this.state.rootNode ? this.state.rootNode : []}
								end={this.dateRangeEnd}
								start={this.dateRangeStart}
								colourise={this.state.colourise}
								errorColour={this.getErrorColour}
							/> : null}
						<svg id={"svg_" + this.state.board.id} />
					</div>


					<Drawer

						onClose={this.closeDrawer}
						open={Boolean(this.state.drawerOpen)}
						anchor='left'
						sx={{
							width: this.state.drawerWidth,
							flexShrink: 0,
							[`& .MuiDrawer-paper`]: { width: this.state.drawerWidth, boxSizing: 'border-box' },
						}}
					>
						<Box>
							<Grid container direction="column">
								<Grid item>
									<Grid container direction="row">
										<Grid xs={6} item>
											<Button
												aria-label="Open As New Tab"
												onClick={this.openAsActive}
												endIcon={<OpenInNew />}
											>
												Open Copy
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
													value={this.state.mode}
													onChange={this.modeChange}
													label="Mode"
												>
													<MenuItem value="tree">Tree</MenuItem>
													<MenuItem value="sunburst">Sunburst</MenuItem>
													<MenuItem value="partition">Partition</MenuItem>
													<MenuItem value="timeline">Timeline</MenuItem>
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
													<MenuItem value="none">None</MenuItem>
													<MenuItem value="plannedStart">Planned Start</MenuItem>
													<MenuItem value="plannedFinish">Planned End</MenuItem>
													<MenuItem value="size">Size</MenuItem>
													<MenuItem value="r_size">Size Rollup</MenuItem>
													{this.state.mode === 'sunburst' ? null : <MenuItem value="title">Title</MenuItem>}
													<MenuItem value="score">Score Total</MenuItem>
													{this.state.mode === 'tree' ? null : <MenuItem value="count">Card Count</MenuItem>}

													<MenuItem value="id">ID#</MenuItem>
												</Select>
											</FormControl>
										</Grid>
										<Grid item >
											<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
												<InputLabel>Sort Direction</InputLabel>
												<Select
													value={this.state.sortDir}
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
													<MenuItem value="state">Card State</MenuItem>
													<MenuItem value="l_user">Last Updater</MenuItem>
													<MenuItem value="c_user">Creator</MenuItem>
													<MenuItem value="a_user">First Assignee</MenuItem>
													<MenuItem value="context">Context</MenuItem>
												</Select>
											</FormControl>
										</Grid>
										{this.state.mode === 'timeline' ? (
											<Grid item>
												<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
													<InputLabel>Group By</InputLabel>
													<Select
														value={this.state.grouping}
														onChange={this.groupChange}
														label="Grouping"
													>
														<MenuItem value="level">Level</MenuItem>
														<MenuItem value="context">Context</MenuItem>
														<MenuItem value="type">Card Type</MenuItem>
													</Select>
												</FormControl>
											</Grid>
										) : null}
										<Grid item>
											<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
												<InputLabel>Error Bars</InputLabel>
												<Select
													value={this.state.showErrors}
													onChange={this.errorChange}
													label="Errors"
												>
													<MenuItem value="on">On</MenuItem>
													<MenuItem value="off">Off</MenuItem>
												</Select>
											</FormControl>
										</Grid>
									</Grid>
								</Grid>

							</Grid>
						</Box>
					</Drawer>
				</Stack >
			)
		}
		else return (
			<div>
				loading
			</div>
		);
	}

	getTopLevel = async () => {

		var me = this;
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
				for (var i = 0; i < cards.length; i++) {
					var cParams = {
						host: this.props.host,
						mode: "GET",
						url: "/card/" + cards[i].id
					}
					var cResponse = await doRequest(cParams)
					var cResult = await cResponse.json()
					this.root.children.push(cResult)
					if (this.state.depth > 0) this.childrenOf(params.host, [cResult], this.state.depth)
					else this.setData()
				}
			}
		} catch (error) {
			console.log("Caught error: ", error)
		}
		return null;
	}

	childrenOf = (host, cards, depth) => {

		var me = this;
		for (var i = 0; i < cards.length; i++) {
			getCardHierarchy(host, cards[i], 'children', depth)
			me.setData()
		}
		//		forEach(cards, (card, idx) => {
		//			getCardHierarchy(host, card, 'children', depth)

		// me.setState((prev) => { return { pending: prev.pending + 1, total: prev.total + 1 } })
		// getCardChildren(host, card).then(async (result) => {
		// 	me.setState((prev) => { return { pending: prev.pending - 1 } })
		// 	var children = await result.json()
		// 	if (children) {
		// 		if (!Boolean(card.children)) card.children = [];
		// 		forEach(children.cards, (cd) => {
		// 			//Remove from top list if they are a child of something
		// 			me.root.children = _.reject(me.root.children, function (rootChild) {
		// 				return rootChild.id === cd.id
		// 			})
		// 			me.setState((prev) => { return { pending: prev.pending + 1, total: prev.total + 1 } })
		// 			getCard(host, cd).then(async (realResult) => {
		// 				var realCard = await realResult.json();
		// 				if (realCard) {
		// 					me.setState((prev) => { return { pending: prev.pending - 1 } })
		// 					//Tag a single parent for the 'hierarchy'
		// 					realCard.parent = card.id
		// 					card.children.push(realCard);
		// 					me.setData();
		// 					if (depth < this.state.depth) this.childrenOf(host, [realCard], depth + 1)
		// 				}
		// 			})

		// 		})

		// 	}
		// 	this.setData()
		// }, this)
		//		})
	}
	setData = () => {
		function setChildIdx(item) {
			item.children && item.children.forEach((child, idx) => {
				child.parent = item;
				child.colour = idx;
				setChildIdx(child);
			})
		}

		function collect(array, result) {
			array.forEach(function (el) {
				if (el.children) {
					collect(el.children, result);
				}
				result.push(el);

			});
		}
		function filterRootItems(root) {
			var items = []
			collect(root.children, items)
			console.log("flatted: ", items)
			return items
		}
		if (this.root) {
			setChildIdx(this.root)
			filterRootItems(this.root)
		}

		//this.setColouring({ colouring: this.state.colouring })
		this.setState({ rootNode: d3.hierarchy(this.root) })
	}


	componentDidMount = () => {
		if (this.state.fetchActive) {
			this.setData()
			this.update()
			this.setState({ fetchActive: false })
		}

		this.setColouring({ colouring: this.state.colouring })
		window.addEventListener('resize', this.resize);
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
				this.setState({ mode: e.target.getAttribute('value') })
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
		as += "&mode=" + this.state.mode
		as += "&dir=" + this.state.sortDir
		as += "&colour=" + this.state.colouring
		as += "&depth=" + this.state.depth
		as += "&eb=" + this.state.showErrors

		document.open("/nui/context/" + this.state.board.id + as, "", "noopener=true")
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

export default APBoard