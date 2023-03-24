import { Card, CardContent, CardHeader, Chip, Grid } from "@mui/material";
import { useEffect, useRef } from "react";
import BoardService from "../../services/Board"
import AgilePlace from "../../utils/AgilePlace";
import * as d3 from 'd3';


const Board = ({ board, cards }) => {

	const svgRef = useRef();

	useEffect(() => {
		var treeCards = structuredClone(cards)
		treeCards.push({
			id: 'root',
			title: board.title
		})
		const svg = d3.select(svgRef.current);
		svgRef.current.replaceChildren()
		var srf = document.getElementById("surface_" + board.id);
		svg.attr('viewBox', '-80 -20 ' + (srf.clientWidth + 100) + ' ' + (srf.clientHeight + 100))
		svg.attr('class', 'rootSurface')
		console.log(svgRef.current)
		var nodeTree = d3.stratify()
			.id(function (d) {
				return d.id || 'root';
			})
			.parentId(function (d) {
				if (d.parentCards && d.parentCards.length) return d.parentCards[0].id
				else if (d.id !== 'root') return 'root'
				else return null;

			})
			(treeCards)
		var tree = d3.tree()
			.size([srf.clientHeight, srf.clientWidth])
			.separation(function (a, b) {
				return (a.parent === b.parent ? 1 : 4); //All leaves equi-distant
			}
			);

		var mtr = tree(nodeTree);
		console.log(mtr)
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

		paths(svg, children);
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
						var endPointH = d.parent.y + width + 20;
						var endPointV = d.parent.x - 5;

						var string = "M" + startPointH + "," + startPointV +

							"C" + (startPointH - ((startPointH - endPointH) / 10)) + "," + (startPointV - 10) + " " +
							(endPointH + ((startPointH - endPointH) / 10)) + "," + (endPointV + 10) + " " +
							endPointH + "," + endPointV;
						return string
					});
			}
		})
	}

	return <Grid container direction='row'>
		<Chip label={board.title} />
		<svg id={"surface_" + board.id} ref={svgRef} />
	</Grid>
}

export async function getServerSideProps({ params }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new AgilePlace(process.env.AGILEPLACE, process.env.AGILEUSER, process.env.AGILEPASS, process.env.AGILEKEY)
	}
	var bs = new BoardService();
	var board = await bs.get(params.id)
	var result = await bs.getCards(params.id)
	return { props: { board: board, cards: result.cards } }
}
export default Board