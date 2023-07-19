import React from "react";
import { doRequest } from "../utils/Client/Sdk";
import Column from "./Column";
import { APtimebox } from "./AP-Fields/timebox";
import { orderBy } from "lodash";
import { Grid } from "@mui/material";

export class PIPlanApp extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			board: props.board,
			planningSeries: [],
			currentSeries: "",
			seriesIncrements: [],
			currentIncrement: ""
		}
	}

	componentDidMount() {
		//Now get the planning series called "PI Planning" and the sub-increments
		var allSeries = []
		if (this.state.board && this.state.board.planningSeries.length) {
			var seriesSet = this.state.board.planningSeries
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
	}

	setCurrentSeries = (currentSeriesId) => {
		this.setState({ currentSeries: currentSeriesId })
	}
	setAllIncrements = (increments) => {
		this.setState({ seriesIncrements: increments })
	}

	setCurrentIncrement = (currentIncrementId) => {
		this.setState({ currentIncrement: currentIncrementId })
	}

	timeBoxChange = async (evt) => {
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
		this.setAllIncrements(increments)
		this.setCurrentIncrement(increments[0].id);
	}

	incrementChange = (evt) => {
		this.setCurrentIncrement(evt.target.value)
		//Filter the root items to those that are part of this increment
		//And fetch all the sub-increments (i.e. iterations)

	}

	render() {
		return (<Column>
			<ul className="column-ul">
				<li className="column-li">
					<input className="column-input" id="rad1" type="radio" name="rad" /><label className="column-label" htmlFor="rad1"><div>Configuration</div></label>
					<div className="accslide">
						<div className="content">
							<h1>
								Configuration
							</h1>
							<Grid container>
								<Grid item>
									<APtimebox
										title="Planning Series"
										timeBoxChange={this.timeBoxChange}
										timeboxes={this.state.planningSeries}
										initialTimeBox={this.state.currentSeries}
									/>
								</Grid>
								<Grid item>
									<APtimebox
										title="Planning Timebox"
										timeBoxChange={this.incrementChange}
										timeboxes={this.state.seriesIncrements}
										initialTimeBox={this.state.currentIncrement}
									/>
								</Grid>
								<Grid item>
									<Grid container>
										
									</Grid>
								</Grid>
							</Grid>

						</div>
					</div>
				</li>
				<li className="column-li">
					<input className="column-input" id="rad2" type="radio" name="rad" /><label className="column-label" htmlFor="rad2"><div>PI Planning</div></label>
					<div className="accslide">
						<div className="content">
							<h1>
								PI Planning
							</h1>
							<p>
								Go
							</p>
						</div>
					</div>
				</li>
			</ul>


		</Column>)
	}
}