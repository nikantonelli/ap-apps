import { Card, CardActions, CardHeader, Grid, IconButton, InputAdornment, Paper, Stack, TextField, Tooltip } from "@mui/material";

import { AccountTree, Cancel, NextPlan, Search, Settings } from "@mui/icons-material";
import { orderBy } from "lodash";
import { useState } from 'react';
import { ConfigDrawer } from "../../Components/ConfigDrawer";
import { findBoards } from "../../Utils/Client/Sdk";
import { extractOpts } from "../../Utils/Server/Helpers";

export default function Board({ host, grouping, view, eb, colour, field, dir }) {

	const [boards, setBoards] = useState([]);
	const [filterText, setFilterText] = useState("");
	const [pending, setPending] = useState(false);
	const [sortField, setLSortField] = useState(field || "id")
	const [lSortDir, setLSortDir] = useState(dir || "ascending")
	const [lView, setLView] = useState(view || 'tree')
	const [lGrouping, setLGrouping] = useState(grouping || 'none')
	const [lSortType, setLSortType] = useState('id')
	const [lColouring, setLColouring] = useState(colour|| 'type')
	const [lShowErrors, setLShowErrors] = useState(eb || 'off')
	const [drawerOpen, setDrawerOpen] = useState(false)

	function boardClicked(evt) {
		document.open("/nui/context/" + evt.currentTarget.id + "?view=" + lView + "&dedupe=true", "", "noopener=true")
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
		var sortedBoards = orderBy(boards, [sortField], [lSortDir])
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
		setPending(false);
		setLShowErrors(evt.target.value)
	}
	function groupChange(evt) {
		setPending(false);
		setLGrouping(evt.target.value)
	}
	function colourChange(evt) {
		setPending(false);
		setLColouring(evt.target.value)
	}
	function sortDirChange(evt) {
		setPending(false);
		setLSortDir(evt.target.value)
	}
	function sortChange(evt) {
		setPending(false);
		setLSortType(evt.target.value)
	}
	function viewChange(evt) {
		setPending(false);
		setLView(evt.target.value)
	}

	function fieldChange(evt) {
		setPending(false);
		setLSortField(evt.target.value)
	}
	return <Stack>
		<Paper>
			<>
				<Tooltip title="View Settings">
					<IconButton sx={{ margin: "0px 10px 0px 10px" }} onClick={openDrawer}>
						<Settings />
					</IconButton>
				</Tooltip>
				<ConfigDrawer
					onClose={closeDrawer}
					width={200}
					open={drawerOpen}
					view={lView}
					viewChange={viewChange}
					field={sortField}
					fieldChange={fieldChange}
					sortDir={lSortDir}
					sortDirChange={sortDirChange}
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
							sx={{ width: "400px", backgroundColor: "darkgrey", color: "white" }}
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

export function getServerSideProps({ req, query }) {

	var appProps = { host: req.headers.host }
	extractOpts(query, appProps)

	//Find the url to this server and pass to client-side
	return {props: appProps};
}