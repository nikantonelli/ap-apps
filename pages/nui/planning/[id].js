import { PIPlanApp } from "../../../Components/PIPlanApp";
import BoardService from "../../../services/BoardService";
import DataProvider from "../../../utils/Server/DataProvider";

export default function Planning({ board, host }) {
	return (
		<PIPlanApp board={board} host={host}/>
	)
}
export async function getServerSideProps({ req, params, query }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}
	var bs = new BoardService(req.headers.host);
	var board = await bs.get(params.id)
	if (board) {
		return ({ props: { board: board, host: req.headers.host }})
	}
	else return ({ props: { board: null, host: null }})
}