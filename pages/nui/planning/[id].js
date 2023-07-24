import { PIPlanApp } from "../../../Components/PIPlanApp";
import BoardService from "../../../services/BoardService";
import DataProvider from "../../../utils/Server/DataProvider";

export default function Planning({ board, host, series, timebox, cards }) {
	return (
		<PIPlanApp board={board} host={host} series={series} timebox={timebox} cards={cards}/>
	)
}
export async function getServerSideProps({ req, params, query }) {
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

	if (board) {
		return ({ props: { board: board, cards: cards, host: req.headers.host, series: series, timebox: timebox} })
	}
	else return ({ props: { board: null, host: null } })
}