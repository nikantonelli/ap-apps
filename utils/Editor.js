import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import {ClearEditorPlugin} from '@lexical/react/LexicalClearEditorPlugin';
import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { ListItemNode, ListNode } from "@lexical/list"
import { ParagraphNode } from "lexical"
import { TRANSFORMERS } from "@lexical/markdown"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table"
import { useEffect, useState } from "react"
import ToolbarPlugin from "./Editor/Plugins/ToolbarPlugin"

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot } from "lexical"

import CodeHighlightPlugin from "./Editor/Plugins/CodeHighlightPlugin"
import AutoLinkPlugin from "./Editor/Plugins/EditorAutoLinkPlugin"
import ListMaxIndentLevelPlugin from "./Editor/Plugins/ListMaxIndentLevelPlugin"

import {useSharedHistoryContext} from './context/SharedHistoryContext';
import ImagesPlugin from './Editor/Plugins/ImagesPlugin';

function onError(e) {
	console.log(e)
}

const UpdateText = ({ onChange, initialValue }) => {

	const [state, setState] = useState(false)

	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		if (!state) {
			editor.update(() => {
				if (Boolean(initialValue)) {
					const parser = new DOMParser()
					const dom = parser.parseFromString(initialValue, 'text/html')
					const nodes = $generateNodesFromDOM(editor, dom)
					const root = $getRoot()
					root.clear();
					nodes.forEach((node) => root.append(node))
				}

			})
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


	})
}
export const Editor = ({ onChange, className, value }) => {

	const {historyState} = useSharedHistoryContext();
	const [initial, setInitial] = useState(true);

	const initialConfig = {
		namespace: className + '-Editor',
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
			LinkNode
		]
	};
	var init = false;
	if (initial) {
		init = true;
		setInitial(false)
	}

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div className={className + "-container"}>
				<ToolbarPlugin className={className + "-toolbar"} />
				<div className={className + "-inner"}>
					<RichTextPlugin
						contentEditable={<ContentEditable className={className + "-input"} value={value} />}
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
					<UpdateText onChange={onChange} initialValue={init ? null : value} />
				</div>
			</div>
		</LexicalComposer>
	)
}