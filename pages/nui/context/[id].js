import React from "react";
import { APBoard } from "../../../Components/APBoard";
import BoardService from "../../../services/BoardService";
import DataProvider from "../../../utils/Server/DataProvider";
export default function Board({ board, cards, active, depth, colour, mode, sort, eb, dir, host }) {
	return (
		<>
			<APBoard
				board={board}
				cards={cards}
				active={active}
				depth={depth}
				colour={colour}
				mode={mode}
				sort={sort}
				eb={eb}
				dir={dir}
				host={host}
			/>
			<div id={"surface_" + board.id} style={{ width:"100%", height:"100%"}}>
				<svg
					id={"svg_" + board.id}
					width={"100%"}
				/>
			</div>
		</>
	)
}

export async function getServerSideProps({ req, params, query }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}
	var bs = new BoardService(req.headers.host);
	var board = await bs.get(params.id)
	var cards = await bs.getCards(params.id);
	if (board) {
		var active = null;
		if (query.active) {
			active = query.active;
		}

		var mode = null;
		if (query.mode) {
			mode = query.mode;
		}

		var depth = null;
		if (query.depth) {
			depth = query.depth;
		}
		else {
			switch (mode) {
				case 'sunburst': {
					depth = APBoard.DEFAULT_SUNBURST_DEPTH //Rings are harder to fit in than the tree
					break;
				}
				default:
				case 'tree': {
					depth = APBoard.DEFAULT_TREE_DEPTH	//Limit the exponential explosion of fetches as you go down the tree
					break;
				}
			}
		}

		var colour = null;
		if (query.colour) {
			colour = query.colour;
		}
		var sort = null;
		if (query.sort) {
			sort = query.sort;
		}
		var eb = null;
		if (query.eb) {
			eb = query.eb;
		}

		var dir = null;
		if (query.dir) {
			dir = query.dir;
		}
		return { props: { board: board, cards: cards, active: active, depth: depth, colour: colour, mode: mode, sort: sort, eb: eb, dir: dir, host: req.headers.host } }
	}
	return { props: { board: null, active: null, depth: null, colour: null, mode: null, sort: null, eb: null, dir: null, host: req.headers.host } }
}