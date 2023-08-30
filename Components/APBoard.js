import { Autocomplete, Box, Button, Drawer, FormControl, Grid, InputLabel, Menu, MenuItem, Select, Stack, TextField, Tooltip } from "@mui/material";
import { hierarchy, stratify, select, scaleOrdinal, quantize, interpolateRainbow, interpolateCool, interpolateWarm, ascending, descending } from "d3";
import _, { concat, forEach } from "lodash";

import { HighlightOff, OpenInNew, Settings } from "@mui/icons-material";

import React from "react";

import { APcard } from "../Components/APcard";
import { APTimeLineView } from "../Components/TimeLineApp";
import { VIEW_TYPES, createTree, flattenTree, getRealChildren, removeDuplicates } from "../utils/Client/Sdk";

import App from "./App";
import { APPartitionView } from "./PartitionApp";
import { APSunburstView } from "./SunburstApp";
import { APTreeView } from "./TreeApp";

export class APBoard extends App {

	static DEFAULT_TREE_DEPTH = 3;
	static DEFAULT_SUNBURST_DEPTH = 3;	//Three rings of children plus the root
	static OPACITY_HIGH = 1.0;
	static OPACITY_MEDIUM = 0.7;
	static OPACITY_LOW = 0.3;
	static OPACITY_VERY_LOW = 0.1;

	constructor(props) {
		super(props)

		var stateDepth = this.props.depth || APBoard.DEFAULT_TREE_DEPTH
		if (stateDepth < 0) stateDepth = 99;	//If -1 passed in, then do as much as anyone stupid would want.
		this.state = {
			...this.state,
			mode: this.props.mode || VIEW_TYPES.TREE,
			anchorEl: null,
			drawerOpen: false,
			menuOpen: false,
			board: this.props.board,
			fetchActive: true,
			active: props.active,
			drawerWidth: this.props.drawerWidth || 400,
			depth: stateDepth,
			pending: 0,
			total: 0,
			topLevelList: props.topLevelList || [],
			popUp: null,
			sortType: this.props.sort || 'none',
			sortDir: this.props.dir || 'ascending',
			clickCount: 0,
			colouring: this.props.colour || 'type',
			grouping: this.props.group || 'level',
			showErrors: this.props.eb || 'off',
			colourise: this.typeColouring,
		}
	}

	popUp = null

	root = {
		id: 'root',
		children: this.props.cards || []
	};
	assignedUserList = [];
	createdUserList = [];
	updatedUserList = [];
	contextList = [];


	/**
	 * Two stage colour fetching:
	 * 1. Optional: Set up a function to convert a value to a colour
	 * 2. Call a function (that could call that previous function) with the 'd' parameter
	 * 	that converts d to a value.
	 * 
	 * You could, of course, only have one function that converts 'd' to a colour
	 */
	opacityDrop = true;
	colourFnc = null;

	tempColouring = (d) => {
		this.opacityDrop = true;
		var mine = this.searchNodeTree(this.rootNode, d.data.id)
		while (mine.parent && mine.parent.data.id != 'root') {
			mine = mine.parent;
		}
		return this.colourFnc((mine ? mine.index : 1) + 1);
	}

	typeColouring = (d) => {
		this.opacityDrop = false;
		if (d.data) return d.data.type.cardColor
		else return "#ccc"
	}

	//Get first assigned user only
	aUserColouring = (d) => {
		this.opacityDrop = false;
		var user = null;
		//Assigned users is always returned and empty if there are none
		if (d.data.assignedUsers.length) {
			user = d.data.assignedUsers[0];
			var index = _.findIndex(this.assignedUserList, function (assignee) {
				return user.id === assignee.id;
			})
			if (index >= 0) return this.colourFnc(index);
		}
		return this.colourFnc(0);
	}

	lUserColouring = (d) => {
		this.opacityDrop = false;
		var user = null;
		//last update users is always returned and empty if there are none
		if (d.data.updatedBy) {
			user = d.data.updatedBy;
			var index = _.findIndex(this.updatedUserList, function (assignee) {
				return user.id === assignee.id;
			})
			if (index >= 0) return this.colourFnc(index);
		}
		return this.colourFnc(0);
	}

	cUserColouring = (d) => {
		this.opacityDrop = false;
		var index = -1;
		//creator users is always returned and empty if there are none
		if (d.data.createdBy) {
			index = _.findIndex(this.createdUserList, function (user) {
				return d.data.createdBy.id === user.id;
			})
		}
		var colour = this.colourFnc((index >= 0) ? index : 0);
		return colour
	}

	contextColouring = (d) => {
		this.opacityDrop = false;
		var boardid = d.data.board.id
		var index = _.findIndex(this.contextList, function (context) {
			return boardid === context.id;
		})
		if (index >= 0) return this.colourFnc(index);

		return this.colourFnc(0);
	}

	stateColouring = (d) => {
		this.opacityDrop = false;
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

	closePopUp = () => {
		this.popUp = null
		this.setState({ popUp: null })
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

				d.parent.latest = _.max([pPF, pPS, pf, ps, d.parent.latest])
				d.parent.earliest = _.min([pPF, pPS, pf, ps, d.parent.earliest])

				rootNode.latest = _.max([pPF, pPS, pf, ps, aPF, aPS, af, as, rootNode.latest])
				rootNode.earliest = _.min([pPF, pPS, pf, ps, aPF, aPS, af, as, rootNode.earliest])
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
				_.forEach(d.data.assignedUsers, (user) => {
					this.assignedUserList = _.unionWith(this.assignedUserList, [user], function (a, b) { return b.id === a.id })
				})
			}
			if (d.data.createdBy) {
				this.createdUserList = _.unionWith(this.createdUserList, [d.data.createdBy], function (a, b) { return b.id === a.id })
			}
			if (d.data.updatedBy) {
				this.updatedUserList = _.unionWith(this.updatedUserList, [d.data.updatedBy], function (a, b) { return b.id === a.id })
			}
			if (d.data.id != 'root') {
				this.contextList = _.unionWith(this.contextList, [d.data.board], function (a, b) { return b.id === a.id })
				//Ensure that the colouring function is called in a consistent order. You can end up with different colour if you don't
				d.colour = this.state.colourise(d);

			}
			d.opacity = 1.0
		})
	};

	addPortals = () => {
		var portals = [];
		var allItems = []
		flattenTree(this.root.children, allItems)
		var me = this;
		allItems.forEach(function (item, idx) {

			var parents = []	//TODO: add parents to children

			//Create a load of popups to show card details
			portals.push(
				<Drawer
					onClose={me.closePopUp}
					key={idx}
					id={"portal_" + item.id}
					open={
						Boolean(me.state.popUp === item.id)
					}
				>
					<Box>
						<APcard
							descendants={item.children}
							parents={parents}
							cardProps={{ maxWidth: 700, flexGrow: 1 }}
							host={me.props.host}
							card={item}
							context={me.state.context}
							onClose={me.closePopUp}
							readOnly
						/>
					</Box>
				</Drawer>

			)
		})
		return portals;
	}

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
		this.setState({ grouping: value });
		if (this.props.groupChange) this.props.groupChange(value);
	}

	colourChange = (e) => {
		var value = e.target.value;
		this.setColouring({ colouring: value })

		if (this.props.colourChange) this.props.colourChange(value);
	}

	render() {
		if (!this.state.fetchActive) {
			var hdrBox = document.getElementById("header-box")
			this.calcTreeData(this.state.rootNode)
			return (<>
				{this.addPortals()}
				<Stack id="portalContainer" sx={{ width: '100%' }}>

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
					<Menu
						open={Boolean(this.state.anchorEl)}
						anchorEl={this.state.anchorEl}
						onClose={this.closeMenu}
						anchorOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
					>

						<MenuItem value='expand' onClick={this.closeMenu}>Restore All</MenuItem>
						{(this.state.active && this.state.active.length) ?
							<MenuItem value='reloadAll' onClick={this.closeMenu}>Reload All</MenuItem>
							: null}
					</Menu>


					{this.state.mode === VIEW_TYPES.TIMELINE ?
						<APTimeLineView
							end={this.dateRangeEnd}
							start={this.dateRangeStart}
							root={this.state.rootNode}
							onClick={this.nodeClicked}
							sort={this.state.sortType}
							colouring={this.state.colouring}
							colourise={this.state.colourise}
							errorData={this.getErrorData}
						/> : null}

					{this.state.mode === VIEW_TYPES.PARTITION ?
						<APPartitionView
							size={
								[
									window.innerWidth - 20,	//Space for the scroll bar
									window.innerHeight - (hdrBox ? hdrBox.getBoundingClientRect().height : 60) //Pure guesswork on the '60'
								]
							}

							target={document.getElementById("svg_" + this.state.board.id)}
							board={this.state.board}
							root={this.state.rootNode}
							onClick={this.svgNodeClicked}
							sort={this.state.sortType}
							colouring={this.state.colouring}
							colourise={this.state.colourise}
							errorData={this.getErrorData}
						/> : null}

					{this.state.mode === VIEW_TYPES.TREE ?
						<APTreeView
							size={
								[
									window.innerWidth,
									//document.getElementById("svg_" + this.state.board.id).getBoundingClientRect().width,
									window.innerHeight - (hdrBox ? hdrBox.getBoundingClientRect().height : 60) //Pure guesswork on the '60'
								]
							}

							target={document.getElementById("svg_" + this.state.board.id)}
							board={this.state.board}
							root={this.state.rootNode}
							onClick={this.svgNodeClicked}
							sort={this.state.sortType}
							colouring={this.state.colouring}
							colourise={this.state.colourise}
							errorData={this.getErrorData}
						/> : null}
					{this.state.mode === VIEW_TYPES.SUNBURST ?
						<APSunburstView
							size={
								[
									window.innerWidth,
									window.innerHeight - (hdrBox ? hdrBox.getBoundingClientRect().height : 60) //Pure guesswork on the '60'
								]
							}
							depth={this.state.depth}
							target={document.getElementById("svg_" + this.state.board.id)}
							board={this.state.board}
							root={this.state.rootNode}
							onClick={this.svgNodeClicked}
							opacityDrop
							sort={this.state.sortType}
							colouring={this.state.colouring}
							colourise={this.state.colourise}
							errorColour={this.getErrorData}
							errorData={this.getErrorData}
						/> : null}
					<Drawer

						onClose={this.closeDrawer}
						open={Boolean(this.state.drawerOpen)}
						anchor='left'
						sx={{
							width: this.state.drawerWidth,
							flexShrink: 0,
							[`& .MuiDrawer-paper`]: { width: this.state.drawerWidth, boxSizing: 'border-box' },
						}}
					>
						<Box>
							<Grid container direction="column">
								<Grid item>
									<Grid container direction="row">
										<Grid xs={6} item>
											<Button
												aria-label="Open As New Tab"
												onClick={this.openAsActive}
												endIcon={<OpenInNew />}
											>
												Open Copy
											</Button>
										</Grid>
										<Grid xs={6} item>
											<Grid sx={{ justifyContent: 'flex-end' }} container>

												<Tooltip title='Close Settings'>
													<HighlightOff onClick={this.closeDrawer} />
												</Tooltip>
											</Grid>
										</Grid>
									</Grid>
								</Grid>
								<Grid item>
									{this.topLevelList()}
								</Grid>
								<Grid item>
									<Grid container>
										<Grid item>
											<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
												<InputLabel>Mode</InputLabel>
												<Select
													value={this.state.mode}
													onChange={this.modeChange}
													label="Mode"
												>
													<MenuItem value={VIEW_TYPES.TREE}>Tree</MenuItem>
													<MenuItem value={VIEW_TYPES.SUNBURST}>Sunburst</MenuItem>
													<MenuItem value={VIEW_TYPES.PARTITION}>Partition</MenuItem>
													<MenuItem value={VIEW_TYPES.TIMELINE}>Timeline</MenuItem>
												</Select>
											</FormControl>
										</Grid>
										<Grid item>
											<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
												<InputLabel>Sort By</InputLabel>
												<Select
													value={this.state.sortType}
													onChange={this.sortChange}
													label="Sort By"
												>
													<MenuItem value="none">None</MenuItem>
													<MenuItem value="plannedStart">Planned Start</MenuItem>
													<MenuItem value="plannedFinish">Planned End</MenuItem>
													<MenuItem value="size">Size</MenuItem>
													<MenuItem value="r_size">Size Rollup</MenuItem>
													{this.state.mode === VIEW_TYPES.SUNBURST ? null : <MenuItem value="title">Title</MenuItem>}
													<MenuItem value="score">Score Total</MenuItem>
													{this.state.mode === VIEW_TYPES.TREE ? null : <MenuItem value="count">Card Count</MenuItem>}

													<MenuItem value="id">ID#</MenuItem>
												</Select>
											</FormControl>
										</Grid>
										<Grid item >
											<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
												<InputLabel>Sort Direction</InputLabel>
												<Select
													value={this.state.sortDir}
													onChange={this.sortDirChange}
													label="Sort Direction"
												>
													<MenuItem value="ascending">Ascending</MenuItem>
													<MenuItem value="descending">Descending</MenuItem>
												</Select>
											</FormControl>
										</Grid>
										<Grid item>
											<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
												<InputLabel>Colours</InputLabel>
												<Select
													value={this.state.colouring}
													onChange={this.colourChange}
													label="Colours"
												>
													<MenuItem value="cool">Cool</MenuItem>
													<MenuItem value="warm">Warm</MenuItem>
													<MenuItem value="type">Card Type</MenuItem>
													<MenuItem value="state">Card State</MenuItem>
													<MenuItem value="l_user">Last Updater</MenuItem>
													<MenuItem value="c_user">Creator</MenuItem>
													<MenuItem value="a_user">First Assignee</MenuItem>
													<MenuItem value="context">Context</MenuItem>
												</Select>
											</FormControl>
										</Grid>
										{this.state.mode === VIEW_TYPES.TIMELINE ? (
											<Grid item>
												<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
													<InputLabel>Group By</InputLabel>
													<Select
														value={this.state.grouping}
														onChange={this.groupChange}
														label="Grouping"
													>
														<MenuItem value="level">Level</MenuItem>
														<MenuItem value="context">Context</MenuItem>
														<MenuItem value="type">Card Type</MenuItem>
													</Select>
												</FormControl>
											</Grid>
										) : null}
										<Grid item>
											<FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
												<InputLabel>Error Bars</InputLabel>
												<Select
													value={this.state.showErrors}
													onChange={this.errorChange}
													label="Errors"
												>
													<MenuItem value="on">On</MenuItem>
													<MenuItem value="off">Off</MenuItem>
												</Select>
											</FormControl>
										</Grid>
									</Grid>
								</Grid>

							</Grid>
						</Box>
					</Drawer>
				</Stack >
			</>
			)
		}
	}

	sortData = (items) => {
		var sortField = "state";
		var sortDir = "asc"


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
		this.setState({ rootNode: this.rootNode })
	}


	componentDidMount = () => {
		var me = this;
		Promise.all(getRealChildren(this.props.host, this.props.cards, this.state.depth)).then((result) => {
			result.forEach((card) => {
				card.parentId = 'root'	//For d3.stratify
			})
			if (me.props.dedupe) {
				var flatted = []
				flattenTree(result, flatted)
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
				target.data.savedChildren = _.union(target.data.children, target.data.savedChildren)
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
			this.popUp = target.data.id
			this.setState({ popUp: target.data.id })
		}
		return true;
	}

	resetChildren = (node) => {
		node.children = _.union(node.children || [], node.savedChildren || [])
		node.savedChildren = [];
		node.children.forEach((child) => {
			this.resetChildren(child)
		})
	}

	enableMenu = (e) => {
		this.setState({ anchorEl: e.currentTarget })
	}

	closeMenu = async (e) => {
		var command = e.target.getAttribute('value');

		switch (command) {
			case 'expand': {
				var data = this.rootNode && this.rootNode.children
				if (data) data.forEach((item) => { this.resetChildren(item) })
				break;
			}
			case VIEW_TYPES.TREE:
			case VIEW_TYPES.PARTITION:
			case VIEW_TYPES.SUNBURST: {
				//Force a redraw as well
				this.setState({ mode: e.target.getAttribute('value') })
				break;
			}
			case 'reloadAll': {
				this.reloadInProgress = true;
				this.load();
				break;
			}

			case 'savePDF': {
				// 	var doc = new jsPDF(
				// 		{
				// 			orientation: "l",
				// 			unit: 'px',
				// 			format: "a4",
				// 			hotfixes: ["px_scaling"]
				// 		}
				// 	);
				// 	var svg = document.getElementById("svg_" + this.state.board.id);
				// 	var svgAsXml = new XMLSerializer().serializeToString(svg)
				// 	await doc.addSvgAsImage(svgAsXml, 0, 0, svg.getBoundingClientRect().width, svg.getBoundingClientRect().height)
				// 	doc.save(this.state.board.id + ".pdf")
				break;
			}
		}

		this.setState({ anchorEl: null })
	}

	openDrawer = () => {
		this.setState({ drawerOpen: true })
	}

	closeDrawer = () => {
		this.setState({ drawerOpen: false })
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
		if (root.savedChildren && (root.savedChildren.length > 0)) allChildren = _.union(allChildren, root.savedChildren)
		if (valueList.length > 0) {
			root.children = _.filter(allChildren, function (child) {
				var result = (
					_.filter(valueList, function (value) {
						var eqv = value.id === child.id;
						return eqv
					}))
				return (result.length > 0)
			})
			root.savedChildren = _.reject(allChildren, function (child) {
				var result = (
					_.filter(valueList, function (value) {
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

	topLevelList = () => {
		//Top level list is the children of root

		var cardList = this.root.children
		return (cardList && cardList.length) ? (
			<Autocomplete
				freeSolo
				multiple
				clearOnEscape
				id="root-child-selector"
				disableClearable
				onChange={this.handleChangeMultiple}
				value={this.state.topLevelList}
				options={cardList}
				getOptionLabel={(option) => option.title}
				renderOption={(props, option) => {
					return (
						<li {...props} key={option.id}>
							{option.title}
						</li>
					);
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						label="Click here to search cards"
						InputProps={{
							...params.InputProps,
							type: 'search',
						}}
					/>
				)}
			/>

		) : null
	}

	saveLowerChildren = (cnt, depth, node) => {
		if (cnt < depth) {
			forEach(node.children, (child) => this.saveLowerChildren(cnt + 1, depth, child))
		} else {
			node.hiddenChildren = _.union(node.savedChildren, node.children)
			node.children = null;
			node.savedChildren = null;
		}

	}

}

export default APBoard