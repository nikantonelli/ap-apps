import DataProvider from "../Utils/Server/DataProvider";

class UserService {

	constructor(host) {
		this.baseUrl = "http://" + host + "/api";
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
		if (globalThis.dataProvider)
			return await this.getData(params);
	}

	async getMySubscribedCards(options) {
		var params = {
			url: "/user/me/card?type=subscribed&filter=card&cardStatus=notStarted,started",
			mode: "GET"
		}
		if (globalThis.dataProvider)
			return await this.getData(params);
	}

	async getData(params) {
		console.log("bs: ", this.baseUrl + params.url, { method: params.mode })
		if (!globalThis.dataProvider) {
			globalThis.dataProvider = new DataProvider();
		}
		return await globalThis.dataProvider.xfr(params);

	}

}
export default UserService;