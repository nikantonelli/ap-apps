import { hierarchy, interpolateCool, interpolateRainbow, interpolateWarm, quantize, scaleOrdinal } from "d3";
import { findIndex } from "lodash";
import { VIEW_TYPES } from "../Utils/Client/Sdk";
import { searchNodeTree } from "../Utils/Client/SdkSvg";
import { AppRoot } from "./App";

export class HierarchyApp extends AppRoot {

	static DEFAULT_TREE_DEPTH = 2;
	static DEFAULT_SUNBURST_DEPTH = 2;	//Two rings of children plus the root
	static OPACITY_HIGH = 1.0;
	static OPACITY_MEDIUM = 0.7;
	static OPACITY_LOW = 0.3;
	static OPACITY_VERY_LOW = 0.1;

	constructor(props) {
		super(props);

		var stateDepth = this.props.depth || HierarchyApp.DEFAULT_TREE_DEPTH
		if (stateDepth < 0) stateDepth = 99;	//If -1 passed in, then do as much as anyone stupid would want.


		this.state = {
			...this.state,
			popUp: null,
			depth: stateDepth,
			view: this.props.view || VIEW_TYPES.TREE,
			colouring: this.props.colour || 'type',
			colourise: this.typeColouring,
			grouping: this.props.group || 'level',
			showErrors: this.props.eb || 'off',
			sortType: this.props.sort || 'id',
			sortDir: this.props.dir || 'ascending',

			configOpen: false,
			drawerWidth: this.props.drawerWidth || 400,
		}

		// if (!globalThis.bc) {
		// 	globalThis.bc = new BroadcastChannel("nui_socket_ch")
		// 	this.bc = globalThis.bc;

		// } else {
		// 	this.bc = new BroadcastChannel("nui_socket_ch");
		// 	this.bc.onmessage = (event) => {
		// 		console.log(event);
		// 	}
		// }


		// if (!globalThis.ws) {
		// 	globalThis.ws = io()

		// 	globalThis.ws.on('connect', () => {
		// 		console.log('connected')
		// 	})
		// 	globalThis.ws.on('update-item', (msg) => {
		// 		console.log('update', msg)
		// 		globalThis.bc.postMessage({
		// 			type: "update",
		// 			data: msg
		// 		})
		// 	})
		// }
		// //Connect to endpoint to establish socket set up on server
		// fetch("/api/socket");
	}

	assignedUserList = [];
	createdUserList = [];
	updatedUserList = [];
	contextList = [];

	closePopUp = () => {
		this.setState({ popUp: null })
	}

	//Config drawer

	openDrawer = () => {
		this.setState({ configOpen: true })
	}

	closeDrawer = () => {
		this.setState({ configOpen: false })
	}


	viewChange = (e) => {
		var newView = e.target.value;
		this.setState((prev) => {
			if (newView === VIEW_TYPES.TIMELINE) {
				return { view: newView, sortType: 'count' }
			}
			if ((prev.sortType === "title") && (newView === VIEW_TYPES.SUNBURST)) {
				return { view: newView, sortType: 'count' }
			}
			else if ((prev.sortType === "count") && (newView === VIEW_TYPES.TREE)) {
				return { view: newView, sortType: 'size' }
			}
			return { view: newView }
		});
		if (this.props.viewChange) this.props.viewChange(newView);
	}

	sortChange = (e) => {
		var value = e.target.value;
		this.setState({ sortType: value });
		if (this.props.sortChange) this.props.sortChange(value);

	}

	sortDirChange = (e) => {
		var value = e.target.value;
		this.setState({ sortDir: value });
		if (this.props.sortDirChange) this.props.sortDirChange(value);
	}

	errorChange = (e) => {
		var value = e.target.value;
		this.setState({ showErrors: value });
		if (this.props.errorChange) this.props.errorChange(value);
	}

	groupChange = (e) => {
		var value = e.target.value;
		this.setColouring({ colouring: value })
		this.setState({ grouping: value, colouring: value });
		if (this.props.groupChange) this.props.groupChange(value);
	}

	colourChange = (e) => {
		var value = e.target.value;
		this.setColouring({ colouring: value })

		if (this.props.colourChange) this.props.colourChange(value);
	}

	/**
	 * Two stage colour fetching:
	 * 1. Optional: Set up a function to convert a value to a colour
	 * 2. Call a function (that could call that previous function) with the 'd' parameter
	 * 	that converts d to a value.
	 * 
	 * You could, of course, only have one function that converts 'd' to a colour
	 */
	colourFnc = null;

	tempColouring = (d) => {
		var mine = searchNodeTree(this.rootNode, d.data.id)
		if (mine){
		while (mine.parent && mine.parent.data.id != 'root') {
			mine = mine.parent;
		}
		return this.colourFnc((mine ? mine.index : 1) + 1);
	} else {
		return "#ccc"
	}
	}

	typeColouring = (d) => {
		if (d.data) return d.data.type.cardColor
		else return "#ccc"
	}

	//Get first assigned user only
	aUserColouring = (d) => {
		var user = null;
		//Assigned users is always returned and empty if there are none
		if (d.data.assignedUsers.length) {
			user = d.data.assignedUsers[0];
			var index = findIndex(this.assignedUserList, function (assignee) {
				return user.id === assignee.id;
			})
			if (index >= 0) return this.colourFnc(index);
		}
		return this.colourFnc(0);
	}

	lUserColouring = (d) => {
		var user = null;
		//last update users is always returned and empty if there are none
		if (d.data.updatedBy) {
			user = d.data.updatedBy;
			var index = findIndex(this.updatedUserList, function (assignee) {
				return user.id === assignee.id;
			})
			if (index >= 0) return this.colourFnc(index);
		}
		return this.colourFnc(0);
	}

	cUserColouring = (d) => {
		var index = -1;
		//creator users is always returned and empty if there are none
		if (d.data.createdBy) {
			index = findIndex(this.createdUserList, function (user) {
				return d.data.createdBy.id === user.id;
			})
		}
		var colour = this.colourFnc((index >= 0) ? index : 0);
		return colour
	}

	contextColouring = (d) => {
		var boardid = d.data.board.id
		var index = findIndex(this.contextList, function (context) {
			return boardid === context.id;
		})
		if (index >= 0) return this.colourFnc(index);

		return this.colourFnc(0);
	}

	stateColouring = (d) => {
		if (d.data.actualFinish) return '#444444'
		if (d.data.actualStart) return '#27a444';
		else return '#4989e4';

	}

	/**
	 * 
	 * @param {
	 * 	type: string
	 * 	method: function
	 * 	config: object
	 * 
	 * } params 
	 */
	setColouring = (params) => {
		switch (params.colouring) {
			case 'cool': {
				this.colourFnc = scaleOrdinal(quantize(interpolateCool, (this.rootNode.children && this.rootNode.children.length) ? this.rootNode.children.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.tempColouring });
				break;
			}
			case 'warm': {
				this.colourFnc = scaleOrdinal(quantize(interpolateWarm, (this.rootNode.children && this.rootNode.children.length) ? this.rootNode.children.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.tempColouring });
				break;
			}
			case 'context': {
				this.colourFnc = scaleOrdinal(quantize(interpolateRainbow, this.contextList.length ? this.contextList.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.contextColouring });
				break;
			}
			case 'type': {
				this.setState({ colouring: params.colouring, colourise: this.typeColouring });
				break;
			}
			case 'state': {
				this.setState({ colouring: params.colouring, colourise: this.stateColouring });
				break;
			}
			case 'a_user': {
				this.colourFnc = scaleOrdinal(quantize(interpolateRainbow, this.assignedUserList.length ? this.assignedUserList.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.aUserColouring });
				break;
			}
			case 'l_user': {
				this.colourFnc = scaleOrdinal(quantize(interpolateRainbow, this.updatedUserList.length ? this.updatedUserList.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.lUserColouring });
				break;
			}
			case 'c_user': {
				this.colourFnc = scaleOrdinal(quantize(interpolateRainbow, this.createdUserList.length ? this.createdUserList.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.cUserColouring });
				break;
			}
			default: {
				this.setState({ colouring: params.colouring })
				this.colourFnc = scaleOrdinal(quantize(interpolateCool, 2))
			}
		}

	}

	getD3ErrorData = (d) => {
		var data = {
			colour: "",
			msg: ""
		}

		d.opacity = 1.0

		if (this.state.showErrors === 'on') {
			//Compare dates
			var pPF = d.parent.data.plannedFinish ? new Date(d.parent.data.plannedFinish).getTime() : null;
			var pPS = d.parent.data.plannedStart ? new Date(d.parent.data.plannedStart).getTime() : null;
			var pf = d.data.plannedFinish ? new Date(d.data.plannedFinish).getTime() : null;
			var ps = d.data.plannedStart ? new Date(d.data.plannedStart).getTime() : null;

			if (d.data.blockedStatus.isBlocked) {
				data.msg += "BLOCKED.\n"
				data.colour = "red"
			}

			if ((pf === null) || (ps === null)) {
				data.msg += "Incomplete schedule information for this item\n"
				data.colour = "red"
			} else {
				if ((pf > pPF) || (ps >= pPF)) {
					data.msg += "This item runs beyond parent dates\n"
					data.colour = "red"
				}
				else if (ps < pPS) {
					data.msg += "This item starts before parent dates\n"
					data.colour = "#e69500"
				}
			}

			if (data.msg.length) {
				d.opacity = 0.7
			}
		}
		return data;
	}


	root = {
		id: 'root',
		children: this.props.cards || []
	};

	setData = () => {
		this.rootNode = hierarchy(this.root)
		this.setRootNode(this.rootNode)
	}

	setChildColourIndex = (item) => {
		item.children && item.children.forEach((child, idx) => {
			child.index = idx;
			this.setChildColourIndex(child);
		})
	}

	setRootNode = (rootNode) => {
		this.setChildColourIndex(this.rootNode)
		var me = this;
		this.setState((prev) => {
			return { rootNode: this.rootNode }
		})
	}

}