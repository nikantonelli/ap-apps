import { HierarchyApp } from "../../../Apps/HierarchyApp";
import { APBoard } from "../../../Components/APBoard";
import BoardService from "../../../Services/BoardService";
import DataProvider from "../../../Utils/Server/DataProvider";
import { extractOpts } from "../../../Utils/Server/Helpers";

export default function Board(props) {
	return (
		<>
			<APBoard {...props} />	{/* Needs the following div AND svg for the D3 based apps */}
			<div id={"surface_" + props.context.id} style={{ width: "100%", height: "100%" }}>
				<svg
					id={"svg_" + props.context.id}
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
	var context = await bs.get(params.id)
	var cards = await bs.getCards(params.id);
	var appProps = { cards: cards, context: context, host: req.headers.host }
	extractOpts(query, appProps)

	if (!appProps.depth) {
		//Limit the exponential explosion of fetches as you go down the tree
		switch (appProps.view) {
			case 'sunburst': {
				appProps.depth = HierarchyApp.DEFAULT_SUNBURST_DEPTH //Rings are harder to fit in than the tree
				break;
			}
			default:
			case 'tree': {
				appProps.depth = HierarchyApp.DEFAULT_TREE_DEPTH
				break;
			}
		}
	}

	if (context) {
		return ({
			props: {
				...appProps
			}
		})
	}
	else return ({ props: {} })
}
