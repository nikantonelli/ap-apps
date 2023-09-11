import { Settings, WifiTetheringOffSharp } from "@mui/icons-material";
import { Box, Button, Drawer, Grid, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { filter, find, forEach, max, min, orderBy, union, unionWith } from "lodash";
import React from "react";
import { APAllocationView } from "../Apps/AllocationApp";
import { APtimebox } from "../Components/AP-Fields/timebox";
import { ConfigDrawer } from "../Components/ConfigDrawer";
import PlanItem from "../Components/PlanningItem";
import { VIEW_TYPES, doRequest, getRealChildren, searchRootTree } from "../utils/Client/Sdk";
import { HierarchyApp } from "./HierarchyApp";
import { APTreeView } from "./TreeApp";
import { ReqsProgress } from "../Components/ReqsProgress";
import { ascending, descending, hierarchy } from "d3";
import { APCard } from "../Components/APCard";
import { searchNodeTree } from "../utils/Client/SdkSvg";

export class PIPlanApp extends HierarchyApp {

	static CONFIG_PANEL = "config"
	static PLAN_PANEL = "plan"
	static ALLOC_PANEL = "allocation"

	constructor(props) {
		super(props);

		var splitActive = this.props.active ? this.props.active.split(',') : []
		this.state = {
			...this.state,
			context: props.context,
			cards: props.cards || [],
			planningSeries: [],
			currentSeries: null,
			seriesIncrements: [],
			currentTimebox: null,
			topLevelList: {
				active: splitActive.length ? splitActive : [],
				passive: []
			},
			currentPanel: this.props.panel || 'config',
			drawerWidth: this.props.drawerWidth || 400,
			mode: VIEW_TYPES.TREE 	//Default view type
		}
	}

	root = {
		id: 'root',
		children: this.props.cards || []
	};

	componentDidMount() {
		//Now get the planning series called "PI Planning" and the sub-increments
		var allSeries = []
		if (this.state.context && this.state.context.planningSeries.length) {
			var seriesSet = this.state.context.planningSeries
			seriesSet.forEach(async (series) => {
				var cParams = {
					host: this.props.host,
					mode: "GET",
					url: "/timebox/" + series.id
				}
				var cResult = await doRequest(cParams)
				allSeries.push(cResult)
				this.setAllSeries(allSeries);
			})
		}
	}

	setAllSeries = (series) => {
		this.setState({ planningSeries: series })
		if (this.props.series && find(series, { id: this.props.series })) {
			this.seriesChange({ target: { value: this.props.series } })
		}
	}

	setCurrentSeries = (currentSeries) => {
		this.setState({ currentSeries: currentSeries })
	}
	setAllTimeboxes = (increments) => {
		this.setState({ seriesIncrements: increments })
	}

	setCurrentTimebox = (currentIncrement) => {
		this.setState({ currentTimebox: currentIncrement })
	}

	seriesChange = async (evt) => {
		// Get the list of planning increments for the series and repopulate the dropdown for the top level increment
		var cParams = {
			host: this.props.host,
			mode: "GET",
			url: "/timebox/" + evt.target.value + "?incr=all"
		}
		var cResult = await doRequest(cParams)
		var increments = orderBy(cResult.increments, ["startDate"], ["desc"])
		this.setCurrentSeries(find(this.state.planningSeries, { id: evt.target.value }))
		this.setAllTimeboxes(increments)
		var foundTimebox = null;
		if (this.props.timebox && (foundTimebox = find(increments, { id: this.props.timebox }))) {
			this.updateTimeBox(increments, this.props.timebox);
		} else {
			this.updateTimeBox(increments, increments[0].id);
		}
	}

	updateTimeBox = (timeboxes, tid) => {
		//Filter the root items to those that are part of this increment
		var incrementList = []
		var activeList = []
		var passiveList = []
		incrementList = filter(this.props.cards, (card) => {
			var increments = card.planningIncrements;
			return (find(increments, { id: tid }) !== undefined)
		})

		var propsActiveList = incrementList.map(item => item.id);

		if (this.props.active) propsActiveList = this.props.active.split(',');

		if (Boolean(incrementList)) {
			forEach(incrementList, (card) => {
				if (find(propsActiveList, (item) => {
					return item === card.id
				}))
					activeList.push(card)
				else
					passiveList.push(card)
			})
		}

		this.setCurrentTimebox(find(timeboxes, { id: tid }))
		this.data = this.createAllocationData(activeList, passiveList)
	}

	createAllocationData = async (activeList, passiveList) => {
		var me = this;
		this.fetchActive = true
		this.countReset();
		Promise.all(getRealChildren(this.props.host, activeList, this.state.depth, this.countInc, this.countDec)).then((cards) => {
			cards.forEach((card) => {
				if (!card.appData) card.appData = {}
				card.appData['parentId'] = 'root'	//For d3.stratify
				card.appData['level'] = this.state.depth
			})
			if (me.props.dedupe) {
				var flatted = []
				flattenChildren(cards, flatted)
				var reducedTree = removeDuplicates(flatted);
				me.root.children = createTree(reducedTree)
			} else {
				me.root.children = cards;
			}
			me.fetchActive = false
			me.setState({ topLevelList: { active: activeList, passive: passiveList } })
			me.setData()
			me.setColouring({ colouring: me.state.colouring })
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
					
					case 'plannedStart': {
						return dirFnc(new Date(a.data.plannedStart), new Date(b.data.plannedStart))
					}
					//Dates need to be backwards to be more useful: ascending means from now until later
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

	timeboxChange = (evt) => {
		this.updateTimeBox(this.state.seriesIncrements, evt.target.value)
	}

	openAsActive = () => {
		var activeList = this.state.topLevelList.active;
		var as = ""
		var ex = ""

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
			ex += "?"
		}
		if (this.state.currentSeries) {
			as += ex + "srs=" + this.state.currentSeries.id
			if (this.state.currentTimebox) as += "&tmb=" + this.state.currentTimebox.id
		}
		as += "&sort=" + this.state.sortType
		as += "&mode=" + this.state.mode
		as += "&dir=" + this.state.sortDir
		as += "&colour=" + this.state.colouring
		as += "&depth=" + this.state.depth
		as += "&eb=" + this.state.showErrors

		document.open("/nui/planning/" + this.state.context.id + as, "", "noopener=true")
	}

	cardSelectChange = (id, newState) => {
		this.setState((prevState) => {
			var topLevelList = {}
			if (newState === false) {
				topLevelList = {
					passive: _.union(prevState.topLevelList.passive, _.remove(prevState.topLevelList.active, { id: id })),
					active: prevState.topLevelList.active
				}
			}
			else {
				topLevelList = {
					active: _.union(prevState.topLevelList.active, _.remove(prevState.topLevelList.passive, { id: id })),
					passive: prevState.topLevelList.passive
				}
			}
			this.root.children = topLevelList.active
			this.rootNode = hierarchy(this.root)
			return { topLevelList: topLevelList, rootNode: this.rootNode }
		})
	}

	render() {
		if (this.state.context) {
			if (this.rootNode) this.calcTreeData(this.rootNode)
			var item = this.state.popUp ? searchRootTree(this.root, this.state.popUp) : null
			return (
				<>
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
					<Paper>
						<Button size="small" variant={this.state.currentPanel === PIPlanApp.CONFIG_PANEL ? "contained" : "text"} name={PIPlanApp.CONFIG_PANEL} onClick={this.panelChange}>
							Configuration
						</Button>

						{(this.state.currentSeries && this.state.currentTimebox) ?
							<>
								<Button size="small" variant={this.state.currentPanel === PIPlanApp.PLAN_PANEL ? "contained" : "text"} name={PIPlanApp.PLAN_PANEL} onClick={this.panelChange}>
									Planning
								</Button>
								<Button size="small" variant={this.state.currentPanel === PIPlanApp.ALLOC_PANEL ? "contained" : "text"} name={PIPlanApp.ALLOC_PANEL} onClick={this.panelChange}>
									Allocation
								</Button>
							</> :
							null}
						<Button disabled>
							<Typography sx={{ padding: "0px 4px 0px 0px" }}>{this.state.context.title + " :"}</Typography>
							{this.state.currentSeries ?
								<Typography sx={{ padding: "0px 4px 0px 0px" }}>{this.state.currentSeries.label + " :"}</Typography>
								: null}
							{this.state.currentTimebox ?
								<Typography sx={{ padding: "0px 4px 0px 0px" }}>{this.state.currentTimebox.label}</Typography>
								: null}
						</Button>
					</Paper>
					{this.state.currentPanel === PIPlanApp.CONFIG_PANEL ?
						<div className="content">
							<Grid container>
								<Grid item sx={{ margin: "2px" }}>
									<>
										<Tooltip title="Configure Settings">
											<IconButton sx={{ margin: "0px 10px 0px 10px" }} onClick={this.openDrawer}>
												<Settings />
											</IconButton>
										</Tooltip>
										<ConfigDrawer
											onClose={this.closeDrawer}
											openInNew={this.openAsActive}
											width={this.state.drawerWidth}
											open={this.state.configOpen}
											items={this.state.topLevelList}
											allItems={this.props.cards}
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
									</>
								</Grid>

								<Grid item sx={{ margin: "2px" }}>
									<APtimebox
										title="Planning Series"
										timeBoxChange={this.seriesChange}
										timeboxes={this.state.planningSeries}
										initialTimeBox={this.state.currentSeries ? this.state.currentSeries.id : null}
									/>
								</Grid>
								<Grid item sx={{ margin: "2px" }}>
									<APtimebox
										title="Planning Timebox"
										timeBoxChange={this.timeboxChange}
										timeboxes={this.state.seriesIncrements}
										initialTimeBox={this.state.currentTimebox ? this.state.currentTimebox.id : null}
									/>
								</Grid>
								{this.fetchActive ?
									<Grid item>
										<ReqsProgress pending={this.state.reqsPending} complete={this.state.reqsComplete} />
									</Grid>
									: null}
							</Grid>


							<Grid container direction="column" className="board-grid">
								{this.state.topLevelList.active.length ?
									<>
										<Grid item>
											<Typography>Considering:</Typography>
										</Grid>
										<Grid item><Grid container direction="row">
											{this.state.topLevelList.active.map((card, idx) => {
												return (
													<Grid key={idx + 1} item sx={{ margin: "2px" }}>
														<PlanItem
															card={card}
															showSelector
															selected={true}
															selectChange={this.cardSelectChange} />
													</Grid>
												)
											})}
										</Grid>
										</Grid>
									</>
									: null}
							</Grid>
							<Grid container direction="column" className="board-grid">
								{this.state.topLevelList.passive.length ?
									<>
										<Grid item>
											<Typography>Out of Scope:</Typography>
										</Grid>
										<Grid item>
											<Grid container direction="row">
												{this.state.topLevelList.passive.map((card, idx) => {
													return (
														<Grid key={idx + 1} item>

															<PlanItem
																card={card}
																showSelector
																selected={false}
																selectChange={this.cardSelectChange} />
														</Grid>
													)
												})}
											</Grid>
										</Grid>
									</>
									: null}

							</Grid>



						</div >
						: null
					}
					{
						this.state.currentPanel === PIPlanApp.PLAN_PANEL ?
							<div id={PIPlanApp.PLAN_PANEL} className="content">
								{this.getPanelType()}
							</div>
							: null
					}
					{
						this.state.currentPanel === PIPlanApp.PLAN_PANEL ?
							<div id={PIPlanApp.ALLOC_PANEL} className="content">
								<APAllocationView
									target={PIPlanApp.ALLOC_PANEL}
									context={this.state.context}
									cards={this.state.topLevelList.active}
									depth={this.state.depth}
									colour={this.state.colouring}
									mode={this.state.mode}
									sort={this.state.sortType}
									eb={this.state.showErrors}
									sortDir={this.state.sortDir}
									host={this.props.host}
									timebox={this.state.currentTimebox}
								/>
							</div>
							: null
					}
				</>)
		}
		else {
			return null
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
				var newNode = searchNodeTree(me.rootNode, target.data.id)
				var newRoot = searchRootTree(me.root, target.data.id);
				var parent = searchRootTree(me.root, newNode.parent.data.id);
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

	getPanelType = () => {
		if (typeof document !== "undefined") {
			var svgTarget = document.getElementById("svg_" + this.state.context.id)
			if (Boolean(svgTarget)) svgTarget.replaceChildren()

			var hdrBox = document.getElementById("header-box")
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
						window.innerHeight - (hdrBox ? hdrBox.getBoundingClientRect().height : 60) //Pure guesswork on the '60'
					]
				,
				target: svgTarget,
				//onClick: this.nodeClicked,
				sort: this.state.sortType,
				colouring: this.state.colouring,
				colourise: this.state.colourise,
				errorData: this.getD3ErrorData,
			}

			switch (this.state.mode) {
				case 'tree': {
					return (
						<>
							<APTreeView
								{...appProps}
								onSvgClick={this.svgNodeClicked}
							/>
						</>)
				}
			}

		}
	}

	panelChange = (evt) => {
		this.setState({ currentPanel: evt.target.name })
	}
}