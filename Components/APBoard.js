import { Box, Drawer, Grid, Stack, TextField } from "@mui/material";
import { hierarchy } from "d3";
import { filter, max, min, reject, union, unionWith } from "lodash";

import { Settings } from "@mui/icons-material";

import React from "react";

import { APTimeLineView } from "../Apps/TimeLineApp";
import { VIEW_TYPES, createTree, flattenChildren, getRealChildren, removeDuplicates, searchRootTree } from "../Utils/Client/Sdk";
import { APCard } from "./APCard";

import { HierarchyApp } from "../Apps/HierarchyApp";
import { APPartitionView } from "../Apps/PartitionApp";
import { APSunburstView } from "../Apps/SunburstApp";
import { APTreeView } from "../Apps/TreeApp";
import { compareSvgNode, searchNodeTree, svgNodeClicked } from "../Utils/Client/SdkSvg";
import { ConfigDrawer } from "./ConfigDrawer";
import { ReqsProgress } from "./ReqsProgress";

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

	componentDidMount = () => {
		this.load(this.props.cards);
		window.addEventListener('resize', this.resize);
	}

	load = (usedCards) => {
		var me = this;
		if (typeof document !== "undefined") {
			var svgTarget = document.getElementById("svg_" + this.props.context.id)
			if (Boolean(svgTarget)) svgTarget.replaceChildren()
		}
		//Add in that we already have these cards from the server
		usedCards.forEach(() => {
			this.countInc()
			this.countDec()
		})
		
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
				return compareSvgNode(me.state.sortType,  me.state.sortDir, a, b) 
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

			var item = this.state.popUp ? searchRootTree(this.root, this.state.popUp) : null
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
				<Stack sx={{ width: '100%' }}>
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

					{this.state.view === VIEW_TYPES.TIMELINE ?
						<APTimeLineView {...appProps}
						/> : null}

					{this.state.view === VIEW_TYPES.PARTITION ?
						<APPartitionView {...appProps} /> : null}
					{this.state.view === VIEW_TYPES.TREE ?
						<APTreeView {...appProps} /> : null}
					{this.state.view === VIEW_TYPES.SUNBURST ?
						<APSunburstView {...appProps} /> : null}

					<ConfigDrawer
						onClose={this.closeDrawer}
						onChange={this.handleChangeMultiple}
						openInNew={this.openAsActive}
						width={this.state.drawerWidth}
						open={this.state.configOpen}
						items={this.state.topLevelList}
						allItems={this.root.children}
						view={this.state.view}
						viewChange={this.viewChange}
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
				<ReqsProgress pending={this.state.reqsPending} complete={this.state.reqsComplete}/>
			)
		}
	}

	

	nodeClicked = (ev) => {
		var node = searchNodeTree(this.rootNode, ev.currentTarget.id)
		this.svgNodeClicked(ev, node)
	}

	svgNodeClicked = (ev, node) => {
		svgNodeClicked.call(this, ev, node)
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
		as += "&view=" + this.state.view
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