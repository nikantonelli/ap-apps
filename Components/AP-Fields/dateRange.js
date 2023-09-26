import React from "react";
import dayjs from 'dayjs';

import { Grid, Paper } from "@mui/material";
import { DateField, DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';


export class APdateRange extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			endError: false,
			startError: false,
			endDate: props.end ? new Date(props.end) : null,
			startDate: props.start ? new Date(props.start) : null
		}
	}
	
	componentDidUpdate = (prevProps, prevState) => {
		if (prevProps != this.props) {
			this.setState(
				{
					endError: false,
					startError: false,
					endDate: this.props.end ? new Date(this.props.end) : null,
					startDate: this.props.start ? new Date(this.props.start) : null
				}
			)
		}
	}

	startChange = (date) => {
		var endDate = this.state.endDate
		if (endDate) {
			if (date > endDate) {
				//Set error condition
				this.setState({startError: true})
				return;
			}
		}
		
		if (Boolean(this.props.startChange) ){
			this.props.startChange(date.toLocaleString())
			this.setState({startError: false})
		}
	}

	endChange = (date) => {
		var startDate = this.state.startDate
		if (startDate) {
			if (date < startDate) {
				//Set error condition
				this.setState({endError: true})
				return;
			}
		}
		
		if (Boolean(this.props.endChange) ){
			this.props.endChange(date.toLocaleString())
			this.setState({endError: false})
		}
	}

	render() {
		var startError = this.state.startError?  { sx: {border: '2px solid red'}}: {}
		var endError = this.state.endError? { sx: {border: '2px solid red'}}: {}
		return (
			<Grid className="date-range-picker" container sx={{ alignItems: 'center' }} direction="row">
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<DatePicker
						{...startError}
						showDaysOutsideCurrentMonth
						label="Start Date"
						format="LL"
						value={this.state.startDate ? dayjs(this.state.startDate) : "invalid"}
						onChange={this.startChange}
					/>
					<Paper sx={{ margin: "20px" }} elevation={0}> until </Paper>
					<DatePicker
						{...endError}
						showDaysOutsideCurrentMonth
						label="End Date"
						format="LL"
						value={this.state.endDate ? dayjs(this.state.endDate) : "invalid"}
						onChange={this.endChange}
					/>
				</LocalizationProvider>
			</Grid>
		)
	}
}
