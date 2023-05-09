import { Paper, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React from "react";
import { cloneDeep } from "lodash";
export class ConnectionTable extends React.Component {
    columns = [
        { field: 'title', headerName: 'Title', width: 400 },
        {
            field: 'customId', headerName: 'Header', width: 200,
            valueGetter: (params) =>
                `${params.row.customId.value || ''}`
        },
        {
            field: 'board', headerName: 'Context', width: 400,
            valueGetter: (params) =>
                `${params.row.board.title || ''}`
        },

    ]
    constructor(props) {
        super(props)
        this.state = {
            idString: Boolean(this.props.title) ? "connection-" + this.props.title.toLowerCase().replace(/[^a-z0-9]/g, "-") : "connection-grid",
            scaledColumns: this.columns
        }
    }
    

    openBoard = (evt) => {
        document.open("/nui/board/" + evt.currentTarget.id, "", "noopener=true")
    }

    openCard = (evt) => {
        document.open("/nui/card/" + evt.id, "", "noopener=true")
    }

    onResize = (size) => {
        var scaledColumns = cloneDeep(this.columns)
                //Get the scaling of the columns
            var scaling = 0;
            this.columns.forEach((column) => {
                scaling += column.width;
            })
            scaledColumns.forEach((column) => {
                column.width = Math.floor(column.width * size.width / scaling);
            })
        this.setState({scaledColumns: scaledColumns})
    }

    render = () => {
        if (Boolean(this.props.items)) {
            // return (
            //     <>
            //         <Paper square elevation={2} className="title-paper"><Typography variant={this.props.titleType} className="title-field">{this.props.title}</Typography></Paper>
            //         <TableContainer sx={{ maxHeight: 200 }} component={Paper} elevation={0}>
            //             <Table stickyHeader sx={{ minWidth: 500 }} size="small" aria-label="card connection table">
            //                 <TableHead>
            //                     <TableRow>
            //                         <TableCell>Title</TableCell>
            //                         <TableCell>Header</TableCell>
            //                         <TableCell>Context</TableCell>
            //                     </TableRow>
            //                 </TableHead>
            //                 <TableBody>
            //                     {this.props.items.map((row, idx) => (
            //                         <TableRow
            //                             key={idx}
            //                             sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            //                         >
            //                             <TableCell className="clickable" id={row.id} onClick={this.openCard} component="th" scope="row">
            //                                 {row.title}
            //                             </TableCell>
            //                             <TableCell>{row.customId.value}</TableCell>
            //                             <TableCell className="clickable" id={row.board.id} onClick={this.openBoard} >{row.board.title}</TableCell>


            //                         </TableRow>
            //                     ))}
            //                 </TableBody>
            //             </Table>
            //         </TableContainer>
            //     </>
            // )
            return (<div id={this.state.idString} >
                <Paper square elevation={2} className="title-paper"><Typography variant={this.props.titleType} className="title-field">{this.props.title}</Typography></Paper>
                <DataGrid
                    rows={this.props.items}
                    columns={this.state.scaledColumns}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 5 },
                        },
                    }}
                    pageSizeOptions={[5, 10, 20]}
                    disableRowSelectionOnClick
                    autoHeight
                    onRowClick={this.openCard}
                    onResize={this.onResize}
                />
            </div>)
        } else {
            return null;
        }
    }
}