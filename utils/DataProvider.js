import AgilePlace from "./AgilePlace"

class DataProvider  {
	constructor() {	
		//Choose your poison
		this.provider = new AgilePlace()
	}
	
	//To form an abstraction layer, all calls come here first
	get() {
		return this;
	}

	getContextByString(param1, param2) {
		return this.provider.getContextByString(param1, param2);
	}
}

export default DataProvider