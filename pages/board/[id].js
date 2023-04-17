import { Chip, Menu, MenuItem, Stack } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import BoardService from "../../services/BoardService"
import CardService from "../../services/CardService"
import * as d3 from 'd3';
import * as _ from 'lodash';
import { DataProvider } from "@/utils/DataProvider";


const Board = ({ board, root, host }) => {

	const svgRef = useRef();

	const [tileType, setTileType] = useState("tree");
	const [anchorEl, setAnchorEl] = useState(null);

	useEffect(() => {

		const svg = d3.select(svgRef.current);
		if (svgRef && svgRef.current) svgRef.current.replaceChildren()


		switch (tileType) {
			case 'tree': {
				var data = d3.hierarchy(root)

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
				console.log(viewBoxSize, colWidth)
				svg.attr('viewBox', colWidth + ' 0 ' + viewBoxSize[0] + ' ' + viewBoxSize[1])
				svg.attr('preserveAspectRatio', 'none');
				svg.attr('class', 'rootSurface')
				var tree = d3.tree()
					.size([viewBoxSize[1], viewBoxSize[0] + colWidth])
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
					.attr("id", function (d) { return "clip_" + d.parent.data.id + "_" + d.data.id + '_' + d.depth })
					.append("rect").attr("id", function (d) { return "rect_" + d.parent.data.id + '_' + d.data.id })
					.attr("y", function (d) { return d.x - (d.rowHeight / 2) })
					.attr("x", function (d) { return d.y })
					.attr("width", function (d) { return d.colWidth - d.colMargin })
					.attr("height", 30)

				nodes.append("text")
					.attr("clip-path", function (d) { return "url(#clip_" + d.parent.data.id + "_" + d.data.id + '_' + d.depth + ")" })
					.text(function (d) { return d.data.title; })
					.attr('class', "idText")
					.attr("height", rowHeight - 10)
					.attr("id", function (d) {
						return "text_" + d.data.id
					})
					.style("text-anchor", "start")
					.attr("x", function (d) { return d.y })
					.attr("y", function (d) { return d.x });

				paths(svg, nodes)

			}
		}

	})

	function paths(svg, nodes) {
		nodes.each(child => {
			console.log(child)
			var links = svg.selectAll(".link")
				.data(child)
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
			if (child.parent.data.id == "root") return;

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

						"C" + (startPointH + (d.colMargin / 2)) + "," + (startPointV) + " " +
						(endPointH - (d.colMargin / 2)) + "," + endPointV + " " +
						endPointH + "," + endPointV;
					return string
				});

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

			<div id={"surface_" + board.id} >
				<svg ref={svgRef} />
			</div>

		</Stack>
	)
	else return null;
}

async function getChildren(card) {
	var cs = new CardService();
	var result = await cs.getChildren(card.id);
	var children = [];
	if (result) {
		children = result;
		if (children) {
			for (var i = 0; i < children.length; i++) {
				children[i].children = await getChildren(children[i])
				children[i].parentId = card.id
			}
		}
	}
	return children;
}

export async function getServerSideProps({ req, params }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = DataProvider.get()
	}
	var bs = new BoardService(req.headers.host);
	var board = await bs.get(params.id).then((result) => result.json())
	if (board) {
		var cards = await bs.getCards(params.id)
		var root = {
			id: 'root',
			children: []
		}
		//Make a tree of the cards

		if (cards && cards.length) {
			//Drop mirrors as we will get these later
			var rootCards = _.filter(cards, function (crd) { return crd.isMirroredCard == false });
			for (var i = 0; i < cards.length; i++) {
				//Fix the fact that the AP API is rubbish.
				cards[i].parentId = "root"
				cards[i].board = {
					id: board.id
				}
				//The child card could already be on this board, so check and remove from root
				try {
					cards[i].children = await getChildren(cards[i])
					for (var j = 0; j < cards[i].children.length; j++) {
						rootCards = _.filter(rootCards, function (crd) { return crd.id != cards[i].children[j].id })
					}
				} catch (e) {
					console.log("Caught Error: ", e)
				}

			}
			root.children = rootCards
		}
		return { props: { board: board, root: root, host: req.headers.host } }
	}
	return { props: { board: null, root: null, host: req.headers.host } }
}
export default Board