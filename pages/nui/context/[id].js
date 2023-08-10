import BoardService from "../../../services/BoardService";
import DataProvider from "../../../utils/Server/DataProvider";
import React from "react";
import { APBoard } from "../../../Components/APBoard";
export default function Board(props) {
	return (
		<APBoard 
			{...props}
		/>
	)
}

export async function getServerSideProps({ req, params, query }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}
	var bs = new BoardService(req.headers.host);
	var board = await bs.get(params.id)
	if (board) {
		var active = null;
		if (query.active) {
			active = query.active;
		}
		var depth = null;
		if (query.depth) {
			depth = query.depth;
		}
		else depth = Board.DEFAULT_TREE_DEPTH	//Limit the exponential explosion of fetches as you go down the tree

		var mode = null;
		if (query.mode) {
			mode = query.mode;
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
		return { props: { board: board, active: active, depth: depth, colour: colour, mode: mode, sort: sort, eb: eb, dir: dir, host: req.headers.host } }
	}
	return { props: { board: null, active: null, depth: null, colour: null, mode: null, sort: null, eb: null, dir: null, host: req.headers.host } }
}