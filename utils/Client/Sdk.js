import { forEach, union, unionBy } from "lodash";
import { shortDate } from "./Helpers";

export class VIEW_TYPES {
	static SUNBURST = 'sunburst'
	static TREE = 'tree'
	static PARTITION = 'partition'
	static TIMELINE = 'timeline'
}

export const getCardChildren = (host, card) => {
	var params = {
		host: host,
		mode: "GET",
		url: "/card/" + card.id + "/connection/children?cardStatus=notStarted,started,finished",
	}
	return doRequest(params);
}

/** 
 * Coded like this because we usually have to 'refetch' the REAL version 
 * of a nonsense one back from a different api call.
*/
export const getCard = (host, cardId) => {
	var params = {
		host: host,
		mode: "GET",
		url: "/card/" + cardId,
	}
	return doRequest(params);
}

export const getCards = (host, cardIds) => {
	var reqs = []
	if (cardIds.constructor.toString().indexOf("Array") < 0) return null;
	cardIds.forEach(async (crd) => {
		var card = getCard(host, crd)
		reqs.push(card)
	})
	return Promise.all(reqs).then((results) => {
		var cards = [];
		results.forEach((result) => {
			cards.push(result)
		})
		return cards
	})
}


/**
 * 
 * @param {*} host 
 * @param {*} card 
 * @param {*} type 
 * @param {*} depth 
 * @returns A partial Card
 * 
 * The AgilePlace API returns different card structures depending on what call you make
 * This is a bit of a pain as it means that most times you have to get the card twice 
 * if you want ALL the fields
 * In the case that you want all the fields, flatten the tree and then get all the cards
 * and replace each one back into the tree
 */
export const getCardHierarchy = async (host, card, type, depth) => {
	if (depth < 0) return null //We're done
	return new Promise(async (resolve, reject) => {

		var level = depth - 1;
		switch (type) {
			case 'children': {
				var result = await getCardChildren(host, card);

				if (result.cards && result.cards.length) {
					var cardIds = result.cards.map((card) => card.id)
					var realCards = await getCards(host, cardIds)
					var grc = Promise.all(getRealChildren(host, realCards, level)).then((results) => {

						if (!card.children) {
							card.children = realCards
						} else {
							card.children = unionBy(card.children, realCards, (card) => card.id)
						}
						resolve(card);
					})
				} else {
					resolve(card)
				}
			}
		}
		
	})
}


export function getRealChildren(host, cards, depth) {

	var reqs = [];
	if (cards.constructor.toString().indexOf("Array") < 0) return [];
	cards.forEach(async (card) => {
		reqs.push(getCardHierarchy(host, card, 'children', depth))
	})
	// return Promise.all(reqs).then((results) => {
	// 	var newCards = [];
	// 	results.forEach((result) => {
	// 		newCards.push(result)
	// 	})
	// 	return newCards;
	// })
	return reqs;
}

/** If a top level card is a child of something else in the hierarchy, then remove from the top layer */
export const removeDuplicates = (cards) => {
	var checkedCards = cards;

	cards.forEach((card) => {
		checkedCards = filter(checkedCards, (cc) => {
			return !filter(card.children, (child) => {
				return child.id === cc.id
			})
		})
	})
	return checkedCards
}

export const flattenTree = (array, result) => {
	array.forEach(function (el) {
		if (el.children) {
			flattenTree(el.children, result);
		}
		result.push(el);

	});
}

export const findBoards = async (host, options) => {
	var params = {
		url: "/board",
		mode: "GET",
		host: host
	}
	if (options && options.search) {
		//Extra params are uri encoded at the lower level.
		params.search = "q=" + options.search
	}
	var result = await doMultiRequest(params, "boards")
	if (result)
		return result
	else return null

}
export const getListOfCards = async (host, cardList) => {
	var params = {
		host: host,
		mode: 'GET',
		url: "/card?cards=" + cardList.toString()
	}
	return doRequest(params);
}

export const getBoard = async (host, brdId) => {
	var params = {
		host: host,
		mode: 'GET',
		url: "/board/" + brdId
	}
	return doRequest(params);
}
export const getBoardIcons = async (host, brdId) => {
	var params = {
		host: host,
		mode: 'GET',
		url: "/board/" + brdId + "/customIcon"
	}
	return doRequest(params);
}

export const partitionSize = (treeNode, sizFnc) => {
	var myValue = sizFnc(treeNode);

	forEach(treeNode.children, (item) => {
		myValue += partitionSize(item, sizFnc)
	})
	return myValue
}

export const doRequest = async (params) => {
	var ps = { method: params.mode }
	if (params.body) {
		ps.body = params.body
	}
	if (params.type) {
		var headers = new Headers();
		headers.append("Content-Type", params.type)
		ps.headers = headers
	}
	//The NextJs bit requires the 'http:<host>' parameter to be present. THe browser copes without it.
	var req = new Request("http://" + params.host + "/api" + params.url, ps);
	var res = await fetch(req, { next: { revalidate: 30 } }).then(
		async (response) => {
			if (response.ok) {
				return response
			} else return null;
		}
	)
	var data = null;
	if (res) data = await res.json()
	return data
}

/**
 *  Get all the pages of data available
 * @param {*} params 
 * @returns 
 */
export const doMultiRequest = async (params, itemType) => {
	var ps = { method: params.mode }
	if (params.body) {
		ps.body = params.body
	}
	if (params.type) {
		var headers = new Headers();
		headers.append("Content-Type", params.type)
		ps.headers = headers
	}
	var moreItems = true;
	var data = [];
	var currentItem = 0;
	var extras = "";

	if (params.search) extras += "&" + params.search

	while (moreItems) {
		//The NextJs bit requires the 'http:<host>' parameter to be present. THe browser copes without it.
		var response = await fetch(new Request("http://" + params.host + "/api" + params.url + "?offset=" + currentItem + encodeURI(extras), ps))
		var res = await response.json();
		if (res) {
			currentItem = res.pageMeta.endRow
			if (res.pageMeta.totalRecords <= currentItem) moreItems = false;
			res[itemType].forEach(d => data.push(d));
		}
		else
			return null;
	}
	res[itemType] = data;
	res.pageMeta.startRow = 1;
	return res
}

export const statusString = (card) => {
	return ((card.actualFinish?.length) ?
		" Finished (" + shortDate(card.actualFinish) + ")" :
		(card.actualStart?.length) ?
			" Started (" + shortDate(card.actualStart) + ")" :
			" Not Started"

	)
}