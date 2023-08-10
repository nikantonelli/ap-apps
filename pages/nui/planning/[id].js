import { PIPlanApp } from "../../../Components/PIPlanApp";
import BoardService from "../../../services/BoardService";
import DataProvider from "../../../utils/Server/DataProvider";

export default function Planning({ board, host, series, timebox, cards, active, mode, colour, sort, eb, dir }) {
	return (
		<PIPlanApp 
			board={board} 
			host={host} 
			series={series} 
			timebox={timebox} 
			cards={cards} 
			active={active} 
			mode={mode} 
			colour={colour} 
			sort={sort}
			eb={eb}
			dir={dir}
		/>
	)
}
export  async function getServerSideProps({ req, params, query }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}
	var bs = new BoardService(req.headers.host);
	var board = await bs.get(params.id)
	var cards = await bs.getCards(params.id);
	var series = null;
	if (query.srs) {
		series = query.srs;
	}
	var timebox = null;
	if (query.tmb) {
		timebox = query.tmb;
	}
	var active = null;
	if (query.active) {
		active = query.active;
	}
	
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

	if (board) {
		return ({ props: { 
			board: board, 
			cards: cards, 
			host: req.headers.host, 
			series: series, 
			timebox: timebox, 
			active: active, 
			colour: colour, 
			mode: mode, 
			sort: sort, 
			eb: eb, 
			dir: dir
		} })
	}
	else return ({ props: { board: null, host: null } })
}