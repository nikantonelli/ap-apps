import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { ListItemNode, ListNode } from "@lexical/list"
import { CLEAR_EDITOR_COMMAND, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW, ParagraphNode } from "lexical"
import { TRANSFORMERS } from "@lexical/markdown"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ImageNode } from './Nodes/ImageNode'
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table"
import { useEffect, useState } from "react"
import ToolbarPlugin from "./Plugins/ToolbarPlugin"

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot } from "lexical"

import CodeHighlightPlugin from "./Plugins/CodeHighlightPlugin"
import AutoLinkPlugin from "./Plugins/EditorAutoLinkPlugin"
import ListMaxIndentLevelPlugin from "./Plugins/ListMaxIndentLevelPlugin"

import { useSharedHistoryContext } from './Context/SharedHistoryContext';
import ImagesPlugin from './Plugins/ImagesPlugin';

function onError(e) {
	console.log(e)
}

const UpdateText = ({ className, onChange, initialValue }) => {

	const [state, setState] = useState(false)

	const [editor] = useLexicalComposerContext();



	useEffect(() => {

		const clearEditorEvent = (e) => {
			editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
		}

		if (!state) {
			//Use the class name to distinguish different editors on the page
			//This does rely on there only being one of each....

			window.addEventListener('clear-editor-' + className, clearEditorEvent)

			editor.registerCommand(CLEAR_EDITOR_COMMAND, () => {
				if (Boolean(initialValue)) {
					const parser = new DOMParser()
					const dom = parser.parseFromString(initialValue, 'text/html')
					const nodes = $generateNodesFromDOM(editor, dom)
					const root = $getRoot()
					root.clear();
					nodes.forEach((node) => root.append(node))
					return true;
				}
			}, COMMAND_PRIORITY_HIGH)

			editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
			editor.blur();
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					if (onChange) {
						onChange($generateHtmlFromNodes(editor))
					}
				})
			})

			setState(true);
		}


	}, [state, editor, initialValue, onChange, className])
}

export const Editor = ({ onChange, type, value, readOnly }) => {

	const { historyState } = useSharedHistoryContext();
	const [initial, setInitial] = useState(true);

	const initialConfig = {
		editable: !Boolean(readOnly),
		namespace: type + '-editor',
		onError: onError,
		nodes: readOnly ? [] : [
			ParagraphNode,
			HeadingNode,
			ListNode,
			ListItemNode,
			QuoteNode,
			CodeNode,
			CodeHighlightNode,
			TableNode,
			TableCellNode,
			TableRowNode,
			AutoLinkNode,
			LinkNode,
			ImageNode
		]
	};
	var init = false;
	if (initial) {
		init = true;
		setInitial(false)
	}

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div className={type + "-editor-container"}>
			{!readOnly ? (
						<ToolbarPlugin className={type + "-editor-toolbar"} />
					) : null}
				<div className={type + "-editor-inner"}>
					

					<RichTextPlugin
						contentEditable={<ContentEditable className={type + "-editor-input"} value={value} />}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<UpdateText className={type} onChange={onChange} initialValue={init ? null : value} />
					{!readOnly ? (<>
						<ClearEditorPlugin />
						<HistoryPlugin externalHistoryState={historyState} />
						<CodeHighlightPlugin /><ListPlugin /><LinkPlugin /><ImagesPlugin /><AutoLinkPlugin /><ListMaxIndentLevelPlugin maxDepth={7} /><MarkdownShortcutPlugin transformers={TRANSFORMERS} /></>
					) : null}
				</div>
			</div>
		</LexicalComposer>
	)
}