import React from "react";
import { doRequest } from "../utils/Client/Sdk";
import Column from "./Column";
import { APtimebox } from "./AP-Fields/timebox";
import { filter, find, orderBy, join } from "lodash";
import { Grid, IconButton, Typography } from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import PlanItem from "./PlanningItem";
import Board from "../pages/nui/context/[id]";

export class PIPlanApp extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			context: props.board,
			cards: props.cards || [],
			planningSeries: [],
			currentSeries: "",
			seriesIncrements: [],
			currentTimebox: "",
			topLevelList: {
				active: [],
				passive: []
			},
			currentPanel: this.props.panel || 'plan'
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
				var cResponse = await doRequest(cParams)
				var cResult = await cResponse.json()
				allSeries.push(cResult)
				this.setAllSeries(allSeries);
			})
		}
	}

	setAllSeries = (series) => {
		this.setState({ planningSeries: series })
		if (this.props.series && find(series, { id: this.props.series })) {
			this.setCurrentSeries(this.props.series)
		}
	}

	setCurrentSeries = (currentSeriesId) => {
		this.setState({ currentSeries: currentSeriesId })
	}
	setAllTimeboxes = (increments) => {
		this.setState({ seriesIncrements: increments })
	}

	setCurrentTimebox = (currentIncrementId) => {
		this.setState({ currentTimebox: currentIncrementId })
	}

	seriesChange = async (evt) => {
		// Get the list of planning increments for the series and repopulate the dropdown for the top level increment
		var cParams = {
			host: this.props.host,
			mode: "GET",
			url: "/timebox/" + evt.target.value + "?incr=all"
		}
		var cResponse = await doRequest(cParams)
		var cResult = await cResponse.json()
		var increments = orderBy(cResult.increments, ["startDate"], ["desc"])
		this.setCurrentSeries(evt.target.value)
		this.setAllTimeboxes(increments)
		if (this.props.timebox && find(increments, { id: this.props.timebox })) {
			this.timeboxChange({ target: { value: this.props.timebox } });
		} else {
			this.timeboxChange({ target: { value: increments[0].id } });
		}
	}

	timeboxChange = (evt) => {
		this.setCurrentTimebox(evt.target.value)
		//Filter the root items to those that are part of this increment

		var newList = filter(this.props.cards, (card) => {
			var increments = card.planningIncrements;
			return (find(increments, { id: evt.target.value }) !== undefined)

		})
		this.setState({ topLevelList: { active: newList, passive: [] } })
	}

	openInTab = () => {
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
			as += ex + "srs=" + this.state.currentSeries
			if (this.state.currentTimebox) as += "&tmb=" + this.state.currentTimebox
		}

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
			return (<Column>
				<ul className="column-ul">
					<li className="column-li">
						<input className="column-input" id="rad1" type="radio" name="rad" />
						<label className="column-label" htmlFor="rad1">
							<div>
								Configuration

							</div>
						</label>
						<div className="accslide">
							<div className="content">
								<h1>
									Configuration
									<IconButton onClick={this.openInTab}>
										<OpenInNew />
									</IconButton>
								</h1>

								<Grid container>
									<Grid item>
										<APtimebox
											title="Planning Series"
											timeBoxChange={this.seriesChange}
											timeboxes={this.state.planningSeries}
											initialTimeBox={this.state.currentSeries}
										/>
									</Grid>
									<Grid item>
										<APtimebox
											title="Planning Timebox"
											timeBoxChange={this.timeboxChange}
											timeboxes={this.state.seriesIncrements}
											initialTimeBox={this.state.currentTimebox}
										/>
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
														<Grid key={idx + 1} item>
															<PlanItem
																card={card}
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



							</div>
						</div>
					</li>
					<li className="column-li">
						<input className="column-input" id="rad2" type="radio" name="rad" checked={true}/><label className="column-label" htmlFor="rad2"><div>PI Planning</div></label>
						<div className="accslide">
							<div className="content">
								<Board
								host={this.props.host}
									mode='tree'
									board={this.state.context}
									active={this.state.topLevelList.active.length? join(this.state.topLevelList.active.map((card) => {
										return card.id
									}), ","): null}
									>
								</Board>
							</div>
						</div>
					</li>
				</ul>


			</Column>)
		}
		else {
			return null
		}
	}
}