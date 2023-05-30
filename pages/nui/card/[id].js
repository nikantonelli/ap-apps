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

	componentDidMount = () => {
		var data = this.props.card;

		//Get the connection info
		getCardChildren(this.props.host, data).then(async (children) => {
			var childArray = await children.json()
			this.setState({ descendants: childArray.cards })
			if (data.parentCards && data.parentCards.length) {
				getListOfCards(this.props.host, data.parentCards.map((card) => card.cardId)).then(async (parents) => {
					var parentArray = await parents.json()
					this.setState({ parents: parentArray.cards })
				})
			}
		})

		//Get the context info
		getBoard(this.props.host, data.board.id).then(async (info) => {
			var board = await info.json()
			this.setState({ context: board })
		})
		//Get the context info
		// getBoardIcons(this.props.host, this.state.data.board.id).then(async (info) => {
		// 	var icons = await info.json()
		// 	this.setState({ contextIcons: icons })
		// })
		

	}


	render() {

		if (this.props.card != null) {
			return (
				<APcard
					cardProps={{margin:"10px"}}
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
	var cs = new CardService(req.headers.host);
	var card = await cs.get(params.id)
	if (card) {

		return { props: { card: card, host: req.headers.host } }
	}
	return { props: { card: null, host: req.headers.host } }
}