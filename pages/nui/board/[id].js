import { DataProvider } from "@/utils/DataProvider";
import { Autocomplete, Chip, Drawer, Grid, IconButton, Menu, MenuItem, Stack, TextField, Typography } from "@mui/material";
import * as d3 from 'd3';
import { forEach } from "lodash";
import BoardService from "../../../services/BoardService";

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { EditNote, Filter, Filter1Outlined, FilterAlt, HighlightOff, Label } from "@mui/icons-material";
import React from "react";
import { doRequest, getCardChildren } from "@/utils/Sdk";


export class Board extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			tileType: 'tree',
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
			total: 0
		}
	}

	root = {
		id: 'root',
		children: []
	}

	getTopLevel = async (params) => {

		try {
			var response = await doRequest(params)
			var result = await response.json()
			var cards = result.cards
			this.root.children = cards
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
			if (this.state.depth > 0) this.childrenOf(params.host, cards, 1)
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


	update = () => {
		var svgEl = document.getElementById("svg_" + this.state.board.id)
		var svg = d3.select(svgEl);
		svgEl.replaceChildren()
		switch (this.state.tileType) {
			case 'tree': {
				var data = d3.hierarchy(this.state.cardData)

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

				var rowHeight = 30;

				childCount(0, data);
				var treeBoxHeight = d3.max(levelWidth) * rowHeight;
				var rootEl = document.getElementById("surface_" + this.state.board.id)

				var viewBoxSize = [rootEl.getBoundingClientRect().width, treeBoxHeight]
				var colWidth = (viewBoxSize[0] / (data.height || 1))


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

				var mtr = tree(data);

				var nodes = svg.selectAll(".node")
					.data(mtr.descendants().slice(1))
					.enter()

				nodes.each(function (d) {
					d.colMargin = 80;
					d.colWidth = colWidth - d.colMargin;
					d.rowHeight = rowHeight;
				})

				nodes.append("clipPath")
					.attr("id", function (d, idx) { return "clip_" + d.parent.data.id + "_" + d.data.id + '_' + idx })
					.append("rect").attr("id", function (d) { return "rect_" + d.parent.data.id + '_' + d.data.id })
					.attr("y", function (d) { return d.x - (d.rowHeight / 2) })
					.attr("x", function (d) { return d.y })
					.attr("width", function (d) { return d.colWidth })
					.attr("height", 30)

				var nodeGroups = nodes.append('g')

				nodeGroups.append("text")
					.attr("clip-path", function (d, idx) { return "url(#clip_" + d.parent.data.id + "_" + d.data.id + '_' + idx + ")" })
					.text(function (d) { return d.data.title + ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : ""); })
					.attr('class', "idText")
					.attr("height", rowHeight - 10)
					.attr("id", function (d) {
						return "text_" + d.data.id
					})
					.style("text-anchor", "start")
					.attr("x", function (d) { return d.y })
					.attr("y", function (d) { return d.x })
					.on('click', this.nodeClicked)
					.style('cursor', 'pointer')
					.on('mouseover', this.showCard)
					.on('mouseover', this.hideCard)

				nodeGroups.append('g')
					.attr("x", (d) => d.x)
					.attr("y", (d) => d.y)
					.html("<div style={width:80;height:80}>hello</text>")

				this.paths(svg, nodes)
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

	componentDidUpdate() {
		this.update()
	}

	render() {
		if (!this.state.fetchActive) return (
			<Stack>
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
					<MenuItem value='analysis' onClick={this.closeMenu}>Analysis</MenuItem>
					<MenuItem value='expand' onClick={this.closeMenu}>Expand All</MenuItem>
					{(this.state.active && this.state.active.length) ?
						<MenuItem value='reloadAll' onClick={this.closeMenu}>Reload All</MenuItem>
						: null
					}
				</Menu>

				<div style={{ margin: '5px' }} id={"surface_" + this.state.board.id} >
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
							<HighlightOff onClick={this.closeDrawer} />
						</Grid>
						<Grid item>
							{this.topLevelList()}
						</Grid>
					</Grid>
				</Drawer>
			</Stack>
		)
		else return <div>loading</div>;
	}

	load = () => {
		this.getTopLevel(
			{
				host: this.props.host,
				mode: "GET",
				url: "/board/cards/" + this.state.board.id
			}
		).then(() => {
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

	showCard = () => {

	}
	hideCard = () => {

	}

	nodeClicked = (ev, d) => {
		ev.preventDefault()
		ev.stopPropagation();
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
		} else {
			document.open("/nui/card/" + d.data.id, "", "noopener=true")
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
			case 'analysis': {
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
		this.setState({ cardData: root })
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
		globalThis.dataProvider = DataProvider.get()
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