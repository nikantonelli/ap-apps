import React from "react";
import dayjs from 'dayjs';

import { Grid, Paper } from "@mui/material";
import { DateField, DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';


export class APdateRange extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<Grid className="date-range-picker" container sx={{ alignItems: 'center' }} direction="row">
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<DatePicker 
						showDaysOutsideCurrentMonth 
						label="Start Date" 
						format="LL" 
						defaultValue={dayjs(this.props.start)}
						onSelectionChange={this.props.startChange} 
					/>
					<Paper sx={{margin:"20px"}} elevation={0}> until </Paper>
					<DatePicker 
						showDaysOutsideCurrentMonth 
						label="End Date" 
						format="LL" 
						defaultValue={this.props.end?dayjs(this.props.end):null} 
						onSelectionChange={this.props.endChange}
					/>
				</LocalizationProvider>
			</Grid>
		)
	}
}
