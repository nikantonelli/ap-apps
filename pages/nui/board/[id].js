import { Autocomplete, Chip, Drawer, Grid, Menu, MenuItem, Popover, Popper, Stack, TextField, ThemeProvider } from "@mui/material";
import * as d3 from 'd3';
import { forEach } from "lodash";
import BoardService from "../../../services/BoardService";
import DataProvider from "../../../utils/DataProvider";

import { FilterAlt, HighlightOff, OpenInBrowser } from "@mui/icons-material";
import React, { createRef } from "react";
import { APHoverCard } from "../../../Components/APHoverCard";
import { doRequest, getCardChildren } from "../../../utils/Sdk";
import { useTheme } from "@emotion/react";

export class Board extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			tileType: 'sunburst',
			anchorEl: null,
			cardData:
			{
				id: 'root',
				children: null,
				savedChildren: null
			},
			allData: null,
			drawerOpen: false,
			menuOpen: false,
			board: this.props.board,
			fetchActive: true,
			active: props.active,
			drawerWidth: 400,
			depth: this.props.depth || 0,
			pending: 0,
			total: 0,
			topLevelList: [],
			popUp: null
		}
	}
	popUp = null
	portals = [];
	root = {
		id: 'root',
		children: []
	};
	tileType = 'sunburst'

	closePopUp = () => {
		this.popUp = null
		this.setState({ popUp: null })
	}

	calcTreeData = (mtr) => {
		mtr.leaves(function (d) {
			d.value = d.data.size || 1;
		})
	}

	update = () => {
		this.portals = [];
		var svgEl = document.getElementById("svg_" + this.state.board.id)
		var svg = d3.select(svgEl);
		svgEl.replaceChildren()

		var dataTree = d3.hierarchy(this.state.cardData)

		switch (this.tileType) {
			case 'tree': {

				var levelWidth = [1];
				var childCount = function (level, n) {
					if (n.children && n.children.length > 0) {
						if (levelWidth.length <= level + 1) levelWidth.push(0);
						levelWidth[level + 1] += n.children.length;
						n.children.forEach(function (d) {
							childCount(level + 1, d);
						});
					}
				};

				var rowHeight = 40;

				childCount(0, dataTree);
				var treeBoxHeight = d3.max(levelWidth) * rowHeight;
				var rootEl = document.getElementById("surface_" + this.state.board.id)

				var viewBoxSize = [rootEl.getBoundingClientRect().width, treeBoxHeight]
				var colWidth = (viewBoxSize[0] / (dataTree.height || 1))


				svg.attr('width', viewBoxSize[0])
				svg.attr("height", viewBoxSize[1])
				svg.attr('viewBox', colWidth + ' 0 ' + (viewBoxSize[0]) + ' ' + viewBoxSize[1])
				rootEl.setAttribute('width', viewBoxSize[0]);
				rootEl.setAttribute('height', viewBoxSize[1]);
				svg.attr('preserveAspectRatio', 'none');
				svg.attr('class', 'rootSurface')
				var tree = d3.tree()
					.size([viewBoxSize[1], viewBoxSize[0]])
					.separation(function (a, b) {
						return (a.parent === b.parent ? 1 : 1); //All leaves equi-distant
					}
					);

				var mtr = tree(dataTree);
				this.calcTreeData(mtr);

				var nodes = svg.selectAll(".node")
					.data(mtr.descendants().slice(1))
					.enter()

				var me = this;
				nodes.each(function (d) {
					d.colMargin = 80;
					d.colWidth = colWidth - d.colMargin;
					d.rowHeight = rowHeight;
					var parents = d.parent.depth > 0 ? [d.parent.data] : null
					var children = []
					d.children?.forEach((child) => {
						children.push(child.data)
					})
					var analysisData = {
						calculatedSize: d.value
					}
					me.portals.push(

						<Drawer
							onClose={me.closePopUp}
							key={d.data.id + "-" + d.parent?.data.id + "-" + d.depth}
							open={me.popUp === d.data.id}
						>
							<div>
								<APHoverCard
									analysis={analysisData}
									descendants={children}
									parents={parents}
									cardProps={{ maxWidth: 650 }}
									loadSource={d.depth < 2 ? 'board' : 'card'}
									host={me.props.host} card={d.data}
									context={me.state.context}
									onClose={me.closePopUp}
								/>
							</div>
						</Drawer>

					)
				})

				nodes.append("clipPath")
					.attr("id", function (d, idx) { return "clip_" + d.parent.data.id + "_" + d.data.id + '_' + idx })
					.append("rect").attr("id", function (d) { return "rect_" + d.parent.data.id + '_' + d.data.id })
					.attr("y", function (d) { return d.x - (d.rowHeight / 2) })
					.attr("x", function (d) { return d.y })
					.attr("width", function (d) { return d.colWidth })
					.attr("height", 30)

				var nodeGroups = nodes.append('g')
					.attr("id", function (d) {
						return "g_" + d.data.id
					})

				nodeGroups.append("text")
					.attr("clip-path", function (d, idx) { return "url(#clip_" + d.parent.data.id + "_" + d.data.id + '_' + idx + ")" })
					.text(function (d) { return d.data.title + ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : ""); })
					.on('click', this.nodeClicked)
					.attr('class', "idText")
					.attr("height", rowHeight - 10)
					.attr("id", function (d) {
						return "text_" + d.data.id
					})
					.style("text-anchor", "start")
					.attr("x", function (d) { return d.y })
					.attr("y", function (d) { return d.x })
					.style('cursor', 'pointer')

				this.paths(svg, nodes)
				break;
			}
			case 'timeline': {
				break;
			}
			case 'sunburst': {
				var root = partition(dataTree);
				root.each(d => d.current = d);
				var rootPairs = root.links()
				rootPairs.forEach((pair, idx) => {
					pair.source.index = idx;
				})
				var ringWidth = 100;
				var width = root.height * ringWidth;
				var rootEl = document.getElementById("surface_" + this.state.board.id)
				width = _.min([width, rootEl.getBoundingClientRect().width / 2])
				svg.attr('viewBox', [0, 0, width * 2, width * 2])
				svg.attr("height", width * 2)
				const g = svg.append("g")
					.attr("transform", `translate(${width},${width})`);
				var color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, root.children?.length))
				var format = d3.format(",d");
				var arc = d3.arc()
					.startAngle(d => d.x0)
					.endAngle(d => d.x1)
					.padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
					.padRadius((width / 3) * 1.5)
					.innerRadius(d => d.y0 * (width / 3))
					.outerRadius(d => Math.max(d.y0 * (width / 3), d.y1 * (width / 3) - 1))
				var path = g.append("g")
					.selectAll("path")
					.data(root.descendants().slice(1))
					.join("path")
					.attr("fill", d => {
						while (d.depth > 1)
							d = d.parent;
						return color(d.index);
					})
					.attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
					.attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")

					.attr("d", d => arc(d.current));
				path.filter(d => d.children)
					.style("cursor", "pointer")
					.on("click", clicked);

				path.append("title")
					.text(d => {
						return d.data.data.title + " : " + d.data.data.size;
					})

				const label = g.append("g")
					.attr("pointer-events", "none")
					.attr("text-anchor", "middle")
					.style("user-select", "none")
					.selectAll("text")
					.data(root.descendants().slice(1))
					.join("text")
					.attr("dy", "0.35em")
					//					.attr("fill-opacity", 1)
					.attr("fill-opacity", d => +labelVisible(d.current))
					.attr("transform", d => labelTransform(d.current))
					.text(d => d.data.data.id);

				const parent = g.append("circle")
					.datum(root)
					.attr("r", (width / 3))
					.attr("fill", "#888")
					.attr("pointer-events", "all")
					.on("click", clicked)

				const parentLabel = g.append("text")
					.datum(root)
					.text(d =>
						d.data.data.id)
						
					.attr("text-anchor", "middle");


				function partition(data) {
					const root = d3.hierarchy(data)
						.sum(d => {
							return Boolean(d.data.size) ? d.data.size : 1
						})
						.sort((a, b) => b.value - a.value);
					return d3.partition()
						.size([2 * Math.PI, root.height + 1])
						(root);
				}

				function clicked(event, p) {
					parent.datum(p.parent || root);
					parentLabel.datum(p).text(d =>
						d.data.data.id);

					root.each(d => d.target = {
						x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
						x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
						y0: Math.max(0, d.y0 - p.depth),
						y1: Math.max(0, d.y1 - p.depth)
					});

					const t = g.transition().duration(750);

					// Transition the data on all arcs, even the ones that aren’t visible,
					// so that if this transition is interrupted, entering arcs will start
					// the next transition from the desired position.
					path.transition(t)
						.tween("data", d => {
							const i = d3.interpolate(d.current, d.target);
							return t => d.current = i(t);
						})
						.filter(function (d) {
							return +this.getAttribute("fill-opacity") || arcVisible(d.target);
						})
						.attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
						.attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none")

						.attrTween("d", d => () => arc(d.current));

					label.filter(function (d) {
						return +this.getAttribute("fill-opacity") || labelVisible(d.target);
					}).transition(t)
						.attr("fill-opacity", d => +labelVisible(d.target))
						.attrTween("transform", d => () => labelTransform(d.current));
				}

				function arcVisible(d) {
					return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
				}

				function labelVisible(d) {
					return d.y1 <= 3 && d.y0 >= 1 && ((d.y1 - d.y0) * (d.x1 - d.x0)) > 0.06;
				}

				function labelTransform(d) {
					const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
					const y = (d.y0 + d.y1) / 2 * (width / 3);
					return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
				}
			}
		}
	}

	paths = (svg, nodes) => {
		nodes.each(node => {
			var links = svg.selectAll(".link")
				.data(node)
				.enter()
			links.append("line")
				.attr("id", function (d) { return "line_" + d.parent.data.id + '_' + d.data.id })
				.attr("class", function (d) { return ((d.parent.data.id == 'root') && !d.children) ? "invisible--link" : "local--link" })
				.attr("x1", function (d) {
					return d.y
				})
				.attr("y1", function (d) {
					return d.x + 2
				})
				.attr("x2", function (d) {
					var rEl = document.getElementById("rect_" + d.parent.data.id + '_' + d.data.id)
					var tEl = document.getElementById("text_" + d.data.id)

					var width = d3.min([tEl.getClientRects()[0].width, rEl.getClientRects()[0].width])
					return d.y + (d.children ? (d.colWidth) : width)
				})
				.attr("y2", function (d) {
					return d.x + 2
				})
			if (node.parent.data.id == "root") return;

			links.append("path")
				.attr("id", function (d) { return "path_" + d.parent.data.id + '_' + d.data.id })
				.attr("class", function (d) { return "local--link"; })
				.attr("d", function (d) {
					var tEl = document.getElementById("rect_" + d.parent.data.id + '_' + d.data.id)
					var width = tEl.getClientRects()[0].width
					var startPointH = d.parent.y + width;
					var startApex = (d.y - (d.parent.y + width)) / 2
					var startPointV = d.parent.x + 2;
					var endPointH = d.y;
					var endPointV = d.x + 2;

					var string = "M" + startPointH + "," + startPointV +
						"C" + (startPointH + (startApex)) + "," + (startPointV) + " " +
						(endPointH - (startApex)) + "," + endPointV + " " +
						endPointH + "," + endPointV;
					return string
				});

		})
	}

	shouldComponentUpdate() {
		if (!this.state.fetchActive) this.update()
		return true;
	}

	render() {
		if (!this.state.fetchActive) {
			return (
				<Stack id="portalContainer">
					{this.portals}
					<Grid alignItems={'center'} alignContent={'center'} container direction={'row'}>
						<Grid item>
							<FilterAlt fontSize="large" onClick={this.openDrawer} />
						</Grid>
						<Grid item>
							<Chip label={this.state.board.title} onClick={this.enableMenu} />
						</Grid>
						<Grid item className="last-column">
							{this.state.pending ?
								<Chip label={"Queued: " + this.state.pending} />
								: <Chip label={"Total loaded: " + this.state.total}></Chip>}
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
						<MenuItem value='tree' onClick={this.closeMenu}>Tree</MenuItem>
						<MenuItem value='sunburst' onClick={this.closeMenu}>Sunburst</MenuItem>
						<MenuItem value='expand' onClick={this.closeMenu}>Expand All</MenuItem>
						{(this.state.active && this.state.active.length) ?
							<MenuItem value='reloadAll' onClick={this.closeMenu}>Reload All</MenuItem>
							: null
						}
					</Menu>

					<div id={"surface_" + this.state.board.id} >
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
							<Grid sx={{ margin: "5px" }} item>
								<HighlightOff onClick={this.closeDrawer} />
								<OpenInBrowser onClick={this.openAsActive} />
							</Grid>

							<Grid item>
								{this.topLevelList()}
							</Grid>
						</Grid>
					</Drawer>
				</Stack>
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
			body: JSON.stringify({ "board": this.state.board.id, "only": ["id"] })
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
			var cardList = '{ "cards" : ['
			if (cards?.length) {
				cards.forEach(async (card) => {

					var cParams = {
						host: this.props.host,
						mode: "GET",
						url: "/card/" + card.id
					}
					var cResponse = await doRequest(cParams)
					var cResult = await cResponse.json()
					this.root.children.push(cResult)

					if (this.state.depth > 0) this.childrenOf(params.host, [cResult], 1)
				})
			}
		} catch (error) {
			console.log("Caught error: ", error)
		}
		return null;
	}

	childrenOf = (host, cards, depth) => {
		if (cards.length == 0) this.setState({ cardData: this.root })
		forEach(cards, (card) => {
			this.setState((prev) => { return { pending: prev.pending + 1, total: prev.total + 1 } })
			getCardChildren(host, card).then(async (result) => {
				this.setState((prev) => { return { pending: prev.pending - 1 } })
				var children = await result.json()
				card.children = children.cards
				var ld = depth;
				if (ld < this.state.depth) this.childrenOf(host, card.children, ld + 1)
				else this.setState({ cardData: this.root })
			}, this)
		})
	}

	load = () => {
		this.getTopLevel().then(() => {
			var clonedData = JSON.parse(JSON.stringify(this.root))
			this.setState({ allData: clonedData })
			this.setState({ cardData: this.root })
		})
	}

	componentDidMount = () => {
		if (this.state.fetchActive) {
			this.setState({ fetchActive: false })
			this.load();
		}
	}

	hideCard = (e, d) => {
		// d.popperEl.style.visibility = 'hidden';
	}

	nodeClicked = (ev, d) => {
		if (ev.ctrlKey) {
			if (d.data.children && d.data.children.length) {
				d.data.savedChildren = _.union(d.data.children, d.data.savedChildren)
				d.data.children = [];
			}
			else if (d.data.savedChildren && d.data.savedChildren.length) {
				d.data.children = d.data.savedChildren;
				d.data.savedChildren = [];
			}
			this.setState((prev) => {
				return { cardData: prev.cardData }
			})
		}
		else if (ev.shiftKey) {
			document.open("/nui/card/" + d.data.id, "", "noopener=true")
		}
		else {
			this.popUp = d.data.id
			this.setState({ popUp: d.data.id })
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
				var data = this.state.cardData && this.state.cardData.children
				if (data) data.forEach((item) => { this.resetChildren(item) })
				break;
			}
			case 'tree':
			case 'sunburst': {
				this.tileType = e.target.getAttribute('value');
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
		}
		document.open("/nui/board/" + this.state.board.id + as, "", "noopener=true")
	}
	handleChangeMultiple = (evt, valueList) => {
		var root = { ...this.state.cardData };
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
		this.setState({ cardData: root, topLevelList: valueList })
	}

	topLevelList = () => {
		//Top level list is the children of root

		var cardList = null;
		if (this.state.allData) cardList = this.state.allData.children
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
	var board = await bs.get(params.id).then((result) => result.json())
	if (board) {
		var active = null;
		if (query.active) {
			active = query.active;
		}
		var depth = null;
		if (query.depth) {
			depth = query.depth;
		}
		else depth = 3	//Limit the exponential explosion of fetches as you go down the tree
		return { props: { board: board, active: active, depth: depth, host: req.headers.host } }
	}
	return { props: { board: null, active: null, host: req.headers.host } }
}
export default Board