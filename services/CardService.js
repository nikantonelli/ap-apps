class CardService {
	/**
	 * 
	 * @param {object to access AgilePlace} apiAccess 
	 */
	constructor(apiAccess) {
		this.cache = null;
	}

	find(options) {
		var params = {
			url: "/card/",
			method: "GET"
		}
		return this.getData(params);
	}

	get(id, options) {
		var params = {
			url: "/card/" + id,
			method: "GET"
		}
		return this.getData(params);
	}

	getChildren(id, options) {
		var params = {
			method: "GET",
			url: "/card/" + id + "/connection/children?cardStatus=notStarted,started,finished",
		}
		var x = this.getData(params)
		return x
	}

	async getData(params) {

		if (globalThis.dataProvider) {
			var response = await globalThis.dataProvider.xfr(params);
			if (response) return response.data;
		}
		return null;
	}
}
export default CardService;