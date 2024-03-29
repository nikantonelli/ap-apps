import { HighlightOff, OpenInNew } from "@mui/icons-material";
import { Autocomplete, Box, Button, Drawer, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Tooltip } from "@mui/material";
import { VIEW_TYPES } from "../Utils/Client/Sdk";

export function ConfigDrawer({
    onClose,
    onChange,
    openInNew,
    width,
    open,
    allItems,
    items,
    view,
    viewChange,
    sort,
    sortChange,
    sortDir,
    sortDirChange,
    colour,
    colourChange,
    group,
    groupChange,
    errors,
    errorChange,
    field,
    fieldChange
}) {
    return (
        <Drawer

            onClose={onClose}
            open={Boolean(open)}
            anchor='left'
            sx={{
                width: width,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: width, boxSizing: 'border-box' },
            }}
        >
            <Box>
                <Grid container direction="column">
                    <Grid item>
                        <Grid container direction="row">
                            {openInNew ?
                                <Grid xs item>
                                    <Button
                                        aria-label="Open As New Tab"
                                        onClick={openInNew}
                                        endIcon={<OpenInNew />}
                                    >
                                        New Tab
                                    </Button>
                                </Grid>
                                : <Grid xs item />}
                            <Grid xs={2} item>
                                <Grid sx={{ justifyContent: 'flex-end' }} container>

                                    <Tooltip title='Close Settings'>
                                        <HighlightOff onClick={onClose} />
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item>
                        {onChange ?
                            <Autocomplete
                                freeSolo
                                multiple
                                clearOnEscape
                                id="root-child-selector"
                                disableClearable
                                onChange={onChange}
                                value={items}
                                options={allItems}
                                getOptionLabel={(option) => option.title}
                                renderOption={(props, option) => {
                                    return (
                                        <li {...props} key={option.id}>
                                            {option.title}
                                        </li>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Click here to search cards"
                                        InputProps={{
                                            ...params.InputProps,
                                            type: 'search',
                                        }}
                                    />
                                )}
                            />
                            : null}
                    </Grid>
                    <Grid item>
                        <Grid container>
                            <Grid item>
                                <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
                                    <InputLabel>View</InputLabel>
                                    <Select
                                        value={view}
                                        onChange={viewChange}
                                        label="View"
                                    >
                                        <MenuItem value={VIEW_TYPES.TREE}>Tree</MenuItem>
                                        <MenuItem value={VIEW_TYPES.SUNBURST}>Sunburst</MenuItem>
                                        <MenuItem value={VIEW_TYPES.PARTITION}>Partition</MenuItem>
                                        <MenuItem value={VIEW_TYPES.TIMELINE}>Timeline</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {Boolean(sortChange) ?
                                <Grid item>
                                    <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
                                        <InputLabel>Sort By</InputLabel>
                                        <Select
                                            value={sort}
                                            onChange={sortChange}
                                            label="Sort By"
                                        >
                                            <MenuItem value="plannedStart">Planned Start</MenuItem>
                                            <MenuItem value="plannedFinish">Planned End</MenuItem>
                                            <MenuItem value="size">Size</MenuItem>
                                            <MenuItem value="r_size">Size Rollup</MenuItem>
                                            {view === VIEW_TYPES.SUNBURST ? null : <MenuItem value="title">Title</MenuItem>}
                                            <MenuItem value="score">Score Total</MenuItem>
                                            {view === VIEW_TYPES.TREE ? null : <MenuItem value="count">Card Count</MenuItem>}

                                            <MenuItem value="id">ID</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                : null}
                                {Boolean(fieldChange) ?
                                    <Grid item>
                                        <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
                                            <InputLabel>Field</InputLabel>
                                            <Select
                                                value={field}
                                                onChange={fieldChange}
                                                label="Field"
                                            >
                                                <MenuItem value="id">ID</MenuItem>
                                                <MenuItem value="title">Title</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    : null}
                            {(Boolean(sortDirChange) || Boolean(fieldChange)) ?
                                <Grid item >
                                    <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
                                        <InputLabel>Sort Direction</InputLabel>
                                        <Select
                                            value={sortDir}
                                            onChange={sortDirChange}
                                            label="Sort Direction"
                                        >
                                            <MenuItem value="ascending">Ascending</MenuItem>
                                            <MenuItem value="descending">Descending</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                : null}
                            {Boolean(colourChange) ?
                                <Grid item>
                                    <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
                                        <InputLabel>Colours</InputLabel>
                                        <Select
                                            value={colour}
                                            onChange={colourChange}
                                            label="Colours"
                                        >
                                            <MenuItem value="cool">Cool</MenuItem>
                                            <MenuItem value="warm">Warm</MenuItem>
                                            <MenuItem value="type">Card Type</MenuItem>
                                            <MenuItem value="state">Card State</MenuItem>
                                            <MenuItem value="l_user">Last Updater</MenuItem>
                                            <MenuItem value="c_user">Creator</MenuItem>
                                            <MenuItem value="a_user">First Assignee</MenuItem>
                                            <MenuItem value="context">Context</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                : null}
                            {(view === VIEW_TYPES.TIMELINE) && Boolean(groupChange) ?
                                <Grid item>
                                    <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
                                        <InputLabel>Group By</InputLabel>
                                        <Select
                                            value={group}
                                            onChange={groupChange}
                                            label="Grouping"
                                        >
                                            <MenuItem value="level">Level</MenuItem>
                                            <MenuItem value="context">Context</MenuItem>
                                            <MenuItem value="type">Card Type</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                : null}
                            {Boolean(errorChange) ?
                                <Grid item>
                                    <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} size="small">
                                        <InputLabel>Error Bars</InputLabel>
                                        <Select
                                            value={errors}
                                            onChange={errorChange}
                                            label="Errors"
                                        >
                                            <MenuItem value="on">On</MenuItem>
                                            <MenuItem value="off">Off</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                : null}
                        </Grid>
                    </Grid>

                </Grid>
            </Box>
        </Drawer>
    )
}