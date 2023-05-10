import React from "react";
import dayjs from 'dayjs';

import { Grid, Paper } from "@mui/material";
import { DateField, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';


export class APdateRange extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<Grid container sx={{ alignItems: 'center' }} direction="row">
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<DateField format="LL" defaultValue={dayjs(this.props.start)} />
					<Paper sx={{margin:"20px"}} elevation={0}> until </Paper>
					<DateField format="LL" defaultValue={this.props.end?dayjs(this.props.end):null} />
				</LocalizationProvider>
			</Grid>
		)
	}
}
