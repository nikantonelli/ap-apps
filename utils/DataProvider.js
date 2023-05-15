import AgilePlace from "./AgilePlace"
import ItemCache from "./ItemCache";

class DataProvider  {
	constructor() {	
		//Choose your poison
		this.provider = new AgilePlace();
		this.cache = new ItemCache(200)
	}
	
	getContextByString(param1, param2) {
		return this.provider.getContextByString(param1, param2);
	}

	xfr(param) {
		return this.provider.xfr(param)
	}

	addToCache(context) {
		var id = this.provider.getIdentifierField(context);
		this.cache.put(id, context);
	}

	inCache(context) {
		var id = this.provider.getIdentifierField(context);
		return this.cache.get(id);
	}
}

export default DataProvider