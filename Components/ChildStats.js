import { Grid, Tooltip } from "@mui/material";
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
	*/

	render() {
		if (Boolean(this.props.data.connectedCardStats)) {
			return (
				<Grid container sx={{ alignItems: 'center' }}>
					{Boolean(this.props.showByPoints) ?
						<>
							<Grid item>
								<Tooltip title={"Planned Complete By Points"}>
									<APProgressBar
										startDate={this.props.data.plannedStart}
										endDate={this.props.data.plannedFinish}
										endValue={this.props.data.connectedCardStats.totalSize}
										currentValue={this.props.data.connectedCardStats.completedSize} />
								</Tooltip>
							</Grid>
							<Grid item>
								<Tooltip title={"Actual Complete By Points"}>
									<APProgressBar
										startDate={this.props.data.actualStart}
										endDate={this.props.data.actualFinish}
										endValue={this.props.data.connectedCardStats.totalSize}
										currentValue={this.props.data.connectedCardStats.completedSize} />
								</Tooltip>
							</Grid>
						</>
						: null
					}
					{Boolean(this.props.showByCount) ?
						<>
							<Grid item>
								<Tooltip title={"Planned Complete By Count"}>
									<APProgressBar
										startDate={this.props.data.plannedStart}
										endDate={this.props.data.plannedFinish}
										endValue={this.props.data.connectedCardStats.totalCount}
										currentValue={this.props.data.connectedCardStats.completedCount} />
								</Tooltip>
							</Grid>
							<Grid item>
								<Tooltip title={"Actual Complete By Count"}>
									<APProgressBar
										startDate={this.props.data.actualStart}
										endDate={this.props.data.actualFinish}
										endValue={this.props.data.connectedCardStats.totalCount}
										currentValue={this.props.data.connectedCardStats.completedCount} />
								</Tooltip>
							</Grid>
						</>
						: null
					}
					{Boolean(this.props.showPlanDates) ?
						<APdateRange
							start={this.props.data.connectedCardStats.plannedStart}
							end={this.props.data.connectedCardStats.plannedFinish}
						/>
						: null
					}
					{Boolean(this.props.showActualsDates) ?
						<APdateRange
							start={this.props.data.connectedCardStats.actualStart}
							end={this.props.data.connectedCardStats.actualFinish}
						/>
						: null
					}
				</Grid>
			)
		} else return null
	}
}
