import { Box, CircularProgress, Grid, LinearProgress, Tooltip, Typography } from "@mui/material";
import React from "react";

/**
 * Props:
 * 
 * startDate: string
 * endDate: string
 * startValue: integer
 * endValue: integer
 * currentValue: integer
 * circleSize: integer
 * 
 */
export class APProgressBar extends React.Component {
	constructor(props) {
		super(props);
		this.percentComplete =
			(
				(Boolean(props.currentValue) ? props.currentValue : 0)
				/ ((Boolean(props.endValue) ? props.endValue : 100) - (Boolean(props.startValue) ? props.startValue : 0))
			) * 100;
	}

	calcColour = () => {
		if (this.props.startDate && this.props.endDate) {
			var timeRange = new Date(this.props.endDate).getTime() - new Date(this.props.startDate).getTime()
			if (timeRange <= 0) return 'primary'

			var timeElapsed = new Date().getTime() - new Date(this.props.startDate).getTime()
			if (timeElapsed <= 0) return 'success'

			var expectedPointsPercent = (timeElapsed / timeRange) * (this.props.endValue - this.props.startValue) * 100;
			if ((expectedPointsPercent - this.percentComplete) > 20) {
				return 'error'
			}
			if ((expectedPointsPercent - this.percentComplete) > 10) {
				return 'warning'
			}
			return 'success'
		}
		else {
			return 'primary'
		}
	}

	render() {
		return (
			Boolean(this.props.showAsCircles) ?
				<Box className='circular-progress-bar' sx={{ position: 'relative', display: 'inline-flex' }}>
					<CircularProgress
						size={this.props.circleSize ? this.props.circleSize : 40}
						variant="determinate"
						value={this.percentComplete}
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
						>{`${Math.round(this.percentComplete)}%`}</Typography>
					</Box>
				</Box>
				:
				<Box className='linear-progress-bar-box'>
					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }} >
						<Box sx={{ width: '100%', mr: 1 }}>
							<LinearProgress thickness={5} sx={{ backgroundColor: '#eee' }} variant="determinate" value={this.percentComplete} />
						</Box>
						<Box sx={{ minWidth: 35 }}>
							<Typography variant='body2'>{`${Math.round(this.percentComplete)}%`}</Typography>
						</Box>
					</Box>
				</Box>
		)


	}
}