import { PIPlanApp } from "../../../Apps/PIPlanApp";
import BoardService from "../../../Services/BoardService";
import DataProvider from "../../../Utils/Server/DataProvider";
import { extractOpts } from "../../../Utils/Server/Helpers";

export default function Planning(props) {
	return (
		<PIPlanApp {...props}/>
	)
}

export  async function getServerSideProps({ req, params, query }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}
	var bs = new BoardService(req.headers.host);
	var context = await bs.get(params.id)
	var cards = await bs.getCards(params.id);
	var appProps = {cards: cards, context: context, host: req.headers.host}
	extractOpts(query, appProps)

	if (context) {
		return ({ props: {
			...appProps
		} })
	}
	else return ({ props: { } })
}