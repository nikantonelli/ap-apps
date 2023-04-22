import { DataProvider } from "@/utils/DataProvider";
import { Autocomplete, Chip, Drawer, Grid, IconButton, Menu, MenuItem, Stack, TextField } from "@mui/material";
import * as d3 from 'd3';
import jsPDF from "jspdf";
import { forEach } from "lodash";
import BoardService from "../../services/BoardService";

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { EditNote } from "@mui/icons-material";
import React from "react";


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
			drawerWidth: 400
		}
	}

	root = {
		id: 'root',
		children: []
	}
	
	getTopLevel = async (host, params) => {
		
		try {
			var req = new Request("http://" + host + "/api" + params.url, { method: params.mode });
			var response = await fetch(req, { next: { revalidate: 30 } })
			var result = await response.json()
			var cards = result.cards
			this.root.children = cards
			if (this.state.active) {
				var activeCards = this.state.active.split(',')
				cards = _.filter(cards, function (child) {
					var result = (_.filter(activeCards, function (value) {
						var eqv = value === child.id;
						return eqv
					}))
					return (result.length > 0)
				})
			}
			this.childrenOf(host, cards)
		} catch (error) {
			console.log("Caught error: ", error)
		}
		return null;
	}

	childrenOf = (host, cards) => {
		if (cards.length == 0) this.setState({cardData: this.root})
		forEach(cards, (card) => {
			this.getChildren(host, card).then(async (result) => {
				var children = await result.json()
				card.children = children.cards
				this.childrenOf(host, card.children)
			})
		})
	}

	getChildren = (host, card) => {
		var params = {
			mode: "GET",
			url: "/card/" + card.id + "/connection/children?cardStatus=notStarted,started,finished",
		}
		var req = new Request("http://" + host + "/api" + params.url, { method: params.mode });
		var res = fetch(req, { next: { revalidate: 30 } })
		return res
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

				var colWidth = 400;
				var rowHeight = 50;

				childCount(0, data);
				var treeBoxHeight = d3.max(levelWidth) * rowHeight;
				var rootEl = document.getElementById("surface_" + this.state.board.id)

				var viewBoxSize = [rootEl.getBoundingClientRect().width, treeBoxHeight]
				colWidth = (colWidth > (viewBoxSize[0] / (data.height))) ? colWidth : (viewBoxSize[0] / (data.height)) 


				svg.attr('width', viewBoxSize[0])
				svg.attr("height", viewBoxSize[1])
				svg.attr('viewBox', colWidth + ' 0 ' + (viewBoxSize[0]) + ' ' + viewBoxSize[1])
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
					d.colWidth = colWidth;
					d.colMargin = colWidth/8;
					d.rowHeight = rowHeight;
				})

				nodes.append("clipPath")
					.attr("id", function (d, idx) { return "clip_" + d.parent.data.id + "_" + d.data.id + '_' + idx })
					.append("rect").attr("id", function (d) { return "rect_" + d.parent.data.id + '_' + d.data.id })
					.attr("y", function (d) { return d.x - (d.rowHeight / 2) })
					.attr("x", function (d) { return d.y })
					.attr("width", function (d) { return d.colWidth - d.colMargin })
					.attr("height", 30)

				var nodeGroups = nodes.append('g')

				nodeGroups.append("text")
					.attr("clip-path", function (d, idx) { return "url(#clip_" + d.parent.data.id + "_" + d.data.id + '_' + idx + ")" })
					.text(function (d) { return d.data.title; })
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
				.attr("class", function(d) {return ((d.parent.data.id == 'root') && !d.children)? "invisible--link": "local--link"})
				.attr("x1", function (d) {
					return d.y
				})
				.attr("y1", function (d) {
					return d.x + 2
				})
				.attr("x2", function (d) {
					var rEl = document.getElementById("rect_" + d.parent.data.id + '_' + d.data.id )
					var tEl = document.getElementById("text_" + d.data.id )

					var width = d3.min([tEl.getClientRects()[0].width, rEl.getClientRects()[0].width])
					return d.y + (d.children? (d.colWidth - d.colMargin) : width)
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
					var startPointV = d.parent.x + 2;
					var endPointH = d.y;
					var endPointV = d.x + 2;

					var string = "M" + startPointH + "," + startPointV +
						"C" + (d.parent.y + d.colWidth - (d.colMargin/2)) + "," + (startPointV) + " " +
						(endPointH - (d.colMargin/2)) + "," + endPointV + " " +
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
				<Grid container direction={'row'}>
					<EditNote fontSize='large' onClick={this.openDrawer} />
					<Chip label={this.state.board.title} onClick={this.enableMenu} />
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

					<ChevronLeftIcon onClick={this.closeDrawer} fontSize='large' />

					{this.topLevelList()}
				</Drawer>
			</Stack>
		)
		else return <div>loading</div>;
	}

	componentDidMount = () => {
		if (this.state.fetchActive) {
			this.setState({ fetchActive: false })
			var params = {
				parent: this.state.board.id,
				mode: "GET",
				url: "/board/cards/" + this.state.board.id
			}
			this.getTopLevel(this.props.host, params).then(() => {
				var clonedData = JSON.parse(JSON.stringify(this.root))
				this.setState({ allData: clonedData })
				this.setState({ cardData: this.root })
			})
		}
	}

	showCard = () => {

	}
	hideCard = () => {

	}

	nodeClicked = (ev, d) => {
		document.open("/card/" + d.data.id, "", "noopener=true")
	}


	enableMenu = (e) => {
		this.setState({ anchorEl: e.currentTarget })
	}

	closeMenu = async (e) => {
		var command = e.target.getAttribute('value');

		switch (command) {
			case 'tree':
			case 'analysis': {
				this.setState({tileType:e.target.getAttribute('value')})
				break;
			}

			case 'savePDF': {
				var doc = new jsPDF(
					{
						orientation: "l",
						unit: 'px',
						format: "a4",
						hotfixes: ["px_scaling"]
					}
				);
				var svg = document.getElementById("svg_" + this.state.board.id);
				var svgAsXml = new XMLSerializer().serializeToString(svg)
				await doc.addSvgAsImage(svgAsXml, 0, 0, svg.getBoundingClientRect().width, svg.getBoundingClientRect().height)
				doc.save(this.state.board.id + ".pdf")
			}
		}

		this.setState({anchorEl:null})
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
		if (root.savedChildren && (root.savedChildren.length > 0)) allChildren = allChildren.concat(root.savedChildren)
		if (valueList.length > 0) {
			root.children = _.filter(allChildren, function (child) {
				var result = (_.filter(valueList, function (value) {
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
		return { props: { board: board, active: active, host: req.headers.host } }
	}
	return { props: { board: null, active: null, host: req.headers.host } }
}
export default Board