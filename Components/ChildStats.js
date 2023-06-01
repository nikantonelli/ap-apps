import { Box, CircularProgress, Grid, LinearProgress, Tooltip, Typography } from "@mui/material";
import React from "react";
import { APdateRange } from "./AP-Fields/dateRange";

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
	 */

	constructor(props) {
		super(props);
		this.percentByPoints = ((this.props.data.connectedCardStats &&
			(this.props.data.connectedCardStats.completedSize / this.props.data.connectedCardStats.totalSize)) || 0) * 100
		this.percentByCount = ((this.props.data.connectedCardStats &&
			(this.props.data.connectedCardStats.completedCount / this.props.data.connectedCardStats.totalCount)) || 0) * 100
	}

	render() {
		return (
			<Grid container sx={{ alignItems: 'center' }}
			>
				{Boolean(this.props.showByPoints) ?
					<Grid item class='linear-progress-bar'>
						<Tooltip title={"Percent Complete By Points"}>
							{Boolean(this.props.showAsCircles) ?
								<Box className='circular-progress-bar' sx={{ position: 'relative', display: 'inline-flex' }}>
									<CircularProgress
										size={this.props.circleSize ? this.props.circleSize : 40}
										variant="determinate"
										value={this.percentByPoints}
										color="success"
										thickness={this.props.circleSize ? this.props.circleSize / 10 : 4}
									/>
									<Box
										sx={{
											top: 0,
											left: 0,
											bottom: 0,
											right: 0,
											position: 'absolute',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Typography
											variant="caption"
											component="div"
										>{`${Math.round(this.percentByPoints)}%`}</Typography>
									</Box>
								</Box>
								:
								<Box className='linear-progress-bar-box'>
								<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }} >
									<Box sx={{ width: '100%', mr: 1 }}>
										<LinearProgress thickness={5} className='linear-progress-bar' variant="determinate" value={this.percentByPoints} />
									</Box>
									<Box sx={{ minWidth: 35 }}>
										<Typography variant='body2'>{`${Math.round(this.percentByPoints)}%`}</Typography>
									</Box>
								</Box>
								<Typography variant='body2'>Child Completion by Points</Typography>
							</Box>}
						</Tooltip>
					</Grid> : null
				}
				{Boolean(this.props.showByCount) ?
					<Grid item >
						<Tooltip title={"Percent Complete By Count"}>
							{Boolean(this.props.showAsCircles) ?
								<Box className='circular-progress-bar' sx={{ position: 'relative', display: 'inline-flex' }}>
									<CircularProgress
										size={this.props.circleSize ? this.props.circleSize : 40}
										variant="determinate"
										value={this.percentByCount}
										color="success"
										thickness={this.props.circleSize ? this.props.circleSize / 10 : 4}
									/>
									<Box
										sx={{
											top: 0,
											left: 0,
											bottom: 0,
											right: 0,
											position: 'absolute',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Typography
											variant="caption"
											component="div"
										>{`${Math.round(this.percentByCount)}%`}</Typography>
									</Box>
								</Box>
								: <Box className='linear-progress-bar-box'>
									<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }} >
										<Box sx={{ width: '100%', mr: 1 }}>
											<LinearProgress className='linear-progress-bar' variant="determinate" value={this.percentByCount} />
										</Box>
										<Box sx={{ minWidth: 35 }}>
											<Typography variant='body2'>{`${Math.round(this.percentByCount)}%`}</Typography>
										</Box>
									</Box>
									<Typography variant='body2'>Child Completion by Count</Typography>
								</Box>
							}
						</Tooltip>
					</Grid> : null
				}
				{Boolean(this.props.showPlanDates) ?
					<APdateRange
						start={this.props.data.connectedCardStats.plannedStart}
						end={this.props.data.connectedCardStats.plannedFinish}
					/>
					: null}
				{Boolean(this.props.showActualsDates) ?
					<APdateRange
						start={this.props.data.connectedCardStats.actualStart}
						end={this.props.data.connectedCardStats.actualFinish}
					/>
					: null}
			</Grid>
		)
	}
}
