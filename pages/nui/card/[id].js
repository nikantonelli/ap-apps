import CardService from "../../../services/CardService";
import DataProvider from "../../../utils/Server/DataProvider";
import React from "react";

import { APcard } from "../../../Components/APcard";
import { getBoard, getCardChildren, getListOfCards } from "../../../utils/Client/Sdk"

export default class Item extends React.Component {


	constructor(props) {
		super(props);
		this.state = {
			parents: [],
			context: null,
			descendants: []
		}
	}

	render() {

		if (this.props.card != null) {
			return (
				<APcard
					cardProps={{ margin: "10px" }}
					loadSource='card'
					readOnly={false}
					card={this.props.card}
					descendants={this.state.descendants}
					parents={this.state.parents}
					context={this.state.context}
				/>
			)
		} else {
			return <div id="dead" />
		}
	}
}


export async function getServerSideProps({ req, params, query }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}
	var card = globalThis.dataProvider.inCache(params.id, 'card');

	if (card === null) {
		var cs = new CardService(req.headers.host);
		card = await cs.get(params.id)
	}
	if (card) {
		globalThis.dataProvider.addToCache(card, 'card')
		return { props: { card: card, host: req.headers.host } }
	}

	return { props: { card: null, host: req.headers.host } }
}