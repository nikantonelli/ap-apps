import { Card, CardContent, CardHeader, Chip, Grid } from "@mui/material";
import { useEffect, useRef } from "react";
import BoardService from "../../services/BoardService"
import CardService from "../../services/CardService"
import AgilePlace from "../../utils/AgilePlace";
import * as d3 from 'd3';
import * as _ from 'lodash';


const Board = ({ board, root }) => {

	const svgRef = useRef();

	useEffect(() => {

		const svg = d3.select(svgRef.current);
		svgRef.current.replaceChildren()
		var srf = document.getElementById("surface_" + board.id);
		svg.attr('viewBox', '-80 -20 ' + (srf.clientWidth + 400) + ' ' + (srf.clientHeight + 400))
		svg.attr('class', 'rootSurface')
		var data = d3.hierarchy(root)
		var tree = d3.tree()
			.size([srf.clientHeight, srf.clientWidth])
			.separation(function (a, b) {
				return (a.parent === b.parent ? 1 : 1); //All leaves equi-distant
			}
			);

		var mtr = tree(data);
		var children = mtr.children;

		var nodes = svg.selectAll(".node")
			.data(mtr.descendants().slice(1))
			.enter()
			.append("g").attr("id", function (d) { return "g-" + d.data.id });

		nodes.append("clipPath")
			.attr("id", function (d) { return "clip-" + d.data.id })
			.append("rect").attr("y", function (d) { return d.x - 15 }).attr("x", function (d) { return d.y }).attr("width", (srf.clientHeight / mtr.height) + 20).attr("height", 30)

		nodes.append("g").append("text").attr("clip-path", function (d) { return "url(#clip-" + d.data.id + ")" })
			.text(function (d) { return d.data.title; })
			.attr('class', "idText")
			.attr("width", srf.clientHeight / mtr.height)
			.attr("height", 18)
			.attr("id", function (d) {
				return "text-" + d.data.id
			})
			.style("text-anchor", "start")
			.attr("x", function (d) { return d.y })
			.attr("y", function (d) { return d.x });

		if (children) paths(svg, children);
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
						var el = document.getElementById("text-" + d.parent.data.id)
						var width = el.getClientRects()[0].width
						var startPointH = d.y;
						var startPointV = d.x - 5;
						var endPointH = d.parent.y + width + 30;
						var endPointV = d.parent.x - 5;

						var string = "M" + startPointH + "," + startPointV +

							"C" + (startPointH - ((startPointH - endPointH) / 8)) + "," + (startPointV - 20) + " " +
							(endPointH + ((startPointH - endPointH) / 8)) + "," + (endPointV + 20) + " " +
							endPointH + "," + endPointV;
						return string
					});
			}
		})
	}

	if ( board) return <Grid container direction='row'>
		<Chip label={board.title} />
		<svg id={"surface_" + board.id} ref={svgRef} />
	</Grid>
	else return null;
}

async function getChildren(card) {
	var cs = new CardService();
	var result = await cs.getChildren(card.id);
	var children;
	if (result) {
		children = result.cards;
		if (children) {
			for (var i = 0; i < children.length; i++) {
				children[i].children = await getChildren(children[i])
				children[i].parentId= card.id
			}
		}
	}
	else children = [];
	return children;
}

export async function getServerSideProps({ params }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new AgilePlace(process.env.AGILEPLACE, process.env.AGILEUSER, process.env.AGILEPASS, process.env.AGILEKEY)
	}
	var cards = [];
	var bs = new BoardService();
	var board = await bs.get(params.id)
	var result = await bs.getCards(params.id)
	var root = {
		id: 'root',
		children: []
	}
	//Make a tree of the cards

	if (result) {
		cards = result.cards;
		for (var i = 0; i < cards.length; i++) {
			//Fix the fact that the AP API is rubbish.
			cards[i].parentId = "root"
			cards[i].board = {
				id: board.id
			}
			//The child card could already be on this board, so check and remove from root
			cards[i].children = await getChildren(cards[i])
			for (var j = 0; j < cards[i].children.length; j++ ){
					cards = _.filter(cards, function(crd) { return crd.id != cards[i].children[j].id})
			}
		}
		root.children = cards
	}
	return { props: { board: board, root: root} }
}
export default Board