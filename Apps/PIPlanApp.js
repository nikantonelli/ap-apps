import { Settings } from "@mui/icons-material";
import { Button, Grid, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { filter, find, forEach, orderBy } from "lodash";
import React from "react";
import { APAllocationView } from "../Apps/AllocationApp";
import { APtimebox } from "../Components/AP-Fields/timebox";
import APBoard from "../Components/APBoard";
import { ConfigDrawer } from "../Components/ConfigDrawer";
import PlanItem from "../Components/PlanningItem";
import { VIEW_TYPES, doRequest, getCardHierarchy } from "../utils/Client/Sdk";
import { NiksApp } from "./App";

export class PIPlanApp extends NiksApp {

	static CONFIG_PANEL = "config"
	static PLAN_PANEL = "plan"
	static ALLOC_PANEL = "allocation"

	constructor(props) {
		super(props);
		
		var splitActive = this.props.active ? this.props.active.split(',') : []
		this.state = {
			...this.state,
			context: props.board,
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
			transitionDone: true,
			drawerWidth: this.props.drawerWidth || 400,
			mode: VIEW_TYPES.TREE 	//Default view type
		}
	}

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

		this.data = this.createAllocationData(activeList)
		this.setState({ topLevelList: { active: activeList, passive: passiveList } })
		this.setCurrentTimebox(find(timeboxes, { id: tid }))
	}

	createAllocationData = async (cardList) => {
		var groups = [];
		//Get all the boards

		//First get the hierarchy
		for (var i = 0; i < cardList.length; i++) {
			await getCardHierarchy(this.props.host, cardList[i], 'children', this.state.depth)

		}

		// var boards = await findBoards(this.props.host, 
		// 	{search: 
		// 		join(
		// 			uniq( cardList.map((card) => card.board.title)),
		// 			',')
		// 	})

		// switch (this.state.grouping) {
		// 	case 'level': {
		// 		//Get the levels from the system? Or just use the levesl from the boards we have
		// 		break;
		// 	}

		// 	case 'board': {

		// 		break;
		// 	}
		// }

		return cardList;
	}

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
		var card = null;
		this.setState((prevState) => {
			if (newState === false) {
				return {
					topLevelList: {
						passive: _.union(prevState.topLevelList.passive, _.remove(prevState.topLevelList.active, { id: id })),
						active: prevState.topLevelList.active
					}
				}
			}
			else {
				return {
					topLevelList: {
						active: _.union(prevState.topLevelList.active, _.remove(prevState.topLevelList.passive, { id: id })),
						passive: prevState.topLevelList.passive
					}
				}
			}
		})
	}

	render() {
		if (this.state.context) {
			return (
				<>
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
									board={this.state.context}
									cards={this.state.topLevelList.active}
									depth={this.props.depth}
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

	getPanelType = () => {
		return (
			<>
				<APBoard
					target={PIPlanApp.PLAN_PANEL}
					board={this.state.context}
					cards={this.state.topLevelList.active}
					depth={this.props.depth}
					colour={this.state.colouring}
					mode={this.state.mode}
					sort={this.state.sortType}
					eb={this.state.showErrors}
					sortDir={this.state.sortDir}
					host={this.props.host}
				/>
				<svg id={"svg_" + this.state.context.id} />
			</>)
	}
	modeChange = (mode) => {
		this.setState({ mode: mode })
	}

	sortChange = (sort) => {
		this.setState({ sort: sort })
	}

	colourChange = (colour) => {
		this.setState({ colouring: colour })
	}

	sortDirChange = (sortDir) => {
		this.setState({ sortDir: sortDir })
	}

	errorChange = (eb) => {
		this.setState({ showErrors: eb })
	}

	panelChange = (evt) => {
		this.setState({ currentPanel: evt.target.name, transitionDone: false })
	}

	transitionDone = (evt) => {
		this.setState({ transitionDone: true })
	}
}