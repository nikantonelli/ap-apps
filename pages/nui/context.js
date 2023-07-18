import { Button, Card, CardActions, CardHeader, Grid, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import BoardService from "../../services/BoardService";

import { AccountTree, Brightness7, CalendarMonth, Cancel, Domain, OpenInNew, Search } from "@mui/icons-material";
import { useState } from 'react';
import { findBoards } from "../../utils/Client/Sdk";
import { orderBy } from "lodash";

export default function Board({ host }) {

	const [boards, setBoards] = useState([]);
	const [filterText, setFilterText] = useState("");
	const [timer, setTimer] = useState(null);
	const [pending, setPending] = useState(false);
	const [sortField, setSortField] = useState("id")
	const [sortDir, setSortDir] = useState("desc")


	function treeClicked(evt) {
		document.open("/nui/context/" + evt.currentTarget.id + "?mode=tree", "", "noopener=true")
	}

	function sunClicked(evt) {
		document.open("/nui/context/" + evt.currentTarget.id + "?mode=sunburst", "", "noopener=true")
	}

	function partClicked(evt) {
		document.open("/nui/context/" + evt.currentTarget.id + "?mode=partition", "", "noopener=true")
	}
	function timeClicked(evt) {
		document.open("/nui/context/" + evt.currentTarget.id + "?mode=timeline", "", "noopener=true")
	}

	function updateList() {
		var fld = document.getElementById("filter-field");
		setFilterText(fld.value);
		setPending(false);
	}

	function sortBoards(boards) {
		var sortedBoards = orderBy(boards, [sortField], [sortDir])
		return sortedBoards;
	}

	async function getList(fltr) {
		if (fltr && (fltr.length == 0)) fltr = null;
		var result = await findBoards(host, { search: fltr });
		if (result) {
			var sortedBoards = sortBoards(result.boards)
			setBoards(sortedBoards);
		}
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
			InputProps={{
				startAdornment: (
					<InputAdornment position="start">
						{filterText.length != 0 ?
							<IconButton onClick={clearFilter} sx={{cursor:'pointer'}}>
								<Cancel />
							</IconButton>
							: null }
							<Search onClick={updateList} sx={{cursor:'pointer'}}/>
					</InputAdornment>
				),
			}}
		/>
		{(boards && boards.length) ?
			<Grid className='board-grid' container >
				{boards.map((brd, key) => {
					return <Grid key={key} item>
						<Card
							sx={{ minWidth: "300px", backgroundColor: "darkgrey", color: "white" }}
							variant="standard"
							raised
						>
							<CardHeader
								title={brd.title}
								sx={{ textAlign: 'center' }}
							/>
							<CardActions>
								<IconButton
									sx={{ cursor: 'pointer' }}
									onClick={treeClicked}
									id={brd.id}
								>
									<AccountTree />
								</IconButton>
								<IconButton
									sx={{ cursor: 'pointer' }}
									onClick={partClicked}
									id={brd.id}
								>
									< Domain />
								</IconButton>
								<IconButton
									sx={{ cursor: 'pointer' }}
									onClick={sunClicked}
									id={brd.id}
								>
									<Brightness7 />
								</IconButton>
								<IconButton
									sx={{ cursor: 'pointer' }}
									onClick={timeClicked}
									id={brd.id}
								>
									<CalendarMonth />
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