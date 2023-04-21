import { DataProvider } from "@/utils/DataProvider";
import { Autocomplete, Chip, Drawer, Grid, IconButton, Menu, MenuItem, Stack, TextField } from "@mui/material";
import * as d3 from 'd3';
import jsPDF from "jspdf";
import { forEach } from "lodash";
import { useEffect, useRef, useState } from "react";
import BoardService from "../../services/BoardService";

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { EditNote } from "@mui/icons-material";


const Board = ({ board, active, host }) => {

	const svgRef = useRef();

	const [tileType, setTileType] = useState("tree");
	const [anchorEl, setAnchorEl] = useState(null);

	const [cardData, setCardData] = useState({
		id: 'root',
		children: null,
		savedChildren: null
	})

	const [allData, setAllData] = useState(null)
	const [accessCount, setAccessCount] = useState(0)
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [timer, setTimer] = useState(null);

	async function getStuff(host, params) {
		try {
			var req = new Request("http://" + host + "/api" + params.url, { method: params.mode });
			var response = await fetch(req, { next: { revalidate: 30 } })
			var result = await response.json()
			var cards = result.cards
			if (active) {
				var activeCards = active.split(',')
				cards = _.filter(cards, function (child) {
					var result = (_.filter(activeCards, function (value) {
						var eqv = value === child.id;
						return eqv
					}))
					return (result.length > 0)
				})
			}
			return childrenOf(host, cards)
		} catch (error) {
			console.log("Caught error: ", error)
		}
		return null;
	}

	if (!timer) {
		setTimer(setTimeout(restartTimer, 1000))
	}

	function restartTimer() {
		setTimer(setTimeout(restartTimer, 1000))
	}

	async function childrenOf(host, cards) {
		forEach(cards, async (card) => {
			var res2 = await getChildren(host, card);
			var children = await res2.json()
			card.children = children.cards
			forEach(card.children, async (card) => {
				var res2 = await getChildren(host, card);
				var children = await res2.json()
				card.children = children.cards
			})
		})

		return cards;
	}
	async function getChildren(host, card) {
		var params = {
			mode: "GET",
			url: "/card/" + card.id + "/connection/children?cardStatus=notStarted,started,finished",
		}
		var req = new Request("http://" + host + "/api" + params.url, { method: params.mode });
		return await fetch(req, { next: { revalidate: 30 } })
	}

	useEffect(() => {

		if (cardData.children == null) {
			var params = {
				parent: board.id,
				mode: "GET",
				url: "/board/cards/" + board.id
			}
			var result = getStuff(host, params).then((cards) => {
				var root = {
					id: 'root',
					children: cards
				}
				//Keep a backup for the selector list
				var clonedData = JSON.parse(JSON.stringify(root))
				setAllData(clonedData)
				setCardData(root)
			})


		} else {
			const svg = d3.select(svgRef.current);
			if (svgRef && svgRef.current) svgRef.current.replaceChildren()


			switch (tileType) {
				case 'tree': {
					var data = d3.hierarchy(cardData)

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
					var rootEl = document.getElementById("surface_" + board.id)

					var viewBoxSize = [rootEl.getBoundingClientRect().width, treeBoxHeight]
					colWidth = (colWidth > (viewBoxSize[0] / (data.height))) ? (viewBoxSize[0] / (data.height)) : colWidth


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
						d.colMargin = 50;
						d.rowHeight = rowHeight;
					})

					nodes.append("clipPath")
						.attr("id", function (d, idx) { return "clip_" + d.parent.data.id + "_" + d.data.id + '_' + idx })
						.append("rect").attr("id", function (d) { return "rect_" + d.parent.data.id + '_' + d.data.id })
						.attr("y", function (d) { return d.x - (d.rowHeight / 2) })
						.attr("x", function (d) { return d.y })
						.attr("width", function (d) { return d.colWidth - d.colMargin })
						.attr("height", 30)

					nodes.append("text")
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
						.on('click', nodeClicked)
						.style('cursor', 'pointer')
						.on('mouseover', showCard)
						.on('mouseover', hideCard)

					paths(svg, nodes)

				}
			}
		}
	})

	function showCard() {

	}
	function hideCard() {

	}

	function nodeClicked(ev, d) {
		document.open("/card/" + d.data.id, "", "noopener=true")
	}

	function paths(svg, nodes) {
		nodes.each(node => {
			var links = svg.selectAll(".link")
				.data(node)
				.enter()
			links.append("line")
				.attr("id", function (d) { return "line_" + d.parent.data.id + '_' + d.data.id })
				.attr("class", function (d) { return d.children ? "local--link" : "invisible--link" })
				.attr("x1", function (d) {
					return d.y
				})
				.attr("y1", function (d) {
					return d.x + 2
				})
				.attr("x2", function (d) {
					return d.y + (d.colWidth - d.colMargin)
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
						"C" + (d.parent.y + d.colWidth + (d.colMargin)) + "," + (startPointV) + " " +
						(endPointH - (d.colMargin)) + "," + endPointV + " " +
						endPointH + "," + endPointV;
					return string
				});

		})
	}

	function enableMenu(e) {
		setAnchorEl(e.currentTarget)
	}

	async function closeMenu(e) {
		var command = e.target.getAttribute('value');

		switch (command) {
			case 'tree':
			case 'analysis': {
				setTileType(e.target.getAttribute('value'))
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
				var svg = document.getElementById("svg_" + board.id);
				var svgAsXml = new XMLSerializer().serializeToString(svg)
				await doc.addSvgAsImage(svgAsXml, 0, 0, svg.getBoundingClientRect().width, svg.getBoundingClientRect().height)
				doc.save(board.id + ".pdf")
			}
		}

		setAnchorEl(null)
	}

	const openDrawer = () => {
		setDrawerOpen(true)
	}

	const closeDrawer = () => {
		setDrawerOpen(false)
	}

	const [itemNames, setItemNames] = useState([])

	const handleChangeMultiple = (evt, valueList) => {
		var root = { ...cardData };
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
		setCardData(root)
		setItemNames(valueList);
	}

	const topLevelList = () => {
		//Top level list is the children of root

		var cardList = null;
		if (allData) cardList = allData.children
		return (cardList && cardList.length) ? (
			<Autocomplete
				freeSolo
				multiple
				id="root-child-selector"
				disableClearable
				onChange={handleChangeMultiple}
				options={cardList}
				getOptionLabel={(option) => option.title}
				renderInput={(params) => (
					<TextField
						{...params}
						label="Search cards"
						InputProps={{
							...params.InputProps,
							type: 'search',
						}}
					/>
				)}
			/>

		) : null

	}

	const open = Boolean(anchorEl);

	const drawerWidth = 400;



	if (board) return (
		<Stack>
			<Grid container direction={'row'}>
				<EditNote fontSize='large' onClick={openDrawer} />
				<Chip label={board.title} onClick={enableMenu} />
			</Grid>

			<Menu
				open={open}
				anchorEl={anchorEl}
				onClose={closeMenu}
				anchorOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				<MenuItem value='tree' onClick={closeMenu}>Tree</MenuItem>
				<MenuItem value='analysis' onClick={closeMenu}>Analysis</MenuItem>
			</Menu>

			<div id={"surface_" + board.id} >
				<svg id={"svg_" + board.id} ref={svgRef} />
			</div>

			<Drawer
				variant='persistent'
				open={drawerOpen}
				anchor='left'
				sx={{
					width: drawerWidth,
					flexShrink: 0,
					[`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
				}}
			>

				<ChevronLeftIcon onClick={closeDrawer} fontSize='large' />

				{topLevelList()}
			</Drawer>
		</Stack>
	)
	else return null;
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