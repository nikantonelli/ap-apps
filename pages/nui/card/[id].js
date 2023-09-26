import React from "react";
import CardService from "../../../Services/CardService";
import DataProvider from "../../../Utils/Server/DataProvider";

import { APCard } from "../../../Components/APCard";
import { extractOpts } from "../../../Utils/Server/Helpers";

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
				<APCard
					cardProps={{ margin: "10px" }}
					loadSource='card'
					readOnly={false}
					card={this.props.card}
					descendants={this.state.descendants}
					parents={this.state.parents}
					context={this.state.context}
					host={this.props.host}
				/>
			)
		} else {
			return <div id="dead" />
		}
	}
}


export async function getServerSideProps({ req, params, query }) {
	if (!Boolean(globalThis.dataProvider)) {
		globalThis.dataProvider = new DataProvider()
	}
	
	var card = globalThis.dataProvider.inCache(params.id, 'card');
	var appProps = {host: req.headers.host}
	extractOpts(query, appProps)

	if (card === null) {
		var cs = new CardService(req.headers.host);
		card = await cs.get(params.id)	//This adds it to the cache
	}
	if (card) {
		appProps.card = card
		return ({ props: {
			...appProps
		} })
	}
	else return ({ props: { } })
}