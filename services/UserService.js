import DataProvider from "../Utils/Server/DataProvider";
import CardService from "./CardService";

class UserService {

	constructor(host) {
		this.baseUrl = "http://" + host + "/io";
		this.cache = null;
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

		if (globalThis.dataProvider){
			var result = await this.getData(params);
			if (result) {
				var cards = result.cards
				if (cards && cards.length) {
					for (var i = 0; i < cards.length; i++) {
						var card = await cs.get(cards[i].id)
						if (card) {
							newCards.push(card)
							globalThis.dataProvider.addToCache(card, 'card')	
						}
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

		if (globalThis.dataProvider){
			var result = await this.getData(params);
			if (result) {
				var cards = result.cards
				if (cards && cards.length) {
					for (var i = 0; i < cards.length; i++) {
						var card = await cs.get(cards[i].id)
						if (card) {
							newCards.push(card)
							globalThis.dataProvider.addToCache(card, 'card')	
						}
					}
				}
			}
		}
		return newCards;
	}

	async getData(params) {
		console.log("us: ", this.baseUrl + params.url, { method: params.mode })
		if (!globalThis.dataProvider) {
			globalThis.dataProvider = new DataProvider();
		}
		return await globalThis.dataProvider.xfr(params);

	}

}
export default UserService;