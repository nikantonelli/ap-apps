import AgilePlace from "./AgilePlace"
import ItemCache from "./ItemCache";

class DataProvider {

	CACHE_ITEM_COUNT = 2000;
	CACHE_AGE_TIMER = 30 * 1000;	//Check every 30 sec
	//CACHE_AGE_LIMIT = 1 * 60 * 1000;	//Limit of 1 min
	CACHE_AGE_LIMIT = (
		((process.env.AGILEPLACE_CACHE_AGE_LIMIT === undefined) || (process.env.AGILEPLACE_CACHE_AGE_LIMIT === null)) ?
		30 : process.env.AGILEPLACE_CACHE_AGE_LIMIT) * 60 * 1000;	//Default of 30 mins

	constructor() {
		//Choose your poison
		this.provider = new AgilePlace();
		this.cacheMap = new Map();
		setInterval(this.ageCache, this.CACHE_AGE_TIMER)
	}

	ageCache = () => {
		this.cacheMap.forEach((cache, type) => {
			this.checkCache(cache, type, Date.now(), this.CACHE_AGE_LIMIT);
		})

	}

	invalidateCaches = () => {
		this.cacheMap = new Map();
	}

	checkCache(cache, type, now, limit) {
		cache.map.forEach((value, key) => {
			if (value.date < (now - limit)) {
				cache.map.delete(key);
			}
		})
	}

	getContextByString(param1, param2, param3) {
		return this.provider.getContextByString(param1, param2, param3);
	}

	xfr(param) {
		return this.provider.xfr(param)
	}

	getCache(realType) {
		var type = (Boolean(realType) && (typeof realType === "string")) ? realType : "unknown"
		var cache = this.cacheMap.get(type)
		if (!cache) {
			cache = new ItemCache(type, this.CACHE_ITEM_COUNT, this.CACHE_AGE_LIMIT)
			this.cacheMap.set(type, cache)
		}
		return cache;
	}

	addToCache(data, type) {
			var cache = this.getCache(type)	//Creates new one if not present
			var id = this.provider.getIdentifierField(data, type);
			let newEntry = {
				date: Date.now(),
				value: data
			}
			cache.put(id, newEntry);
	}

	addToCacheWithId(id, data, type) {
			var cache = this.getCache(type)	//Creates new one if not present
			let newEntry = {
				date: Date.now(),
				value: data
			}
			cache.put(id, newEntry);
	}

	delFromCache(id, type) {
		var cache = this.getCache(type)
		if (cache) cache.delete(id);
	}

	inCache(id, type) {
		var cache = this.getCache(type)
		var cacheEntry = null;
		return (cache && (cacheEntry = cache.get(id)) && cacheEntry.value) || null
	}

	getHost() {
		return this.provider.getHost();
	}
	getCardUrl(id) {
		return this.provider.getCardUrl(id);
	}
	getBoardUrl(id) {
		return this.provider.getBoardUrl(id);
	}
}

export default DataProvider