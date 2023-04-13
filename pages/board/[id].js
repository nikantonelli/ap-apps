import { Card, CardContent, CardHeader, Chip, Grid, Menu, MenuItem, Popover } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import BoardService from "../../services/BoardService"
import CardService from "../../services/CardService"
import * as d3 from 'd3';
import * as _ from 'lodash';
import { DataProvider } from "@/utils/DataProvider";


const Board = ({ board, root, host }) => {

	const svgRef = useRef();

	const [tileType, setTileType] = useState("analysis");
	const [anchorEl, setAnchorEl] = useState(null);

	useEffect(() => {

		const svg = d3.select(svgRef.current);
		if (svgRef && svgRef.current) svgRef.current.replaceChildren()
		var srf = document.getElementById("surface_" + board.id);
console.log(tileType)
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
				var rowHeight = 30;

				colWidth = (colWidth < (srf.clientWidth / data.height)) ? (srf.clientWidth / data.height) : colWidth

				childCount(0, data);
				var newHeight = d3.max(levelWidth) * rowHeight;
				newHeight = (newHeight < 400) ? 400 : newHeight;
				svg.attr('viewBox', colWidth + ' ' + 0 + ' ' + 2048 + ' ' + newHeight)
				svg.attr('class', 'rootSurface')
				var tree = d3.tree()
					.size([newHeight, colWidth * data.height])
					.separation(function (a, b) {
						return (a.parent === b.parent ? 1 : 1); //All leaves equi-distant
					}
					);

				var mtr = tree(data);
				var children = mtr.children;

				var nodes = svg.selectAll(".node")
					.data(mtr.descendants().slice(1))
					.enter()
					.append("g").attr("id", function (d) { return "g_" + d.data.id });

				nodes.append("clipPath")
					.attr("id", function (d) { return "clip_" + d.parent.data.id + "_" + d.data.id })
					.append("rect")
					.attr("id", function (d) { return "rect_" + d.parent.data.id + "_" + d.data.id })
					.attr("y", function (d) { return d.x - 15 })
					.attr("x", function (d) { return d.y })
					.attr("width", colWidth - 50)
					.attr("height", 30)

				nodes.append("g").append("text").attr("clip-path", function (d) { return "url(#clip_" + d.parent.data.id + "_" + d.data.id + ")" })
					.text(function (d) { return d.data.title; })
					.attr('class', "idText")
					.attr("height", rowHeight - 10)
					.attr("id", function (d) {
						return "text_" + d.data.id
					})
					.style("text-anchor", "start")
					.attr("x", function (d) { return d.y })
					.attr("y", function (d) { return d.x });

				if (children) paths(svg, children);

			}
		}

	})

	function paths(svg, children) {
		children.forEach(child => {
			if (child.children) {
				paths(svg, child.children)
				svg.selectAll(".link")
					.data(child.children)
					.enter().append("path")
					.attr("class", function (d) { return (d.depth === 0) ? "invisible--link" : "local--link"; })
					.attr("d", function (d) {
						var rEl = document.getElementById("rect_" + d.parent.data.id + "_" + d.data.id)
						var rWidth = rEl.getClientRects()[0].width
						var tEl = document.getElementById("text_" + d.parent.data.id)
						var tWidth = tEl.getClientRects()[0].width
						var width = tWidth < rWidth ? tWidth : rWidth
						var startPointH = d.y - 5;
						var startPointV = d.x - 5;
						var endPointH = d.parent.y + width + 90;
						var endPointV = d.parent.x - 5;

						var string = "M" + startPointH + "," + startPointV +

							"C" + (startPointH - ((startPointH - endPointH) / 5)) + "," + startPointV + " " +
							(endPointH + ((startPointH - endPointH) / 5)) + "," + endPointV + " " +
							endPointH + "," + endPointV;
						return string
					});
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

	if (board) return <Grid container direction='row'>
		<Chip label={board.title} onClick={enableMenu}/>
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
	</Grid>
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