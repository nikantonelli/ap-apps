import { Grid, LinearProgress, Paper, Typography } from "@mui/material";

export function ReqsProgress({ pending, complete }) {
	return (
		<Paper elevation={4} sx={{margin:"3px"}}>
			<Grid container direction='column' sx={{ margin:"3px", display: 'flex', alignItems: 'center' }}>
				<Grid>
					<Typography variant="body">Loading, please wait</Typography>
				</Grid>
				<Grid sx={{ width: '100%' }}>
					<Grid container direction="row">
						<Grid xs={10} item>
							<LinearProgress variant="determinate" value={Math.round((complete) / (pending ? pending : 1) * 100)} />
						</Grid>
						<Grid xs={2} item>
							<Typography variant="body2" color="text.secondary">{pending}</Typography>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</Paper>
	)
}