import { Button, Card, CardActions, CardHeader, Grid, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import BoardService from "../../services/BoardService";

import { AccountTree, Brightness7, Cancel, Domain, OpenInNew, Search } from "@mui/icons-material";
import { useState } from 'react';
import { findBoards } from "../../utils/Client/Sdk";

export default function Board({ host }) {

	const [boards, setBoards] = useState([]);
	const [filterText, setFilterText] = useState("");
	const [timer, setTimer] = useState(null);
	const [pending, setPending] = useState(false);


	function treeClicked(evt) {
		document.open("/nui/board/" + evt.currentTarget.id + "?mode=tree", "", "noopener=true")
	}

	function sunClicked(evt) {
		document.open("/nui/board/" + evt.currentTarget.id + "?mode=sunburst", "", "noopener=true")
	}

	function partClicked(evt) {
		document.open("/nui/board/" + evt.currentTarget.id + "?mode=partition", "", "noopener=true")
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
		var result = await findBoards(host, { search: fltr });
		var res = await result.json()
		setBoards(res.boards);

	}

	if (!pending) {
		setPending(true);
		var ft = filterText;
		 getList(ft)

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
							: <Search />}
					</InputAdornment>
				),
			}}
		/>
		{(boards && boards.length) ?
			<Grid className='board-grid' container >
				{boards.map((brd, key) => {
					return <Grid key={key} item>
						<Card
							sx={{ cursor: 'pointer' }}
							className="card"
							variant="standard"
							raised
						>
							<CardHeader
								title={brd.title}
								sx={{ textAlign: 'center'}}
							/>
							<CardActions>
								<IconButton
									onClick={treeClicked}
									id={brd.id}
								>
									<AccountTree />
								</IconButton>
								<IconButton
									onClick={partClicked}
									id={brd.id}
								>
									< Domain />
								</IconButton>
								<IconButton
									onClick={sunClicked}
									id={brd.id}
								>
									<Brightness7 />
								</IconButton>
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