import DataProvider from "../Utils/Server/DataProvider";
import CardService from "./CardService";

class UserService {

	constructor() {
		if (!Boolean(globalThis.dataProvider)) {
			globalThis.dataProvider = new DataProvider()
		}
		this.provider = globalThis.dataProvider;
	}

	async getMe(options) {
		var params = {
			url: "/user/me",
			mode: "GET"
		}
		if (globalThis.dataProvider)
			return await this.getData(params);
	}

	async getMyAssignedCards(options) {
		var params = {
			url: "/user/me/card?type=assigned&filter=card&cardStatus=notStarted,started",
			mode: "GET"
		}
		var newCards = [];
		var cs = new CardService();

		var result = await this.getData(params);
		if (result) {
			var cards = result.cards
			if (cards && cards.length) {
				for (var i = 0; i < cards.length; i++) {
					var card = await cs.get(cards[i].id)
					if (card) {
						newCards.push(card)
						this.provider.addToCache(card, 'card')
					}
				}
			}
		}

		return newCards;
	}

	async getMySubscribedCards(options) {
		var params = {
			url: "/user/me/card?type=subscribed&filter=card&cardStatus=notStarted,started",
			mode: "GET"
		}
		var newCards = [];
		var cs = new CardService();

		var result = await this.getData(params);
		if (result) {
			var cards = result.cards
			if (cards && cards.length) {
				for (var i = 0; i < cards.length; i++) {
					var card = await cs.get(cards[i].id)
					if (card) {
						newCards.push(card)
						this.provider.addToCache(card, 'card')
					}
				}
			}
		}

		return newCards;
	}

	async getData(params) {
		console.log("us: ", params.url, { method: params.mode })
		this.provider = new DataProvider();
		return await this.provider.xfr(params);

	}

}
export default UserService;