import { Grid, Tooltip, Typography } from "@mui/material";
import React from "react";
import { APdateRange } from "./AP-Fields/dateRange";
import { APProgressBar } from "./ProgressBar";

export class APChildStats extends React.Component {

	/**
	 * 
	 * @param {*} props 
	 * 
	 * data: card info
	 * showByPoints: boolean
	 * showByCount: boolean
	 * showPlanDates: boolean
	 * showActualsDates: boolean
	 * showAsCircles: boolean
	 * showProgress: boolean	Colour code the progress bar by an algorithm using dates
	 */

	/**
	* ProgressBar takes these
	*
	* startDate: string
	* endDate: string
	* startValue: integer (defaults to 0)
	* endValue: integer	(defaults to 100)
	* currentValue: integer
	* circleSize: integer
	* showProgress: boolean	Colour code the progress bar by an algorithm using dates
	*
	*/

	render() {
		if (Boolean(this.props.data.connectedCardStats)) {
			return (
				<Grid container direction="row">
					<Grid item>
						{Boolean(this.props.showByPoints) ?
							<>
								<Typography variant='body2'>By Points</Typography>
								<Grid container direction={this.props.showAsCirles ? "column" : "row"}>
									<Grid item>
										<Grid container direction="row">
											<Grid item>
												<Typography sx={{ width: 50 }} variant='body2'>Plan:</Typography>
											</Grid>
											<APProgressBar
												startDate={this.props.data.plannedStart}
												endDate={this.props.data.plannedFinish}
												endValue={this.props.data.connectedCardStats.totalSize}
												currentValue={this.props.data.connectedCardStats.completedSize}
												showProgress={this.props.showProgress}
												showAsCircles={this.props.showAsCircles}
												circleSize={this.props.circleSize} />
											<Grid item>
												<Grid container direction="row">
													<Grid item>
														<Typography sx={{ width: 50 }} variant='body2'>Actual:</Typography>
													</Grid>
													<APProgressBar
														startDate={this.props.data.actualStart}
														endDate={this.props.data.actualFinish}
														endValue={this.props.data.connectedCardStats.totalSize}
														currentValue={this.props.data.connectedCardStats.completedSize}
														showProgress={this.props.showProgress}
														showAsCircles={this.props.showAsCircles}
														circleSize={this.props.circleSize} />
												</Grid>
											</Grid>
										</Grid>
									</Grid>
								</Grid>
							</>
							: null}
					</Grid>
					<Grid item>
						{Boolean(this.props.showByCount) ?
							<>
								<Typography variant='body2'>By Count</Typography>
								<Grid container direction={this.props.showAsCirles ? "column" : "row"}>
									<Grid item>
										<Grid container direction="row">
											<Grid item>
												<Typography sx={{ width: 50 }} variant='body2'>Plan:</Typography>
											</Grid>
											<APProgressBar
												startDate={this.props.data.plannedStart}
												endDate={this.props.data.plannedFinish}
												endValue={this.props.data.connectedCardStats.totalCount}
												currentValue={this.props.data.connectedCardStats.completedCount}
												showProgress={this.props.showProgress}
												showAsCircles={this.props.showAsCircles}
												circleSize={this.props.circleSize} />
										</Grid>
									</Grid>
									<Grid item>
										<Grid container direction="row">
											<Grid item>
												<Typography sx={{ width: 50 }} variant='body2'>Actual:</Typography>
											</Grid>
											<APProgressBar
												startDate={this.props.data.actualStart}
												endDate={this.props.data.actualFinish}
												endValue={this.props.data.connectedCardStats.totalCount}
												currentValue={this.props.data.connectedCardStats.completedCount}
												showProgress={this.props.showProgress}
												showAsCircles={this.props.showAsCircles}
												circleSize={this.props.circleSize} />
										</Grid>
									</Grid>
								</Grid>
							</>
							: null}
					</Grid>
					<Grid item>
						{Boolean(this.props.showPlanDates) ?
							<APdateRange
								start={this.props.data.connectedCardStats.plannedStart}
								end={this.props.data.connectedCardStats.plannedFinish} />
							: null}
					</Grid>
					<Grid item>
						{Boolean(this.props.showActualsDates) ?
							<APdateRange
								start={this.props.data.connectedCardStats.actualStart}
								end={this.props.data.connectedCardStats.actualFinish} />
							: null}
					</Grid>
				</Grid>
			)
		} else return null
	}
}
