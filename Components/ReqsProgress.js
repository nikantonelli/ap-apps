import { Grid, LinearProgress, Typography } from "@mui/material";

export function ReqsProgress({pending, complete}) {
    return (
        <Grid container direction='column' sx={{ display: 'flex', alignItems: 'center' }}>
					<Grid>
						<Typography variant="h6">Loading, please wait</Typography>
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
    )
}