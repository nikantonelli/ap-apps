import { findLastIndex, forEach, orderBy, pullAt, slice, unionBy, uniqBy } from "lodash";
import { shortDate } from "./Helpers";

export class VIEW_TYPES {
	static SUNBURST = 'sunburst'
	static TREE = 'tree'
	static PARTITION = 'partition'
	static TIMELINE = 'timeline'
	static ALLOCATION = 'allocation'	//Only exists in the PIPlanningApp so far.
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

export const searchRootTree = (element, id) => {
	if (element.id === id) {
		return element;
	}
	else if (Boolean(element.children)) {
		var i;
		var result = null;
		for (i = 0; result == null && i < element.children.length; i++) {
			result = searchRootTree(element.children[i], id);
		}
		return result
	}
	return null;
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
export const getCardHierarchy = async (host, card, type, depth, up, down) => {

	return new Promise(async (resolve, reject) => {

		var level = depth - 1;

		if (!card.appData) card.appData = {}
		card.appData['level'] = depth	//This card is found at this depth - gets reset to lowest value possible.
		switch (type) {
			case 'children': {
				if (level < 0) {
					resolve(card)
				} else {
					var result = await getCardChildren(host, card);	//Only fetches a partial record

					if (result.cards && result.cards.length) {
						var cardIds = result.cards.map((c) => {
							if (up) up()
							return c.id
						})
						var realCards = await getCards(host, cardIds)	//Gets the whole thing!
						var grc = Promise.all(getRealChildren(host, realCards, level, up, down)).then((results) => {


							if (!card.children) {
								card.children = realCards
							} else {
								card.children = unionBy(card.children, realCards, (c) => c.id)

							}
							card.children.forEach((c) => {
								if (down) down()
								if (!c.appData) c.appData = {}
								c.appData['parentId'] = card.id	//We set this to recreate a tree from d3.stratify if needed
								c.appData['level'] = level
							})
							resolve(card);
						})
					} else {
						resolve(card)
					}
				}
			}
		}

	})
}


export function getRealChildren(host, cards, depth, up, down) {
	var reqs = [];
	if (cards.length) {
		cards.forEach(async (card) => {
			reqs.push(getCardHierarchy(host, card, 'children', depth, up, down))
		})
	}
	return reqs
}

/** If a top level card is a child of something else in the hierarchy, then remove from the upper layer
 *  This relies on an array arranged by a nodes followed by their children in topological order as per
 *  the d3 based: node.descendants()
 */
export const removeDuplicates = (rawCards) => {
	var cards = orderBy(rawCards,[(card) => card.id, (card) => card.appData.level], ['asc','asc'])
	var currentCards = uniqBy(cards,(card) => card.id)
	return currentCards
}

export const flattenTree = (item, result) => {
	flattenChildren([item], result)
	return result;
}

export const flattenChildren = (array, result) => {
	array.forEach(function (el) {

		result.push({ ...el });
		if (el.children) {
			flattenChildren(el.children, result);
		}
	});
}

export const visitTree = (treeNode, sizFnc, previous) => {
	var prev = previous;

	forEach(treeNode.children, (item) => {
		prev = visitTree(item, sizFnc, prev)
	})
	return sizFnc(treeNode, prev);
}

export const createTree = (cards) => {
	var tree = { id: 'root' }
	addChildrentoTree(tree, cards)
	return tree.descendants;
}

const addChildrentoTree = (item, cards) => {
	cards.forEach((c) => {
		if (c.appData && (c.appData.parentId === item.id)) {
			addChildrentoTree(c, cards)
			item.descendants =
				item.descendants ?
					item.descendants = unionBy(item.descendants, [c]) :
					[c]
		}
	})
}


export const resetChildren = (node) => {
	node.children = _.union(node.children || [], node.savedChildren || [])
	node.savedChildren = [];
	node.children.forEach((child) => {
		this.resetChildren(child)
	})
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
	var res = await fetch(req).then(
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
			(" Not Started: " + shortDate(card.plannedStart))
	)
}