import { Button, Card, CardActions, CardHeader, Grid, IconButton, InputAdornment, Paper, Stack, TextField, Tooltip } from "@mui/material";
import BoardService from "../../services/BoardService";

import { AccountTree, Brightness7, CalendarMonth, Cancel, Domain, NextPlan, OpenInNew, Search, Settings } from "@mui/icons-material";
import { useState } from 'react';
import { findBoards } from "../../utils/Client/Sdk";
import { orderBy } from "lodash";
import { ConfigDrawer } from "../../Components/ConfigDrawer";

export default function Board({ host }) {

	const [boards, setBoards] = useState([]);
	const [filterText, setFilterText] = useState("");
	const [timer, setTimer] = useState(null);
	const [pending, setPending] = useState(false);
	const [sortField, setSortField] = useState("id")
	const [sortDir, setSortDir] = useState("ascending")
	const [mode, setMode] = useState('tree')
	const [grouping, setGrouping] = useState('none')
	const [sortType, setSortType] = useState('none')
	const [colouring, setColouring] = useState('type')
	const [showErrors, setShowErrors] = useState('off')
	const [drawerOpen, setDrawerOpen] = useState(false)

	function boardClicked(evt) {
		document.open("/nui/context/" + evt.currentTarget.id + "?mode=" + mode + "&dedupe=true", "", "noopener=true")
	}

	function planClicked(evt) {
		document.open("/nui/planning/" + evt.currentTarget.id, "", "noopener=true")
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

	function closeDrawer() {
		setDrawerOpen(false)
	}
	function openDrawer() {
		setDrawerOpen(true)
	}

	function errorChange(evt) {
		setShowErrors(evt.target.value)
	}
	function groupChange(evt) {
		setGrouping(evt.target.value)
	}
	function colourChange(evt) {
		setColouring(evt.target.value)
	}
	function sortDirChange(evt) {
		setSortDir(evt.target.value)
	}
	function sortChange(evt) {
		setSortType(evt.target.value)
	}
	function modeChange(evt) {
		setMode(evt.target.value)
	}

	return <Stack>
		<Paper>
			<>
				<Tooltip title="Configure Settings">
					<IconButton sx={{ margin: "0px 10px 0px 10px" }} onClick={openDrawer}>
						<Settings />
					</IconButton>
				</Tooltip>
				<ConfigDrawer
					onClose={closeDrawer}
					width={200}
					open={drawerOpen}
					mode={mode}
					modeChange={modeChange}
					sort={sortType}
					sortChange={sortChange}
					sortDir={sortDir}
					sortDirChange={sortDirChange}
					colour={colouring}
					colourChange={colourChange}
					group={grouping}
					groupChange={groupChange}
					errors={showErrors}
					errorChange={errorChange}

				/>
			</>
			<Tooltip title="Type, then click on Magnifying Glass">
			<TextField
				id="filter-field"
				variant="standard"
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							{filterText.length != 0 ?
								<IconButton onClick={clearFilter} sx={{ cursor: 'pointer' }}>
									<Cancel />
								</IconButton>
								: null}
							<Search onClick={updateList} sx={{ cursor: 'pointer' }} />
						</InputAdornment>
					),
				}}
			/>
</Tooltip>
		</Paper>
		{(boards && boards.length) ?
			<Grid className='board-grid' container >
				{boards.map((brd, key) => {
					return <Grid key={key} item>
						<Card
							sx={{ width: "300px", backgroundColor: "darkgrey", color: "white" }}
							variant="standard"
							raised
						>
							<CardHeader
								title={brd.title}
								sx={{ textAlign: 'center' }}
							/>
							<CardActions>
								<Tooltip title="View Hierarchy in New Tab">
									<IconButton
										sx={{ cursor: 'pointer' }}
										onClick={boardClicked}
										id={brd.id}
									>
										<AccountTree />
									</IconButton>
								</Tooltip>

								<Tooltip title="Planning">
									<IconButton
										sx={{ cursor: 'pointer' }}
										onClick={planClicked}
										id={brd.id}
									>
										<NextPlan />
									</IconButton>
								</Tooltip>
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