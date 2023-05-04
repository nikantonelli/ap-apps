import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import {ClearEditorPlugin} from '@lexical/react/LexicalClearEditorPlugin';
import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { ListItemNode, ListNode } from "@lexical/list"
import { CLEAR_EDITOR_COMMAND, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW, ParagraphNode } from "lexical"
import { TRANSFORMERS } from "@lexical/markdown"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import {ImageNode } from './Editor/Nodes/ImageNode'
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table"
import { useEffect, useState } from "react"
import ToolbarPlugin from "./Editor/Plugins/ToolbarPlugin"

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot } from "lexical"

import CodeHighlightPlugin from "./Editor/Plugins/CodeHighlightPlugin"
import AutoLinkPlugin from "./Editor/Plugins/EditorAutoLinkPlugin"
import ListMaxIndentLevelPlugin from "./Editor/Plugins/ListMaxIndentLevelPlugin"

import {useSharedHistoryContext} from './Editor/Context/SharedHistoryContext';
import ImagesPlugin from './Editor/Plugins/ImagesPlugin';

function onError(e) {
	console.log(e)
}

const UpdateText = ({ className, onChange, initialValue }) => {

	const [state, setState] = useState(false)

	const [editor] = useLexicalComposerContext();

	const externalEventHandler = (e) => {
		debugger;
		editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
	}

	useEffect(() => {
		if (!state) {
			window.addEventListener('clear-editor-'+className, externalEventHandler)
			
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
						onChange($generateHtmlFromNodes(editor, null))
					}
				})
			})

			setState(true);
		}


	},[state, editor, initialValue, onChange])
}
export const Editor = ({ onChange, className, value }) => {

	const {historyState} = useSharedHistoryContext();
	const [initial, setInitial] = useState(true);

	const initialConfig = {
		namespace: className + '-editor',
		onError: onError,
		nodes: [
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
			<div className={className + "-editor-container"}>
				<ToolbarPlugin className={className + "-editor-toolbar"} />
				<div className={className + "-editor-inner"}>
					<RichTextPlugin
						contentEditable={<ContentEditable className={className + "-editor-input"} value={value} />}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<ClearEditorPlugin />
					<HistoryPlugin externalHistoryState={historyState} />
					<CodeHighlightPlugin />
					<ListPlugin />
					<LinkPlugin />
					<ImagesPlugin />
					<AutoLinkPlugin />
					<ListMaxIndentLevelPlugin maxDepth={7} />
					<MarkdownShortcutPlugin transformers={TRANSFORMERS} />
					<UpdateText className={className} onChange={onChange} initialValue={init ? null : value} />
				</div>
			</div>
		</LexicalComposer>
	)
}