import { Box, Drawer, Grid, LinearProgress, Stack, TextField, Typography } from "@mui/material";
import { ascending, descending, hierarchy, select } from "d3";
import { filter, max, min, reject, union, unionWith } from "lodash";

import { Settings } from "@mui/icons-material";

import React from "react";

import { APTimeLineView } from "../Apps/TimeLineApp";
import { VIEW_TYPES, createTree, flattenChildren, getRealChildren, removeDuplicates } from "../utils/Client/Sdk";
import { APCard } from "./APCard";

import { App } from "../Apps/App";
import { APPartitionView } from "../Apps/PartitionApp";
import { APSunburstView } from "../Apps/SunburstApp";
import { APTreeView } from "../Apps/TreeApp";
import { ConfigDrawer } from "./ConfigDrawer";

export class APBoard extends App {

	static DEFAULT_TREE_DEPTH = 3;
	static DEFAULT_SUNBURST_DEPTH = 3;	//Three rings of children plus the root
	static OPACITY_HIGH = 1.0;
	static OPACITY_MEDIUM = 0.7;
	static OPACITY_LOW = 0.3;
	static OPACITY_VERY_LOW = 0.1;

	constructor(props) {
		super(props)
		this.state = {
			...this.state,	//Bring state in from App
			board: this.props.board,
			fetchActive: true,
			active: props.active,

			topLevelList: props.topLevelList || [],
			pending: 0,
			total: 0
		}
	}

	root = {
		id: 'root',
		children: this.props.cards || []
	};
	assignedUserList = [];
	createdUserList = [];
	updatedUserList = [];
	contextList = [];


	calcTreeData = (rootNode) => {
		var me = this;
		//Do some stuff for the app to work
		rootNode
			.sum(d => {
				switch (me.state.sortType) {

					default:
					case 'count': {
						return 1;
					}
					case 'size':
						return (d.data && d.data.size) ? d.data.size : 0
					case 'r_size': {
						return d.size ? d.size : 0;
					}
				}
			})
			.sort((a, b) => {
				var dirFnc = me.state.sortDir === "ascending" ? ascending : descending
				switch (me.state.sortType) {
					case 'title': {
						return dirFnc(a.data.title, b.data.title)
					}
					case 'count': {
						return dirFnc(a.value, b.value)
					}

					case 'score': {
						return dirFnc(a.data.scoring.scoreTotal, b.data.scoring.scoreTotal)
					}
					//Dates need to be backwards to be more useful: ascending means from now until later
					case 'plannedStart': {
						return dirFnc(new Date(b.data.plannedStart), new Date(a.data.plannedStart))
					}
					case 'plannedFinish': {
						return dirFnc(new Date(b.data.plannedFinish), new Date(a.data.plannedFinish))
					}
					case 'id': {
						return dirFnc(Number(a.data.id), Number(b.data.id))
					}
					case 'context': {
						return dirFnc(Number(a.data.board.id), Number(b.data.board.id))
					}
					case 'size': {
						return dirFnc(a.data.size, b.data.size)
					}
					case 'r_size': {
						return dirFnc(a.value, b.value)
					}

					default: {
						//Sort so the 'latest' (i.e biggest id number) is at top
						return dirFnc(b.data.id, a.data.id)
					}
				}
			})
		//Do some other stuff for stats on the hierarchy to show to user
		rootNode.eachAfter((d) => {
			//If we are the leaves, then check if our dates are outside the parent's
			if (d.parent && (d.parent.data.id !== "root")) {

				var pPF = d.parent.data.plannedFinish ? new Date(d.parent.data.plannedFinish).getTime() : null;
				var pPS = d.parent.data.plannedStart ? new Date(d.parent.data.plannedStart).getTime() : null;
				var pf = d.data.plannedFinish ? new Date(d.data.plannedFinish).getTime() : null;
				var ps = d.data.plannedStart ? new Date(d.data.plannedStart).getTime() : null;

				var aPF = d.parent.data.actualFinish ? new Date(d.parent.data.actualFinish).getTime() : null;
				var aPS = d.parent.data.actualStart ? new Date(d.parent.data.actualStart).getTime() : null;
				var af = d.data.actualFinish ? new Date(d.data.actualFinish).getTime() : null;
				var as = d.data.actualStart ? new Date(d.data.actualStart).getTime() : null;

				d.parent.latest = max([pPF, pPS, pf, ps, d.parent.latest])
				d.parent.earliest = min([pPF, pPS, pf, ps, d.parent.earliest])

				rootNode.latest = max([pPF, pPS, pf, ps, aPF, aPS, af, as, rootNode.latest])
				rootNode.earliest = min([pPF, pPS, pf, ps, aPF, aPS, af, as, rootNode.earliest])
			}
		})

		this.dateRangeStart = new Date().getTime() - (1000 * 60 * 60 * 24 * 14)	//14 days ago
		this.dateRangeEnd = new Date().getTime() + (1000 * 60 * 60 * 24 * 14)	//14 days in future

		if (this.rootNode.earliest) {
			this.dateRangeStart = this.rootNode.earliest;
			if (!this.rootNode.latest) {
				this.dateRangeEnd = this.dateRangeStart + (1000 * 60 * 60 * 24 * 28)	//Go for 28 days onwards
			}
			else {
				if (this.dateRangeEnd < this.rootNode.latest)
					this.dateRangeEnd = this.rootNode.latest
			}
		}

		rootNode.each((d) => {
			if (d.data.assignedUsers && d.data.assignedUsers.length) {
				d.data.assignedUsers.forEach( (user) => {
					this.assignedUserList = unionWith(this.assignedUserList, [user], function (a, b) { return b.id === a.id })
				})
			}
			if (d.data.createdBy) {
				this.createdUserList = unionWith(this.createdUserList, [d.data.createdBy], function (a, b) { return b.id === a.id })
			}
			if (d.data.updatedBy) {
				this.updatedUserList = unionWith(this.updatedUserList, [d.data.updatedBy], function (a, b) { return b.id === a.id })
			}
			if (d.data.id != 'root') {
				this.contextList = unionWith(this.contextList, [d.data.board], function (a, b) { return b.id === a.id })
				//Ensure that the colouring function is called in a consistent order. You can end up with different colour if you don't
				d.colour = this.state.colourise(d);

			}
			d.opacity = 1.0
		})
	};

	getErrorData = (d) => {
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

	modeChange = (e) => {
		var newMode = e.target.value;
		this.setState((prev) => {
			if (newMode === VIEW_TYPES.TIMELINE) {
				return { mode: newMode, sortType: 'count' }
			}
			if ((prev.sortType === "title") && (newMode === VIEW_TYPES.SUNBURST)) {
				return { mode: newMode, sortType: 'count' }
			}
			else if ((prev.sortType === "count") && (newMode === VIEW_TYPES.TREE)) {
				return { mode: newMode, sortType: 'size' }
			}
			return { mode: newMode }
		});
		if (this.props.modeChange) this.props.modeChange(newMode);
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

	render() {
		if (typeof document !== "undefined") {
			var svgTarget = document.getElementById("svg_" + this.state.board.id)
			if (Boolean(svgTarget)) svgTarget.replaceChildren()
		}
		if (!this.state.fetchActive) {
			var hdrBox = document.getElementById("header-box")
			this.calcTreeData(this.state.rootNode)

			var item = this.state.popUp ? this.searchRootTree(this.root, this.state.popUp) : null
			var appProps = {
				end: this.dateRangeEnd,
				start: this.dateRangeStart,
				grouping: this.state.grouping,
				size:
					[
						window.innerWidth,
						//document.getElementById("svg_" + this.state.board.id).getBoundingClientRect().width,
						window.innerHeight - (hdrBox ? hdrBox.getBoundingClientRect().height : 60) //Pure guesswork on the '60'
					]
				,

				target: svgTarget,
				board: this.state.board,
				root: this.state.rootNode,
				onClick: this.nodeClicked,
				onSvgClick: this.svgNodeClicked,
				sort: this.state.sortType,
				colouring: this.state.colouring,
				colourise: this.state.colourise,
				errorData: this.getErrorData,
			}

			return (<>
				<Stack id="portalContainer" sx={{ width: '100%' }}>
					{Boolean(item) ?
						<Drawer
							onClose={this.closePopUp}
							id={"portal_" + item.id}
							open={
								Boolean(this.state.popUp)
							}
						>
							<Box>
								<APCard
									descendants={item.children}
									parents={[]}
									cardProps={{ maxWidth: 700, flexGrow: 1 }}
									host={this.props.host}
									card={item}
									context={this.state.context}
									onClose={this.closePopUp}
									readOnly
								/>
							</Box>
						</Drawer>
						: null}

					<Grid id="header-box" container direction={'row'}>
						<Grid xs={10} item>
							<Grid container sx={{ alignItems: 'center' }} direction={'row'}>
								<Grid item>
									<Settings sx={{ margin: "0px 10px 0px 10px" }} onClick={this.openDrawer} />
								</Grid>
								<Grid item>
									<TextField
										variant="standard"
										sx={{ m: 1, minWidth: 400 }}
										size="small"
										defaultValue={this.state.board.title}
										label="Context"
										InputProps={{ readOnly: true }} />
								</Grid>

							</Grid>
						</Grid>

					</Grid>
					
					{this.state.mode === VIEW_TYPES.TIMELINE ?
						<APTimeLineView {...appProps}
						/> : null}

					{this.state.mode === VIEW_TYPES.PARTITION ?
						<APPartitionView {...appProps}
						/> : null}

					{this.state.mode === VIEW_TYPES.TREE ?
						<APTreeView {...appProps}

						/> : null}
					{this.state.mode === VIEW_TYPES.SUNBURST ?
						<APSunburstView {...appProps}
						/> : null}

					<ConfigDrawer
						onClose={this.closeDrawer}
						onChange={this.handleChangeMultiple}
						openInNew={this.openAsActive}
						width={this.state.drawerWidth}
						open={this.state.configOpen}
						items={this.state.topLevelList}
						allItems={this.root.children}
						mode={this.state.mode}
						modeChange={this.modeChange}
						sort={this.state.sortType}
						sortChange={this.sortChange}
						sortDir={this.state.sortDir}
						sortDirChange={this.sortDirChange}
						colour={this.state.colouring}
						colourChange={this.colourChange}
						group={this.state.grouping}
						groupChange={this.groupChange}
						errors={this.state.showErrors}
						errorChange={this.errorChange}

					/>
				</Stack >
			</>
			)
		} else {
			return (
				<Grid container direction='column' sx={{ display: 'flex', alignItems: 'center' }}>
					<Grid>
						<Typography variant="h6">Loading, please wait</Typography>
					</Grid>
					<Grid sx={{ width: '100%' }}>
						<Grid container direction="row">
							<Grid xs={10} item>
								<LinearProgress variant="determinate" value={Math.round((this.state.total - this.state.pending) / (this.state.total ? this.state.total : 1) * 100)} />
							</Grid>
							<Grid xs={2} item>
								<Typography variant="body2" color="text.secondary">{`${this.state.total}`}</Typography>
							</Grid>
						</Grid>
					</Grid>

				</Grid>
			)
		}
	}

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

	countInc = () => {
		this.setState((prev) => {
			var next = prev.pending + 1
			return { pending: next, total: max([prev.total, next]) }
		})
	}

	countDec = () => {
		this.setState((prev) => {
			return { pending: prev.pending - 1 }
		})
	}

	componentDidMount = () => {
		var me = this;
		Promise.all(getRealChildren(this.props.host, this.props.cards, this.state.depth, this.countInc, this.countDec)).then((result) => {
			result.forEach((card) => {
				if (!card.appData) card.appData = {}
				card.appData['parentId'] = 'root'	//For d3.stratify
				card.appData['level'] = this.state.depth
			})
			if (me.props.dedupe) {
				var flatted = []
				flattenChildren(result, flatted)
				var reducedTree = removeDuplicates(flatted);
				this.root.children = createTree(reducedTree)
			} else {
				this.root.children = result;
			}
			this.setData()
			this.setState({ fetchActive: false })
			this.setColouring({ colouring: this.state.colouring })
		})

		window.addEventListener('resize', this.resize);
	}

	searchNodeTree = (element, id) => {
		if (element.data.id === id) {
			return element;
		}
		else if (Boolean(element.children)) {
			var i;
			var result = null;
			for (i = 0; result == null && i < element.children.length; i++) {
				result = this.searchNodeTree(element.children[i], id);
			}
			return result
		}
		return null;
	}

	searchRootTree = (element, id) => {
		if (element.id === id) {
			return element;
		}
		else if (Boolean(element.children)) {
			var i;
			var result = null;
			for (i = 0; result == null && i < element.children.length; i++) {
				result = this.searchRootTree(element.children[i], id);
			}
			return result
		}
		return null;
	}

	nodeClicked = (ev) => {
		var node = this.searchNodeTree(this.rootNode, ev.currentTarget.id)
		this.svgNodeClicked(ev, node)
	}

	svgNodeClicked = (ev, target) => {
		var me = this;
		ev.stopPropagation()
		ev.preventDefault()
		if (ev.ctrlKey) {
			if (target.data.children && target.data.children.length) {
				target.data.savedChildren = union(target.data.children, target.data.savedChildren)
				target.data.children = [];
			}
			else if (target.data.savedChildren && target.data.savedChildren.length) {
				target.data.children = target.data.savedChildren;
				target.data.savedChildren = [];
			}
			this.setState((prev) => {
				var rNode = hierarchy(this.root)
				return { rootNode: rNode }
			})
		}
		else if (ev.altKey) {
			document.open("/nui/card/" + target.data.id, "", "noopener=true")
		}
		else if (ev.shiftKey) {

			if (target.data.id != 'root') {
				var newNode = this.searchNodeTree(me.rootNode, target.data.id)
				var newRoot = this.searchRootTree(me.root, target.data.id);
				var parent = this.searchRootTree(me.root, newNode.parent.data.id);
				if (me.focus === target.data.id) {
					if (parent && (parent.id !== 'root')) {
						me.focus = parent.id;
						me.setState({
							rootNode: hierarchy(
								parent
							)
						})
					} else {
						me.focus = null;
						me.setState({
							rootNode: hierarchy(me.root)
						})
					}
				} else {
					me.focus = newRoot.id;
					me.setState({
						rootNode: hierarchy(
							newRoot
						)
					})
				}
			} else {
				me.focus = null;
				me.setState({
					rootNode: hierarchy({
						id: 'root',
						children: [newRoot]
					})
				})
				select(".parentLabel").datum(target).text(d =>
					(d.data.id === "root" ? "" : d.data.id));
				select(".parentTitle").datum(target).text(d => {
					return d.data.title + " : " + d.data.size;
				})
				select(".parentNode").datum(target || me.rootNode);
			}
		} else {
			this.setState({ popUp: target.data.id })
		}
		return true;
	}


	openAsActive = () => {
		var activeList = this.state.topLevelList;
		var as = ""

		if (activeList.length) {
			as += "?active="
			activeList.forEach((item, idx) => {
				as += item.id;
				if (idx < (activeList.length - 1)) {
					as += ","
				}
			})
			as += "&"
		}
		else {
			as += "?"
		}
		as += "sort=" + this.state.sortType
		as += "&mode=" + this.state.mode
		as += "&dir=" + this.state.sortDir
		as += "&colour=" + this.state.colouring
		as += "&depth=" + this.state.depth
		as += "&eb=" + this.state.showErrors

		document.open("/nui/context/" + this.state.board.id + as, "", "noopener=true")
	}
	handleChangeMultiple = (evt, valueList) => {
		var root = { ...this.root };
		var allChildren = root.children
		if (root.savedChildren && (root.savedChildren.length > 0)) allChildren = union(allChildren, root.savedChildren)
		if (valueList.length > 0) {
			root.children = filter(allChildren, function (child) {
				var result = (
					filter(valueList, function (value) {
						var eqv = value.id === child.id;
						return eqv
					}))
				return (result.length > 0)
			})
			root.savedChildren =reject(allChildren, function (child) {
				var result = (
					filter(valueList, function (value) {
						var eqv = value.id === child.id;
						return eqv
					})
				)
				return (result.length > 0)
			})
		} else {
			root.children = allChildren
			root.savedChildren = null;
		}
		this.rootNode = hierarchy(root)
		this.setState({ rootNode: this.rootNode, topLevelList: valueList })
	}

}

export default APBoard