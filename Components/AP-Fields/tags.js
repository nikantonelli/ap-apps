import { Chip, FormControl, Grid, InputLabel, MenuItem, Select } from "@mui/material";
import React from "react";
import Autosuggest from "react-autosuggest";
import { addCardTag, getBoardTags, removeCardTag } from "../../Utils/Client/Sdk";
import { filter, findIndex } from "lodash";
import { Delete } from "@mui/icons-material";

/**
 * Display the list of current tags and if the user clicks in the edit field, then load the current
 * tag list for the board the card is on
 */

export class APtags extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            card: this.props.card || null,
            value: "",
            boardTags: [],
            suggestedTags: []
        }
    }

    getCardTags = (card) => {
        return Object.entries((card && card.tags) || []).map(([key, value]) => ({ key, value }))
    }

    tagsChange = (evt, { newValue }) => {
        this.setState((prev) => {
            return {
                value: newValue
            }
        })
    }

    getPossibleTags = () => {
        getBoardTags(this.props.host, this.props.card.board.id).then((result) => {
            if (result) this.setState({ boardTags: Object.entries(result.tags).map(([key, value]) => ({ key, value })) })
        })
    }

    componentDidMount() {
        this.getPossibleTags()
    }

    getTagValue = (tag) => {
        return tag.key
    }
    getSuggestions = (value) => {
        var tags = filter(this.state.boardTags, (tag) => tag.key.includes(value))
        return tags
    }

    onTagFetchRequested = ({ value, reason }) => {
        this.setState({
            value: value,
            suggestedTags: this.getSuggestions(value)
        });
    };

    onTagClearRequested = () => {
        this.setState({
            value: "",
            suggestedTags: []
        });
    };

    addTag = (name) => {
        addCardTag(this.props.host, this.props.card.id, name).then((newCard) => {
            this.setState({ card: newCard, value: "" })
            this.getPossibleTags();
        })
    }

    clickedTag = (evt) => {
        var tagName = evt.currentTarget.innerText;
        this.addTag(tagName);
    }

    selectedTag = (evt) => {
        if ((evt.code === "Enter") && (this.state.suggestedTags.length === 0)) {
            this.addTag(this.state.value)
        }
    }

    removeTag = (evt) => {
        var tagName = evt.currentTarget.parentElement.innerText
        var tagIdx = findIndex(this.getCardTags(this.state.card), function (tag) {
            return tag.value === tagName
        })
        if (tagIdx >= 0) {
            removeCardTag(this.props.host, this.props.card.id, tagIdx).then((newCard) => {
                if (newCard) {
                    this.setState({ card: newCard, value: "" })
                    this.getPossibleTags();
                }
            })
        }
    }

    renderSuggestion = suggestion => (
        <Chip
            label={suggestion.key}
            onClick={this.clickedTag}
            deleteIcon={<Delete />}
        />
    );

    render() {
        const { value, suggestedTags } = this.state;

        // Autosuggest will pass through all these props to the input.
        const inputProps = {
            placeholder: 'Search current board tags',
            value,
            onChange: this.tagsChange,
            onKeyDown: this.selectedTag
        };

        // Finally, render it!
        return (
            <>
                {this.getCardTags(this.state.card).map((tag) =>
                    <Chip key={tag.key + 1}
                        onDelete={this.removeTag}
                        deleteIcon={<Delete />}
                        label={tag.value}
                    />)}
                <div style={{ padding: "5px" }}>
                    <Autosuggest
                        key={0}
                        suggestions={suggestedTags}
                        onSuggestionsFetchRequested={this.onTagFetchRequested}
                        onSuggestionsClearRequested={this.onTagClearRequested}
                        getSuggestionValue={this.getTagValue}
                        renderSuggestion={this.renderSuggestion}
                        inputProps={inputProps}
                    />
                </div>
            </>
        );
    }
}