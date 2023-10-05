import { Button, Grid } from "@mui/material";
import Link from "next/link";


export default function Home() {
	return (
		<Grid container direction="column">
			<Button sx={{margin:"3px"}} size="large" variant="contained" href="/nui/context">Contexts</Button>
			<Button sx={{margin:"3px"}} size="large" variant="contained" href="/nui/mystuff">My Stuff</Button>
			
		</Grid>
	)
}
