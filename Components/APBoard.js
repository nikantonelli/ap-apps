import { Box, Drawer, Grid, LinearProgress, Stack, TextField, Typography } from "@mui/material";
import { ascending, descending, hierarchy, select } from "d3";
import { filter, max, min, reject, union, unionWith } from "lodash";

import { Settings } from "@mui/icons-material";

import React from "react";

import { APTimeLineView } from "../Apps/TimeLineApp";
import { VIEW_TYPES, createTree, flattenChildren, getRealChildren, removeDuplicates } from "../utils/Client/Sdk";
import { APCard } from "./APCard";

import { HierarchyApp } from "../Apps/HierarchyApp";
import { APPartitionView } from "../Apps/PartitionApp";
import { APSunburstView } from "../Apps/SunburstApp";
import { APTreeView } from "../Apps/TreeApp";
import { ConfigDrawer } from "./ConfigDrawer";

export class APBoard extends HierarchyApp {

	constructor(props) {
		super(props)
		this.state = {
			...this.state,	//Bring state in from higher layers
			fetchActive: true,
			active: props.active,
			rootNode: null,
			topLevelList: props.topLevelList || [],	//Usally, won't have any here, but just in case we decide to
			pending: 0,
			total: 0
		}
	}

	/**
	 * 
	 * This app has to deal with both D3 (i.e. SVG) based and normal React apps
	 * so has two types of tree: a d3-hierarchy and a lodash one.
	 * 
	 * The lodash one is the 'original' tree created from AP children. We manipulate the
	 * D3 tree from it, to generate the views we want.
	 */

	//lodash tree here, D3 one in this.state
	root = {
		id: 'root',
		children: this.props.cards || []
	};

	assignedUserList = [];
	createdUserList = [];
	updatedUserList = [];
	contextList = [];

	componentDidMount = () => {
		this.load(this.props.cards);
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

	load = (usedCards) => {
		var me = this;
		if (typeof document !== "undefined") {
			var svgTarget = document.getElementById("svg_" + this.props.context.id)
			if (Boolean(svgTarget)) svgTarget.replaceChildren()
		}
		Promise.all(getRealChildren(this.props.host, usedCards, this.state.depth, this.countInc, this.countDec)).then((result) => {
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
	}

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
				d.data.assignedUsers.forEach((user) => {
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

	render() {
		if (typeof document !== "undefined") {
			var svgTarget = document.getElementById("svg_" + this.props.context.id)
			if (Boolean(svgTarget)) svgTarget.replaceChildren()
		}
		if (!this.state.fetchActive) {
			var hdrBox = document.getElementById("header-box")
			this.calcTreeData(this.state.rootNode)

			var item = this.state.popUp ? this.searchRootTree(this.root, this.state.popUp) : null
			var appProps = {
				root: this.state.rootNode,
				context: this.props.context,	//Needed for labels at least.
				topLevel: this.state.topLevelList,
				end: this.dateRangeEnd,
				start: this.dateRangeStart,
				grouping: this.state.grouping,
				size:
					[
						window.innerWidth,
						//document.getElementById("svg_" + this.props.context.id).getBoundingClientRect().width,
						window.innerHeight - (hdrBox ? hdrBox.getBoundingClientRect().height : 60) //Pure guesswork on the '60'
					]
				,
				onClick: this.nodeClicked,
				onSvgClick: this.svgNodeClicked,
				sort: this.state.sortType,
				colouring: this.state.colouring,
				colourise: this.state.colourise,
				errorData: this.getD3ErrorData,
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
									context={this.props.context}
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
										defaultValue={this.props.context.title}
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
						<APPartitionView {...appProps} /> : null}
					{this.state.mode === VIEW_TYPES.TREE ?
						<APTreeView {...appProps} /> : null}
					{this.state.mode === VIEW_TYPES.SUNBURST ?
						<APSunburstView {...appProps} /> : null}

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

		document.open("/nui/context/" + this.props.context.id + as, "", "noopener=true")
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
			root.savedChildren = reject(allChildren, function (child) {
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