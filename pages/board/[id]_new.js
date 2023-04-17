import { Chip, Menu, MenuItem, Stack } from "@mui/material";
import { useState } from "react";
import * as d3 from 'd3';

import filter from 'lodash';
import { DataProvider } from "@/utils/DataProvider";
import BoardService from "@/services/BoardService";

const Board = ({ id }) => {

	const [tileType, setTileType] = useState("tree");
	const [anchorEl, setAnchorEl] = useState(null);
	const [theTree, setTheTree] = useState({
		id: 'root',
		children: []
	});

	function drawTree() {
		const svg = document.getElementById("surface_" + board.id);
		if (svg) {
			svg.replaceChildren()

			switch (tileType) {
				case 'tree': {
					var data = d3.hierarchy(theTree)

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
					var rowHeight = 30;

					childCount(0, data);
					var treeBoxHeight = d3.max(levelWidth) * rowHeight;
					var rootEl = document.getElementById("surface_" + board.id)

					var viewBoxSize = [rootEl.getBoundingClientRect().width, treeBoxHeight]
					colWidth = (colWidth > (viewBoxSize[0] / (data.height - 1))) ? (viewBoxSize[0] / (data.height - 1)) : colWidth

					console.log(rootEl.getBoundingClientRect())

					svg.attr('width', viewBoxSize[0])
					svg.attr("height", viewBoxSize[1])
					svg.attr('viewBox', '0 0 ' + viewBoxSize[0] + ' ' + viewBoxSize[1])
					svg.attr('preserveAspectRatio', 'none');
					svg.attr('class', 'rootSurface')
					var _tree = d3.tree()
						.size([viewBoxSize[1], viewBoxSize[0] - colWidth])
						.separation(function (a, b) {
							return (a.parent === b.parent ? 1 : 1); //All leaves equi-distant
						}
						);

					var mtr = _tree(data);
					var children = mtr.children;

					var nodes = svg.selectAll(".node")
						.data(mtr.descendants().slice(1))
						.data(mtr.descendants())
						.enter()
						.append("g").attr("id", function (d) { return "g_" + d.data.id });

					nodes.append("clipPath")
						.attr("id", function (d) { return "clip_" + d.parent.data.id + "_" + d.data.id })
						.append("rect").attr("id", function (d) { return "rect_" + d.parent.data.id + d.data.id })
						.attr("y", function (d) { return d.x - 15 })
						.attr("x", function (d) { return d.y })
						.attr("width", colWidth - 50)
						.attr("height", 30)

					nodes.append("g").append("text")
						//.attr("clip-path", function (d) { return "url(#clip_" + d.parent.data.id + "_" + d.data.id + ")" })
						.text(function (d) { return d.data.title; })
						.attr('class', "idText")
						.attr("height", rowHeight - 10)
						.attr("id", function (d) {
							return "text_" + d.data.id
						})
						.style("text-anchor", "end")
						.attr("x", function (d) { return d.y })
						.attr("y", function (d) { return d.x });

					if (children) paths(svg, children);

				}
			}
		}
	}

	function paths(svg, children) {
		children.forEach(child => {
			if (child.children) {
				paths(svg, child.children)
				var links = svg.selectAll(".link")
					.data(child.children)
					.enter()
				links.append("path")
					.attr("class", function (d) { return (d.depth === 0) ? "invisible--link" : "local--link"; })
					.attr("d", function (d) {
						var tEl = document.getElementById("text_" + d.data.id)
						var width = tEl.getClientRects()[0].width
						var startPointH = d.y - (width * 0.75);
						var startPointV = d.x + 1;
						var endPointH = d.parent.y + 10;
						var endPointV = d.parent.x - 5;

						var string = "M" + startPointH + "," + startPointV +

							"C" + (startPointH - ((startPointH - endPointH) / 3)) + "," + (startPointV) + " " +
							(endPointH + ((startPointH - endPointH) / 3)) + "," + endPointV + " " +
							endPointH + "," + endPointV;
						return string
					});
				links.append("line")
					.attr("x1", function (d) {
						var tEl = document.getElementById("text_" + d.data.id)
						var width = tEl.getClientRects()[0].width
						return d.y - (width * 0.75)
					})
					.attr("y1", function (d) {
						return d.x + 1
					})
					.attr("x2", function (d) {
						return d.y
					})
					.attr("y2", function (d) {
						return d.x + 1
					})
					.attr("stroke-width", 1)
					.attr("stroke", "black")
			}
		})
	}

	function enableMenu(e) {
		setAnchorEl(e.currentTarget)
	}

	function closeMenu(e) {
		console.log(e.target)
		setTileType(e.target.getAttribute('value'))
		setAnchorEl(null)
	}

	const open = Boolean(anchorEl);

	if (board) return (
		<Stack>
			<Chip label={board.title} onClick={enableMenu} />
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
			<svg id={"surface_" + board.id} ref={svgRef} />
		</Stack>
	)
	else return null;
}

async function getChildren(card) {
	var params = {
		mode: "GET",
		url: "/card/" + card.id + "/connection/children?cardStatus=notStarted,started,finished",
	}
	result = await globalThis.dataProvider.xfr(params).then((result => result.json()))
	var children = [];
	if (result) {
		children = result;
		if (children) {
			for (var i = 0; i < children.length; i++) {
				children[i].children = getChildren(children[i])
				children[i].parentId = card.id
			}
		}
	}
	return children;
}

export async function getData(board) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = DataProvider.get()
	}

	var params = {
		url: "/board/" + board.id
	}
	board = await globalThis.dataProvider.xfr(params).then((result) => result.json())
	if (board) {
		var params = {
			mode: "GET",
			url: "/board/cards/" + id
		}
		var cards = await globalThis.dataProvider.xfr(params).then((result) => result.json())

		var root = {
			id: 'root',
			children: []
		}
		//Make a tree of the cards

		if (cards && cards.length) {
			//Drop mirrors as we will get these later
			var rootCards = filter(cards, function (crd) { return crd.isMirroredCard == false });
			for (var i = 0; i < cards.length; i++) {
				//Fix the fact that the AP API is rubbish.
				cards[i].parentId = "root"
				cards[i].board = {
					id: board.id
				}
				//The child card could already be on this board, so check and remove from root
				try {
					cards[i].children = getChildren(cards[i])
					for (var j = 0; j < cards[i].children.length; j++) {
						rootCards = filter(rootCards, function (crd) { return crd.id != cards[i].children[j].id })
					}
				} catch (e) {
					console.log("Caught Error: ", e)
				}

			}
			root.children = rootCards
		}
		return root;
	}
}

export async function getServerSideProps({ req, params }) {
	return { props: { id: params.id } }
}

export default Board