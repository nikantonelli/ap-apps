import { Button, Card, CardActionArea, CardActions, CardHeader, Grid, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import BoardService from "../services/BoardService"

import { useState } from 'react'
import { Cancel, Clear, OpenInBrowser, OpenInNew } from "@mui/icons-material";

export default function Board({ host }) {

	const [boards, setBoards] = useState([]);
	const [filterText, setFilterText] = useState("");
	const [timer, setTimer] = useState(null);
	const [bsrv, setBsrv] = useState(null);
	const [pending, setPending] = useState(false);

	var bs = null;

	function cardClicked(evt) {
		document.open("/board/" + evt.currentTarget.id, "", "noopener=true")
	}
	
	function cardClicked2(evt) {
		document.open("/board/" + evt.currentTarget.id, "_blank")
	}

	function filterChange(e) {
		if (timer) {
			clearTimeout(timer)
		}
		setTimer(setTimeout(function () {
			updateList(e.target.value)
		}, 1000))
	}

	function updateList(txt) {
		setFilterText(txt);
		setPending(false);
	}

	async function getList(fltr) {
		if (fltr && (fltr.length == 0)) fltr = null;
		var result = await bs.find({ search: fltr });
		return result;
	}

	if (bsrv == null) {
		bs = new BoardService(host);
		setBsrv(bs);
	}
	else {
		bs = bsrv;
	}

	if (!pending) {
		setPending(true);
		var ft = filterText;
		getList(ft).then((result) => result.json())
			.then((data) => {
				setBoards(data.boards);
			})
	}

	function clearFilter() {
		var fltrField = document.getElementById("filter-field")
		fltrField.value = "";
		setFilterText("")
		setPending(false);
	}

	return <Stack>
		<TextField
			id="filter-field"
			label="Filter"
			helperText="Case insensitive search on title and header"
			variant="standard"
			onChange={filterChange}
			InputProps={{
				startAdornment: (
					<InputAdornment position="start">
						{filterText.length != 0 ?
							<IconButton onClick={clearFilter}>
								<Cancel />
							</IconButton>
							: null}
					</InputAdornment>
				),
			}}
		/>
		{(boards && boards.length) ?
			<Grid container>
				{boards.map((brd, key) => {
					return <Grid key={key} item>
						<Card
							sx={{ minWidth: 300, maxWidth: 600 }}
							className="card"
							variant="standard"
							raised
						>
							<CardHeader 
								title={brd.title} 
								style={{ textAlign: 'center' }}
								/>
							<CardActions>
								<Button
									onClick={cardClicked}
									id={brd.id}
									size="small"
								>
									Open
								</Button>
								
							</CardActions>
						</Card>
					</Grid>
				})}
			</Grid>
			: null}
	</Stack>

}

export function getServerSideProps(context) {

	var props = { props: { host: context.req.headers.host } };
	//Find the url to this server and pass to client-side
	return props;
}